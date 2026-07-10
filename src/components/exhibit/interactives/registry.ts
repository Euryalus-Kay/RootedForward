"use client";
/* ------------------------------------------------------------------ */
/*  Station registry: the code-splitting backbone. Each entry is a     */
/*  next/dynamic component (its own chunk). Only the stations that     */
/*  survived the reader rebuild are registered: the merged HOLC map    */
/*  (ch0 and ch6), the four-claims layer slider (ch1), the bombing     */
/*  record (ch4), the two-buyers arithmetic (ch9), the gap at true     */
/*  scale (ch11), and the answer wall (ch11 end).                      */
/* ------------------------------------------------------------------ */
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { StationId } from "@/lib/exhibit/types";

export interface RegistryEntry {
  title: string;
  Component: ComponentType<Record<string, unknown>>;
}

function entry(
  title: string,
  loader: () => Promise<{ default: ComponentType<Record<string, unknown>> }>
): RegistryEntry {
  return { title, Component: dynamic(loader, { ssr: false }) };
}

export const STATION_REGISTRY: Record<StationId, RegistryEntry> = {
  "holc-map": entry(
    "The 1940 Map and the Sheets Behind It",
    () => import("../stations/HolcMapStation") as Promise<{ default: ComponentType<Record<string, unknown>> }>
  ),
  "layer-slider": entry(
    "Four Claims on the Same Ground",
    () => import("./LayerSlider/LayerSlider") as Promise<{ default: ComponentType<Record<string, unknown>> }>
  ),
  "bombing-map": entry(
    "The Bombing Record",
    () => import("./BombingMap/BombingMap") as Promise<{ default: ComponentType<Record<string, unknown>> }>
  ),
  "two-buyers": entry(
    "Two Buyers of the Same House",
    () => import("./TwoBuyers/TwoBuyers") as Promise<{ default: ComponentType<Record<string, unknown>> }>
  ),
  "gap-at-scale": entry(
    "The Gap at True Scale",
    () => import("./GapAtScale/GapAtScale") as Promise<{ default: ComponentType<Record<string, unknown>> }>
  ),
  "answer-wall": entry(
    "The Wall",
    () => import("./AnswerWall/AnswerWall") as Promise<{ default: ComponentType<Record<string, unknown>> }>
  ),
};
