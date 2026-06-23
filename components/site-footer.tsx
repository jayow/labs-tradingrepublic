export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {year} Trading Republic. All rights reserved.</p>
        <a
          href="https://tradingrepublic.io"
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-foreground"
        >
          tradingrepublic.io
        </a>
      </div>
    </footer>
  );
}
