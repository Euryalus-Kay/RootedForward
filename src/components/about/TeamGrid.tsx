"use client";

/* ------------------------------------------------------------------ */
/*  TeamGrid                                                           */
/*                                                                     */
/*  The roster on /about/team. Circular portrait, name, city, school,  */
/*  and a Read bio button that opens the paragraph in a dialog. Owner  */
/*  picked this shape from a reference in July 2026, with one change.  */
/*  No job titles. The line under the city is where the person goes to */
/*  school, since this is a student-run organization and the school is */
/*  the thing a reader actually wants to know.                         */
/*                                                                     */
/*  The bio is behind a button because that is what a grid forces. A   */
/*  survey of about forty peer team pages found the rule holds almost  */
/*  everywhere. Grids move the bio off the card, stacked rows print it */
/*  inline, and nobody prints a full bio inside a grid cell because    */
/*  bios are never the same length and the ragged bottom edge shows.   */
/*                                                                     */
/*  Every bio is in the delivered HTML inside a closed <dialog>, not   */
/*  fetched on open, so a crawler and a plain fetch still see the      */
/*  whole roster. Native showModal gives focus trapping, Escape to     */
/*  close, and an inert background without writing any of it.          */
/* ------------------------------------------------------------------ */

import { useRef } from "react";
import { OPEN_SEATS, sortRoster, type TeamMember } from "@/lib/team-constants";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const CIRCLE =
  "h-36 w-36 rounded-full border border-border object-cover sm:h-40 sm:w-40";

function PersonCard({ member }: { member: TeamMember }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = `bio-${member.slug}`;

  return (
    /* h-full plus mt-auto on the button row, so a school name that wraps
       to two lines does not drop that card's button below its neighbours. */
    <li className="flex h-full flex-col items-center text-center">
      {member.photo ? (
        <img
          src={member.photo}
          /* Decorative. The name is directly beneath it. */
          alt=""
          width={480}
          height={480}
          loading="lazy"
          style={{ objectPosition: member.objectPosition ?? "50% 30%" }}
          className={CIRCLE}
        />
      ) : (
        <div
          aria-hidden="true"
          className={`${CIRCLE} flex items-center justify-center bg-cream-dark`}
        >
          <span className="font-display text-3xl tracking-[0.06em] text-forest/30">
            {initials(member.name)}
          </span>
        </div>
      )}

      <h2 className="mt-6 font-display text-xl leading-tight text-forest">
        {member.name}
      </h2>

      {member.city && (
        <p className="mt-2 font-body text-sm font-semibold leading-snug text-ink/80">
          {member.city}
        </p>
      )}
      {member.school && (
        <p className="mt-1 max-w-[26ch] font-body text-[13px] leading-snug text-ink/65">
          {member.school}
        </p>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          aria-haspopup="dialog"
          className="rounded-full bg-rust px-6 py-2.5 font-body text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust-dark"
        >
          Read bio
        </button>
      </div>

      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        /* Clicking the backdrop lands on the dialog element itself, since
           the panel inside swallows its own clicks. */
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-sm border border-border bg-cream p-0 text-left backdrop:bg-ink/50"
      >
        <div className="p-7 sm:p-9">
          <h3
            id={headingId}
            className="font-display text-2xl leading-tight text-forest"
          >
            {member.name}
          </h3>
          <p className="mt-1.5 font-body text-[13px] leading-snug text-ink/65">
            {[member.city, member.school].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-5 font-body text-base leading-relaxed text-ink/80">
            {member.bio}
          </p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="mt-7 font-body text-sm font-semibold uppercase tracking-widest text-rust-dark underline decoration-1 underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust-dark"
          >
            Close
          </button>
        </div>
      </dialog>
    </li>
  );
}

/* A seat that is spoken for and not named yet. No name, no face, no
   invented person. It fills the grid honestly and disappears the moment
   OPEN_SEATS goes to 0. */
function ReservedCard() {
  return (
    <li className="flex flex-col items-center text-center">
      <div
        aria-hidden="true"
        className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-warm-gray-light sm:h-40 sm:w-40"
      >
        <span className="font-display text-3xl leading-none text-warm-gray">
          +
        </span>
      </div>
      <p className="mt-6 font-display text-xl leading-tight text-ink/45">
        Joining soon
      </p>
      <p className="mt-2 font-body text-sm leading-snug text-ink/60">Chicago</p>
    </li>
  );
}

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  const roster = sortRoster(members);

  return (
    /* Three across at desktop, which is the only clean grid for six. Four
       across would strand an orphan row of two. */
    <ul className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
      {roster.map((member) => (
        <PersonCard key={member.slug} member={member} />
      ))}
      {Array.from({ length: OPEN_SEATS }, (_, i) => (
        <ReservedCard key={`reserved-${i}`} />
      ))}
    </ul>
  );
}
