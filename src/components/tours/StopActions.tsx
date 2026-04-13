"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, MapPinCheck, Share2, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import ShareModal from "@/components/ui/ShareModal";

interface StopActionsProps {
  stopId: string;
  stopTitle: string;
  stopDescription: string;
  city: string;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
  onClick: () => void;
}

function ActionButton({ icon, label, active, disabled, tooltip, onClick }: ActionButtonProps) {
  return (
    <div className="group relative flex flex-col items-center gap-1.5">
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.9 }}
        whileHover={disabled ? undefined : { scale: 1.05 }}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
          active
            ? "border-forest bg-forest text-cream"
            : disabled
              ? "cursor-not-allowed border-border bg-cream-dark text-warm-gray-light"
              : "border-border bg-cream text-ink-light hover:border-forest hover:text-forest"
        )}
        aria-label={label}
      >
        {icon}
      </motion.button>
      <span className="font-body text-xs text-warm-gray">{label}</span>
      {disabled && tooltip && (
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2.5 py-1 font-body text-xs text-cream opacity-0 transition-opacity group-hover:opacity-100">
          {tooltip}
        </span>
      )}
    </div>
  );
}

export default function StopActions({ stopId, stopTitle, stopDescription, city }: StopActionsProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isVisited, setIsVisited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadUserState() {
      try {
        if (!supabase) { setLoading(false); return; }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from("users")
          .select("saved_stops, visited_stops")
          .eq("id", user.id)
          .single();

        if (profile) {
          setIsSaved(profile.saved_stops?.includes(stopId) ?? false);
          setIsVisited(profile.visited_stops?.includes(stopId) ?? false);
        }
      } catch {
        // User not logged in or profile not found
      } finally {
        setLoading(false);
      }
    }
    loadUserState();
  }, [stopId]);

  const toggleArray = useCallback(
    async (field: "saved_stops" | "visited_stops", current: boolean) => {
      if (!userId || !supabase) return;
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("saved_stops, visited_stops")
          .eq("id", userId)
          .single();

        if (!profile) return;

        const arr: string[] = profile[field] ?? [];
        const updated = current
          ? arr.filter((id) => id !== stopId)
          : [...arr, stopId];

        const updatePayload =
          field === "saved_stops"
            ? { saved_stops: updated }
            : { visited_stops: updated };

        await supabase
          .from("users")
          .update(updatePayload)
          .eq("id", userId);

        return !current;
      } catch {
        toast.error("Something went wrong. Please try again.");
        return current;
      }
    },
    [userId, stopId, supabase]
  );

  const handleSave = async () => {
    if (!userId) return;
    const result = await toggleArray("saved_stops", isSaved);
    if (result !== undefined) {
      setIsSaved(result);
      toast.success(result ? "Stop saved!" : "Stop removed from saved");
    }
  };

  const handleVisited = async () => {
    if (!userId) return;
    const result = await toggleArray("visited_stops", isVisited);
    if (result !== undefined) {
      setIsVisited(result);
      toast.success(result ? "Marked as visited!" : "Removed visited mark");
    }
  };

  const handleShare = () => {
    setIsShareOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoggedIn = !!userId;
  const disabledTooltip = "Sign in to save stops";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-cream p-4">
        <div className="flex justify-center gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-11 w-11 animate-pulse rounded-full bg-cream-dark" />
              <div className="h-3 w-10 animate-pulse rounded bg-cream-dark" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-cream p-4">
        <div className="flex justify-center gap-6">
          <ActionButton
            icon={
              isSaved ? (
                <motion.div
                  key="saved"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <BookmarkCheck size={20} />
                </motion.div>
              ) : (
                <Bookmark size={20} />
              )
            }
            label="Save"
            active={isSaved}
            disabled={!isLoggedIn}
            tooltip={disabledTooltip}
            onClick={handleSave}
          />

          <ActionButton
            icon={
              isVisited ? (
                <motion.div
                  key="visited"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <MapPinCheck size={20} />
                </motion.div>
              ) : (
                <MapPinCheck size={20} />
              )
            }
            label="Visited"
            active={isVisited}
            disabled={!isLoggedIn}
            tooltip={disabledTooltip}
            onClick={handleVisited}
          />

          <ActionButton
            icon={<Share2 size={20} />}
            label="Share"
            onClick={handleShare}
          />

          <ActionButton
            icon={<Printer size={20} />}
            label="Print"
            onClick={handlePrint}
          />
        </div>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={stopTitle}
        url={currentUrl}
        description={stopDescription}
      />
    </>
  );
}
