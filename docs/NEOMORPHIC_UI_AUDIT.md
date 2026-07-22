# Neomorphic UI audit

## Audited baseline structure

- **Application shell:** the root layout owned fonts, theme initialization, metadata, toast notifications, and—after the storefront port—a second global storefront navigation/footer pair.
- **Primary shared shell:** `components/layout/Navbar`, `Footer`, and `CartDrawer` contained the established cart, customer-auth, theme, mobile-menu, newsletter, and dismissible-layer behavior used by commerce, authentication, account, and event routes.
- **Ported storefront shell:** `components/storefront/StorefrontNavbar` and `StorefrontFooter` duplicated parts of the primary shell but omitted the cart drawer and theme controls. Mounting these globally duplicated navigation/footer UI and placed storefront chrome around admin pages.
- **Public commerce:** homepage, catalog, product detail, cart, checkout, order confirmation, and order tracking.
- **Community:** events index plus event detail and RSVP.
- **Customer access:** login, account creation, recovery/reset, and the authenticated account area (overview, profile, addresses, wishlist, orders, security, deletion).
- **Administration:** login plus dashboard, products, orders, events, customers, subscribers, and inventory inside a responsive role-protected sidebar layout.
- **Styling:** Tailwind utilities plus `src/app/globals.css`. Semantic `neo-*`, account, auth, table, modal, and admin class names remained throughout the UI, but a later stylesheet replacement had removed their definitions.

## Implemented architecture

- `components/layout/SiteChrome` now owns the single public `Navbar`, `CartDrawer`, and `Footer` mount. Admin routes bypass storefront chrome and retain the protected admin shell.
- `src/app/globals.css` is again the canonical design layer for light and dark tokens, raised and recessed surfaces, focus, semantic states, safe areas, responsive breakpoints, forced colors, and reduced motion.
- `tailwind.config.js` maps brand, canvas, text, border, radius, and shadow utilities to the same CSS variables.
- The homepage is the representative implementation; its hero, campaign, countdown, products, brand story, and newsletter sections use the shared system.
- Catalog, authentication, account, cart, checkout, tracking, events, admin entry, tables, drawers, and admin dialogs consume the shared surfaces and controls without changing their data or permission logic.

## Shared components and systems updated

- Restored the shared CSS custom-property system for canvas, raised/recessed surfaces, text, borders, radii, shadows, focus, semantic states, and motion.
- Reconciled Tailwind semantic colors with the CSS variables so the ported storefront and established routes share one light/dark treatment.
- Kept one public shell using `Navbar`, `CartDrawer`, and `Footer`, mounted only outside admin routes.
- Updated the homepage sections, catalog filters/sort/product cards, empty/loading states, and product-detail surfaces to the same tokens.
- Normalized shared form, button, table, badge, modal, drawer, toast, loading, disabled, success, warning, and error treatments.
- Preserved admin navigation, mobile drawer, tables, charts, and modal behavior while moving their visual values to semantic tokens.

## Design decisions

- Preserve the Cormorant/DM Sans typography, compact uppercase labels, official logo, editorial voice, and understated streetwear identity.
- Use a cool blue-gray canvas with high-contrast slate text; dark mode remains supported because it already exists and is user-selectable.
- Reserve raised shadows for navigation, cards, panels, and key actions. Use inset shadows for fields, selected filters, quantity controls, toggles, and pressed states.
- Use the blue-to-violet gradient for primary actions and small emphasis areas, not every surface.
- Keep subtle borders so controls remain legible in bright conditions and when shadows are visually reduced.
- Preserve all current routes, data fetching, cart behavior, checkout validation, RSVP behavior, authentication, and role checks.
- Respect 44px touch targets, visible `:focus-visible` rings, safe-area insets, sufficient contrast, and `prefers-reduced-motion`.

## Representative implementation and review matrix

The homepage was the representative implementation because it exercises navigation, promotional imagery, product cards, countdown controls, editorial panels, newsletter forms, footer, animation, and responsive grids in a high-traffic route. It was reviewed first at 1440×1000 and 390×844.

1. `/shop` error boundary at desktop and mobile; live catalog/detail data is blocked by the local Supabase key noted below.
2. `/login` visually at desktop/mobile; `/create-account`, `/forgot-password`, and `/reset-password` inspected for landmarks, labels, target size, and overflow.
3. `/cart`, `/checkout`, `/order-confirmation`, and `/track` at desktop/mobile, including loading and guarded empty states.
4. `/events` empty state at desktop/mobile and `/events/[slug]` not-found boundary; a live event was unavailable.
5. `/account` unauthenticated redirect boundary.
6. `/admin` login at desktop/mobile and the protected dashboard redirect; authenticated dashboard pages and dialogs were code-reviewed because credentials were unavailable.
7. Homepage, authentication, and catalog-error views in both light and dark themes; mobile navigation and the cart drawer were opened and visually reviewed.

## Known constraints

- The worktree contained user-owned SEO/event changes; the redesign preserved and worked around them.
- The configured local Supabase publishable key is rejected by the hosted project as invalid. Live catalog/product-detail records cannot be visually reviewed until that environment value is refreshed; the resilient catalog error state was reviewed instead.
- No customer or administrator credentials were supplied, so authenticated account pages, admin dashboards, charts, populated tables, and live admin dialogs were validated by code review, lint, type-check, and build rather than browser rendering.
- Product links now resolve through the live `/shop/[slug]` route; no workflow or route name was changed.
