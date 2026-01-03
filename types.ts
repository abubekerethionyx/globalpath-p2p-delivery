
export enum UserRole {
  SENDER = 'SENDER',
  PICKER = 'PICKER',
  ADMIN = 'ADMIN'
}

export enum ItemStatus {
  POSTED = 'POSTED',
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PICKED = 'PICKED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION',
  DELIVERED = 'DELIVERED'
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  created_at: string;
  updated_at: string;
  replies?: TicketReply[];
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  message: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  limit: number;
  role: UserRole;
  description: string;
  is_premium?: boolean;
  duration_days?: number;
  coin_price?: number;
}

export interface SubscriptionTransaction {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  payment_method: 'wallet' | 'direct' | 'chapa' | 'telebirr';
  timestamp: string;
  status: 'COMPLETED' | 'PENDING';
  remaining_usage?: number;
  is_active?: boolean;
  end_date?: string;
  days_remaining?: number;
  transaction_reference?: string;
  receipt_url?: string;
  payment_info?: {
    paymentUrl?: string;
    appId?: string;
    sign?: string;
  };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  role: UserRole;
  avatar: string;
  rating?: number;
  completedDeliveries?: number;
  earnings?: number;
  walletBalance: number;
  coinsBalance: number;
  currentPlanId?: string;
  isSubscriptionActive?: boolean;
  itemsCountThisMonth: number;
  averageDeliveryTime?: number;
  // Expanded Security Fields
  verificationStatus: VerificationStatus;
  idType?: 'NATIONAL_ID' | 'PASSPORT';
  nationalId?: string;
  passportNumber?: string;
  passportExpiry?: string;
  issuanceCountry?: string;
  phoneNumber?: string;
  homeAddress?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
  selfieUrl?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  // Added livenessVideo property to track video verification status
  livenessVideo?: string;
  dateOfBirth?: string;
  createdAt?: string;
  // Privacy Settings
  hidePhoneNumber?: boolean;
  hideRating?: boolean;
  hideCompletedDeliveries?: boolean;
  hideEmail?: boolean;
}

export interface ShipmentItem {
  id: string;
  senderId: string;
  partnerId?: string;
  category?: string;
  description?: string;
  pickupCountry: string;
  destCountry: string;
  address: string;
  receiverName: string;
  receiverPhone: string;
  weight: number;
  fee: number;
  notes: string;
  status: ItemStatus;
  createdAt: string;
  imageUrls?: string[];
  image_urls?: string[];
  pickedAt?: string;
  picked_at?: string;
  availablePickupTime?: string;
  available_pickup_time?: string;
  // User objects populated from backend
  sender?: User;
  partner?: User;
}
// Extend for loose typing if needed
export interface ShipmentItemAny extends ShipmentItem {
  [key: string]: any;
}




export interface MessageThread {
  id: string;
  shipment_id?: string;
  participant1: User;
  participant2: User;
  last_message?: string;
  shipment?: {
    id: string;
    status: ItemStatus;
    pickup_country: string;
    dest_country: string;
    category: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  shipment_id?: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
  sender?: User;
  receiver?: User;
}

export interface AppState {
  currentUser: User | null;
  items: ShipmentItem[];
  messages: Message[];
  plans: SubscriptionPlan[];
  allUsers: User[];
  subscriptionHistory: SubscriptionTransaction[];
}
