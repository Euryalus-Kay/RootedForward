"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface MemberRow {
  id: string;
  slug: string;
  full_name: string;
  role: string;
  city: string | null;
  affiliation: string | null;
  bio: string;
  photo_url: string | null;
  board_type: "student" | "advisory";
  display_order: number;
  is_active: boolean;
  pillar_lead: string | null;
}

type Tab = "student" | "advisory";

const EMPTY_FORM: Omit<MemberRow, "id"> = {
  slug: "",
  full_name: "",
  role: "",
  city: "",
  affiliation: "",
  bio: "",
  photo_url: null,
  board_type: "student",
  display_order: 0,
  is_active: true,
  pillar_lead: null,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/g, "");
}

export default function AdminBoardPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("student");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MemberRow, "id"> & { id?: string }>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [tab]);

  async function fetchMembers() {
    setLoading(true);
    setLoadError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_members")
        .select("*")
        .eq("board_type", tab)
        .order("display_order", { ascending: true });
      if (error) {
        const detail =
          error.code === "42P01"
            ? "Table `board_members` does not exist. Run migration 002_policy_schema.sql."
            : error.code === "PGRST301" || error.code === "42501"
              ? "Row Level Security is rejecting the read. Confirm your account has role = 'admin' in the users table."
              : error.message;
        setLoadError(`${error.code ?? "error"}: ${detail}`);
        setMembers([]);
        return;
      }
      setMembers((data as MemberRow[]) ?? []);
    } catch (e) {
      setLoadError(
        e instanceof Error
          ? e.message
          : "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL is set."
      );
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setForm({ ...EMPTY_FORM, board_type: tab, display_order: members.length + 1 });
    setEditing(null);
    setShowForm(true);
  }

  function startEdit(member: MemberRow) {
    setForm(member);
    setEditing(member.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.full_name.trim() || !form.role.trim() || !form.bio.trim()) {
      toast.error("Name, role, and bio are required.");
      return;
    }

    const slug = form.slug || slugify(form.full_name);
    const payload = {
      ...form,
      slug,
      full_name: form.full_name.trim(),
      role: form.role.trim(),
      bio: form.bio.trim(),
      city: form.city?.trim() || null,
      affiliation: form.affiliation?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient();
      if (editing) {
        const { error } = await supabase
          .from("board_members")
          .update(payload)
          .eq("id", editing);
        if (error) throw error;
        toast.success("Member updated");
      } else {
        const { error } = await supabase
          .from("board_members")
          .insert(payload);
        if (error) throw error;
        toast.success("Member added");
      }
      setShowForm(false);
      setEditing(null);
      fetchMembers();
    } catch (e) {
      const err = e as { code?: string; message?: string };
      const detail =
        err.code === "42P01"
          ? "Table board_members not found. Run migration 002_policy_schema.sql."
          : err.code === "23505"
            ? "Slug already exists. Edit the slug field to a unique value."
            : err.code === "PGRST301" || err.code === "42501"
              ? "RLS rejected the write. Confirm your account has role = 'admin' in the users table."
              : err.message ?? "Unknown error.";
      toast.error(`Save failed — ${detail}`, { duration: 8000 });
    }
  }

  async function toggleActive(id: string, currentlyActive: boolean) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("board_members")
        .update({ is_active: !currentlyActive })
        .eq("id", id);
      if (error) throw error;
      toast.success(currentlyActive ? "Archived" : "Restored");
      fetchMembers();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteMember(id: string) {
    if (!confirm("Permanently delete this member? This cannot be undone.")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("board_members").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      fetchMembers();
    } catch {
      toast.error("Failed to delete");
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "student", label: "Student Board" },
    { key: "advisory", label: "Advisory Board" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">
            Board Members
          </h1>
          <p className="mt-1 font-body text-sm text-warm-gray">
            Manage Student Board and Advisory Board members shown on the About page.
          </p>
        </div>
        <button
          onClick={startNew}
          className="rounded-lg bg-rust px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-rust-dark"
        >
          Add Member
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); }}
            className={`px-4 py-2 font-body text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-rust text-rust"
                : "text-warm-gray hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mt-6 rounded-lg border-2 border-rust/30 bg-cream p-6">
          <h2 className="font-display text-lg text-forest">
            {editing ? "Edit Member" : "Add Member"}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="font-body text-xs font-semibold text-warm-gray">Full Name *</label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value, slug: slugify(e.target.value) })}
                className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>
            <div>
              <label className="font-body text-xs font-semibold text-warm-gray">Role *</label>
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>
            <div>
              <label className="font-body text-xs font-semibold text-warm-gray">City</label>
              <input
                value={form.city ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>
            <div>
              <label className="font-body text-xs font-semibold text-warm-gray">Affiliation</label>
              <input
                value={form.affiliation ?? ""}
                onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
                className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>
            {tab === "student" && (
              <div>
                <label className="font-body text-xs font-semibold text-warm-gray">Pillar Lead</label>
                <select
                  value={form.pillar_lead ?? ""}
                  onChange={(e) => setForm({ ...form, pillar_lead: e.target.value || null })}
                  className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                >
                  <option value="">None</option>
                  <option value="education">Education</option>
                  <option value="policy">Policy</option>
                  <option value="research">Research</option>
                </select>
              </div>
            )}
            <div>
              <label className="font-body text-xs font-semibold text-warm-gray">Display Order</label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="font-body text-xs font-semibold text-warm-gray">Bio *</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
              />
              <p className="mt-1 font-body text-xs text-warm-gray">
                {form.bio.length} characters
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSave}
              className="rounded bg-forest px-4 py-2 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
            >
              {editing ? "Update" : "Add Member"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="rounded border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Load error banner — shown when Supabase rejects the read */}
      {loadError && !loading && (
        <div className="mt-6 rounded-md border border-rust/40 bg-rust/5 p-4 font-body text-[13px] leading-relaxed text-rust">
          <p className="font-semibold uppercase tracking-widest text-[11px]">
            Could not load board members
          </p>
          <p className="mt-1 font-mono text-[12.5px] text-rust/85">
            {loadError}
          </p>
          <p className="mt-2 text-rust/85">
            Until this is fixed, the form below may say it saved
            successfully but writes will not actually land in the
            database.
          </p>
        </div>
      )}

      {/* Members list */}
      {loading ? (
        <p className="mt-8 font-body text-sm text-warm-gray">Loading...</p>
      ) : members.length === 0 ? (
        <p className="mt-8 font-body text-sm text-warm-gray">
          {loadError
            ? "Members could not be loaded. See error above."
            : "No members yet. Add your first board member above."}
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className={`flex items-center justify-between rounded-lg border border-border bg-cream p-4 ${
                !member.is_active ? "opacity-50" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-cream-dark font-display text-sm text-warm-gray">
                  {member.full_name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-ink">
                    {member.full_name}
                  </p>
                  <p className="font-body text-xs text-warm-gray">
                    {member.role}
                    {member.city && ` · ${member.city}`}
                    {member.pillar_lead && ` · ${member.pillar_lead} lead`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(member)}
                  className="rounded bg-cream-dark px-3 py-1.5 font-body text-xs font-medium text-ink transition-colors hover:bg-border"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(member.id, member.is_active)}
                  className="rounded bg-cream-dark px-3 py-1.5 font-body text-xs font-medium text-ink transition-colors hover:bg-border"
                >
                  {member.is_active ? "Archive" : "Restore"}
                </button>
                <button
                  onClick={() => deleteMember(member.id)}
                  className="rounded bg-rust/10 px-3 py-1.5 font-body text-xs font-medium text-rust transition-colors hover:bg-rust/20"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
