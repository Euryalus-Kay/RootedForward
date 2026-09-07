<#
    Rooted Forward museum kiosk installer (Windows 11).

    Run this ONLY on the dedicated museum display machine.

    Right-click Windows PowerShell, choose "Run as administrator", then:

        cd "C:\path\to\this\folder"
        powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1

    Everything it changes is undone by Uninstall-Kiosk.ps1.
#>

[CmdletBinding()]
param(
    [string]$ExhibitPath
)

$ErrorActionPreference = 'Stop'

$KioskHome  = 'C:\RootedForwardKiosk'
$TaskName   = 'RootedForwardKiosk'
$Here       = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateFile  = Join-Path $KioskHome 'previous-settings.json'
$ChromePol  = 'HKLM:\SOFTWARE\Policies\Google\Chrome'
$UpdatePol  = 'HKLM:\SOFTWARE\Policies\Google\Update'

function Say  { param($m) Write-Host "`n$m" -ForegroundColor White }
function Ok   { param($m) Write-Host "  [ok] $m" -ForegroundColor Green }
function Warn { param($m) Write-Host "  [!!] $m" -ForegroundColor Yellow }

# ---------------------------------------------------------------------------
# 0. Administrator, and a guard against running this on the wrong computer.
# ---------------------------------------------------------------------------
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host 'This must run as administrator.' -ForegroundColor Red
    Write-Host 'Right-click Windows PowerShell and choose "Run as administrator", then run it again.'
    exit 1
}

Say 'Rooted Forward museum kiosk installer'
@'
This machine will be turned into an unattended exhibit display:

  - Chrome opens full screen at logon and cannot be closed for long
  - the PC will never sleep and the screen never turns off
  - Chrome is locked to the exhibit file and can reach nothing else
  - Task Manager and the Windows key are disabled for the display account

Do not run this on a PC you use for anything else.
Run Uninstall-Kiosk.ps1 to put everything back.

'@ | Write-Host

$confirm = Read-Host 'Type the word MUSEUM to continue'
if ($confirm -cne 'MUSEUM') {
    Write-Host 'Cancelled. Nothing was changed.'
    exit 1
}

# ---------------------------------------------------------------------------
# 1. Find the exhibit file.
# ---------------------------------------------------------------------------
Say '1. Locating the exhibit file'
if (-not $ExhibitPath) {
    $search = @()
    $search += Get-ChildItem -Path $Here -Filter '*.html' -ErrorAction SilentlyContinue
    $search += Get-ChildItem -Path "$env:USERPROFILE\Downloads" -Filter '*Kiosk*.html' -ErrorAction SilentlyContinue
    if ($search.Count -gt 0) { $ExhibitPath = $search[0].FullName }
}
if (-not $ExhibitPath -or -not (Test-Path $ExhibitPath)) {
    Warn 'Could not find the exhibit HTML file.'
    Write-Host '     Pass it directly:  .\Install-Kiosk.ps1 -ExhibitPath "C:\path\to\exhibit.html"'
    exit 1
}
$size = (Get-Item $ExhibitPath).Length
if ($size -lt 1MB) {
    Warn "$ExhibitPath is only $size bytes. The real exhibit is about 7 MB."
    Warn 'That looks like the wrong file. Stopping so you can check.'
    exit 1
}
Ok "using $ExhibitPath ($size bytes)"

# ---------------------------------------------------------------------------
# 2. Lay the files down.
# ---------------------------------------------------------------------------
Say "2. Installing files into $KioskHome"
New-Item -ItemType Directory -Path $KioskHome -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $KioskHome 'chrome-profile') -Force | Out-Null
Copy-Item $ExhibitPath (Join-Path $KioskHome 'exhibit.html') -Force
Copy-Item (Join-Path $Here 'kiosk-watchdog.ps1') $KioskHome -Force
Ok 'exhibit.html and kiosk-watchdog.ps1 installed'

# A scheduled task running powershell.exe directly flashes a black console
# window at every logon. Launching it through wscript with a hidden window
# is the reliable way to avoid that; -WindowStyle Hidden alone still blinks.
$vbs = @"
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""$KioskHome\kiosk-watchdog.ps1""", 0, False
"@
Set-Content -Path (Join-Path $KioskHome 'launch-hidden.vbs') -Value $vbs -Encoding ASCII
Ok 'hidden launcher written'

# Remember what was here before, so uninstall can be honest about it.
$state = @{
    chromePolicyExisted = (Test-Path $ChromePol)
    updatePolicyExisted = (Test-Path $UpdatePol)
    installedBy         = $env:USERNAME
}
$state | ConvertTo-Json | Set-Content $StateFile -Encoding UTF8

# ---------------------------------------------------------------------------
# 3. The scheduled task. This is what makes it come back.
# ---------------------------------------------------------------------------
Say '3. Registering the startup task'
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$KioskHome\launch-hidden.vbs`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"

# ExecutionTimeLimit of zero means "never time out", which matters for a
# process meant to run for months. RestartCount covers the watchdog itself
# dying, which the watchdog obviously cannot handle on its own.
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -StartWhenAvailable

# Interactive logon type, because the task has to draw on the visible
# desktop. A task registered to run "whether the user is logged on or not"
# runs in a hidden session and the screen stays black.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Ok "scheduled task '$TaskName' registered for $env:USERNAME"

# ---------------------------------------------------------------------------
# 4. Chrome enterprise policies. This is the real lockdown on Windows.
# ---------------------------------------------------------------------------
Say '4. Locking Chrome down'
New-Item -Path $ChromePol -Force | Out-Null

$policies = @{
    IncognitoModeAvailability    = 1   # incognito disabled
    DeveloperToolsAvailability   = 2   # devtools disallowed
    BookmarkBarEnabled           = 0
    PrintingEnabled              = 0
    PasswordManagerEnabled       = 0
    BrowserSignin                = 0   # no signing into Chrome
    SyncDisabled                 = 1
    MetricsReportingEnabled      = 0
    DefaultNotificationsSetting  = 2   # block
    PromptForDownloadLocation    = 0
    DownloadRestrictions         = 3   # block all downloads
    DefaultBrowserSettingEnabled = 0
    TranslateEnabled             = 0
    ShowFullUrlsInAddressBar     = 0
}
foreach ($k in $policies.Keys) {
    New-ItemProperty -Path $ChromePol -Name $k -Value $policies[$k] -PropertyType DWord -Force | Out-Null
}
Ok "$($policies.Count) Chrome policies set"

# Block every URL, then allow only the exhibit. Without this a visitor who
# finds a link, or a stray Ctrl+O, can browse the open internet on a screen
# with the museum's name above it.
$blockKey = Join-Path $ChromePol 'URLBlocklist'
$allowKey = Join-Path $ChromePol 'URLAllowlist'
Remove-Item $blockKey -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $allowKey -Recurse -Force -ErrorAction SilentlyContinue
New-Item -Path $blockKey -Force | Out-Null
New-Item -Path $allowKey -Force | Out-Null
New-ItemProperty -Path $blockKey -Name '1' -Value '*' -PropertyType String -Force | Out-Null
New-ItemProperty -Path $allowKey -Name '1' -Value "file:///C:/RootedForwardKiosk/exhibit.html" -PropertyType String -Force | Out-Null
Ok 'Chrome can now open the exhibit and nothing else'

# The exhibit is a local file and Chrome can reach no other URL, so there is
# no browsing attack surface to patch. Turning updates off stops Chrome
# relaunching itself in the middle of a museum day.
New-Item -Path $UpdatePol -Force | Out-Null
New-ItemProperty -Path $UpdatePol -Name 'UpdateDefault' -Value 0 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $UpdatePol -Name 'AutoUpdateCheckPeriodMinutes' -Value 0 -PropertyType DWord -Force | Out-Null
Ok 'Chrome auto-update disabled (update it by hand when you visit)'

# ---------------------------------------------------------------------------
# 5. Windows lockdown for this account.
# ---------------------------------------------------------------------------
Say '5. Locking down the desktop for this account'
$sysPol = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System'
$expPol = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer'
New-Item -Path $sysPol -Force | Out-Null
New-Item -Path $expPol -Force | Out-Null
New-ItemProperty -Path $sysPol -Name 'DisableTaskMgr'    -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $expPol -Name 'NoWinKeys'         -Value 1 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $expPol -Name 'NoControlPanel'    -Value 1 -PropertyType DWord -Force | Out-Null
Ok 'Task Manager, Windows key and Control Panel disabled'

# ---------------------------------------------------------------------------
# 6. Power. Never sleep, never blank.
# ---------------------------------------------------------------------------
Say '6. Power settings'
powercfg /change monitor-timeout-ac 0   | Out-Null
powercfg /change standby-timeout-ac 0   | Out-Null
powercfg /change disk-timeout-ac 0      | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
powercfg /change monitor-timeout-dc 0   | Out-Null
powercfg /change standby-timeout-dc 0   | Out-Null
powercfg /hibernate off 2>$null         | Out-Null
Ok 'the PC and screen will never sleep'

# Windows will still reboot for updates. Active hours at least keeps it from
# doing so while the museum is open.
$wuKey = 'HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings'
New-Item -Path $wuKey -Force | Out-Null
New-ItemProperty -Path $wuKey -Name 'ActiveHoursStart'    -Value 7  -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $wuKey -Name 'ActiveHoursEnd'      -Value 22 -PropertyType DWord -Force | Out-Null
New-ItemProperty -Path $wuKey -Name 'IsActiveHoursEnabled' -Value 1 -PropertyType DWord -Force | Out-Null
Ok 'Windows Update will not reboot between 7am and 10pm'

# ---------------------------------------------------------------------------
# 7. Start it now.
# ---------------------------------------------------------------------------
Say '7. Starting the kiosk'
Start-ScheduledTask -TaskName $TaskName
Ok 'started, Chrome should be opening'

# ---------------------------------------------------------------------------
Say 'Installed. Three things still need doing by hand.'
@'

  A. TURN ON AUTOMATIC LOGON, or the PC stops at the sign-in screen after a
     power cut and the exhibit never comes back.

       Press Windows+R, type   netplwiz   and press Enter
       Untick "Users must enter a user name and password to use this computer"
       Click OK and type the account password twice

     If that tick box is not there, Windows Hello is hiding it. Run this in
     the administrator PowerShell window, then open netplwiz again:

       Set-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\PasswordLess\Device" `
         -Name DevicePasswordLessBuildVersion -Value 0

     The account MUST have a password for this to work. Windows cannot
     auto-sign-in an account with a blank password.

  B. SET THE BIOS TO POWER ON AFTER A POWER CUT. This is the only real
     answer to "if it turns off, turn it back on", and Windows cannot do it.

       Restart, and hold Del or F2 as it boots to enter BIOS or UEFI setup
       Find a setting called "Restore on AC Power Loss", "After Power
       Failure", or "AC Recovery" and set it to "Power On" or "Last State"
       Save and exit

  C. HIDE THE TASKBAR AND TURN ON DO NOT DISTURB.
       Right-click the taskbar > Taskbar settings > Taskbar behaviors >
       tick "Automatically hide the taskbar"
       Settings > System > Notifications > Do not disturb > On

  Check it is running:   Get-ScheduledTask RootedForwardKiosk
  Watch the log:         Get-Content C:\RootedForwardKiosk\kiosk.log -Tail 30 -Wait
  Put everything back:   .\Uninstall-Kiosk.ps1

'@ | Write-Host
