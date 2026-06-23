import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata = { title: "Set up your account" };

export default async function AcceptInvitePage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/tr-logo.png"
            alt="Trading Republic"
            width={48}
            height={48}
            priority
            className="mb-4 h-11 w-auto"
          />
          <h1 className="font-display text-2xl font-bold">
            Welcome to Labs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a password to finish setting up your author account.
          </p>
        </div>
        <AcceptInviteForm initialName={profile.display_name ?? ""} />
      </div>
    </main>
  );
}
