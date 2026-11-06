// A sidebar link is current only on its own page: on a collection's page, its link lights up
// rather than "View all collections" too.
export function isNavLinkActive(pathname: string, href: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return path === href;
}
