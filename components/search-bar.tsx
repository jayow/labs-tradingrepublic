import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" className="flex w-full max-w-md gap-2">
      <Input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search posts…"
        aria-label="Search posts"
      />
      <Button type="submit" variant="outline" aria-label="Search">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
