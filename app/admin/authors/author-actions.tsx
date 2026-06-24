"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { setUserRole, deleteUser } from "../actions";
import { Button } from "@/components/ui/button";

export function AuthorActions({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: "admin" | "author";
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  async function toggleRole() {
    setBusy(true);
    const res = await setUserRole(userId, role === "admin" ? "author" : "admin");
    setBusy(false);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this account? This can't be undone.")) return;
    setBusy(true);
    const res = await deleteUser(userId);
    setBusy(false);
    if (res.ok) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={toggleRole}>
        {role === "admin" ? "Make author" : "Make admin"}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={busy}
        onClick={remove}
        title="Delete account"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
