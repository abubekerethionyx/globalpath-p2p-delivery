# Backend Plan Fetching & Seeding

## Frontend Updates (`PackagingPage.tsx`)
1.  **Dynamic Rendering**:
    - Removed dependency on hardcoded `SENDER_PLANS` and `PICKER_PLANS`.
    - Added `useEffect` to fetch plans from `GET /api/subscriptions/plans`.
    - Implemented logic to filter fetched plans by `viewRole` (Sender vs Picker).
    - Prevents mismatch between frontend constants and backend database.

## Backend Verification (`seed.py`)
1.  **Zero-Cost Packages**:
    - Confirmed that `seed.py` creates:
        - `Basic Sender`: 0.0 ETB
        - `Traveler Basic`: 0.0 ETB
    - These plans will now be served to the frontend dynamically.

## Steps to Apply
1.  Restart the Flask Backend to ensure seed data is loaded/clean (if necessary).
2.  Refresh the React Frontend.
3.  The Pricing Page will now display plans directly from your SQLite database.
