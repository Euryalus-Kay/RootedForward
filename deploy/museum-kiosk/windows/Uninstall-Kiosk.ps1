<#
    Undo everything Install-Kiosk.ps1 did (Windows 11).

    Right-click Windows PowerShell, choose "Run as administrator", then:

        powershell -ExecutionPolicy Bypass -File .\Uninstall-Kiosk.ps1

    Safe to run even if the installer only got partway through.
#>

$ErrorActionPreference = 'Continue'

$KioskHome = 'C:\RootedForwardKiosk'
$TaskName  = 'RootedForwardKiosk'
$ChromePol = 'HKLM:\SOFTWARE\Policies\Google\Chrome'
$UpdatePol = 'HKLM:\SOFTWARE\Policies\Google\Update'

function Say { param($m) Write-Host "`n$m" -ForegroundColor White }
function Ok  { param($m) Write-Host "  [ok] $m" -ForegroundColor Green }

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
           ).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host 'This must run as administrator.' -ForegroundColor Red
    exit 1
}

Say 'Removing the Rooted Forward kiosk'

# 1. Stop the watchdog first, otherwise closing Chrome just restarts it.
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Ok 'scheduled task removed'

Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*--user-data-dir=$KioskHome\chrome-profile*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like '*kiosk-watchdog.ps1*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Ok 'kiosk Chrome and watchdog stopped'

# 2. Chrome policies. These keys did not exist before the installer created
#    them on a clean machine, so removing them restores stock Chrome.
Say 'Unlocking Chrome'
Remove-Item $ChromePol -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $UpdatePol -Recurse -Force -ErrorAction SilentlyContinue
Ok 'Chrome policies and update block removed'

# 3. Desktop restrictions.
Say 'Restoring the desktop'
$sysPol = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System'
$expPol = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer'
Remove-ItemProperty -Path $sysPol -Name 'DisableTaskMgr' -Force -ErrorAction SilentlyContinue
Remove-ItemProperty -Path $expPol -Name 'NoWinKeys'      -Force -ErrorAction SilentlyContinue
Remove-ItemProperty -Path $expPol -Name 'NoControlPanel' -Force -ErrorAction SilentlyContinue
Ok 'Task Manager, Windows key and Control Panel re-enabled'

# 4. Power back to something normal. Windows defaults vary by machine, so
#    these are sensible values rather than a claim to restore exactly.
Say 'Power settings'
powercfg /change monitor-timeout-ac 10 | Out-Null
powercfg /change standby-timeout-ac 30 | Out-Null
powercfg /change disk-timeout-ac 20    | Out-Null
powercfg /change monitor-timeout-dc 5  | Out-Null
powercfg /change standby-timeout-dc 15 | Out-Null
Ok 'screen sleeps after 10 minutes, PC after 30'

Say 'Done'
@"

  The exhibit files are still in $KioskHome in case you want them.
  Delete them with:  Remove-Item '$KioskHome' -Recurse -Force

  Two things this script cannot undo, because they are not settings it made:

    - Automatic logon   (Windows+R, netplwiz, re-tick the password box)
    - The BIOS "restore on AC power loss" setting

"@ | Write-Host
