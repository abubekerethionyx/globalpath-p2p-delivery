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

        print("Seeding complete!")
        print(f"Admin Email: {admin.email}")
        print(f"Admin Password: admin123")

if __name__ == "__main__":
    seed_data()
