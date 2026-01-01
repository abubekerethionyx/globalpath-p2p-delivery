
import { UserRole, ItemStatus, ShipmentItem, User, SubscriptionPlan, VerificationStatus } from './types';

export const COUNTRIES = [
  "Ethiopia", "USA", "United Kingdom", "Germany", "UAE (Dubai)",
  "China", "Turkey", "Kenya", "South Africa", "Canada"
];

export const CATEGORIES = [
  "Clothing/Habesha Kemis", "Electronics", "Documents", "Spices/Berbere", "Coffee Beans", "Medicines", "Gifts", "Other"
];

export const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee for picker earnings

export const SENDER_PLANS: SubscriptionPlan[] = [
  { id: 's-free', name: 'Starter', price: 0, limit: 1, role: UserRole.SENDER, description: 'Post 1 item per month' },
  { id: 's-basic', name: 'Standard', price: 800, limit: 5, role: UserRole.SENDER, description: 'Post up to 5 items per month' },
  { id: 's-pro', name: 'Premium Business', price: 2500, limit: 100, role: UserRole.SENDER, description: 'Unlimited global posting' }
];

export const PICKER_PLANS: SubscriptionPlan[] = [
  { id: 'p-free', name: 'Casual Traveler', price: 0, limit: 1, role: UserRole.PICKER, description: 'Pick 1 active item at a time' },
  { id: 'p-pro', name: 'Professional Picker', price: 1200, limit: 5, role: UserRole.PICKER, description: 'Handle up to 5 active deliveries' },
  { id: 'p-elite', name: 'Elite Agent', price: 3000, limit: 100, role: UserRole.PICKER, description: 'No limits on active picks' }
];

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice@example.com',
    role: UserRole.SENDER,
    avatar: 'https://i.pravatar.cc/150?u=alice@example.com',
    walletBalance: 150.00,
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
    firstName: 'Bob',
    lastName: 'Smith',
    email: 'bob@example.com',
    role: UserRole.SENDER,
    avatar: 'https://i.pravatar.cc/150?u=bob@example.com',
    walletBalance: 50.00,
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
    lastName: 'Brown',
    email: 'charlie@example.com',
    role: UserRole.PICKER,
    avatar: 'https://i.pravatar.cc/150?u=charlie@example.com',
    rating: 4.8,
    completedDeliveries: 12,
    earnings: 1200.00,
    walletBalance: 0,
    currentPlanId: '',
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.VERIFIED,
    isEmailVerified: true,
    isPhoneVerified: true,
    createdAt: '2023-03-10'
  },
  {
    id: 'u4',
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@example.com',
    role: UserRole.PICKER,
    avatar: 'https://i.pravatar.cc/150?u=diana@example.com',
    rating: 4.5,
    completedDeliveries: 3,
    earnings: 0,
    walletBalance: 0,
    currentPlanId: '',
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.PENDING,
    isEmailVerified: true,
    isPhoneVerified: false,
    createdAt: '2023-04-05'
  },
  {
    id: 'u5',
    firstName: 'Evan',
    lastName: 'Wright',
    email: 'evan@example.com',
    role: UserRole.SENDER,
    avatar: 'https://i.pravatar.cc/150?u=evan@example.com',
    walletBalance: 0.00,
    currentPlanId: '',
    itemsCountThisMonth: 0,
    verificationStatus: VerificationStatus.UNVERIFIED,
    isEmailVerified: false,
    isPhoneVerified: false,
    createdAt: '2023-05-12'
  },
  {
    id: 'admin1',
    firstName: 'GlobalPath',
    lastName: 'Admin',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    avatar: 'https://i.pravatar.cc/150?u=admin@example.com',
    walletBalance: 0,
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
