#!/bin/bash
# Rooted Forward museum kiosk launcher (macOS).
#
# launchd runs this script and watches it. Chrome is exec'd, not
# backgrounded, so this script's process becomes Chrome. When Chrome exits
# for any reason (crash, Cmd+Q, a visitor closing the window) launchd sees
# the exit and starts it again. Do not add "&" to the exec line.
#
# Nothing here uses python. /usr/bin/python3 on a clean Mac is a stub that
# pops up a "install developer tools" dialog instead of running, which would
# be a dialog sitting on a museum wall. plutil ships with every macOS.

set -u

KIOSK_HOME="/Users/Shared/RootedForwardKiosk"
PROFILE="$KIOSK_HOME/chrome-profile"
EXHIBIT="$KIOSK_HOME/exhibit.html"
LOG="$KIOSK_HOME/kiosk.log"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$KIOSK_HOME" "$PROFILE" 2>/dev/null

say() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG" 2>/dev/null; }

# Months of restarts would otherwise grow this without bound.
if [ -f "$LOG" ] && [ "$(wc -c <"$LOG" 2>/dev/null || echo 0)" -gt 2000000 ]; then
  mv -f "$LOG" "$LOG.1" 2>/dev/null
fi
say "===== launcher starting (pid $$) ====="

# --------------------------------------------------------------------------
# 1. Wait for the graphical session.
# A LaunchAgent can fire before WindowServer will hand out windows. Chrome
# started that early comes up with no window at all, exits, and gets
# relaunched in a loop.
# --------------------------------------------------------------------------
for i in $(seq 1 180); do
  if /usr/bin/pgrep -x WindowServer >/dev/null 2>&1 && /usr/bin/pgrep -x Dock >/dev/null 2>&1; then
    say "graphical session ready after ${i}s"
    break
  fi
  sleep 1
done
sleep 3

# --------------------------------------------------------------------------
# 2. Do not fight another Chrome for the profile.
# Chrome only allows one process per user-data-dir. A second one hands off
# and exits instantly, which with KeepAlive means respawning forever. If
# something already owns the profile, the exhibit is already on screen, so
# wait rather than thrash.
# --------------------------------------------------------------------------
for i in $(seq 1 60); do
  /usr/bin/pgrep -f -- "--user-data-dir=$PROFILE" >/dev/null 2>&1 || break
  say "another Chrome owns the profile, waiting ($i)"
  sleep 5
done

# --------------------------------------------------------------------------
# 3. Clear stale lock files.
# A power cut leaves SingletonLock pointing at a process id that no longer
# exists, and Chrome then refuses to start. This is the single most likely
# reason a kiosk is dark the morning after an outage.
# --------------------------------------------------------------------------
if ! /usr/bin/pgrep -f -- "--user-data-dir=$PROFILE" >/dev/null 2>&1; then
  rm -f "$PROFILE/SingletonLock" "$PROFILE/SingletonSocket" "$PROFILE/SingletonCookie" 2>/dev/null
  say "cleared stale singleton locks"
fi

# --------------------------------------------------------------------------
# 4. Tell Chrome the last session ended normally.
# After any power cut Chrome believes it crashed and offers to restore tabs,
# which parks a dialog over the exhibit. --hide-crash-restore-bubble hides
# the bubble; clearing these two keys means Chrome never thinks it crashed.
# --------------------------------------------------------------------------
if [ -f "$PROFILE/Default/Preferences" ]; then
  /usr/bin/plutil -replace profile.exit_type -string "Normal" \
    "$PROFILE/Default/Preferences" >/dev/null 2>&1 \
    && say "exit_type reset to Normal"
fi
if [ -f "$PROFILE/Local State" ]; then
  /usr/bin/plutil -replace user_experience_metrics.stability.exited_cleanly -bool true \
    "$PROFILE/Local State" >/dev/null 2>&1 \
    && say "exited_cleanly reset to true"
fi

# --------------------------------------------------------------------------
# 5. Check the things that make starting pointless.
# Sleeping before a failing exit matters. launchd's ThrottleInterval is 10
# seconds, so without this a missing file means six Chrome launches a minute
# forever.
# --------------------------------------------------------------------------
if [ ! -x "$CHROME" ]; then
  say "FATAL Chrome is not installed at $CHROME"
  sleep 60
  exit 1
fi
if [ ! -f "$EXHIBIT" ]; then
  say "FATAL exhibit file missing at $EXHIBIT"
  sleep 60
  exit 1
fi

# The installed path deliberately has no spaces in it. The substitution is
# here so a renamed file still produces a valid URL.
URL="file://${EXHIBIT// /%20}"

# --------------------------------------------------------------------------
# 6. Hold off sleep for exactly as long as Chrome runs.
# -w takes a process id, and the exec below keeps this same pid, so the
# assertion is released the moment Chrome exits. This changes no system
# setting, so there is nothing to undo later.
# --------------------------------------------------------------------------
/usr/bin/caffeinate -dimsu -w $$ >/dev/null 2>&1 &

say "exec Chrome -> $URL"

# Every switch below was confirmed present in the Chrome 152 binary on the
# machine this kit was written on. Three switches that older kiosk guides
# still recommend are gone from current Chrome and are deliberately absent:
#   --disable-session-crashed-bubble   replaced by --hide-crash-restore-bubble
#   --disable-pinch                    removed
#   --disable-infobars                 removed in Chrome 65, does nothing now
exec "$CHROME" \
  --kiosk \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  --disable-search-engine-choice-screen \
  --noerrdialogs \
  --hide-crash-restore-bubble \
  --disable-notifications \
  --disable-sync \
  --disable-extensions \
  --disable-background-networking \
  --disable-component-update \
  --disable-backgrounding-occluded-windows \
  --check-for-update-interval=31536000 \
  --overscroll-history-navigation=0 \
  --autoplay-policy=no-user-gesture-required \
  --allow-file-access-from-files \
  "$URL"
