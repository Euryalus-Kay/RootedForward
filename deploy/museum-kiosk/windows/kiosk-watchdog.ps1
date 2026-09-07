<#
    Rooted Forward museum kiosk watchdog (Windows 11).

    One long-lived PowerShell process. It starts Chrome in kiosk mode and
    checks every two seconds that it is still running. If Chrome is closed,
    crashes, or is killed, it starts again.

    This works on Windows 11 Home, which has no Assigned Access and no Group
    Policy Editor. It is also used on Pro, because Assigned Access does not
    reliably relaunch a third-party browser on its own.

    There are no backslash line continuations anywhere in this file.
    PowerShell uses a backtick for that, and a stray backslash is a parse
    error that stops the whole kiosk from ever starting.
#>

$ErrorActionPreference = 'Continue'

$KioskHome   = 'C:\RootedForwardKiosk'
$ChromeData  = Join-Path $KioskHome 'chrome-profile'
$Exhibit     = Join-Path $KioskHome 'exhibit.html'
$LogFile     = Join-Path $KioskHome 'kiosk.log'
$NightlyHour = 4

function Write-KioskLog {
    param([string]$Message)
    $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    try {
        # Months of restarts would otherwise grow this without bound.
        if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 2MB)) {
            Move-Item $LogFile "$LogFile.1" -Force -ErrorAction SilentlyContinue
        }
        Add-Content -Path $LogFile -Value "$stamp  $Message" -ErrorAction SilentlyContinue
    } catch { }
}

function Get-ChromePath {
    $candidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    return $null
}

function Get-KioskBrowser {
    # Chrome runs many processes. Only the browser process is worth watching:
    # renderers and GPU helpers all carry a --type= switch, the browser does
    # not. Matching on our own profile directory means another Chrome the
    # staff might open is left alone.
    try {
        $procs = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" -ErrorAction Stop
    } catch {
        return $null
    }
    foreach ($p in $procs) {
        $cmd = $p.CommandLine
        if ([string]::IsNullOrEmpty($cmd)) { continue }
        if ($cmd -like "*--user-data-dir=$ChromeData*" -and $cmd -notlike '*--type=*') {
            return $p
        }
    }
    return $null
}

function Reset-CrashFlags {
    # After a power cut Chrome believes it crashed and offers to restore
    # tabs, which parks a dialog over the exhibit. Rewriting these two values
    # means Chrome never thinks it crashed in the first place.
    $prefs = Join-Path $ChromeData 'Default\Preferences'
    if (Test-Path $prefs) {
        try {
            $json = Get-Content $prefs -Raw | ConvertFrom-Json
            if ($null -ne $json.profile) {
                # Add-Member -Force both adds the property when it is missing
                # and overwrites it when it is present. Plain assignment
                # throws on a PSCustomObject that has no such property yet,
                # which is exactly the case on a fresh profile.
                $json.profile | Add-Member -NotePropertyName 'exit_type' -NotePropertyValue 'Normal' -Force
                $json.profile | Add-Member -NotePropertyName 'exited_cleanly' -NotePropertyValue $true -Force
                $json | ConvertTo-Json -Depth 100 -Compress | Set-Content $prefs -Encoding UTF8
                Write-KioskLog 'Reset the Chrome crash flag.'
            }
        } catch {
            Write-KioskLog "Could not reset the crash flag: $($_.Exception.Message)"
        }
    }
}

function Start-Kiosk {
    param([string]$ChromeExe)

    Reset-CrashFlags

    # file:/// with forward slashes. C:\path\file.html is not a valid URL.
    # Parenthesised rather than chained, so precedence is not something a
    # future reader has to reason about.
    $forwardSlashed = ($Exhibit -replace '\\', '/')
    $url = 'file:///' + ($forwardSlashed -replace ' ', '%20')

    # Every switch here exists in current Chrome. Switches that older kiosk
    # guides still recommend and that Chrome has REMOVED are deliberately
    # absent: --disable-session-crashed-bubble (now --hide-crash-restore-bubble),
    # --disable-pinch, and --disable-infobars.
    $switches = @(
        '--kiosk'
        "--user-data-dir=$ChromeData"
        '--no-first-run'
        '--no-default-browser-check'
        '--disable-search-engine-choice-screen'
        '--noerrdialogs'
        '--hide-crash-restore-bubble'
        '--disable-notifications'
        '--disable-sync'
        '--disable-extensions'
        '--disable-background-networking'
        '--disable-component-update'
        '--disable-backgrounding-occluded-windows'
        '--check-for-update-interval=31536000'
        '--overscroll-history-navigation=0'
        '--autoplay-policy=no-user-gesture-required'
        '--allow-file-access-from-files'
        '--start-fullscreen'
        $url
    )

    Write-KioskLog "Starting Chrome -> $url"
    Start-Process -FilePath $ChromeExe -ArgumentList $switches -ErrorAction SilentlyContinue
}

# ---------------------------------------------------------------------------
# Startup checks. Sleeping before giving up matters, so a broken install
# does not spin the processor launching Chrome hundreds of times a minute.
# ---------------------------------------------------------------------------
Write-KioskLog '===== watchdog starting ====='

$chromeExe = Get-ChromePath
if ($null -eq $chromeExe) {
    Write-KioskLog 'FATAL Chrome is not installed. Install it from google.com/chrome.'
    Start-Sleep -Seconds 300
    exit 1
}
if (-not (Test-Path $Exhibit)) {
    Write-KioskLog "FATAL exhibit file missing at $Exhibit"
    Start-Sleep -Seconds 300
    exit 1
}
Write-KioskLog "Chrome found at $chromeExe"

# ---------------------------------------------------------------------------
# The loop.
# ---------------------------------------------------------------------------
$lastStart      = [datetime]::MinValue
$rapidFailures  = 0
$lastNightly    = [datetime]::MinValue

while ($true) {

    # Restart once a night so a page running for weeks does not accumulate
    # memory. Guarded so it can only happen once per calendar day and only
    # in the small hours.
    $now = Get-Date
    if ($now.Hour -eq $NightlyHour -and $now.Date -ne $lastNightly.Date) {
        $lastNightly = $now
        $browser = Get-KioskBrowser
        if ($null -ne $browser) {
            Write-KioskLog 'Nightly restart.'
            try { Stop-Process -Id $browser.ProcessId -Force -ErrorAction SilentlyContinue } catch { }
        }
    }

    $browser = Get-KioskBrowser

    if ($null -eq $browser) {
        $sinceStart = ($now - $lastStart).TotalSeconds

        # If Chrome keeps dying immediately, something is actually wrong.
        # Back off rather than hammering it, so the log stays readable and
        # the machine stays responsive enough to fix over the network.
        if ($sinceStart -lt 15) {
            $rapidFailures++
        } else {
            $rapidFailures = 0
        }

        if ($rapidFailures -ge 5) {
            $wait = [Math]::Min(60, 5 * $rapidFailures)
            Write-KioskLog "Chrome has failed $rapidFailures times quickly. Waiting ${wait}s."
            Start-Sleep -Seconds $wait
        }

        $lastStart = Get-Date
        Start-Kiosk -ChromeExe $chromeExe
        Start-Sleep -Seconds 5
    }

    Start-Sleep -Seconds 2
}
