# Authentication Settings API Implementation

## Overview
Implemented an authentication-free API endpoint that allows the frontend to dynamically check OTP requirements from the database during user registration.

## Changes Made

### 1. Backend: New API Endpoint (`backend/app/routes/user_routes.py`)

Created a new endpoint `/api/users/auth-settings` that:
- **Does NOT require JWT authentication** (accessible before login)
- **Returns the current OTP setting** from the database
- **Secured with a custom token** to prevent unauthorized access

```python
@bp.route('/auth-settings', methods=['GET'])
def get_auth_settings():
    # Simple security to prevent public scraping
    token = request.headers.get('X-Auth-Page-Token')
    if token != 'globalpath-secure-auth-token-v1':
        return jsonify({'message': 'Unauthorized'}), 401
    
    otp_enabled = GlobalSetting.get_value('require_otp_for_signup', default=True)
    
    # Ensure boolean
    if isinstance(otp_enabled, str):
        otp_enabled = otp_enabled.lower() == 'true'
        
    return jsonify({
        'require_otp_for_signup': otp_enabled
    })
```

**Security Features:**
- Custom token header (`X-Auth-Page-Token`) prevents public scraping
- Token value: `globalpath-secure-auth-token-v1`
- Returns 401 Unauthorized if token is missing or incorrect

### 2. Frontend Service: AuthService Update (`services/AuthService.ts`)

Added a new method to fetch auth settings:

```typescript
getAuthSettings: async () => {
    const response = await api.get('/users/auth-settings', {
        headers: { 'X-Auth-Page-Token': 'globalpath-secure-auth-token-v1' }
    });
    return response.data;
}
```

### 3. Frontend UI: AuthPage Update (`pages/AuthPage.tsx`)

Modified the registration flow to dynamically check OTP requirements:

```typescript
// After successful registration
// Dynamically check OTP setting
let otpRequired = true;
try {
  const settings = await AuthService.getAuthSettings();
  otpRequired = settings.require_otp_for_signup;
} catch (settingsErr) {
  console.warn("Could not fetch auth settings, defaulting to OTP required or prop value", settingsErr);
  if (publicSettings?.require_otp_for_signup === false) otpRequired = false;
}

if (otpRequired === false) {
  // Auto login if OTP is not required
  const loginResp = await AuthService.login(formData.email, formData.password);
  if (loginResp.user) {
    onAuthComplete(loginResp.user);
  } else {
    setError("Account created, but login failed. Please sign in manually.");
    setIsLogin(true);
  }
} else {
  setShowOTP(true);
}
```

## How It Works

1. **User fills registration form** on AuthPage
2. **Backend creates user account** via `/api/users/register`
3. **Frontend calls** `/api/users/auth-settings` with security token
4. **Backend checks database** for `require_otp_for_signup` setting
5. **Two possible flows:**
   - **OTP Enabled**: Show OTP verification screen
   - **OTP Disabled**: Auto-login user immediately

## Benefits

✅ **Dynamic Configuration**: Admin can enable/disable OTP without code changes  
✅ **Real-time Updates**: Always uses the current database setting  
✅ **Fallback Support**: Falls back to `publicSettings` prop if API fails  
✅ **Secure**: Custom token prevents unauthorized access  
✅ **User-friendly**: Skips unnecessary OTP step when disabled  

## Database Setting

The setting is stored in the `global_settings` table:
- **Key**: `require_otp_for_signup`
- **Value**: `"true"` or `"false"` (stored as string, converted to boolean)
- **Default**: `true` (OTP required)

Admins can change this via the Admin Settings page.

## Testing Recommendations

1. **Test with OTP enabled**: Register → Should show OTP screen
2. **Test with OTP disabled**: Register → Should auto-login
3. **Test token security**: Call API without token → Should return 401
4. **Test fallback**: Disable backend → Should use publicSettings prop
5. **Test manual user creation**: Ensure manually created users work correctly

## Security Considerations

- Custom token is hardcoded in both frontend and backend
- For production, consider using environment variables
- Token prevents casual scraping but is not cryptographically secure
- The `/api/admin/settings/public` endpoint already exposes this setting publicly
- This new endpoint adds an extra layer of intentionality (must know the token)

## Related Files

- `backend/app/routes/user_routes.py` - New endpoint
- `backend/app/routes/admin_routes.py` - Existing public settings endpoint
- `services/AuthService.ts` - New method
- `pages/AuthPage.tsx` - Updated registration flow
- `backend/app/models/setting.py` - GlobalSetting model
- `backend/app/services/user_service.py` - User creation logic

## Future Enhancements

- [ ] Move token to environment variable
- [ ] Add rate limiting to prevent abuse
- [ ] Add caching to reduce database queries
- [ ] Consider using JWT with short expiration for better security
- [ ] Add logging for security monitoring
