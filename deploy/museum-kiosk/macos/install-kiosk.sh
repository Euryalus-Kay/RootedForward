#!/bin/bash
# Rooted Forward museum kiosk installer (macOS).
#
# Run this ONLY on the dedicated museum display machine. It changes power
# settings, disables the screen saver, and makes Chrome launch at login and
# stay there. Everything it does is undone by uninstall-kiosk.sh.
#
#   bash install-kiosk.sh "/path/to/Rooted Forward Map Kiosk (offline).html"
#
# If you leave the path off, it looks in this folder and in ~/Downloads.

set -euo pipefail

KIOSK_HOME="/Users/Shared/RootedForwardKiosk"
LABEL="org.rootedforward.kiosk"
NIGHTLY_LABEL="org.rootedforward.kiosk-nightly"
AGENTS="$HOME/Library/LaunchAgents"
BACKUP="$KIOSK_HOME/previous-settings.txt"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  [ok] %s\n' "$*"; }
warn() { printf '  [!!] %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 0. Refuse to run by accident on somebody's everyday Mac.
# ---------------------------------------------------------------------------
say "Rooted Forward museum kiosk installer"
cat <<EOF
This machine will be turned into an unattended exhibit display:

  - Google Chrome opens full screen at login and cannot be closed for long
  - the Mac will never sleep and the screen never dims
  - it restarts by itself after a power cut
  - the screen saver is turned off

Do not run this on a laptop you use for anything else.
Run uninstall-kiosk.sh to put everything back.

EOF
printf 'Type the word MUSEUM to continue: '
read -r CONFIRM
if [ "$CONFIRM" != "MUSEUM" ]; then
  echo "Cancelled. Nothing was changed."
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Find the exhibit file.
# ---------------------------------------------------------------------------
say "1. Locating the exhibit file"
EXHIBIT_SRC="${1:-}"
if [ -z "$EXHIBIT_SRC" ]; then
  for candidate in \
    "$HERE"/*.html \
    "$HOME/Downloads/Rooted Forward Map Kiosk (offline).html" \
    "$HOME/Downloads"/*Kiosk*.html
  do
    if [ -f "$candidate" ]; then EXHIBIT_SRC="$candidate"; break; fi
  done
fi
if [ -z "$EXHIBIT_SRC" ] || [ ! -f "$EXHIBIT_SRC" ]; then
  warn "Could not find the exhibit HTML file."
  echo "     Pass it directly:  bash install-kiosk.sh \"/path/to/exhibit.html\""
  exit 1
fi
SIZE=$(stat -f%z "$EXHIBIT_SRC")
if [ "$SIZE" -lt 1000000 ]; then
  warn "$EXHIBIT_SRC is only $SIZE bytes. The real exhibit is about 7 MB."
  warn "That looks like the wrong file. Stopping so you can check."
  exit 1
fi
ok "using $EXHIBIT_SRC ($SIZE bytes)"

if [ ! -x "$CHROME" ]; then
  warn "Google Chrome is not installed at $CHROME"
  echo "     Install Chrome from google.com/chrome, then run this again."
  exit 1
fi
ok "Chrome found, version $("$CHROME" --version 2>/dev/null | tr -d '\n')"

# ---------------------------------------------------------------------------
# 2. Lay the files down in a path with no spaces in it.
# ---------------------------------------------------------------------------
say "2. Installing files into $KIOSK_HOME"
mkdir -p "$KIOSK_HOME/chrome-profile"
cp "$EXHIBIT_SRC" "$KIOSK_HOME/exhibit.html"
cp "$HERE/kiosk-launch.sh"  "$KIOSK_HOME/kiosk-launch.sh"
cp "$HERE/kiosk-nightly.sh" "$KIOSK_HOME/kiosk-nightly.sh"
chmod +x "$KIOSK_HOME/kiosk-launch.sh" "$KIOSK_HOME/kiosk-nightly.sh"
chmod -R u+rwX,go+rX "$KIOSK_HOME"
ok "exhibit.html and launcher scripts installed"

# ---------------------------------------------------------------------------
# 3. The launch agent. This is what makes it come back when it is closed.
# ---------------------------------------------------------------------------
say "3. Installing the launch agent"
mkdir -p "$AGENTS"

# KeepAlive is the plain boolean true on purpose, not a SuccessfulExit
# dictionary. Quitting Chrome with Cmd+Q exits with status 0, and we want a
# relaunch after that just as much as after a crash. launchd's default
# ThrottleInterval of 10 seconds means a genuinely broken setup retries once
# every 10s instead of spinning the processor.
cat >"$AGENTS/$LABEL.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>              <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$KIOSK_HOME/kiosk-launch.sh</string>
  </array>
  <key>RunAtLoad</key>          <true/>
  <key>KeepAlive</key>          <true/>
  <key>ThrottleInterval</key>   <integer>10</integer>
  <key>ProcessType</key>        <string>Interactive</string>
  <key>StandardOutPath</key>    <string>$KIOSK_HOME/launchd.log</string>
  <key>StandardErrorPath</key>  <string>$KIOSK_HOME/launchd.log</string>
</dict>
</plist>
EOF
plutil -lint "$AGENTS/$LABEL.plist" >/dev/null
ok "$LABEL.plist written and validated"

# A long-running browser showing an animated map creeps up in memory over
# weeks. Restarting Chrome at 4am is cheaper and less disruptive than
# rebooting the machine. The script it runs checks the clock before acting,
# because launchd fires a missed calendar interval as soon as the machine
# next wakes, which would otherwise restart the exhibit mid-visit.
cat >"$AGENTS/$NIGHTLY_LABEL.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>            <string>$NIGHTLY_LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$KIOSK_HOME/kiosk-nightly.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>   <integer>4</integer>
    <key>Minute</key> <integer>0</integer>
  </dict>
</dict>
</plist>
EOF
plutil -lint "$AGENTS/$NIGHTLY_LABEL.plist" >/dev/null
ok "$NIGHTLY_LABEL.plist written (fresh Chrome every night at 4am)"

# bootstrap is the modern verb; load is kept as a fallback for older systems.
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootout "gui/$(id -u)/$NIGHTLY_LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$AGENTS/$LABEL.plist" 2>/dev/null \
  || launchctl load -w "$AGENTS/$LABEL.plist"
launchctl bootstrap "gui/$(id -u)" "$AGENTS/$NIGHTLY_LABEL.plist" 2>/dev/null \
  || launchctl load -w "$AGENTS/$NIGHTLY_LABEL.plist"
ok "agents loaded, Chrome should be opening now"

# ---------------------------------------------------------------------------
# 4. Settings that do not need a password.
# ---------------------------------------------------------------------------
say "4. Display and desktop settings"
mkdir -p "$KIOSK_HOME"
{
  echo "# Saved by install-kiosk.sh so uninstall can put these back."
  echo "screensaver_idleTime=$(defaults -currentHost read com.apple.screensaver idleTime 2>/dev/null || echo 300)"
  echo "dock_autohide=$(defaults read com.apple.dock autohide 2>/dev/null || echo 0)"
  for corner in tl tr bl br; do
    echo "wvous_${corner}=$(defaults read com.apple.dock "wvous-${corner}-corner" 2>/dev/null || echo 1)"
  done
  echo "pmset_displaysleep=$(pmset -g custom | awk '/displaysleep/{print $2; exit}')"
  echo "pmset_sleep=$(pmset -g custom | awk '/^ *sleep/{print $2; exit}')"
  echo "pmset_autorestart=$(pmset -g custom | awk '/autorestart /{print $2; exit}')"
} >"$BACKUP"
ok "previous settings saved to $BACKUP"

defaults -currentHost write com.apple.screensaver idleTime -int 0
ok "screen saver off"

defaults write com.apple.dock autohide -bool true
for corner in tl tr bl br; do
  defaults write com.apple.dock "wvous-${corner}-corner" -int 0
done
killall Dock 2>/dev/null || true
ok "Dock hidden, hot corners disabled"

# ---------------------------------------------------------------------------
# 5. Power settings. These need an administrator password.
# ---------------------------------------------------------------------------
say "5. Power settings (your Mac password is needed once)"
echo "  Setting: never sleep, never dim, restart after a power cut,"
echo "  and power on by itself at 7am daily in case it is ever shut down."
if sudo -v 2>/dev/null; then
  sudo pmset -a displaysleep 0 sleep 0 disksleep 0
  ok "display and disk will never sleep"
  sudo pmset -a autorestart 1
  ok "restarts automatically after a power failure"
  # 'wakeorpoweron' wakes it if asleep and powers it on if it is off.
  sudo pmset repeat wakeorpoweron MTWRFSU 07:00:00
  ok "powers itself on every day at 7:00am"
else
  warn "Skipped power settings, no administrator password given."
  warn "Run this later to finish:"
  echo "     sudo pmset -a displaysleep 0 sleep 0 disksleep 0 autorestart 1"
  echo "     sudo pmset repeat wakeorpoweron MTWRFSU 07:00:00"
fi

# ---------------------------------------------------------------------------
# 6. What is left for a human to click.
# ---------------------------------------------------------------------------
say "Installed. Three things still need doing by hand."
cat <<'EOF'

  A. TURN OFF FILEVAULT, then TURN ON AUTOMATIC LOGIN.
     Automatic login is impossible while FileVault is on, so do it in
     this order.
       System Settings > Privacy & Security > FileVault > Turn Off
       (wait for it to finish decrypting, this can take a while)
       System Settings > Users & Groups > Automatic log in as > pick the account

     Without this the Mac stops at the login screen after a power cut and
     the exhibit never comes back.

  B. TURN ON DO NOT DISTURB so notifications never appear over the map.
       Control Center > Focus > Do Not Disturb > turn on
       Then: System Settings > Focus > Do Not Disturb > Turn on automatically
       and set a schedule covering all day.

  C. UNPLUG THE KEYBOARD AND MOUSE once you have finished setting it up.
     This is the single most effective lockdown on a Mac. A touchscreen
     with no keyboard cannot press Cmd+Q, Cmd+Tab, or anything else. macOS
     has no true kiosk lock without paid device management, so physical
     removal is what actually stops a visitor.

  Check it is running:      launchctl list | grep rootedforward
  Watch the log:            tail -f /Users/Shared/RootedForwardKiosk/kiosk.log
  Put everything back:      bash uninstall-kiosk.sh

EOF
