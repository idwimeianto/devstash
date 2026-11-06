import { ArrowLeft, Layers } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-between">
          {/* The negative margin cancels the padding, so the arrow lines up with the form's edge. */}
          <Link
            href="/"
            className="-ml-2 flex min-h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
        </div>
        {children}
      </div>
    </main>
  );
}
