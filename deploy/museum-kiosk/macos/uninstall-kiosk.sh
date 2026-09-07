#!/bin/bash
# Undo everything install-kiosk.sh did (macOS).
#
#   bash uninstall-kiosk.sh
#
# Safe to run even if the installer only got partway through.

set -uo pipefail

KIOSK_HOME="/Users/Shared/RootedForwardKiosk"
LABEL="org.rootedforward.kiosk"
NIGHTLY_LABEL="org.rootedforward.kiosk-nightly"
AGENTS="$HOME/Library/LaunchAgents"
BACKUP="$KIOSK_HOME/previous-settings.txt"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok()  { printf '  [ok] %s\n' "$*"; }

say "Removing the Rooted Forward kiosk"

# 1. Stop the agents first, otherwise killing Chrome just restarts it.
for label in "$LABEL" "$NIGHTLY_LABEL"; do
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null \
    || launchctl unload -w "$AGENTS/$label.plist" 2>/dev/null || true
  rm -f "$AGENTS/$label.plist"
  ok "removed $label"
done

pkill -f "$KIOSK_HOME/chrome-profile" 2>/dev/null || true
ok "kiosk Chrome closed"

# 2. Put the settings back where they were, using the values the installer
#    saved. Falls back to macOS defaults if the backup is missing.
say "Restoring settings"
get() { grep "^$1=" "$BACKUP" 2>/dev/null | cut -d= -f2- ; }

SS=$(get screensaver_idleTime); SS=${SS:-300}
defaults -currentHost write com.apple.screensaver idleTime -int "$SS"
ok "screen saver back to ${SS}s"

DA=$(get dock_autohide); DA=${DA:-0}
if [ "$DA" = "1" ]; then
  defaults write com.apple.dock autohide -bool true
else
  defaults write com.apple.dock autohide -bool false
fi
for corner in tl tr bl br; do
  V=$(get "wvous_${corner}"); V=${V:-1}
  defaults write com.apple.dock "wvous-${corner}-corner" -int "$V"
done
killall Dock 2>/dev/null || true
ok "Dock and hot corners restored"

say "Power settings (password needed)"
if sudo -v 2>/dev/null; then
  DS=$(get pmset_displaysleep); DS=${DS:-10}
  SL=$(get pmset_sleep);        SL=${SL:-10}
  AR=$(get pmset_autorestart);  AR=${AR:-0}
  sudo pmset -a displaysleep "$DS" sleep "$SL" disksleep 10
  sudo pmset -a autorestart "$AR"
  sudo pmset repeat cancel
  ok "sleep, autorestart and the daily power-on schedule restored"
else
  echo "  Skipped. To finish by hand:"
  echo "     sudo pmset -a displaysleep 10 sleep 10 disksleep 10 autorestart 0"
  echo "     sudo pmset repeat cancel"
fi

say "Done"
cat <<EOF

  The exhibit files are still in $KIOSK_HOME in case you want them.
  Delete them with:  rm -rf "$KIOSK_HOME"

  Two things this script cannot undo for you, because they are switches in
  System Settings rather than commands:

    - Automatic login   (System Settings > Users & Groups > Automatic log in as > Off)
    - FileVault         (System Settings > Privacy & Security > FileVault > Turn On)
    - Do Not Disturb    (Control Center > Focus)

EOF
