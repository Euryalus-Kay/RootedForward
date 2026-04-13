"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate } from "@/lib/utils";
import type { UserProfile } from "@/lib/types/database";
import { Loader2, Users, Shield, UserIcon } from "lucide-react";
import toast from "react-hot-toast";

const ROLES: UserProfile["role"][] = ["user", "editor", "admin"];

const roleConfig: Record<
  UserProfile["role"],
  { label: string; bg: string; text: string; icon: typeof UserIcon }
> = {
  user: {
    label: "User",
    bg: "bg-warm-gray/10",
    text: "text-warm-gray",
    icon: UserIcon,
  },
  editor: {
    label: "Editor",
    bg: "bg-forest/10",
    text: "text-forest",
    icon: Shield,
  },
  admin: {
    label: "Admin",
    bg: "bg-rust/10",
    text: "text-rust",
    icon: Shield,
  },
};

export default function UsersManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data ?? []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: UserProfile["role"]
  ) => {
    setUpdatingId(userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-forest">
          Users
        </h1>
        <p className="text-sm text-warm-gray">
          Manage user accounts and roles
        </p>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-border bg-white/60 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-warm-gray-light" />
          <p className="mt-3 text-warm-gray">No users found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white/60 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_1fr_140px_150px_120px] gap-4 border-b border-border bg-cream-dark/50 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Email
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Name
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Role
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Change Role
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-warm-gray">
              Joined
            </span>
          </div>

          {users.map((user) => {
            const config = roleConfig[user.role];
            const isUpdating = updatingId === user.id;

            return (
              <div
                key={user.id}
                className="flex flex-col md:grid md:grid-cols-[1fr_1fr_140px_150px_120px] gap-2 md:gap-4 items-start md:items-center border-b border-border/40 px-6 py-4 last:border-b-0"
              >
                {/* Email */}
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm font-medium text-ink">
                    {user.email}
                  </p>
                </div>

                {/* Name */}
                <div className="min-w-0 w-full">
                  <p className="truncate text-sm text-ink-light">
                    {user.full_name || "---"}
                  </p>
                </div>

                {/* Current Role Badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    config.bg,
                    config.text
                  )}
                >
                  <config.icon className="h-3 w-3" />
                  {config.label}
                </span>

                {/* Role Dropdown */}
                <div className="relative">
                  {isUpdating ? (
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-forest" />
                      <span className="text-xs text-warm-gray">
                        Updating...
                      </span>
                    </div>
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(
                          user.id,
                          e.target.value as UserProfile["role"]
                        )
                      }
                      className="w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-rust"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Joined Date */}
                <span className="text-xs text-warm-gray">
                  {formatDate(user.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-white/60 p-4 shadow-sm">
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length;
          const config = roleConfig[role];
          return (
            <div key={role} className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  config.bg,
                  config.text
                )}
              >
                {config.label}
              </span>
              <span className="text-sm font-semibold text-ink">{count}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <span className="text-xs text-warm-gray">Total</span>
          <span className="text-sm font-bold text-ink">{users.length}</span>
        </div>
      </div>
    </div>
  );
}
