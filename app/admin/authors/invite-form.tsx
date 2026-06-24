"use client";

import { useState } from "react";
import { toast } from "sonner";
import { inviteAuthor, createInviteLink } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await inviteAuthor(email);
    setLoading(false);
    if (result.ok) {
      toast.success(result.message);
      setEmail("");
    } else {
      toast.error(result.message);
    }
  }

  async function copyLink() {
    setLoading(true);
    const result = await createInviteLink(email);
    setLoading(false);
    if (!result.ok || !result.link) {
      toast.error(result.message);
      return;
    }
    try {
      await navigator.clipboard.writeText(result.link);
      toast.success("Invite link copied — paste it to your author.");
    } catch {
      // Clipboard blocked — let them copy manually.
      window.prompt("Copy this invite link:", result.link);
    }
    setEmail("");
  }

  return (
    <form
      onSubmit={sendInvite}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Invite an author
        </label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="writer@tradingrepublic.io"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "..." : "Send invite"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={copyLink}
        >
          Copy link
        </Button>
      </div>
    </form>
  );
}
