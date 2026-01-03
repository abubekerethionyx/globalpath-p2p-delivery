# OTP Settings API Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: User fills registration form
┌──────────────┐
│  AuthPage    │  User enters: name, email, password, phone, role
│  (Frontend)  │
└──────┬───────┘
       │
       │ Submit Form
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 2: Create user account                                             │
│                                                                          │
│  POST /api/users/register                                               │
│  ┌─────────────────────────────────────────────┐                        │
│  │ Backend creates user in database            │                        │
│  │ - Generate OTP (if needed)                  │                        │
│  │ - Send email (if OTP enabled)               │                        │
│  │ - Return success                            │                        │
│  └─────────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘
       │
       │ User created successfully
       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ Step 3: Check OTP requirement (NEW!)                                    │
│                                                                          │
│  GET /api/users/auth-settings                                           │
│  Headers: { 'X-Auth-Page-Token': 'globalpath-secure-auth-token-v1' }   │
│                                                                          │
│  ┌─────────────────────────────────────────────┐                        │
│  │ Backend checks database setting             │                        │
│  │ - Query global_settings table               │                        │
│  │ - Get 'require_otp_for_signup' value        │                        │
│  │ - Convert to boolean                        │                        │
│  │ - Return: { require_otp_for_signup: bool }  │                        │
│  └─────────────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘
       │
       │ Response received
       ▼
       
       ┌─────────────────┐
       │ OTP Required?   │
       └────────┬────────┘
                │
        ┌───────┴────────┐
        │                │
        │ YES            │ NO
        ▼                ▼
┌──────────────┐  ┌──────────────────┐
│ Show OTP     │  │ Auto-login User  │
│ Screen       │  │                  │
│              │  │ POST /api/users/ │
│ User enters  │  │      login       │
│ 6-digit code │  │                  │
│              │  │ Store token      │
│ POST /api/   │  │ Navigate to      │
│ users/verify │  │ dashboard        │
│ -otp         │  └──────────────────┘
│              │          │
│ Then login   │          │
└──────┬───────┘          │
       │                  │
       │                  │
       └────────┬─────────┘
                │
                ▼
        ┌───────────────┐
        │ USER LOGGED   │
        │ IN & ACTIVE   │
        └───────────────┘


═══════════════════════════════════════════════════════════════════════════
                            SECURITY FLOW
═══════════════════════════════════════════════════════════════════════════

┌──────────────────┐         ┌────────────────────────────────────────────┐
│   AuthPage.tsx   │────────▶│  Request Headers                           │
│   (Frontend)     │         │  {                                         │
└──────────────────┘         │    'X-Auth-Page-Token':                    │
                             │    'globalpath-secure-auth-token-v1'       │
                             │  }                                         │
                             └────────────────┬───────────────────────────┘
                                              │
                                              ▼
                             ┌────────────────────────────────────────────┐
                             │  user_routes.py                            │
                             │                                            │
                             │  token = request.headers.get(              │
                             │      'X-Auth-Page-Token'                   │
                             │  )                                         │
                             │                                            │
                             │  if token != 'globalpath-secure-auth-     │
                             │              token-v1':                    │
                             │      return 401 Unauthorized               │
                             └────────────────┬───────────────────────────┘
                                              │
                                              ▼
                             ┌────────────────────────────────────────────┐
                             │  Token Valid ✓                             │
                             │                                            │
                             │  Query Database:                           │
                             │  GlobalSetting.get_value(                  │
                             │      'require_otp_for_signup'              │
                             │  )                                         │
                             │                                            │
                             │  Return setting value                      │
                             └────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                        DATABASE SCHEMA
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────┐
│                        Table: global_settings                           │
├────────────────────────┬───────────────┬──────────────────────────────┤
│ key (PK)               │ value         │ description                  │
├────────────────────────┼───────────────┼──────────────────────────────┤
│ require_otp_for_signup │ "true"/"false"│ Enable OTP for registration  │
│ enable_google_login    │ "true"/"false"│ Enable Google OAuth          │
│ ...other settings...   │ ...           │ ...                          │
└────────────────────────┴───────────────┴──────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          ADMIN CONTROL
═══════════════════════════════════════════════════════════════════════════

    Admin changes setting in UI
            │
            ▼
    POST /api/admin/settings
    {
      "require_otp_for_signup": {
        "value": "false",
        "description": "..."
      }
    }
            │
            ▼
    Database updated immediately
            │
            ▼
    Next registration uses new value
    (No frontend code change needed!)

```

## Key Points

1. **Authentication-Free**: The `/api/users/auth-settings` endpoint doesn't require JWT
2. **Secured**: Protected by custom token header
3. **Dynamic**: Always uses current database value
4. **Fallback**: Falls back to props if API fails
5. **Real-time**: Changes take effect immediately

## Token Security

The token `globalpath-secure-auth-token-v1` is:
- Hardcoded in both frontend and backend
- Not cryptographically secure
- Provides basic protection against casual scraping
- Should be moved to environment variables for production

## Benefits Over Props

| Aspect | Old (Props) | New (API Call) |
|--------|-------------|----------------|
| Updates | Requires page reload | Immediate |
| Source of truth | Frontend cache | Database |
| Admin control | Limited | Full |
| Security | Public | Token-protected |
