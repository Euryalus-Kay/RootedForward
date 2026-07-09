"use client";
/* ------------------------------------------------------------------ */
/*  RoomOverlay, the machine rooms' door frame. A full-screen in-page  */
/*  overlay over the dimmed stage, driven entirely by                  */
/*  state.openRoom. Radix Dialog supplies the focus trap, the body     */
/*  scroll lock, and Escape; the overlay renders in place (no          */
/*  portal) so the exhibit's scoped linen styles apply and the sheet   */
/*  stacks above the z-40 HUD at z-[55]. The room body is its own      */
/*  scroll region. Opening pushes #room-<id> onto history so the       */
/*  browser Back button closes the room; closing strips the hash.      */
/*                                                                     */
/*  Deep links: ExhibitApp owns mount-time URL handling. Integrators   */
/*  call openRoomFromHash(dispatch) once the tour is mounted (mode     */
/*  set, stage up) to honor a #room-<id> hash on arrival.              */
/* ------------------------------------------------------------------ */
import { useEffect, useRef, type Dispatch } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import type { ExhibitAction } from "@/lib/exhibit/types";
import { COUNTER_ROOM_ID, FILES_ROOM_ID, isRoomId, machineOf, type RoomId } from "@/lib/exhibit/machines";
import { COUNTER_ROOM } from "@/lib/exhibit/content/rooms";
import { FILES_ROOM_PLATE } from "@/lib/exhibit/files-room";
import { useExhibitDispatch, useExhibitState } from "@/lib/exhibit/ExhibitProvider";
import { moveFocus } from "@/lib/exhibit/focus";
import { machineTitle } from "../hud/BrassLamp";

const HASH_PREFIX = "#room-";

/** Parse a location hash into a known room id (five machines, the
 *  counter room, the Surveyor's Files), else null. A suffix after a
 *  colon (#room-files:1594, a sheet permalink) belongs to the room
 *  and is ignored here.  */
export function roomIdFromHash(hash: string | null | undefined): RoomId | null {
  if (!hash || !hash.startsWith(HASH_PREFIX)) return null;
  const id = hash.slice(HASH_PREFIX.length).split(":")[0];
  return isRoomId(id) ? id : null;
}

/**
 * Mount-time deep-link helper for the integrator (ExhibitApp owns the
 * mount sequence, not this module). Reads location.hash and opens the
 * named room when it is a real machine id. Returns true when a room
 * opened. Call it after mode/BEGIN so the stage exists behind the
 * overlay.
 */
export function openRoomFromHash(dispatch: Dispatch<ExhibitAction>): boolean {
  if (typeof window === "undefined") return false;
  const id = roomIdFromHash(window.location.hash);
  if (!id) return false;
  dispatch({ type: "OPEN_ROOM", roomId: id });
  return true;
}

/* The room body is deep material; it loads as its own chunk the first
 * time a door opens, the same policy as the interactive registry. */
const MachineRoom = dynamic(() => import("./MachineRoom"), {
  ssr: false,
  loading: () => (
    <p className="exh-plat px-8 py-16 text-center text-xs uppercase tracking-[0.25em] text-exh-ink-soft">
      Opening the room
    </p>
  ),
});

const SurveyorsFiles = dynamic(() => import("./SurveyorsFiles"), {
  ssr: false,
  loading: () => (
    <p className="exh-plat px-8 py-16 text-center text-xs uppercase tracking-[0.25em] text-exh-ink-soft">
      Opening the archive
    </p>
  ),
});

export default function RoomOverlay() {
  const state = useExhibitState();
  const dispatch = useExhibitDispatch();

  const openRoom = state.openRoom;
  const isCounter = openRoom === COUNTER_ROOM_ID;
  const isFiles = openRoom === FILES_ROOM_ID;
  const machine = openRoom && !isCounter && !isFiles ? machineOf(openRoom) : undefined;

  const plate = machine
    ? { title: machineTitle(machine), plain: machine.plainName, description: machine.definition }
    : isCounter
      ? { title: COUNTER_ROOM.title, plain: COUNTER_ROOM.plainName, description: COUNTER_ROOM.definition }
      : isFiles
        ? { title: FILES_ROOM_PLATE.title, plain: FILES_ROOM_PLATE.plainName, description: FILES_ROOM_PLATE.definition }
        : undefined;
  const plateTitle = plate?.title;
  const platePlain = plate?.plain;
  const plateDescription = plate?.description;

  const openRoomRef = useRef<string | null>(openRoom);
  const lastRoomRef = useRef<string | null>(null);
  const prevRoomRef = useRef<string | null>(null);
  /* whoever had focus when the room opened; closing hands it back
     (a station button can open a room far from that room's door) */
  const openerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    openRoomRef.current = openRoom;
  }, [openRoom]);

  /* hash sync: open pushes #room-<id>, close strips it. The pushed
     entry means the browser Back button lands on the pre-room URL and
     the popstate handler below closes the overlay. */
  useEffect(() => {
    const prev = prevRoomRef.current;
    prevRoomRef.current = openRoom;
    if (openRoom) lastRoomRef.current = openRoom;
    if (openRoom && openRoom !== prev) {
      const target = HASH_PREFIX + openRoom;
      /* compare by room id, not the exact string: a sheet permalink
         (#room-files:1594) already names this room and its suffix
         belongs to the room, so it must survive the open */
      if (roomIdFromHash(window.location.hash) !== openRoom) {
        window.history.pushState(null, "", target);
      }
    } else if (!openRoom && prev) {
      if (window.location.hash.startsWith(HASH_PREFIX)) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, [openRoom]);

  /* Back closes, Forward reopens */
  useEffect(() => {
    const onPop = () => {
      const id = roomIdFromHash(window.location.hash);
      if (id) {
        if (openRoomRef.current !== id) dispatch({ type: "OPEN_ROOM", roomId: id });
      } else if (openRoomRef.current) {
        dispatch({ type: "CLOSE_ROOM" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [dispatch]);

  const close = () => dispatch({ type: "CLOSE_ROOM" });

  return (
    <Dialog.Root
      open={!!openRoom}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <Dialog.Overlay className="fixed inset-0 z-[55] bg-exh-ink/60" />
      <Dialog.Content
        ref={contentRef}
        data-testid="room-overlay"
        data-room={openRoom ?? undefined}
        onOpenAutoFocus={() => {
          /* runs before Radix moves focus into the sheet, so the
             active element is still whatever control opened the room */
          const opener = document.activeElement;
          openerRef.current =
            opener instanceof HTMLElement && opener !== document.body ? opener : null;
        }}
        onEscapeKeyDown={(e) => {
          /* an open citation popover or voice card INSIDE this room
             claims the Escape; the room stays. Both close themselves
             on the same event. A stale voice card left open out on
             the page must not eat the room's Escape. */
          if (
            contentRef.current?.querySelector(
              '[data-testid="source-popover"], [data-testid^="voice-card-"]'
            )
          ) {
            e.preventDefault();
          }
        }}
        onCloseAutoFocus={(e) => {
          /* hand focus back to the control that opened the room, then
             fall back to the room's door, then the exhibit root
             (there is no Radix Trigger; doors dispatch OPEN_ROOM) */
          e.preventDefault();
          const opener = openerRef.current;
          openerRef.current = null;
          const door = lastRoomRef.current
            ? document.querySelector<HTMLElement>(`[data-testid="door-enter-${lastRoomRef.current}"]`)
            : null;
          moveFocus(
            (opener && opener.isConnected ? opener : null) ??
              door ??
              document.querySelector<HTMLElement>('[data-testid="exhibit-root"]')
          );
        }}
        className="exh-paper fixed inset-0 z-[56] overflow-y-auto overscroll-contain border-exh-ink/30 bg-exh-linen shadow-[0_8px_40px_rgba(28,26,23,0.5)] focus:outline-none md:inset-x-6 md:inset-y-5 md:rounded-sm md:border"
      >
        {/* top bar: nameplate plus the way back, always in reach */}
        <div className="sticky top-0 z-10 border-b border-exh-ink/20 bg-exh-linen exh-paper">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <div className="min-w-0">
              <Dialog.Title asChild>
                <h2 className="exh-plat truncate text-sm font-semibold uppercase tracking-[0.25em] text-exh-ink">
                  {plateTitle ?? "Machine room"}
                </h2>
              </Dialog.Title>
              {platePlain ? (
                <p className="exh-plat mt-0.5 truncate text-[11px] uppercase tracking-[0.18em] text-exh-ink-soft md:text-[10px]">
                  {platePlain}
                </p>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                data-testid="room-close"
                className="exh-plat inline-flex min-h-12 shrink-0 cursor-pointer items-center border border-exh-ink/40 bg-exh-linen px-4 text-xs font-semibold uppercase tracking-[0.2em] text-exh-ink transition-colors duration-200 hover:border-exh-ink hover:bg-exh-ink hover:text-exh-linen"
              >
                Back to the exhibit
              </button>
            </Dialog.Close>
          </div>
        </div>

        {plateDescription ? (
          <Dialog.Description className="sr-only">{plateDescription}</Dialog.Description>
        ) : null}

        {isFiles ? (
          <SurveyorsFiles />
        ) : openRoom && isRoomId(openRoom) ? (
          <MachineRoom roomId={openRoom} />
        ) : (
          <p className="exh-plat px-8 py-16 text-center text-xs uppercase tracking-[0.25em] text-exh-ink-soft">
            This room does not exist
          </p>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
