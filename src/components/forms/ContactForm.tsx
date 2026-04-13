"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("submissions").insert({
        type: "contact" as const,
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });

      if (error) throw error;

      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
    } catch {
      toast.error(
        "Something went wrong sending your message. Please try again or email us directly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label
          htmlFor="contact-name"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Name <span className="text-rust">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="contact-email"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Email <span className="text-rust">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="you@example.com"
          className="w-full rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="contact-message"
          className="mb-1.5 block font-body text-sm font-medium text-ink"
        >
          Message <span className="text-rust">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={6}
          required
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          placeholder="How can we help? Ask a question, share feedback, or just say hello..."
          className="w-full resize-y rounded-md border border-border bg-cream px-4 py-3 font-body text-ink placeholder:text-warm-gray-light focus:border-rust focus:outline-none focus:ring-2 focus:ring-rust/30"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex items-center justify-center rounded-sm bg-rust px-7 py-3.5 font-body text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-rust-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
