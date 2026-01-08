
import { UserRole, ItemStatus, ShipmentItem, User, SubscriptionPlan, VerificationStatus } from './types';

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
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
