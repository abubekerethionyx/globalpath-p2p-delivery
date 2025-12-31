# Marketplace Quota Tracker

## Feature
Added a "Remaining Picks" counter to the Marketplace Page for Travel Partners (Pickers).

## Mechanics
1.  **Data Fetching**:
    - `SubscriptionService.getPlans()` is called on mount.
    - Matches `user.currentPlanId` to the fetched plans to find the limit (e.g., 5 items/month).
    - Uses `user.itemsCountThisMonth` (tracked by backend) as usage.

2.  **UI**:
    - Displays a specialized card in the header section.
    - Shows "X of Y Remaining".
    - Color coded: Green if quota exists, Red if 0.

## Use Case
This helps Travel Partners instantly see if they can pick more shipments without needing to check their profile or billing page.
