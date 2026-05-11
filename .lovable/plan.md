# Mnyumba Connect — Feature Expansion Plan

## 1. Favorites (Tenant)

**Database**
- New table `favorites` (`user_id`, `property_id`, `created_at`, unique pair).
- RLS: tenants manage their own rows; readable only by owner.

**UI**
- Heart icon on `PropertyCard` and on `properties/$id` detail page — toggles favorite (optimistic).
- New route `/favorites` (tenant-only) listing saved properties using `PropertyCard` grid, with empty state.
- Header: add "Favorites" link for tenants.

## 2. Inquiry Workflow + Notifications

**Database**
- Extend `inquiries`: add `status` enum (`new` | `seen` | `replied`), `landlord_reply` (text), `replied_at`, `seen_at`.
- New table `notifications` (`user_id`, `type`, `title`, `body`, `link`, `read`, `created_at`) with RLS (owner-only).
- Trigger on `inquiries` insert → creates a notification for the landlord.
- Trigger on inquiry status change to `replied` → creates a notification for the tenant.
- Enable Realtime on `notifications` and `inquiries`.

**UI**
- Header: bell icon with unread badge (realtime subscription) and dropdown listing recent notifications; click marks read & navigates.
- Landlord dashboard "Inquiries" tab: per-listing grouping, status badges, "Mark seen" auto on open, reply textarea with "Send reply" (saves reply, sets status `replied`).
- Tenant dashboard "My inquiries" tab: shows sent inquiries, status, and landlord replies.

**Email notifications (in-app + email)**
- Requires Lovable Emails domain setup (will trigger setup dialog).
- Transactional emails: new inquiry → landlord; reply → tenant.

## 3. Role-Specific Dashboards

Split the current `/dashboard` into role-aware routes:

- `/dashboard` — redirects based on role.
- `/dashboard/landlord` — listings CRUD (existing), inquiries with reply tracking, **Tracker tab** (analytics + tenant CRM).
- `/dashboard/tenant` — favorites summary, my inquiries, payment history, subscription/billing for rent.

## 4. Landlord Tracker (Analytics + Tenant CRM)

**Database**
- New table `property_views` (`property_id`, `viewer_id` nullable, `created_at`) — increment on detail page load.

**Analytics tab (Recharts)**
- KPIs: total listings, total views (30d), inquiries (30d), conversion rate, revenue collected (30d).
- Line chart: views per day. Bar chart: inquiries per listing. Pie: listings by status.

**Tenant CRM tab**
- Table of unique tenants who inquired/favorited landlord's properties.
- Columns: tenant name, contact, property, last activity, inquiry status, lifetime rent paid.
- Filters by status; export to CSV.

## 5. Rent Payment (Tenant → Landlord)

> Note: Stripe Connect (split payouts directly to landlords) isn't part of Lovable's built-in payments. We'll use **Stripe Checkout** with the platform as merchant of record and **record** each rent payment in the database. Landlords see collected rent and can mark payouts manually. This is the standard Lovable-supported pattern; true automated split payouts to landlord bank accounts would need Stripe Connect (not supported by built-in payments).

**Setup**
- Enable Lovable's built-in Stripe payments.
- New table `rent_payments` (`tenant_id`, `landlord_id`, `property_id`, `amount_kes`, `period_month`, `status` `pending|paid|failed`, `stripe_session_id`, `paid_at`).
- Webhook server route `/api/public/stripe-webhook` updates payment status and creates notifications.

**Flow**
- On a property detail page (or tenant dashboard), tenant clicks "Pay rent" → server fn creates Checkout session for that month → Stripe → webhook records payment.
- Tenant dashboard: "Rent payments" tab with history & receipts.
- Landlord dashboard tracker: rent collected per property, per month chart.

## 6. Rich Seed Data

Migration seeds (idempotent on empty tables):
- 25 properties across Nairobi, Mombasa, Kisumu, Nakuru, Eldoret with varied types/prices/amenities and Unsplash image URLs.
- 2 demo landlord profiles + 3 demo tenant profiles (rows in `profiles` only — auth users not seeded since we can't create real auth users in seed; properties attributed to a placeholder UUID landlord visible to all).
- ~40 inquiries with mixed statuses.
- ~60 favorites.
- ~120 property_views over the last 30 days.
- ~30 rent_payments across past 6 months.

Seed rows use a `is_demo` flag so they can be filtered/hidden later if needed.

## Technical Notes

- Realtime via `supabase.channel().on('postgres_changes', ...)` on `notifications`.
- All new server-side actions use `createServerFn` + `requireSupabaseAuth`.
- Email sending via Lovable Emails queue (`enqueue_email`) — will run email domain setup dialog first.
- Stripe Checkout uses the seamless Lovable Stripe integration; will run the enable flow before wiring code.
- Design tokens preserved (Kenyan green primary, terracotta accent).

## Build Order

1. Stripe enablement + email domain setup dialogs (prerequisites).
2. DB migration: new tables, enums, triggers, realtime, seed data.
3. Favorites UI + `/favorites` route.
4. Notifications bell + realtime.
5. Inquiry workflow with replies + transactional emails.
6. Split dashboards (`/dashboard/tenant`, `/dashboard/landlord`).
7. Landlord tracker (analytics + CRM).
8. Rent payment Checkout + webhook + history views.
