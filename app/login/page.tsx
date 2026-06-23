import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
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
          <h1 className="font-display text-2xl font-bold">Sign in to Labs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Author access is invite-only.
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
