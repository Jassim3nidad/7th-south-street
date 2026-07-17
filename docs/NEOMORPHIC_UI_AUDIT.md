# Neomorphic UI audit

## Existing structure

- Public shell: root layout, fixed navigation, cart drawer, footer, and toast notifications.
- Commerce: homepage, catalog, product detail, cart, checkout, and order confirmation.
- Community: events index and event detail/RSVP.
- Administration: login plus dashboard, products, orders, events, customers, and inventory inside a shared sidebar layout.
- Styling: Tailwind utilities, one active global stylesheet, and a significant amount of inline styling in the homepage, navigation, and footer.

## Shared components to update

- `Navbar`: responsive navigation, mobile menu, and cart access.
- `Footer`: newsletter, navigation, social links, ticker, and admin entry.
- `CartDrawer`: modal surface, quantity controls, empty state, and checkout action.
- `ProductCard`: catalog imagery, badges, hover state, and price hierarchy.
- Global form, button, loading, table, status, modal, and focus styles.
- Admin layout: responsive sidebar/mobile navigation and active route treatment.

## Design decisions

- Preserve the serif display type, compact uppercase labels, black logo, editorial copy, and blue-compatible brand restraint.
- Move the canvas from near-black to a cool blue-gray and use high-contrast slate typography.
- Reserve raised shadows for navigation, cards, panels, and key actions; use inset shadows for fields, selected filters, quantity controls, and active navigation.
- Use a blue-to-violet gradient only for primary actions and small emphasis areas.
- Keep subtle borders so controls remain legible in bright environments and when shadows are reduced.
- Preserve all existing routes, data fetching, cart behavior, checkout validation, RSVP behavior, authentication, and role checks.

## Representative page

The homepage is the representative implementation because it exercises the navigation, product cards, content panels, newsletter form, footer, animation, and responsive grid in a single high-traffic route. Its desktop and mobile behavior will be visually verified before the same tokens and components are applied to the remaining views.
