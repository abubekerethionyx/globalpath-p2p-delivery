# Quick Testing Guide for OTP Settings API

## Test 1: OTP Enabled (Default)
**Scenario**: Admin has OTP enabled in settings

1. Go to Admin page → Settings tab
2. Ensure `require_otp_for_signup` is set to `true`
3. Log out
4. Go to registration page
5. Fill in registration form
6. Click "Create My Account"
7. **Expected**: OTP verification screen appears
8. Check email for 6-digit code
9. Enter code
10. **Expected**: User is verified and logged in

## Test 2: OTP Disabled
**Scenario**: Admin disables OTP verification

1. Log in as Admin
2. Go to Admin page → Settings tab
3. Set `require_otp_for_signup` to `false`
4. Save settings
5. Log out
6. Go to registration page
7. Fill in registration form
8. Click "Create My Account"
9. **Expected**: User is immediately logged in (OTP screen skipped)

## Test 3: API Security
**Scenario**: Test the token security

### Using curl or Postman:

**Without token (should fail):**
```bash
curl http://localhost:5000/api/users/auth-settings
```
**Expected**: `{"message": "Unauthorized"}` with status 401

**With wrong token (should fail):**
```bash
curl -H "X-Auth-Page-Token: wrong-token" http://localhost:5000/api/users/auth-settings
```
**Expected**: `{"message": "Unauthorized"}` with status 401

**With correct token (should succeed):**
```bash
curl -H "X-Auth-Page-Token: globalpath-secure-auth-token-v1" http://localhost:5000/api/users/auth-settings
```
**Expected**: `{"require_otp_for_signup": true}` or `false` with status 200

## Test 4: Fallback Behavior
**Scenario**: Backend API fails

1. Stop the backend server temporarily
2. Try to register
3. **Expected**: Should fall back to `publicSettings` prop from App.tsx
4. Restart backend
5. **Expected**: Should use dynamic API call

## Test 5: Browser DevTools Check

1. Open browser DevTools → Network tab
2. Start registration process
3. Fill form and submit
4. Look for request to `/api/users/auth-settings`
5. Check request headers for `X-Auth-Page-Token`
6. Check response body for `require_otp_for_signup`

## Verification Checklist

- [ ] OTP screen appears when setting is `true`
- [ ] OTP screen is skipped when setting is `false`
- [ ] API returns 401 without proper token
- [ ] Users created with OTP disabled can immediately log in
- [ ] Users created with OTP enabled must verify email first
- [ ] Setting change takes effect immediately (no code deploy needed)
- [ ] Error handling works if API is unavailable

## Common Issues

### Issue: Always showing OTP screen
**Solution**: Check that the API is being called and returning `false`. Check browser console for errors.

### Issue: 401 Unauthorized
**Solution**: Verify the token in AuthService.ts matches the one in user_routes.py

### Issue: API not being called
**Solution**: Check browser console for errors. Verify the registration flow is reaching the auth settings check.

## Production Checklist

Before deploying to production:

- [ ] Move token to environment variable
- [ ] Add rate limiting to the endpoint
- [ ] Enable CORS if frontend is on different domain
- [ ] Test with real email delivery
- [ ] Monitor API usage and errors
- [ ] Document the token value securely
- [ ] Set up alerts for 401 errors (possible attack)
