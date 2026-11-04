# Homepage

## Overview

Replace the placeholder `/` route (`src/app/page.tsx`) with the real marketing homepage, built from the static mockup in `prototypes/homepage/` (`index.html`, `styles.css`, `script.js`). The mockup is the visual and behavioral reference; rebuild it in React with Tailwind and shadcn/ui rather than copying its CSS.

## Requirements

- Same sections, content and order as the mockup: fixed nav, hero text, "chaos to order" hero visual (floating icons, pulsing arrow, dashboard preview), Features (6 cards), AI section (Pro badge, checklist, editor mockup with AI tags), Pricing (Free / Pro with monthly / yearly toggle), CTA, footer
- Same behavior: nav more opaque on scroll, icons drift / bounce / pulse / glide away from the cursor (gentle repel, as tuned in the mockup), sections fade in on scroll, AI tags pop in one by one, yearly toggle shows $72/year
- Respect `prefers-reduced-motion` (no icon animation, arrow pulse or fade-ins) and keep the page usable without JavaScript (content visible, static icon layout)
- Responsive like the mockup: hero stacks with the arrow pointing down, grids go single column, no horizontal scroll at 390px
- Dark theme only, matching the rest of the app; accent color is the snippet blue (no indigo / purple, as in the polished mockup)
- Page metadata: title and description for the landing page

## Links

- Logo → `/`; Features / Pricing → `#features` / `#pricing` (smooth scroll, offset for the fixed nav)
- Sign In → `/sign-in`
- Get Started, "Start for free", Free plan button, CTA button → `/register`
- "Upgrade to Pro" → `/register` (no billing yet)
- Signed-in visitors: nav shows a "Dashboard" button (→ `/dashboard`) instead of Sign In / Get Started, and the main CTAs go to `/dashboard`
- Footer: keep only links to pages that exist (Features, Pricing, Sign In, Register); drop placeholder links (Docs, Blog, Changelog, About, Privacy, Terms) instead of pointing them at `#`

## Component Structure

- Server components by default, in `src/components/home/` (`HomeNav`, `Hero`, `FeaturesSection`, `AiSection`, `PricingSection`, `CtaSection`, `HomeFooter`, plus small shared pieces such as `SectionHeading`)
- Client components only where interactivity needs them:
  - `NavScrollState` — wraps the nav and toggles the opaque style on scroll
  - `ChaosIcons` — the `requestAnimationFrame` icon animation and cursor repel
  - `Reveal` — `IntersectionObserver` fade-in wrapper reused by every section
  - `BillingToggle` — the monthly / yearly switch and the Pro price it controls
- Session-dependent nav buttons and CTAs read the session in a server component inside `<Suspense>` (with the signed-out version as the fallback), so the rest of the page stays static

## Technical

- Tailwind v4 utilities and theme tokens in `globals.css`; no new CSS files, no inline styles. Keyframes (arrow pulse, fade-in) go in `globals.css` only if Tailwind's built-ins don't cover them
- shadcn/ui `Button` / `buttonVariants` for buttons and links (links styled with `buttonVariants`, as elsewhere, so Base UI doesn't add `role="button"`), `Card` and `Badge` where they fit, shadcn `Switch` for the billing toggle
- Icons from `lucide-react`; reuse `GitHubIcon` and add simple inline SVG components for the Notion, Slack and VS Code marks
- Item type icons and colors come from `src/lib/item-type-display.ts` (one source of truth with the app)
- DRY content: features, AI checklist, pricing plans and footer links as typed arrays in one module (e.g. `src/lib/home-content.ts`) mapped by the components; the dashboard preview cards and feature cards share the type display map
- Pricing values (prices, 50 items, 3 collections) defined once and reused, including the yearly price and "Save 25%"
- Keep the icon physics (step, bounce, repel, speed cap) as a pure function in `src/lib/` so the client component only handles the DOM, refs and animation frame
- Check `node_modules/next/dist/docs/` before using anything date- or request-dependent in server components (e.g. the footer year) so the page can still be prerendered

## Testing

- Unit tests for the pure utilities only: the icon physics function (wall bounce, repel within the radius, speed cap, easing back to cruising speed) and any pricing helper
- Browser check: every section at 1440px and 390px, links and anchors, the billing toggle, the cursor repel, reduced motion, signed-in vs signed-out nav, no console errors

## Notes

- `/` stays public; no proxy changes
- `prototypes/homepage/` stays as the reference and is not imported by the app
- Decide at `start`: item type colors from the app's `item-type-display.ts` (recommended, consistent with the dashboard) or the mockup's palette, which differs (e.g. Prompt amber vs violet)
