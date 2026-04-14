"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: "tool" | "guide" | "reference" | "interactive";
  icon: string;
  href: string;
  cta_label: string;
}

const ICON_OPTIONS = ["pen", "book", "compass", "megaphone", "scale", "search", "lightbulb", "users"];
const TYPE_OPTIONS = ["tool", "guide", "reference", "interactive"];

const INITIAL_RESOURCES: ResourceItem[] = [
  { id: "lr1", title: "Draft a Public Comment", description: "Step-by-step walkthrough that helps you write a public comment for Chicago City Council, a zoning hearing, or a state committee.", type: "interactive", icon: "pen", href: "/policy/guides/submit-public-comment-city-council", cta_label: "Start drafting" },
  { id: "lr2", title: "Write a Policy Proposal", description: "Structure a problem statement, proposed solution, and evidence section that a legislative office will actually read.", type: "tool", icon: "lightbulb", href: "/policy/guides/write-policy-proposal", cta_label: "Start writing" },
  { id: "lr3", title: "Find Your Alderperson", description: "Look up your ward, your alderperson, their office address, and their voting record.", type: "reference", icon: "search", href: "https://www.chicago.gov/city/en/depts/mayor/iframe/lookup_ward_and_alderman.html", cta_label: "Look up your ward" },
  { id: "lr4", title: "How Zoning Works in Chicago", description: "What zoning classes mean, how rezoning applications work, and how to weigh in before a developer changes what can be built on your block.", type: "guide", icon: "compass", href: "/policy/guides/submit-comment-zoning-change", cta_label: "Read the guide" },
  { id: "lr5", title: "File an Illinois Witness Slip", description: "Register your position on any state bill in committee. Takes two minutes, counts in the official record.", type: "interactive", icon: "megaphone", href: "/policy/guides/written-testimony-illinois-general-assembly", cta_label: "Learn how" },
  { id: "lr6", title: "Organize a Sign-On Campaign", description: "How to draft a coalition letter, collect signatures, and deliver it to a decision-maker.", type: "guide", icon: "users", href: "/policy/guides/organize-sign-on-letter", cta_label: "Read the guide" },
  { id: "lr7", title: "Track Chicago Legislation", description: "Real-time tracker for every ordinance, resolution, and committee action in City Council.", type: "reference", icon: "scale", href: "https://chicago.legistar.com", cta_label: "Open tracker" },
  { id: "lr8", title: "Get an Ordinance Introduced", description: "What it takes to get an alderperson to put their name on your proposal.", type: "guide", icon: "book", href: "/policy/guides/get-alderperson-to-sponsor-ordinance", cta_label: "Read the guide" },
];

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceItem | null>(null);

  function startEdit(resource: ResourceItem) {
    setEditing(resource.id);
    setForm({ ...resource });
  }

  function startNew() {
    const newItem: ResourceItem = {
      id: `lr-${Date.now()}`,
      title: "",
      description: "",
      type: "guide",
      icon: "book",
      href: "",
      cta_label: "Read more",
    };
    setResources([...resources, newItem]);
    setEditing(newItem.id);
    setForm(newItem);
  }

  function saveEdit() {
    if (!form) return;
    if (!form.title.trim() || !form.href.trim()) {
      toast.error("Title and link are required");
      return;
    }
    setResources((prev) =>
      prev.map((r) => (r.id === form.id ? form : r))
    );
    setEditing(null);
    setForm(null);
    toast.success("Resource saved (update policy-constants.ts to persist)");
  }

  function cancelEdit() {
    if (form && !form.title) {
      setResources((prev) => prev.filter((r) => r.id !== form.id));
    }
    setEditing(null);
    setForm(null);
  }

  function removeResource(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast.success("Resource removed");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-forest">
            Learning Zone Resources
          </h1>
          <p className="mt-1 font-body text-sm text-warm-gray">
            Manage the tools, guides, and references shown in the Policy Learning Zone.
          </p>
        </div>
        <button
          onClick={startNew}
          className="rounded-lg bg-rust px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-rust-dark"
        >
          Add Resource
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {resources.map((resource) =>
          editing === resource.id && form ? (
            <div
              key={resource.id}
              className="rounded-lg border-2 border-rust/30 bg-cream p-5"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="font-body text-xs font-semibold text-warm-gray">
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-warm-gray">
                    Link / URL
                  </label>
                  <input
                    value={form.href}
                    onChange={(e) => setForm({ ...form, href: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                    placeholder="/policy/guides/... or https://..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="font-body text-xs font-semibold text-warm-gray">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-warm-gray">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ResourceItem["type"] })}
                    className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-warm-gray">
                    Icon
                  </label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                  >
                    {ICON_OPTIONS.map((i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-warm-gray">
                    Button Label
                  </label>
                  <input
                    value={form.cta_label}
                    onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-cream px-3 py-2 font-body text-sm focus:outline-none focus:ring-1 focus:ring-rust/30"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={saveEdit}
                  className="rounded bg-forest px-4 py-2 font-body text-sm font-medium text-cream transition-colors hover:bg-forest-light"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="rounded border border-border px-4 py-2 font-body text-sm font-medium text-ink transition-colors hover:bg-cream-dark"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={resource.id}
              className="flex items-center justify-between rounded-lg border border-border bg-cream p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="inline-block rounded bg-cream-dark px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-warm-gray">
                    {resource.type}
                  </span>
                  <p className="font-body text-sm font-medium text-ink">
                    {resource.title}
                  </p>
                </div>
                <p className="mt-1 font-body text-xs text-warm-gray line-clamp-1">
                  {resource.description}
                </p>
              </div>
              <div className="ml-4 flex gap-2">
                <button
                  onClick={() => startEdit(resource)}
                  className="rounded bg-cream-dark px-3 py-1.5 font-body text-xs font-medium text-ink transition-colors hover:bg-border"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeResource(resource.id)}
                  className="rounded bg-rust/10 px-3 py-1.5 font-body text-xs font-medium text-rust transition-colors hover:bg-rust/20"
                >
                  Remove
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <p className="mt-8 font-body text-xs text-warm-gray">
        Note: Changes here are session-only until the database is connected.
        To persist changes permanently, update the PLACEHOLDER_LEARNING_RESOURCES
        array in src/lib/policy-constants.ts.
      </p>
    </div>
  );
}
