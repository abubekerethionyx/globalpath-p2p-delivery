# Verification & Profile Update Logic

## Changes Made

### Backend (`user_routes.py`)
1.  **Strict Admin Verification Endpoint**:
    - `POST /api/users/<id>/verify` is now an **Admin-Only Approval** action.
    - It simply sets `verification_status` to `VERIFIED`.
    - It no longer accepts form data or file uploads (submission should go through `/registration`).

2.  **Smart Profile Updates**:
    - `PUT /api/users/<id>` (`update_user`) now monitors sensitive fields.
    - **Trigger Fields**: `passport_number`, `national_id`, `id_front_url`, `id_back_url`, `selfie_url`, `id_type`.
    - **Behavior**: If any of these fields are present in the update payload from a non-admin user, `verification_status` is automatically forced to `PENDING`.
    - **Benefit**: Ensures that if a verified user changes their ID document, they must be re-verified.

### Frontend (`ProfilePage.tsx`)
- The page uses `UserService.updateUser` which hits the smart `update_user` endpoint.
- Existing data is preserved (PATCH behavior) as `update_user` only updates provided fields.
- If editing of sensitive fields is enabled in the future, the backend will automatically enforce re-verification.
