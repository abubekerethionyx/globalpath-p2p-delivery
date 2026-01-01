from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.shipment import ShipmentItem
from app.models.subscription import SubscriptionPlan, SubscriptionTransaction
from app.models.enums import UserRole, ItemStatus, VerificationStatus
from datetime import datetime, timedelta
import uuid
import random

app = create_app()

def seed_data():
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        print("Creating Plans...")
        plans = [
             SubscriptionPlan(
                name="Basic Sender",
                price=0.0,
                limit=5,
                role=UserRole.SENDER,
                description="Ideal for occasional senders. Send up to 5 items per month."
            ),
            SubscriptionPlan(
                name="Pro Sender",
                price=29.99,
                limit=50,
                role=UserRole.SENDER,
                description="For businesses and frequent senders. Priority support included."
            ),
             SubscriptionPlan(
                name="Traveler Basic",
                price=0.0,
                limit=2,
                role=UserRole.PICKER,
                description="For occasional travelers. Pick up to 2 items per month."
            ),
            SubscriptionPlan(
                name="Traveler Pro",
                price=19.99,
                limit=20,
                role=UserRole.PICKER,
                description="Earn more by delivering more. Access to high-value items."
            ),
            SubscriptionPlan(
                id="s-free-promo-6mo", # Fixed ID
                name="6 Month Free Starter",
                price=0.0,
                limit=150,
                role=UserRole.SENDER, 
                description="Special Promotion: 150 shipments/month free for 6 months."
            ),
             SubscriptionPlan(
                id="p-free-promo-6mo", # Fixed ID
                name="6 Month Free Traveler",
                price=0.0,
                limit=150,
                role=UserRole.PICKER, 
                description="Special Promotion: 150 pickups/month free for 6 months."
            )
        ]
        db.session.add_all(plans)
        db.session.commit()

        print("Creating Users...")
        users = [
            User(
                first_name="GlobalPath",
                last_name="Admin",
                email="admin@example.com",
                role=UserRole.ADMIN,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                wallet_balance=0.00
            ),
            # New Sender 1
            User(
                first_name="Frank",
                last_name="Underwood",
                email="frank@example.com",
                role=UserRole.SENDER,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                wallet_balance=200.00,
                home_address="1600 Pennsylvania Ave NW, Washington, DC",
                phone_number="+1 202 456 1111",
                current_plan_id="s-free-promo-6mo"
            ),
            # New Sender 2
            User(
                first_name="Grace",
                last_name="Hopper",
                email="grace@example.com",
                role=UserRole.SENDER,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                wallet_balance=300.00,
                home_address="Arlington, Virginia",
                phone_number="+1 703 555 9999",
                current_plan_id="s-free-promo-6mo"
            ),
            # Picker for testing
            User(
                first_name="Charlie",
                last_name="Picker",
                email="charlie@example.com",
                role=UserRole.PICKER,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                rating=4.9
            )
        ]

        for user in users:
            user.set_password("password")
            user.avatar = f"https://i.pravatar.cc/150?u={user.email}"
            if user.role == UserRole.PICKER:
                user.id_front_url = "https://placehold.co/600x400/png?text=ID+Front"
                user.id_back_url = "https://placehold.co/600x400/png?text=ID+Back"
                user.selfie_url = f"https://i.pravatar.cc/300?u={user.email}_selfie"

        db.session.add_all(users)
        db.session.commit()

        # Create Subscriptions
        franck = User.query.filter_by(email="frank@example.com").first()
        grace = User.query.filter_by(email="grace@example.com").first()
        
        subs = [
            SubscriptionTransaction(
                user_id=franck.id,
                plan_id="s-free-promo-6mo",
                amount=0.0,
                status="COMPLETED",
                remaining_usage=150,
                timestamp=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=180),
                is_active=True
            ),
             SubscriptionTransaction(
                user_id=grace.id,
                plan_id="s-free-promo-6mo",
                amount=0.0,
                status="COMPLETED",
                remaining_usage=150,
                timestamp=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=180),
                is_active=True
            )
        ]
        db.session.add_all(subs)
        db.session.commit()

        print("Creating Shipments...")
        # 5 Posted Items only
        shipments_data = [
            {
                "category": "Electronics",
                "description": "MacBook Pro M3 Max",
                "pickup_country": "USA",
                "dest_country": "Ethiopia",
                "address": "Silicon Valley, CA",
                "receiver_name": "Abebe B.",
                "receiver_phone": "+251 911 223344",
                "weight": 2.0,
                "fee": 150.0,
                "notes": "High value laptop.",
                "image_urls": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=1000"],
                "available_pickup_time": datetime.utcnow() + timedelta(days=2),
                "sender": franck
            },
            {
                "category": "Documents",
                "description": "University Degrees",
                "pickup_country": "UK",
                "dest_country": "USA",
                "address": "Oxford University",
                "receiver_name": "John D.",
                "receiver_phone": "+1 555 1234444",
                "weight": 0.5,
                "fee": 40.0,
                "notes": "Urgent.",
                "image_urls": ["https://images.unsplash.com/photo-1618044733300-9472054094ee?auto=format&fit=crop&q=80&w=1000"],
                 "available_pickup_time": datetime.utcnow() + timedelta(days=1),
                 "sender": franck
            },
            {
                "category": "Fashion",
                "description": "Nike Air Jordans",
                "pickup_country": "USA",
                "dest_country": "Japan",
                "address": "NYC, Broadway",
                "receiver_name": "Kenji T.",
                "receiver_phone": "+81 90 1234 5678",
                "weight": 1.5,
                "fee": 60.0,
                "notes": "",
                "image_urls": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000"],
                 "available_pickup_time": datetime.utcnow() + timedelta(days=3),
                 "sender": grace
            },
            {
                "category": "Health",
                "description": "Vitamins Batch",
                "pickup_country": "Germany",
                "dest_country": "Kenya",
                "address": "Berlin, Mitte",
                "receiver_name": "Mary O.",
                "receiver_phone": "+254 712 345678",
                "weight": 3.0,
                "fee": 50.0,
                "notes": "Keep dry.",
                "image_urls": ["https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=1000"],
                 "available_pickup_time": datetime.utcnow() + timedelta(days=5),
                 "sender": grace
            },
             {
                "category": "Tech",
                "description": "Drone (DJI Mini)",
                "pickup_country": "China",
                "dest_country": "South Africa",
                "address": "Shenzhen",
                "receiver_name": "Pieter V.",
                "receiver_phone": "+27 82 123 4567",
                "weight": 1.0,
                "fee": 80.0,
                "notes": "Fragile with batteries.",
                "image_urls": ["https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&q=80&w=1000"],
                 "available_pickup_time": datetime.utcnow() + timedelta(days=4),
                 "sender": grace
            }
        ]

        shipment_objects = []
        for data in shipments_data:
            sender = data.pop('sender')
            shipment = ShipmentItem(
                sender_id=sender.id,
                status=ItemStatus.POSTED,
                **data
            )
            shipment_objects.append(shipment)
        
        db.session.add_all(shipment_objects)
        db.session.commit()
        print(f"Created {len(shipment_objects)} shipments.")
        print("Done!")

if __name__ == "__main__":
    seed_data()
