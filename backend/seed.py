from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.subscription import SubscriptionPlan
from app.models.enums import UserRole, VerificationStatus
from datetime import datetime

app = create_app()

def seed_data():
    with app.app_context():
        # Clear existing data
        print("Clearing database...")
        db.drop_all()
        db.create_all()

        print("Creating Subscription Plans...")
        plans = [
            # 6 Month Free Plans
            SubscriptionPlan(
                id="s-free-promo-6mo",
                name="6 Month Free (Sender)",
                price=0.0,
                limit=100,
                role=UserRole.SENDER,
                description="Special 6-month free trial for Senders. Post up to 100 items/month.",
                duration_days=180
            ),
            SubscriptionPlan(
                id="p-free-promo-6mo",
                name="6 Month Free (Picker)",
                price=0.0,
                limit=100,
                role=UserRole.PICKER,
                description="Special 6-month free trial for Pickers. Deliver up to 100 items/month.",
                duration_days=180
            ),
            # Premium Plans
            SubscriptionPlan(
                id="s-premium",
                name="Premium Sender",
                price=49.99,
                limit=500,
                role=UserRole.SENDER,
                description="Unlimited possibilities for professional senders. Priority placement and dedicated support.",
                is_premium=True,
                duration_days=30,
                coin_price=500
            ),
            SubscriptionPlan(
                id="p-premium",
                name="Premium Picker",
                price=39.99,
                limit=500,
                role=UserRole.PICKER,
                description="Maximize your earnings. Access to exclusive high-value routes and instant payouts.",
                is_premium=True,
                duration_days=30,
                coin_price=500
            )
        ]
        db.session.add_all(plans)
        db.session.commit()

        print("Creating Admin User...")
        admin = User(
            first_name="Admin",
            last_name="GlobalPath",
            email="admin@globalpath.com",
            role=UserRole.ADMIN,
            verification_status=VerificationStatus.VERIFIED,
            is_phone_verified=True,
            is_email_verified=True,
            wallet_balance=0.00,
            coins_balance=1000
        )
        admin.set_password("admin123")
        admin.avatar = "https://ui-avatars.com/api/?name=Admin+GlobalPath&background=009E49&color=fff"
        
        db.session.add(admin)
        db.session.commit()

        print("Creating Supported Countries...")
        from app.models.supported_country import SupportedCountry
        initial_countries = ["Ethiopia", "USA", "United Kingdom", "Germany", "UAE (Dubai)", "China", "Turkey", "Kenya", "South Africa", "Canada"]
        db.session.add_all([SupportedCountry(name=name) for name in initial_countries])
        db.session.commit()

        print("Creating Default System Settings...")
        from app.models.setting import GlobalSetting
        from app.constants import (
            SETTING_KYC_VERIFICATION_BONUS, SETTING_REGISTRATION_BONUS,
            SETTING_ENABLE_FREE_PROMO_PICKER, SETTING_ENABLE_FREE_PROMO_SENDER,
            SETTING_FREE_PROMO_PICKER_PLAN_ID, SETTING_FREE_PROMO_SENDER_PLAN_ID,
            DEFAULT_PICKER_PLAN_ID, DEFAULT_SENDER_PLAN_ID
        )
        default_settings = [
            GlobalSetting(key=SETTING_KYC_VERIFICATION_BONUS, value="50", description="Coins awarded upon successful KYC verification"),
            GlobalSetting(key=SETTING_REGISTRATION_BONUS, value="10", description="Coins awarded to new users upon registration"),
            GlobalSetting(key=SETTING_ENABLE_FREE_PROMO_PICKER, value="true", description="Enable free welcome plan for new Pickers"),
            GlobalSetting(key=SETTING_ENABLE_FREE_PROMO_SENDER, value="true", description="Enable free welcome plan for new Senders"),
            GlobalSetting(key=SETTING_FREE_PROMO_PICKER_PLAN_ID, value=DEFAULT_PICKER_PLAN_ID, description="Promotional plan for Pickers"),
            GlobalSetting(key=SETTING_FREE_PROMO_SENDER_PLAN_ID, value=DEFAULT_SENDER_PLAN_ID, description="Promotional plan for Senders"),
            GlobalSetting(key='require_otp_for_signup', value="true", description="Require email OTP verification for new accounts")
        ]
        db.session.add_all(default_settings)
        db.session.commit()

        print("Creating Fake Users (Pickers & Senders)...")
        picker1 = User(
            first_name="Abubeker", last_name="Siraj", email="picker@example.com",
            role=UserRole.PICKER, verification_status=VerificationStatus.VERIFIED,
            is_phone_verified=True, is_email_verified=True, coins_balance=500
        )
        picker1.set_password("password123")
        picker1.avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Abubeker"

        sender1 = User(
            first_name="Sara", last_name="Tadesse", email="sender@example.com",
            role=UserRole.SENDER, verification_status=VerificationStatus.VERIFIED,
            is_phone_verified=True, is_email_verified=True, coins_balance=300
        )
        sender1.set_password("password123")
        sender1.avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara"

        db.session.add_all([picker1, sender1])
        db.session.commit()

        print("Creating Shipment Items...")
        from app.models.shipment import ShipmentItem
        from app.models.enums import ItemStatus
        shipment1 = ShipmentItem(
            sender_id=sender1.id,
            category="Electronics",
            description="MacBook Pro 14 inch",
            pickup_country="USA",
            dest_country="Ethiopia",
            address="123 Apple way, Cupertino",
            receiver_name="Abebe Bikila",
            receiver_phone="+251911223344",
            weight=1.6,
            fee=2500,
            status=ItemStatus.POSTED,
            image_urls=["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"]
        )
        shipment2 = ShipmentItem(
            sender_id=sender1.id,
            category="Clothing",
            description="Designer Handbag",
            pickup_country="Germany",
            dest_country="Ethiopia",
            address="Berlin Fashion St",
            receiver_name="Hanan Ahmed",
            receiver_phone="+251922334455",
            weight=2.0,
            fee=1800,
            status=ItemStatus.POSTED,
            image_urls=["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800"]
        )
        db.session.add_all([shipment1, shipment2])
        db.session.commit()

        print("Creating Travel Announcements...")
        from app.models.travel import Travel, TravelPin
        from datetime import timedelta
        travel1 = Travel(
            user_id=picker1.id,
            origin_country="USA",
            destination_country="Ethiopia",
            travel_date=datetime.utcnow() + timedelta(days=15),
            weight_capacity=10.0,
            description="Traveling from New York to Addis Ababa. I have extra space for light electronics."
        )
        travel2 = Travel(
            user_id=admin.id, # Admin also travels!
            origin_country="China",
            destination_country="Ethiopia",
            travel_date=datetime.utcnow() + timedelta(days=7),
            weight_capacity=23.0,
            description="Regular business trip from Guangzhou. Can carry assorted items."
        )
        db.session.add_all([travel1, travel2])
        db.session.commit()

        print("Creating Travel Pins...")
        pin1 = TravelPin(
            travel_id=travel1.id,
            shipment_id=shipment1.id,
            status='APPROVED'
        )
        db.session.add(pin1)
        db.session.commit()

        print("Seeding complete!")
        print(f"Admin Email: {admin.email} / admin123")
        print(f"Picker Email: {picker1.email} / password123")
        print(f"Sender Email: {sender1.email} / password123")

if __name__ == "__main__":
    seed_data()
