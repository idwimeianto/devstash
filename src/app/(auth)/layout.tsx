import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <Link
        href="/"
        className="absolute top-4 left-4 flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:top-6 sm:left-6"
      >
        <ArrowLeft className="size-4" />
        Back to homepage
      </Link>
      <Link href="/" className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-white">
          <Layers className="size-4" />
        </div>
        <span className="text-lg font-semibold">DevStash</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
