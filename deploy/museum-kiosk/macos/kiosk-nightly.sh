#!/bin/bash
# Restart the kiosk browser once a night so weeks of running do not pile up
# memory in a long-lived page.
#
# The guard matters. launchd runs a MISSED StartCalendarInterval as soon as
# the machine next wakes. If the Mac is off at 4am, launchd would otherwise
# fire this the moment it powers on at 7am, and again after any daytime
# reboot, restarting the exhibit while somebody is reading it. So the script
# checks the clock itself and does nothing outside the small hours.

set -u

KIOSK_HOME="/Users/Shared/RootedForwardKiosk"
LOG="$KIOSK_HOME/kiosk.log"
LABEL="org.rootedforward.kiosk"

say() { printf '%s  nightly: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG" 2>/dev/null; }

HOUR=$(date +%H)
# 10#$HOUR forces base 10, otherwise 08 and 09 are invalid octal and the
# comparison errors out. This bites once a year at 8am and never in testing.
if [ "$((10#$HOUR))" -lt 3 ] || [ "$((10#$HOUR))" -gt 5 ]; then
  say "skipped, it is ${HOUR}:xx and the museum may be open"
  exit 0
fi

say "restarting the kiosk browser"
launchctl kickstart -k "gui/$(id -u)/$LABEL" 2>/dev/null \
  || pkill -f "$KIOSK_HOME/chrome-profile" 2>/dev/null \
  || true
