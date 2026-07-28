#!/bin/sh
# Copies the walk tour media from the site's public folder into the app
# bundle resources, and with --check reports drift instead of copying.
#
#   ./prep-media.sh            sync the app's media to the site's
#   ./prep-media.sh --check    fail if the two have drifted
#
# The site is the source of truth. Regenerating narration writes to
# public/media/hyde-park-walk/audio, and skipping this step is how the
# app came to bundle the old recordings under rewritten text. The copy
# under Resources/Media is committed, so a fresh clone builds a working
# app; git stores one blob per file no matter how many paths point at
# it, so tracking both copies costs almost nothing.
set -e
cd "$(dirname "$0")"
SRC="../public/media/hyde-park-walk"
CHECK=0
[ "$1" = "--check" ] && CHECK=1

mkdir -p Resources/Media/audio Resources/Media/images Resources/Media/thumbs

drift=0
copy_one() {
  src="$1"; dst="$2"
  if cmp -s "$src" "$dst" 2>/dev/null; then return 0; fi
  drift=$((drift + 1))
  if [ "$CHECK" = "1" ]; then
    echo "  behind: ${dst#Resources/Media/}"
  else
    cp "$src" "$dst"
  fi
}

for f in "$SRC"/audio/*.mp3; do copy_one "$f" "Resources/Media/audio/$(basename "$f")"; done
for f in "$SRC"/*.jpg;       do copy_one "$f" "Resources/Media/images/$(basename "$f")"; done
for f in "$SRC"/thumbs/*.jpg; do copy_one "$f" "Resources/Media/thumbs/$(basename "$f")"; done
copy_one ../public/media/site/holc-chicago-1940.jpg Resources/Media/images/holc-chicago-1940.jpg

if [ "$CHECK" = "1" ]; then
  if [ "$drift" -gt 0 ]; then
    echo "$drift file(s) behind the site. Run ./prep-media.sh"
    exit 1
  fi
  echo "app media is in step with the site"
else
  echo "Media synced: $drift updated, $(ls Resources/Media/audio | wc -l | tr -d ' ') audio, $(ls Resources/Media/images | wc -l | tr -d ' ') images, $(ls Resources/Media/thumbs | wc -l | tr -d ' ') thumbs"
fi
