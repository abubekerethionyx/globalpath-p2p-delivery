# Message Thread Architecture Update

## Summary
Refactored the messaging system to use a Thread-based architecture (Sender + Receiver + Context) instead of loose Shipment-based messages.

## Key Changes

### 1. Backend Models
- **New `MessageThread` Model:**
  - Links two users (`participant1`, `participant2`)
  - Optional `shipment_id` for context
  - Tracks `updated_at` for sorting
- **Updated `Message` Model:**
  - Added `thread_id` (Foreign Key)
  - Added `receiver_id` (Explicit)
  - Added `sender_id` (Existing)

### 2. API Endpoints
- `POST /api/messages/threads`: Create or retrieve existing thread between users.
- `GET /api/messages/threads`: List all threads for current user.
- `GET /api/messages/threads/:id/messages`: Get messages for a specific thread.
- `POST /api/messages/`: Send a message to a thread.

### 3. Frontend Implementation
- **ShipmentDetailPage:**
  - Clicking "Message" now calls `MessageService.createThread` to ensure a thread exists.
  - Navigates to `/messages` with `{ threadId }`.
- **MessagesPage:**
  - Lists **Message Threads** in the sidebar.
  - Shows shipment context (Origin -> Destination) in the list.
  - Chat interface loads messages for the active thread.
  - Supports real-time-ish updates (polling).

## How it works (User Flow)

1. **Initiate:**
   - User clicks "Message Sender" on Shipment Detail.
   - Backend checks if a thread exists between these two users for this shipment.
   - If not, creates one. Returns `thread_id`.
   - Frontend navigates to `/messages`.

2. **Chat:**
   - `/messages` loads the list of threads.
   - The specific `thread_id` is auto-selected.
   - User sees chat history and can send messages.

3. **Inbox:**
   - User can see all their conversations (threads) in the sidebar.
   - Sorted by most recent activity.

## Benefits
- **Explicit Relationships:** Messages are clearly between two users.
- **Context Awareness:** Threads maintain shipment context but allow general messaging.
- **Scalability:** easier to add group chats or non-shipment chats later.
- **Data Integrity:** Sender and Receiver are explicitly stored on every message.
