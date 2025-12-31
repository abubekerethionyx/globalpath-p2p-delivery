# Bug Fix: Billing Data Parsing

## Issue
The `BillingPage.tsx` was failing to parse backend data for Subscription Transactions because it expected camelCase keys (e.g., `planName`), but the Python backend returns snake_case keys (e.g., `plan_name`). This caused:
- "Invalid Date" (because `createdAt` was undefined).
- 0 Amount (because `fee` was undefined).

## Solution
Updated `BillingPage.tsx` to handle mixed casing:
- Checks both `plan_name` and `planName`.
- reads `timestamp` correctly for subscriptions.
- reads `amount` correctly.

## Verification
- Reload Billing Page.
- "Platform Subs" tab should now show correct Dates, Plan Names ("Traveler Pro"), and Amounts (19.99).
