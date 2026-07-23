#!/bin/sh
# Copies the walk tour media from the site's public folder into the
# app bundle resources. Run once after cloning (and again whenever
# the tour media changes), then build in Xcode.
set -e
cd "$(dirname "$0")"
SRC="../public/media/hyde-park-walk"
mkdir -p Resources/Media/audio Resources/Media/images Resources/Media/thumbs
cp "$SRC"/audio/stop-*.mp3 Resources/Media/audio/
cp "$SRC"/*.jpg Resources/Media/images/
cp "$SRC"/thumbs/*.jpg Resources/Media/thumbs/
cp ../public/media/site/holc-chicago-1940.jpg Resources/Media/images/
echo "Media copied: $(ls Resources/Media/audio | wc -l | tr -d ' ') audio, $(ls Resources/Media/images | wc -l | tr -d ' ') images, $(ls Resources/Media/thumbs | wc -l | tr -d ' ') thumbs"
