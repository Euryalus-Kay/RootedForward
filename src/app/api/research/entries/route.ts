/* ------------------------------------------------------------------ */
/*  GET  /api/research/entries                                         */
/*  POST /api/research/entries   (admin-only)                          */
/* ------------------------------------------------------------------ */
/*                                                                     */
/*  JSON feed of published research entries. Supports the same        */
/*  filters as the /research page — topic, city, format, sort — plus  */
/*  pagination via `page` and `per_page`.                              */
/*                                                                     */
/*  The POST endpoint creates a new entry. Protected by an auth check */
/*  that requires the caller's row in `users` to have role = 'admin'. */
/*  Row Level Security enforces this at the database level too, but   */
/*  we check here for a friendlier 403 response.                       */
/*                                                                     */
/* ------------------------------------------------------------------ */

import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  PLACEHOLDER_RESEARCH_ENTRIES,
  applyFilters,
  normalizeCitations,
  paginateEntries,
  parseFiltersFromParams,
} from "@/lib/research-constants";
import type { ResearchEntry } from "@/lib/types/database";

interface AdminGuardResult {
  ok: boolean;
  userId?: string;
  status?: number;
  message?: string;
}

async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || (data as { role?: string }).role !== "admin") {
    return { ok: false, status: 403, message: "Admin access required" };
  }

  return { ok: true, userId: user.id };
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const filters = parseFiltersFromParams(url.searchParams);
  const page = Math.max(
    1,
    parseInt(url.searchParams.get("page") ?? "1", 10) || 1
  );
  const perPage = Math.min(
    50,
    Math.max(
      1,
      parseInt(url.searchParams.get("per_page") ?? "10", 10) || 10
    )
  );

  let entries: ResearchEntry[] = [];

  if (!isSupabaseConfigured()) {
    entries = PLACEHOLDER_RESEARCH_ENTRIES;
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("research_entries")
        .select("*")
        .eq("status", "published")
        .order("published_date", { ascending: false });
      if (error || !data || data.length === 0) {
        entries = PLACEHOLDER_RESEARCH_ENTRIES;
      } else {
        entries = data.map((row) => ({
          ...row,
          authors: row.authors ?? [],
          reviewers: row.reviewers ?? [],
          citations: normalizeCitations(row.citations),
          related_campaign_ids: row.related_campaign_ids ?? [],
          related_tour_slugs: row.related_tour_slugs ?? [],
        })) as ResearchEntry[];
      }
    } catch {
      entries = PLACEHOLDER_RESEARCH_ENTRIES;
    }
  }

  const filtered = applyFilters(entries, filters);
  const pagination = paginateEntries(filtered, page, perPage);

  return NextResponse.json({
    data: pagination.items,
    meta: {
      page: pagination.page,
      per_page: perPage,
      total: filtered.length,
      total_pages: pagination.totalPages,
      has_older: pagination.hasOlder,
      has_newer: pagination.hasNewer,
      filters,
    },
  });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.message ?? "Forbidden" },
      { status: guard.status ?? 403 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requiredFields = [
    "slug",
    "title",
    "abstract",
    "topic",
    "city",
    "format",
    "published_date",
  ];
  for (const field of requiredFields) {
    if (!payload[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 422 }
      );
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("research_entries")
      .insert({
        slug: String(payload.slug),
        title: String(payload.title),
        abstract: String(payload.abstract),
        full_content_markdown:
          typeof payload.full_content_markdown === "string"
            ? payload.full_content_markdown
            : null,
        topic: String(payload.topic),
        city: String(payload.city),
        format: String(payload.format),
        authors: Array.isArray(payload.authors)
          ? (payload.authors as string[])
          : [],
        reviewers: Array.isArray(payload.reviewers)
          ? (payload.reviewers as string[])
          : [],
        citations: Array.isArray(payload.citations) ? payload.citations : [],
        pdf_url:
          typeof payload.pdf_url === "string" ? payload.pdf_url : null,
        cover_image_url:
          typeof payload.cover_image_url === "string"
            ? payload.cover_image_url
            : null,
        published_date: String(payload.published_date),
        status:
          payload.status === "published" || payload.status === "archived"
            ? payload.status
            : "draft",
        related_campaign_ids: Array.isArray(payload.related_campaign_ids)
          ? (payload.related_campaign_ids as string[])
          : [],
        related_tour_slugs: Array.isArray(payload.related_tour_slugs)
          ? (payload.related_tour_slugs as string[])
          : [],
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
