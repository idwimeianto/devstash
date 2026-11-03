import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { getPageHref, getPageNumbers, type SearchParams } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PageStepProps {
  direction: "previous" | "next";
  // null at either end, where the step is greyed out.
  href: string | null;
}

// Previous / Next; a span with aria-disabled when there is no page to go to.
function PageStep({ direction, href }: PageStepProps) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous" : "Next";
  const content = (
    <>
      {isPrevious && <ChevronLeft />}
      <span className="hidden sm:inline">{label}</span>
      {!isPrevious && <ChevronRight />}
    </>
  );
  const className = cn(buttonVariants({ variant: "ghost" }), "gap-1 px-2.5");

  return href ? (
    <Link href={href} aria-label={`${label} page`} className={className}>
      {content}
    </Link>
  ) : (
    <span aria-disabled="true" aria-label={`${label} page`} className={cn(className, "opacity-50")}>
      {content}
    </span>
  );
}

interface PaginationBarProps {
  page: number;
  pageCount: number;
  pathname: string;
  searchParams: SearchParams;
  // Search param holding this list's page.
  param?: string;
  // Element id to scroll back to after changing page.
  hash?: string;
  // Names the navigation for screen readers, e.g. "Files pages".
  label?: string;
}

// Numbered links plus Previous / Next; hidden for a single page. Uses Next.js links rather than
// the shadcn PaginationLink, which renders a plain <a> with role="button".
export function PaginationBar({
  page,
  pageCount,
  pathname,
  searchParams,
  param = "page",
  hash,
  label = "Pages",
}: PaginationBarProps) {
  if (pageCount <= 1) return null;

  const href = (target: number) => getPageHref(pathname, searchParams, target, { param, hash });

  return (
    <Pagination aria-label={label}>
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <PageStep direction="previous" href={page > 1 ? href(page - 1) : null} />
        </PaginationItem>
        {getPageNumbers(page, pageCount).map((n, index) => (
          <PaginationItem key={n === "ellipsis" ? `ellipsis-${index}` : n}>
            {n === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <Link
                href={href(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                className={buttonVariants({ variant: n === page ? "outline" : "ghost", size: "icon" })}
              >
                {n}
              </Link>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PageStep direction="next" href={page < pageCount ? href(page + 1) : null} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
