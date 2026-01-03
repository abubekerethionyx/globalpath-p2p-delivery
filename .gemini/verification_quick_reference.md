# Quick Reference: User Verification Logic

## 🎯 The Key Rule

```
┌─────────────────────────────────────────────────────────────┐
│  SENDERS: Email verification = Account verification ✅      │
│  PICKERS: Email verification ≠ Account verification ❌      │
│           Pickers MUST complete KYC for account verification│
└─────────────────────────────────────────────────────────────┘
```

## 📊 Verification Matrix

| Action | SENDER Result | PICKER Result |
|--------|---------------|---------------|
| Register (OTP on) | `is_email_verified=False`<br>`verification_status=UNVERIFIED` | `is_email_verified=False`<br>`verification_status=UNVERIFIED` |
| Register (OTP off) | `is_email_verified=True`<br>`verification_status=VERIFIED` ✅ | `is_email_verified=True`<br>`verification_status=UNVERIFIED` ❌ |
| Verify OTP | `is_email_verified=True`<br>`verification_status=VERIFIED` ✅ | `is_email_verified=True`<br>`verification_status=UNVERIFIED` ❌ |
| Google Login | `is_email_verified=True`<br>`verification_status=VERIFIED` ✅ | `is_email_verified=True`<br>`verification_status=UNVERIFIED` ❌ |
| Complete KYC | N/A | `verification_status=PENDING` ⏳ |
| Admin Approves | N/A | `verification_status=VERIFIED` ✅ |

## 🔄 User Journeys

### SENDER Journey (Simple)
```
START
  ↓
Register
  ↓
[OTP Enabled?]
  ↓           ↓
 YES         NO
  ↓           ↓
Verify OTP   Skip
  ↓           ↓
━━━━━━━━━━━━━━━
  ✅ VERIFIED
  ↓
Use Platform
```

### PICKER Journey (Complex)
```
START
  ↓
Register
  ↓
[OTP Enabled?]
  ↓           ↓
 YES         NO
  ↓           ↓
Verify OTP   Skip
  ↓           ↓
━━━━━━━━━━━━━━━
 Email ✅ but
 Still UNVERIFIED ❌
  ↓
Complete KYC Form
  ↓
Status: PENDING ⏳
  ↓
Admin Reviews
  ↓
Status: VERIFIED ✅
  ↓
Use Platform
```

## 💡 Why This Design?

### SENDERS
- ✅ Low risk (sending items)
- ✅ Quick onboarding
- ✅ Email verification sufficient

### PICKERS  
- ⚠️ High risk (handling others' items)
- ⚠️ Need identity verification
- ⚠️ Background check required
- ⚠️ Trust & safety critical

## 🔍 Quick Checks

### Check if user can access platform:
```python
# SENDER
if user.role == 'SENDER' and user.verification_status == 'VERIFIED':
    # Full access ✅
    
# PICKER  
if user.role == 'PICKER' and user.verification_status == 'VERIFIED':
    # Full access ✅
else:
    # Prompt for KYC ⚠️
```

### Check email status:
```python
if user.is_email_verified:
    # Can receive notifications ✅
else:
    # Prompt to verify email ❌
```

## 📝 Code Locations

| Feature | File | Function |
|---------|------|----------|
| Registration | `user_service.py` | `create_user()` |
| OTP Verification | `user_service.py` | `verify_email_otp()` |
| Google Login | `user_service.py` | `google_login()` |
| KYC Submission | `user_routes.py` | `update_registration()` |
| KYC Approval | `user_routes.py` | `verify_user()` |

## 🎨 Status Icons

| Status | Icon | Meaning |
|--------|------|---------|
| UNVERIFIED | ❌ | Not verified |
| PENDING | ⏳ | Waiting for admin |
| VERIFIED | ✅ | Fully verified |
| REJECTED | 🚫 | KYC rejected |
