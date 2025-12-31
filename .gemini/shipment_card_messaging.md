# ShipmentCard Messaging Integration

## Summary
Integrated messaging directly into `ShipmentCard.tsx`, enabling users to start conversations from any dashboard or list view where shipment cards appear.

## Key Changes

### 1. Smart ShipmentCard
- **Internal Handling:** The card now handles "Chat" clicks internally if no custom handler is provided.
- **Context Aware:**
  - If viewing as **Picker**, clicking Chat messages the **Sender**.
  - If viewing as **Sender**, clicking Chat messages the **Assigned Picker (Partner)**.
- **Thread Creation:** Automatically calls `MessageService.createThread` to ensure a conversation exists before navigating to the Messages page.

### 2. Dashboard Cleanups
- Removed legacy `onChat` props from `SenderDashboard.tsx` and `PickerDashboard.tsx`. These were using outdated navigation logic (`shipmentId`) which would have broken the new Thread-based messaging system.
- Usage is now standardized: Dashboards just render the card, the card handles the communication logic.

## Behavior
- **"Chat" Button Visibility:**
  - Visible to Pickers (targeting Sender).
  - Visible to Senders (only if a Partner is assigned).
- **Action:**
  - Creates/Finds Thread → Navigates to `/messages` with active thread.

## Benefits
- **Consistent UX:** Messaging works the same way everywhere.
- **Reduced Glue Code:** Parent components don't need to implement connection logic.
- **Scalable:** If we add a "Public Listings" page, pickers can message senders immediately.
