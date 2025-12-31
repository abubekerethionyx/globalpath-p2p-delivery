# System Updates Summary

## 1. Verification & Security
- **Strict Logic**: `verify_user` endpoint is now Admin-only approval. 
- **Auto-Lock**: Updating sensitive fields (passport, ID) via `update_user` now automatically reverts a user's status to `PENDING` to ensure re-verification.

## 2. Billing & Finance
- **New Billing Page**: Advanced dashboard separating "Sender Expenditure" and "Picker Earnings".
- **Features**: Date filtering, Status filtering, and Analytics cards.
- **Fix**: Resolved `toLocaleString` crash by adding defensive null checks for transaction amounts.
- **Logic**: Removed Platform Fee deduction from P2P shipments (revenue is subscription-only).

## 3. Subscriptions
- **Integration**: Connected `PackagingPage` to real backend API/Database.
- **Dynamic Pricing**: Plans are fetched from the database, including "0 ETB" plans seeded in the backend.
- **Instant Activation**: Buying a plan (Wallet) automagically upgrades the user's role/plan in the database immediately.
- **UI Upgrade**: Active plan is highlighted and "Subscribe" button is hidden to prevent redundancy.
