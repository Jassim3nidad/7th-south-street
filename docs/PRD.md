# Product Requirements Document: 7TH SOUTH STREET (7SS)

## Product Vision
7TH SOUTH STREET (7SS) is a premium underground streetwear e-commerce and brand platform based in the Philippines. It serves as the digital flagship store for the brand, offering an exclusive, seamless, and nonchalant luxury shopping experience. The platform acts as a singular brand destination, blending commerce with culture, and is designed to scale across Southeast Asia.

## Business Goals
1. Establish a high-end direct-to-consumer (DTC) digital storefront.
2. Provide a frictionless purchasing experience that encourages brand loyalty.
3. Facilitate exclusive limited drops and pop-up events.
4. Expand the customer base across the Philippines with a scalable architecture for future SEA expansion.
5. Provide administrators with robust tools to manage inventory, orders, and content efficiently and securely.

## Target Customers
- Fashion-forward individuals seeking exclusive streetwear.
- Enthusiasts of underground culture and "nonchalant luxury" aesthetics.
- Customers looking for high-quality snapbacks, fitted caps, shirts, hoodies, sweats, and accessories.
- Attendees of 7SS limited drops and pop-up events.

## Administrator Persona
- **Brand Managers / Store Owners:** Require secure, high-level access to manage product catalogs, update inventory, process orders, and review analytics.
- **Content Creators:** Need tools to manage event details and editorial content without writing code.

---

## User Stories

### Customer User Stories
- As a customer, I want to browse products with high-quality images and cinematic transitions so I can appreciate the premium quality of the clothing.
- As a customer, I want to check out quickly as a guest so I don't have to remember another password.
- As a customer, I want the option to create an account so I can track my order history and save my preferences.
- As a customer, I want to view details and RSVP for upcoming pop-up events to stay connected with the brand's physical presence.
- As a customer, I want the website to work flawlessly on my mobile device, since I mostly shop on my phone.

### Administrator User Stories
- As an administrator, I want to securely log into "The Vault" to manage store operations.
- As an administrator, I want to add, update, and manage inventory for products and variants so that the storefront is always up to date.
- As an administrator, I want to track and fulfill orders efficiently.
- As an administrator, I want to view analytics (sales, popular items) to inform future drops.

---

## Functional Requirements

### 1. Product and Inventory Requirements
- The system must display a categorized product catalog (e.g., Snapbacks, Hoodies, Accessories).
- Each product must support multiple variants (e.g., size, color) and track inventory at the variant level.
- Products must support states: "available", "sold_out", "coming_soon".
- High-resolution product images with gallery support.

### 2. Checkout and Fulfillment Workflow
- The system must provide a seamless cart and checkout experience.
- The system must calculate totals accurately (server-side enforced).
- Administrators must be able to view, update, and track the status of orders (e.g., pending, shipped, fulfilled).

### 3. Guest-Checkout Requirements
- Guest checkout must remain available and prominently accessible.
- A user must be able to complete a purchase solely by providing shipping and payment information, without creating a password.

### 4. Customer-Account Requirements
- Customer login and account creation are optional conveniences, not checkout requirements.
- Customers with accounts can view order history and manage saved addresses securely.
- Public registration must never allow a customer to assign themselves an administrator role.

### 5. Admin-Access Requirements
- "The Vault" is private and strictly restricted to authorized administrators.
- Access requires strong authentication.
- Administrators can manage the full product lifecycle, fulfill orders, and manage content.

### 6. Pop-up Event and RSVP Requirements
- The platform must feature an Events section detailing upcoming pop-ups or drops.
- Customers can RSVP to events.
- Administrators can manage event details and track RSVPs.

### 7. Newsletter Requirements
- Users must be able to subscribe to a newsletter.
- Rate limiting must be enforced on subscription endpoints to prevent spam.

### 8. Analytics Requirements
- The system must aggregate sales data, inventory levels, and user engagement metrics for the administrator dashboard.

---

## Non-Functional Requirements

### 1. Security Requirements
- **Authentication:** Utilize Supabase Auth for all session management. Do not expose Supabase service-role keys to the browser. Do not store authentication tokens in `localStorage`.
- **Authorization (RLS):** Protect customer and administrator data using strict PostgreSQL Row Level Security (RLS) policies.
- **Data Integrity:** Never trust client-provided prices, totals, roles, stock values, or payment state. Use transactions or safe database functions for stock-sensitive order operations.

### 2. Accessibility Requirements
- Follow WCAG guidelines.
- Ensure semantic HTML, proper contrast ratios, and keyboard navigability.
- Provide aria-labels for interactive elements.

### 3. Mobile Requirements
- The platform must be strictly mobile-first, ensuring responsive behavior across all device sizes.
- Touch targets must be appropriately sized for mobile users.

### 4. UI/UX Design System
- Preserve the established "nonchalant luxury" identity.
- **Colors:** Charcoal black (`#080808`), Warm gold (`#C9A96E`), Off-white (`#F5F2EE`).
- **Typography:** Cormorant Garamond (headlines), DM Sans (body content).
- **Aesthetic:** Dark-mode dominant, minimalist layouts, premium fashion campaign aesthetic.
- **Interactions:** Cinematic transitions, restrained animation (via Framer Motion).

---

## Architecture & Scope

### Current Technology Stack
- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Zustand.
- **Backend/Database:** Supabase, PostgreSQL, Supabase Auth, Supabase Storage, Next.js Server Actions/Route Handlers.
- **Deployment:** Vercel, GitHub CI/CD.

*Note: The platform is a single-brand store. It does not support multi-vendor or marketplace capabilities. A legacy PHP backend has been fully deprecated and removed in favor of Supabase.*

### MVP Scope
- Core product catalog and inventory management.
- Cart and checkout flow (Guest + Optional Account).
- The Vault (Admin Dashboard) for order and product management.
- Static brand pages and dynamic pop-up event listings.

### Post-Launch Roadmap
- Southeast Asian shipping integration and multi-currency support.
- Advanced promotional tools (discount codes, flash sale timers).
- Enhanced analytics and customer segmentation.

### Risks & Dependencies
- **Risks:** High traffic during limited drops may strain database connections; UI complexity could impact mobile performance.
- **Dependencies:** Supabase uptime, Vercel hosting, Payment Gateway integrations.

### Success Metrics
- Conversion rate for limited drops.
- Zero security breaches or privilege escalation incidents.
- Mobile page load speed and Core Web Vitals.
- Adoption rate of optional customer accounts vs. guest checkout.
