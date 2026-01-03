# User Verification Logic Update

## Overview
Updated the user verification system to differentiate between **SENDERS** and **PICKERS** based on their role-specific requirements.

## New Verification Rules

### Email Verification (`is_email_verified`)
This field indicates whether the user's email has been confirmed.

✅ **Set to TRUE when:**
- User verifies OTP code
- User logs in with Google
- OTP is disabled in settings (automatic)

❌ **Set to FALSE when:**
- User just registered and OTP is enabled
- User has not verified their email yet

### Account Verification (`verification_status`)
This field indicates the overall account verification status.

#### For SENDERS:
- ✅ **VERIFIED** - After email verification (OTP or Google login)
- ❌ **UNVERIFIED** - Before email verification

#### For PICKERS:
- ❌ **UNVERIFIED** - Even after email verification (default state)
- ⏳ **PENDING** - After submitting KYC documents
- ✅ **VERIFIED** - After admin approves KYC documents

## Implementation Changes

### 1. User Registration (`create_user`)

**Location**: `backend/app/services/user_service.py`

```python
# Determine verification status based on role
if is_picker:
    verification_status = VerificationStatus.UNVERIFIED
else:
    # Sender: verified if email is verified
    verification_status = VerificationStatus.VERIFIED if email_verified else VerificationStatus.UNVERIFIED
```

**Logic:**
- **SENDER with OTP disabled**: `is_email_verified=True`, `verification_status=VERIFIED`
- **SENDER with OTP enabled**: `is_email_verified=False`, `verification_status=UNVERIFIED`
- **PICKER (always)**: `is_email_verified=False/True`, `verification_status=UNVERIFIED`

### 2. OTP Verification (`verify_email_otp`)

**Location**: `backend/app/services/user_service.py`

```python
# Only verify SENDERS automatically; PICKERS need KYC
if not is_picker:
    user.verification_status = VerificationStatus.VERIFIED
# else: Picker stays UNVERIFIED until KYC
```

**Logic:**
- **SENDER**: After OTP verification → `is_email_verified=True`, `verification_status=VERIFIED`
- **PICKER**: After OTP verification → `is_email_verified=True`, `verification_status=UNVERIFIED`

### 3. Google Login (`google_login`)

**Location**: `backend/app/services/user_service.py`

```python
# SENDERS are verified, PICKERS need KYC
verification_status = VerificationStatus.UNVERIFIED if is_picker else VerificationStatus.VERIFIED
```

**Logic:**
- **SENDER**: `is_email_verified=True`, `verification_status=VERIFIED`
- **PICKER**: `is_email_verified=True`, `verification_status=UNVERIFIED`

### 4. Email Sending (`register` endpoint)

**Location**: `backend/app/routes/user_routes.py`

```python
# Only send OTP email if OTP is enabled
otp_enabled = GlobalSetting.get_value('require_otp_for_signup', default=True)
if otp_enabled:
    from app.services.email_service import send_otp_email
    send_otp_email(user.email, user.email_otp)
```

**Logic:**
- Only sends OTP email if the setting is enabled
- Prevents unnecessary emails when OTP is disabled

## Verification Status Flow

### SENDER Flow:
```
Register → Email Verified (OTP/Google/Auto) → ✅ VERIFIED → Can use platform
```

### PICKER Flow:
```
Register → Email Verified (OTP/Google/Auto) → Still ❌ UNVERIFIED
         ↓
Complete KYC Form → ⏳ PENDING
         ↓
Admin Approves → ✅ VERIFIED → Can pick up items
```

## Impact on Features

### During Registration:
- **OTP Enabled:**
  - SENDER: Must verify OTP → becomes VERIFIED
  - PICKER: Must verify OTP → stays UNVERIFIED (needs KYC)
  
- **OTP Disabled:**
  - SENDER: Immediately VERIFIED
  - PICKER: Immediately UNVERIFIED (needs KYC)

### Dashboard Access:
- **SENDER (VERIFIED)**: Full access
- **PICKER (UNVERIFIED)**: Limited access, prompted to complete KYC
- **PICKER (PENDING)**: Waiting for admin approval
- **PICKER (VERIFIED)**: Full access

## Database Schema

### Users Table:
```sql
users {
  is_email_verified: BOOLEAN     -- Email confirmed?
  verification_status: ENUM       -- UNVERIFIED, PENDING, VERIFIED, REJECTED
  role: ENUM                      -- SENDER, PICKER, ADMIN
}
```

## Testing Scenarios

### Test 1: SENDER with OTP Enabled
1. Register as SENDER
2. Receive OTP email
3. Verify OTP
4. **Expected**: `is_email_verified=True`, `verification_status=VERIFIED`

### Test 2: SENDER with OTP Disabled
1. Admin disables OTP
2. Register as SENDER
3. **Expected**: Immediate login, `is_email_verified=True`, `verification_status=VERIFIED`

### Test 3: PICKER with OTP Enabled
1. Register as PICKER
2. Receive OTP email
3. Verify OTP
4. **Expected**: `is_email_verified=True`, `verification_status=UNVERIFIED`
5. Prompted to complete KYC

### Test 4: PICKER with OTP Disabled
1. Admin disables OTP
2. Register as PICKER
3. **Expected**: `is_email_verified=True`, `verification_status=UNVERIFIED`
4. Prompted to complete KYC

### Test 5: Google Login as SENDER
1. Login with Google
2. Select SENDER role
3. **Expected**: `is_email_verified=True`, `verification_status=VERIFIED`

### Test 6: Google Login as PICKER
1. Login with Google
2. Select PICKER role
3. **Expected**: `is_email_verified=True`, `verification_status=UNVERIFIED`
4. Prompted to complete KYC

## KYC Process (Pickers Only)

The KYC verification happens in a separate flow:

1. **Picker completes profile** (`/profile` page)
   - Uploads ID documents (front, back)
   - Uploads selfie
   - Uploads liveness video
   - Fills personal information

2. **System sets status to PENDING**
   ```python
   user.verification_status = VerificationStatus.PENDING
   ```

3. **Admin reviews and approves** (`/admin` page)
   ```python
   user.verification_status = VerificationStatus.VERIFIED
   # Award KYC bonus
   reward_user_coins(user.id, kyc_bonus, "KYC Fulfillment Bonus")
   ```

## Security Considerations

✅ **Benefits:**
- Pickers cannot access sensitive features without KYC
- Email verification is separate from account verification
- Admin has full control over picker verification
- Reduces fraud risk

⚠️ **Important:**
- Senders can use platform immediately after email verification
- Pickers must wait for admin approval
- Email verification is a prerequisite but not sufficient for pickers

## Related Files

- `backend/app/services/user_service.py` - Main verification logic
- `backend/app/routes/user_routes.py` - Registration and OTP endpoints
- `backend/app/models/enums.py` - VerificationStatus enum
- `pages/AuthPage.tsx` - Frontend registration flow
- `pages/ProfilePage.tsx` - KYC form for pickers

## Summary Table

| User Type | Email Verified? | Account Status | Can Use Platform? | Notes |
|-----------|----------------|----------------|-------------------|-------|
| SENDER (new, OTP on) | ❌ No | UNVERIFIED | ❌ No | Must verify OTP |
| SENDER (verified OTP) | ✅ Yes | VERIFIED | ✅ Yes | Full access |
| SENDER (OTP off) | ✅ Yes | VERIFIED | ✅ Yes | Immediate access |
| SENDER (Google) | ✅ Yes | VERIFIED | ✅ Yes | Full access |
| PICKER (new, OTP on) | ❌ No | UNVERIFIED | ⚠️ Limited | Must verify OTP |
| PICKER (verified OTP) | ✅ Yes | UNVERIFIED | ⚠️ Limited | Needs KYC |
| PICKER (OTP off) | ✅ Yes | UNVERIFIED | ⚠️ Limited | Needs KYC |
| PICKER (Google) | ✅ Yes | UNVERIFIED | ⚠️ Limited | Needs KYC |
| PICKER (KYC submitted) | ✅ Yes | PENDING | ⚠️ Limited | Waiting approval |
| PICKER (KYC approved) | ✅ Yes | VERIFIED | ✅ Yes | Full access |
