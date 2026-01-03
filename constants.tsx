
import { UserRole, ItemStatus, ShipmentItem, User, SubscriptionPlan, VerificationStatus } from './types';

export const COUNTRIES = [
  "Ethiopia", "USA", "United Kingdom", "Germany", "UAE (Dubai)",
  "China", "Turkey", "Kenya", "South Africa", "Canada"
];

export const CATEGORIES = [
  "Clothing/Habesha Kemis", "Electronics", "Documents", "Spices/Berbere", "Coffee Beans", "Medicines", "Gifts", "Other"
];

export const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee for picker earnings


export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    firstName: 'Frank',
    lastName: 'Underwood',
    email: 'frank@example.com',
    role: UserRole.SENDER,
    avatar: 'https://i.pravatar.cc/150?u=frank@example.com',
    walletBalance: 150.00,
    coinsBalance: 500,
    currentPlanId: '',
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true,
    isPhoneVerified: true,
    homeAddress: "123 Maple St, New York, NY",
    createdAt: '2023-01-15'
  },
  {
    id: 'u2',
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    role: UserRole.SENDER,
    avatar: 'https://i.pravatar.cc/150?u=grace@example.com',
    walletBalance: 50.00,
    coinsBalance: 20,
    currentPlanId: '',
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true,
    isPhoneVerified: true,
    homeAddress: "456 Oak Rd, Chicago, IL",
    createdAt: '2023-02-20'
  },
  {
    id: 'u3',
    firstName: 'Charlie',
    lastName: 'Picker',
    email: 'charlie@example.com',
    role: UserRole.PICKER,
    avatar: 'https://i.pravatar.cc/150?u=charlie@example.com',
    rating: 4.8,
    completedDeliveries: 12,
    earnings: 1200.00,
    walletBalance: 0,
    coinsBalance: 100,
    currentPlanId: '',
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2023-03-10'
  },

  {
    id: 'admin1',
    firstName: 'GlobalPath',
    lastName: 'Admin',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    avatar: 'https://i.pravatar.cc/150?u=admin@example.com',
    walletBalance: 0,
    coinsBalance: 1000,
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2022-10-01'
  }
];

export const INITIAL_ITEMS: ShipmentItem[] = [
  {
    id: 'it1',
    senderId: 'u1',
    category: 'Clothing/Habesha Kemis',
    pickupCountry: 'Ethiopia',
    destCountry: 'USA',
    address: 'Bole Medhanialem, Addis Ababa',
    receiverName: 'Hanna Tadesse',
    receiverPhone: '+1 202 555 0123',
    weight: 2.5,
    fee: 3500,
    notes: 'Traditional dress for a wedding. Please handle with care.',
    status: ItemStatus.POSTED,
    createdAt: new Date().toISOString()
  },
  {
    id: 'it2',
    senderId: 'u1',
    partnerId: 'u2',
    category: 'Coffee Beans',
    pickupCountry: 'Ethiopia',
    destCountry: 'Germany',
    address: 'Piazza, Addis Ababa',
    receiverName: 'Lukas Müller',
    receiverPhone: '+49 152 000 1122',
    weight: 5.0,
    fee: 4200,
    notes: 'Organic Yirgacheffe coffee beans.',
    status: ItemStatus.IN_TRANSIT,
    createdAt: new Date().toISOString()
  }
];
