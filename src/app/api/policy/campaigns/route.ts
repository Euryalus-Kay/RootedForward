import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .in("status", ["active", "past"])
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ campaigns: data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}
