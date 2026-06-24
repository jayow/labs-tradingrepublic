import { requireUser } from "@/lib/auth";
import { AccountForm } from "./account-form";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const profile = await requireUser();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-bold">Your account</h1>
      <AccountForm profile={profile} />
    </main>
  );
}
