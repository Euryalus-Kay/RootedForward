import type { CollageCell } from "@/lib/initiatives";

/* ------------------------------------------------------------------ */
/*  The photo collage in an initiative box.                            */
/*                                                                     */
/*  "museum" is one tall photograph with two squares stacked beside    */
/*  it, the lower of which can hold the partner's mark on its own      */
/*  color (owner, October 18, 2026). "stack" is one large photograph   */
/*  over a row of two, a wide strip and a small square beside it.      */
/*  Cells crop with object-cover and each photo carries its own focus  */
/*  point so the people stay in frame.                                 */
/*                                                                     */
/*  Below lg the box stacks, so cells take aspect ratios there instead */
/*  of sharing a fixed height. On a phone the museum layout puts the   */
/*  tall photo full width at its own 4:5 with the two squares under.   */
/* ------------------------------------------------------------------ */

const LAYOUTS = {
  museum: {
    grid: "grid-cols-2 md:grid-rows-2 md:h-[600px] lg:h-full lg:min-h-[600px]",
    cells: [
      "col-span-2 aspect-[4/5] md:col-span-1 md:row-span-2 md:aspect-auto",
      "aspect-square md:aspect-auto",
      "aspect-square md:aspect-auto",
    ],
  },
  stack: {
    grid: "grid-cols-3 lg:grid-rows-[2.2fr_1fr] lg:h-full lg:min-h-[600px]",
    /* the strip's 2:1 sets the lower row's height; the small photo
       stretches to match it */
    cells: ["col-span-3 aspect-[4/3] lg:aspect-auto", "col-span-2 aspect-[2/1] lg:aspect-auto", "col-span-1"],
  },
} as const;

export default function Collage({
  cells,
  layout,
}: {
  cells: CollageCell[];
  layout: keyof typeof LAYOUTS;
}) {
  const spec = LAYOUTS[layout];
  return (
    <div className={`grid gap-2 bg-cream ${spec.grid}`}>
      {cells.slice(0, spec.cells.length).map((cell, i) => {
        if ("logo" in cell) {
          return (
            <div
              key={cell.logo}
              className={`flex items-center justify-center ${spec.cells[i]}`}
              style={{ backgroundColor: cell.background }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cell.logo}
                alt={cell.alt}
                loading="lazy"
                className="aspect-square w-[54%] max-w-[190px] rounded-full"
              />
            </div>
          );
        }
        return (
          <div key={cell.src} className={`relative overflow-hidden bg-cream-dark ${spec.cells[i]}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cell.src}
              srcSet={cell.small ? `${cell.small} 800w, ${cell.src} 1600w` : undefined}
              sizes={i === 0 ? "(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
              alt={cell.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: cell.focus ?? "50% 50%" }}
            />
          </div>
        );
      })}
    </div>
  );
}
