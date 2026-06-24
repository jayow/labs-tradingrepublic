"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createInviteLink } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await createInviteLink(email);
    setLoading(false);
    if (!result.ok || !result.link) {
      toast.error(result.message);
      return;
    }
    try {
      await navigator.clipboard.writeText(result.link);
      toast.success("Invite link copied — share it with your author.");
    } catch {
      window.prompt("Copy this invite link:", result.link);
    }
    setEmail("");
  }

  return (
    <form
      onSubmit={createLink}
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
      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Copy invite link"}
      </Button>
    </form>
  );
}
