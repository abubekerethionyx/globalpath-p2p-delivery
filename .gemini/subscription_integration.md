# Subscription Backend Integration

## Updates
1.  **Service Handling**:
    - `SubscriptionService.ts` calls `POST /api/subscriptions/transactions`.
    - `PackagingPage.tsx` constructs a snake_case JSON payload matching the backend model.

2.  **Backend Logic**:
    - `backend/app/services/subscription_service.py`:
        - `create_transaction` now intercepts `COMPLETED` payments.
        - Imports `User` model (lazy import to avoid circular dependency).
        - Updates `user.current_plan_id` instantly.

3.  **Flow**:
    - User Selects Plan -> `handlePurchase` -> API Call -> DB Transaction Created -> User Updated -> Frontend Refreshes.

## Verification
- Purchase a plan using "Telebirr Wallet" (Simulated Instant Success).
- App should alert "Successfully upgraded".
- Current Plan card should immediately highlight as Active.
