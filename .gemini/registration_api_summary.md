# New Registration API Implementation

## Summary
Created a new dedicated API endpoint for updating user information during the picker registration process. All data entered by the user (form fields and file uploads) is now properly saved to the database.

## Changes Made

### 1. Backend API - `user_routes.py`

#### New Endpoint: `/api/users/<user_id>/registration` (PUT)
- **Purpose**: Handle all registration data updates during the picker registration process
- **Method**: PUT
- **Authentication**: JWT required (user can only update their own profile)
- **Accepts**: 
  - Form data (multipart/form-data)
  - Text fields: idType, nationalId, passportNumber, passportExpiry, issuanceCountry, phoneNumber, homeAddress, emergencyContact, emergencyContactPhone, dateOfBirth
  - File uploads: idFront, idBack, selfie, livenessVideo
- **Returns**: Updated user object with verification_status set to PENDING

#### Key Features:
- **Field Mapping**: Automatically converts camelCase (frontend) to snake_case (backend)
- **File Upload Handling**: Saves uploaded files to `backend/app/static/uploads/` directory
- **Security**: 
  - Only the user can update their own registration
  - Automatically sets verification_status to 'PENDING' after registration
- **Error Handling**: Returns appropriate error messages with status codes

#### Bug Fix:
- Fixed the `delete_user` endpoint by adding a missing return statement

### 2. Frontend Service - `UserService.ts`

#### New Method: `updateRegistration`
```typescript
updateRegistration: async (userId: string, formData: FormData): Promise<User>
```
- **Purpose**: Call the new registration endpoint from the frontend
- **Parameters**: 
  - `userId`: The ID of the user being updated
  - `formData`: FormData object containing all registration fields and files
- **Returns**: Updated User object
- **Side Effects**: Updates localStorage with the new user data

### 3. Frontend Page - `PickerRegistrationPage.tsx`

#### Updated Form Submission
- Changed from using `UserService.submitVerification()` to `UserService.updateRegistration()`
- Updated user messaging to say "Registration Submitted Successfully" instead of "Verification Submitted Successfully"
- Maintains all existing functionality (4-step wizard, file uploads, form validation)

## Data Flow

1. **User fills out registration form** across 4 steps:
   - Step 1: Document Type (ID/Passport info)
   - Step 2: Personal Profile (address, phone, emergency contact)
   - Step 3: Biometric & Document Upload (ID photos, selfie, liveness video)
   - Step 4: Legal Declaration (terms agreement)

2. **Form submission creates FormData** containing:
   - All text fields from the form
   - All uploaded files

3. **Frontend calls** `UserService.updateRegistration(userId, formData)`

4. **Backend receives request** at `/api/users/<user_id>/registration`
   - Validates JWT token (user must be updating their own profile)
   - Maps camelCase fields to snake_case database fields
   - Saves uploaded files to disk
   - Updates database with all user information
   - Sets verification_status to 'PENDING'

5. **Backend returns** updated user object

6. **Frontend updates**:
   - localStorage with new user data
   - Calls `onSubmit` callback to update parent component
   - Shows success message to user

## Database Fields Updated

The following User model fields are updated during registration:
- `id_type` - Type of identification (PASSPORT or NATIONAL_ID)
- `national_id` - National ID number (if using National ID)
- `passport_number` - Passport number (if using Passport)
- `passport_expiry` - Passport expiration date
- `issuance_country` - Country that issued the ID
- `phone_number` - Primary phone number
- `home_address` - Full residential address
- `emergency_contact` - Emergency contact name
- `emergency_contact_phone` - Emergency contact phone
- `date_of_birth` - User's date of birth
- `id_front_url` - URL to uploaded ID front image
- `id_back_url` - URL to uploaded ID back image
- `selfie_url` - URL to uploaded selfie image
- `liveness_video` - URL to uploaded liveness video
- `verification_status` - Set to 'PENDING' after submission

## Testing

To test the new registration flow:

1. **Start the backend server** (already running based on user's terminal)
2. **Start the frontend** (already running based on user's terminal)
3. **Navigate to the Picker Registration page**
4. **Fill out all 4 steps** of the registration form
5. **Submit the form** and verify:
   - Success message appears
   - User is redirected appropriately
   - Database contains all submitted data
   - Files are saved in `backend/app/static/uploads/`
   - `verification_status` is set to 'PENDING'

## API Endpoint Comparison

| Feature | Old (`/verify`) | New (`/registration`) |
|---------|----------------|---------------------|
| Method | POST | PUT |
| Purpose | Submit verification documents | Complete registration process |
| When to use | After registration, for re-verification | During initial picker registration |
| Updates | Partial user data | All registration data |
| Frontend usage | `submitVerification()` | `updateRegistration()` |

Both endpoints remain available and functional. Use:
- `/registration` for initial picker registration
- `/verify` for resubmitting verification or updating documents later
