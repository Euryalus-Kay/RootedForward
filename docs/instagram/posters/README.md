# The tools of segregation, carousel posters

Fourteen slides, two per tool, 1080 by 1350. Post each pair as a two
slide carousel.

Slide one is the cover. The logo banner, a photograph, the name, and
three short points. Slide two is the longer version. A headline, three
short paragraphs, one figure, and three photographs down the side.

A ready to upload copy sits in **Rooted Forward Instagram posters** on
the Desktop, named so it sorts in order.

## Rebuilding

    python3 docs/instagram/posters/build.py

Copy is in `tools.json`. Full credits for the cover pictures are in
`credits.json` and the short form used on slide two is in
`short-credits.json`. Layout is in `build.py`, rendered through
headless Chrome so the real brand faces are used.

## Rules the generator holds to

It refuses to render a slide whose artwork has no credit on file, so
nothing reaches Instagram uncredited by accident.

Every picture comes from `public/media/`. Nothing is generated and
nothing is stock footage standing in for history.

The four photographs reproduced from the Davis book are left out.
They carry no licence of their own, and posting them publicly is not
the same act as showing them in the app under a book credit.

## Writing

Plain and factual. Active voice, short sentences, dates and numbers
rather than narration. The wording states what a thing was and what it
did, and stops there.
