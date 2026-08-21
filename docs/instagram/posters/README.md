# The tools of segregation, carousel posters

Fourteen slides, two per tool, 1080 by 1350, which is Instagram's
portrait size. Post each pair as a two slide carousel.

Slide A is the cover. A full bleed archival photograph, the tool's
name, and the three things the post covers. Slide B is the history,
one text column with small framed photographs set around it and one
figure pulled out in rust.

## Rebuilding

    python3 docs/instagram/posters/build.py

Copy lives in `tools.json`, credit lines in `credits.json`, and the
layout in `build.py`. Rendering goes through headless Chrome so the
real brand faces are used rather than a substitute.

## Rules the generator holds to

Every photograph carries its printed credit, the same way the app
does. `build.py` refuses to render a slide whose artwork has no credit
line on file, so a picture cannot reach Instagram uncredited by
accident.

Every image comes from `public/media/`, so nothing here is generated
and nothing is a stock photograph standing in for history.

The four photographs reproduced from the Davis book are deliberately
not used. They carry no licence of their own, and posting them
publicly is a different act from showing them inside the app under a
book credit.
