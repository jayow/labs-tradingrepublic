import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <Image
        src="/tr-logo.png"
        alt="Trading Republic"
        width={72}
        height={72}
        priority
        className="mb-8 h-16 w-auto"
      />
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
        Labs
      </p>
      <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Trading Republic Labs
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Insights, research, and ideas from the Trading Republic team. The blog
        is taking shape.
      </p>
    </main>
  );
}
