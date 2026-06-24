"use client";

import { useState } from "react";
import { toast } from "sonner";
import { inviteAuthor } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <form
      onSubmit={handleSubmit}
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
        {loading ? "Sending..." : "Send invite"}
      </Button>
    </form>
  );
}
