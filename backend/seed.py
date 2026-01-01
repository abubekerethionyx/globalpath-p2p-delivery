from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.shipment import ShipmentItem
from app.models.subscription import SubscriptionPlan
from app.models.enums import UserRole, ItemStatus, VerificationStatus
from datetime import datetime
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
            )
        ]
        db.session.add_all(plans)
        db.session.commit()

        print("Creating Users...")
        # Create some users
        # Create some users
        users = [
            User(
                first_name="Alice",
                last_name="Johnson",
                email="alice@example.com",
                role=UserRole.SENDER,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                wallet_balance=150.00,
                home_address="123 Maple St, New York, NY"
            ),
            User(
                first_name="Bob",
                last_name="Smith",
                email="bob@example.com",
                role=UserRole.SENDER,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                wallet_balance=50.00,
                home_address="456 Oak Rd, Chicago, IL"
            ),
            User(
                first_name="Charlie",
                last_name="Brown",
                email="charlie@example.com",
                role=UserRole.PICKER,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                rating=4.8,
                completed_deliveries=12,
                earnings=1200.00
            ),
            User(
                first_name="Diana",
                last_name="Prince",
                email="diana@example.com",
                role=UserRole.PICKER,
                verification_status=VerificationStatus.PENDING,
                is_phone_verified=False,
                rating=4.5,
                completed_deliveries=3
            ),
            User(
                first_name="Evan",
                last_name="Wright",
                email="evan@example.com",
                role=UserRole.SENDER,
                verification_status=VerificationStatus.UNVERIFIED,
                is_phone_verified=False,
                wallet_balance=0.00
            ),
            User(
                first_name="GlobalPath",
                last_name="Admin",
                email="admin@example.com",
                role=UserRole.ADMIN,
                verification_status=VerificationStatus.VERIFIED,
                is_phone_verified=True,
                wallet_balance=0.00
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

        # Helper to get user ID
        senders = [u for u in users if u.role == UserRole.SENDER]
        pickers = [u for u in users if u.role == UserRole.PICKER]

        print("Creating Shipments...")
        shipments_data = [
            {
                "category": "Electronics",
                "description": "iPhone 15 Pro Max, Brand New in Box",
                "pickup_country": "USA",
                "dest_country": "UK",
                "address": "10 Downing Street, London",
                "receiver_name": "Rishi S.",
                "receiver_phone": "+44 7700 900000",
                "weight": 0.5,
                "fee": 40.0,
                "notes": "Fragile, handle with care."
            },
            {
                "category": "Documents",
                "description": "Legal Business Contracts",
                "pickup_country": "USA",
                "dest_country": "Germany",
                "address": "Alexanderplatz 1, Berlin",
                "receiver_name": "Hans Zimmer",
                "receiver_phone": "+49 151 12345678",
                "weight": 0.2,
                "fee": 25.0,
                "notes": "Urgent delivery required."
            },
            {
                "category": "Clothing",
                "description": "Designer Winter Jacket",
                "pickup_country": "France",
                "dest_country": "Canada",
                "address": "555 Bay Street, Toronto",
                "receiver_name": "Sarah Connor",
                "receiver_phone": "+1 416 555 0199",
                "weight": 2.5,
                "fee": 60.0,
                "notes": ""
            },
            {
                "category": "Gifts",
                "description": "Handmade Pottery Set",
                "pickup_country": "Italy",
                "dest_country": "USA",
                "address": "742 Evergreen Terrace, Springfield",
                "receiver_name": "Marge Simpson",
                "receiver_phone": "+1 555 7334",
                "weight": 3.0,
                "fee": 85.0,
                "notes": "Very fragile!"
            },
            {
                "category": "Books",
                "description": "Box of Medical Textbooks",
                "pickup_country": "UK",
                "dest_country": "Nigeria",
                "address": "University Road, Lagos",
                "receiver_name": "Chidi Anagonye",
                "receiver_phone": "+234 803 123 4567",
                "weight": 5.0,
                "fee": 50.0,
                "notes": "Donate to library."
            },
            {
                "category": "Electronics",
                "description": "Sony PlayStation 5",
                "pickup_country": "Japan",
                "dest_country": "Brazil",
                "address": "Av. Paulista 100, Sao Paulo",
                "receiver_name": "Ronaldo N.",
                "receiver_phone": "+55 11 99999-9999",
                "weight": 4.5,
                "fee": 120.0,
                "notes": "Gift wrapper if possible."
            },
            {
                "category": "Medicine",
                "description": "Prescription Suppliments",
                "pickup_country": "USA",
                "dest_country": "India",
                "address": "Park Street, Kolkata",
                "receiver_name": "Amitabh B.",
                "receiver_phone": "+91 98765 43210",
                "weight": 1.0,
                "fee": 30.0,
                "notes": "Keep cool."
            },
             {
                "category": "Food",
                "description": "Box of Swiss Chocolates",
                "pickup_country": "Switzerland",
                "dest_country": "UAE",
                "address": "Palm Jumeirah, Dubai",
                "receiver_name": "Sheikh M.",
                "receiver_phone": "+971 50 123 4567",
                "weight": 1.2,
                "fee": 35.0,
                "notes": "Do not melt."
            },
             {
                "category": "Accessories",
                "description": "Luxury Watch",
                "pickup_country": "Switzerland",
                "dest_country": "USA",
                "address": "Wall Street, NY",
                "receiver_name": "Gordon G.",
                "receiver_phone": "+1 212 555 1234",
                "weight": 0.3,
                "fee": 150.0,
                "notes": "High value, insurance needed."
            },
            {
                "category": "Clothing",
                "description": "Custom Wedding Dress",
                "pickup_country": "France",
                "dest_country": "Australia",
                "address": "Sydney Opera House, Sydney",
                "receiver_name": "Nicole K.",
                "receiver_phone": "+61 2 9250 7111",
                "weight": 4.0,
                "fee": 100.0,
                "notes": "Hang upright."
            },
            {
                "category": "Auto Parts",
                "description": "Vintage Car Part (Carburetor)",
                "pickup_country": "Germany",
                "dest_country": "USA",
                "address": "Detroit, Michigan",
                "receiver_name": "Henry F.",
                "receiver_phone": "+1 313 555 6789",
                "weight": 2.0,
                "fee": 70.0,
                "notes": "Rare part."
            },
            {
                "category": "Electronics",
                "description": "Professional Camera Lens",
                "pickup_country": "Japan",
                "dest_country": "France",
                "address": "Champs-Elysees, Paris",
                "receiver_name": "Luc Besson",
                "receiver_phone": "+33 1 44 55 66 77",
                "weight": 1.5,
                "fee": 55.0,
                "notes": ""
            },
            {
                "category": "Toys",
                "description": "Lego Star Wars Set",
                "pickup_country": "Denmark",
                "dest_country": "USA",
                "address": "Legoland Dr, Carlsbad",
                "receiver_name": "Timmy T.",
                "receiver_phone": "+1 760 555 9999",
                "weight": 3.0,
                "fee": 45.0,
                "notes": "Keep box pristine."
            },
            {
                "category": "Musical Instruments",
                "description": "Violin Bow",
                "pickup_country": "Austria",
                "dest_country": "China",
                "address": "Conservatory of Music, Shanghai",
                "receiver_name": "Yo-Yo M.",
                "receiver_phone": "+86 21 6437 0137",
                "weight": 0.4,
                "fee": 40.0,
                "notes": "Extremely fragile."
            },
            {
                "category": "Shoes",
                "description": "Limited Edition Sneakers",
                "pickup_country": "USA",
                "dest_country": "South Korea",
                "address": "Gangnam-gu, Seoul",
                "receiver_name": "Kim J.",
                "receiver_phone": "+82 2 555 1234",
                "weight": 1.0,
                "fee": 50.0,
                "notes": "Double box."
            }
        ]

        # Create Shipment Objects - Assign to specific senders
        shipment_objects = []
        for i, data in enumerate(shipments_data):
            # Cycle through the 3 senders instead of random
            sender = senders[i % len(senders)]
            
            # Mix up statuses
            status = ItemStatus.POSTED
            partner = None
            if i % 3 == 0:
                status = ItemStatus.REQUESTED
                partner = random.choice(pickers)
            elif i % 5 == 0:
                 status = ItemStatus.DELIVERED
                 partner = random.choice(pickers)
            
            shipment = ShipmentItem(
                sender_id=sender.id,
                partner_id=partner.id if partner else None,
                status=status,
                **data
            )
            shipment_objects.append(shipment)
        
        db.session.add_all(shipment_objects)
        db.session.commit()
        print(f"Created {len(shipment_objects)} shipments.")
        print("Done!")

if __name__ == "__main__":
    seed_data()
