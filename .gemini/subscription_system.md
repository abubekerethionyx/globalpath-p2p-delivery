# Subscription System Finalization

## 1. Pay-Per-Use Quota Enforcement (Backend)
- Modified `SubscriptionTransaction` model to include `remaining_usage`, `is_active`, `end_date`.
- **Activation**: New subscriptions automatically set quota (`limit` -> `remaining_usage`) and deactivate old ones.
- **Enforcement**: 
    - `shipment_service.create_shipment`: Blocks Senders if active quota is 0.
    - `shipment_service.pick_shipment`: Blocks Pickers if active quota is 0.
- **Countdown**: Usage decrements automatically on valid actions.

## 2. Quota Visibility (Frontend)
- **Marketplace**: Shows "Monthly Quota" card (e.g., "5 of 5 Remaining") for Pickers.
- **Post Shipment**: Shows "Posts Remaining" badge and disables form for Senders.
- **Logic**: Fetches `getActiveSubscription` directly to ensure sync with backend.

## 3. Subscription Management (Packaging Page)
- **Prevent Double Subscribe**:
    - Connected `App.tsx` user state to `PackagingPage` via `refreshUser`.
    - Upon purchase, user profile is re-fetched.
    - "Subscribe" button is immediately replaced with "Plan Active" badge for the purchased plan.

## Verification
- Purchase a plan -> Button changes to "Active".
- Post an item -> Quota drops.
- Hit 0 quota -> Actions blocked.
