
export const SETTINGS_KEYS = {
    // Promotions
    ENABLE_FREE_PROMO_SENDER: 'enable_free_promo_sender',
    ENABLE_FREE_PROMO_PICKER: 'enable_free_promo_picker',
    FREE_PROMO_SENDER_PLAN_ID: 'free_promo_sender_plan_id',
    FREE_PROMO_PICKER_PLAN_ID: 'free_promo_picker_plan_id',

    // Security
    REQUIRE_OTP_FOR_SIGNUP: 'require_otp_for_signup',
    ENABLE_GOOGLE_LOGIN: 'enable_google_login',

    // Governance
    REQUIRE_SUB_FOR_DETAILS: 'require_subscription_for_details',
    REQUIRE_SUB_FOR_CHAT: 'require_subscription_for_chat',

    // Automation
    MAINTENANCE_INTERVAL: 'maintenance_interval_hours',

    // Rewards
    REWARD_DAILY_SENDER: 'reward_daily_active_sender',
    REWARD_DAILY_PICKER: 'reward_daily_active_picker',
    REWARD_STATUS_CHANGE: 'reward_status_change',
    REWARD_HOLIDAY_BONUS: 'reward_holiday_bonus',
    ENABLE_HOLIDAY_MODE: 'enable_holiday_mode',
    HOLIDAY_NAME: 'holiday_name',
    REGISTRATION_BONUS: 'registration_bonus_amount',
    KYC_BONUS: 'kyc_verification_bonus_amount',
    HOLIDAY_BONUS_AMOUNT: 'holiday_bonus_amount'
};

// UI Flags for frontend toggles
export const UI_FLAGS = {
    SHOW_OTP_STATUS: true
};
