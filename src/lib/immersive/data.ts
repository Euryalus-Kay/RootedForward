import {
  findPlaceholderImmersiveTour,
  PLACEHOLDER_IMMERSIVE_TOURS,
} from "./constants";
import type {
  ImmersiveMedium,
  ImmersiveStop,
  ImmersiveTour,
} from "./types";

/* ------------------------------------------------------------------ */
/*  Server-side loaders. Supabase first, placeholder constants as the  */
/*  fallback, matching the site-wide pattern.                          */
/* ------------------------------------------------------------------ */

interface ImmersiveTourRow {
  city: string;
  slug: string;
  title: string;
  dek: string;
  medium: string;
  hero_note: string | null;
  stops: unknown;
  published: boolean;
}

const MEDIUMS: ImmersiveMedium[] = ["underwater", "street", "aerial"];

export function rowToImmersiveTour(row: ImmersiveTourRow): ImmersiveTour {
  const medium = MEDIUMS.includes(row.medium as ImmersiveMedium)
    ? (row.medium as ImmersiveMedium)
    : "underwater";
  const stops = Array.isArray(row.stops)
    ? (row.stops as ImmersiveStop[]).filter(
        (s) => s && typeof s.id === "string" && typeof s.title === "string"
      )
    : [];
  return {
    city: row.city,
    slug: row.slug,
    title: row.title,
    dek: row.dek ?? "",
    medium,
    heroNote: row.hero_note ?? undefined,
    stops,
    published: row.published,
  };
}

export async function getImmersiveTour(
  city: string,
  slug: string
): Promise<ImmersiveTour | null> {
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("immersive_tours")
      .select("*")
      .eq("city", city)
      .eq("slug", slug)
      .eq("published", true)
      .single();
    if (error || !data) return findPlaceholderImmersiveTour(city, slug);
    return rowToImmersiveTour(data as ImmersiveTourRow);
  } catch {
    return findPlaceholderImmersiveTour(city, slug);
  }
}

export async function listImmersiveTours(
  city?: string
): Promise<ImmersiveTour[]> {
  const fallback = PLACEHOLDER_IMMERSIVE_TOURS.filter(
    (t) => t.published && (!city || t.city === city)
  );
  try {
    const { isSupabaseConfigured, createClient } = await import(
      "@/lib/supabase/server"
    );
    if (!isSupabaseConfigured()) throw new Error("skip");
    const supabase = await createClient();
    let query = supabase
      .from("immersive_tours")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: true });
    if (city) query = query.eq("city", city);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return fallback;
    return (data as ImmersiveTourRow[]).map(rowToImmersiveTour);
  } catch {
    return fallback;
  }
}
