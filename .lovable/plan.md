# V10 Final Build — Rupkotha Fashion Store

The current app has a working Bengali storefront, cart, guest checkout (COD only), order tracking by code, and an admin panel gated by an admin role. The database has `products`, `orders`, `order_items`, `profiles`, `user_roles` plus `place_order` / `get_order_public` / `has_role`.

V10 keeps all of that and extends it. No redesign, no duplicate tables, no rebuilt auth.

## Assumptions

- Delivery statuses expand to: Order Placed, Confirmed, Processing, Shipped, Out for Delivery, Delivered, Cancelled. Existing `pending/confirmed/shipped/delivered` rows map onto the new list.
- No real payment gateway credentials exist, so bKash/Nagad/card are recorded as payment *intent* with Pending status and a gateway-ready config placeholder. Nothing is ever marked Paid automatically.
- Bangladesh district/upazila data ships as a bundled static dataset (all 64 districts with their upazilas), validated on the server at order time.
- Guest order tracking requires Order ID **plus** the mobile number used on the order.

## Phase 1 — Database (one migration)

- `products`: add `images text[]`, `primary_image`, `active boolean`, keep existing columns (`price` = regular, `old_price` reused as regular-vs-sale is inverted → introduce `sale_price` and keep `price` as regular).
- New `product_variants`: product_id, size, color, stock, unique(product, size, color).
- `orders`: add `district`, `upazila`, `village`, `address_detail`, `discount`, `coupon_code`, `payment_status`, `refund_status`, `cancel_reason`, `cancelled_by`, `cancelled_at`, `user_id` (nullable for guests). Keep `address`, `area`, `status`.
- `order_items`: add `variant_id`.
- New `order_status_events` (status, note, created_at) to drive the tracking timeline.
- New `coupons` (code, type, value, min_order, max_discount, starts_at, ends_at, usage_limit, per_customer_limit, active) and `coupon_redemptions`.
- New `store_settings` singleton: inside/outside Dhaka delivery charge, free-delivery threshold.
- RLS: public read on active products/variants/settings; coupons validated only through a security-definer function (codes not publicly listable); orders readable by owner (`user_id = auth.uid()`) or admin; guest access only via definer functions requiring code + phone; admins manage everything.

## Phase 2 — Server-side order logic (SQL security-definer functions)

- `place_order_v2`: recomputes prices from the DB, validates district/upazila, validates and applies the coupon, computes delivery charge from `store_settings`, decrements variant stock atomically with a stock check (fails if insufficient), stores the snapshot totals, records the first status event. Client-supplied prices/discounts are ignored.
- `get_order_tracking(code, phone)`: returns order + items + timeline only when the phone matches.
- `cancel_order(code, phone, reason)`: allowed only before Shipped; sets Cancelled, restocks variants, sets Refund Pending for prepaid.
- `validate_coupon(code, subtotal)`: returns discount or a reason string.
- Admin-only functions/policies for status, payment status, refund status.

## Phase 3 — Customer frontend

- Product detail: image gallery (thumbnails + main), size/color matrix driven by variant stock, unavailable combos disabled, quantity capped at variant stock, Buy Now.
- Cart: stores variant id + snapshot fields; quantity capped by stock.
- Checkout: structured District → Upazila → Village/Area → Detailed Address (dependent selects), payment method picker (COD / bKash / Nagad / Card), coupon field with server validation, live totals (subtotal, delivery, discount, grand total), double-submit guard.
- Order page: timeline of statuses, payment/refund state, cancel button when eligible with reason select.
- New `/track` page: order ID + mobile lookup. New `/account` (optional login) with order history; `/auth` for customer signup/login. Login stays optional everywhere.

## Phase 4 — Admin

- Dashboard: total/today sales, order counts by status, total customers, recent orders, 7/30/custom-range report, inventory summary (low stock, out of stock, best sellers), quick actions.
- Products: multi-image upload (storage bucket), primary image, variant grid with stock, regular/sale price, activate/deactivate.
- Orders: search/filter, full detail drawer, status + payment + refund controls, cancellation reason display.
- New Coupons page and Delivery Settings page.

## Phase 5 — Verify

Typecheck/build, then browser-drive the guest flow (product → variant → cart → checkout → order → track → cancel), coupon valid/invalid/expired, and the admin flows. Fix what breaks.

## Notes

- Existing routes and visual identity are untouched; new pages reuse `StoreLayout`, the pink/purple tokens and Bengali copy.
- Delivery charge and discount are frozen onto each order row so later settings changes never rewrite history.
- This is large; I will work through the phases in order and report progress. Phase 1's migration needs your approval before the rest can land.
