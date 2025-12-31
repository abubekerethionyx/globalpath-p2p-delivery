
import { ShipmentItem, Message, AppState, User, UserRole, ItemStatus, SubscriptionPlan, VerificationStatus, SubscriptionTransaction } from '../types';
import { INITIAL_ITEMS, MOCK_USERS, SENDER_PLANS, PICKER_PLANS } from '../constants';

const STORAGE_KEY = 'globalpath_storage';

class MockApiService {
  private state: AppState;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.state = JSON.parse(stored);
    } else {
      this.state = {
        currentUser: null,
        items: INITIAL_ITEMS,
        messages: [],
        plans: [...SENDER_PLANS, ...PICKER_PLANS],
        allUsers: MOCK_USERS,
        subscriptionHistory: [
          // Initial mock subscriptions for Dawit (u1)
          {
            id: 'sub-mock-1',
            userId: 'u1',
            planId: 's-basic',
            planName: 'Standard',
            amount: 800,
            paymentMethod: 'wallet',
            timestamp: '2023-09-01T10:00:00Z',
            status: 'COMPLETED'
          },
          {
            id: 'sub-mock-2',
            userId: 'u2',
            planId: 'p-pro',
            planName: 'Professional Picker',
            amount: 1200,
            paymentMethod: 'wallet',
            timestamp: '2023-09-15T14:30:00Z',
            status: 'COMPLETED'
          }
        ]
      };
      this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  setCurrentUser(user: User | null) {
    this.state.currentUser = user;
    this.save();
  }

  getCurrentUser() {
    return this.state.currentUser;
  }

  getAllUsers() {
    return this.state.allUsers;
  }

  getPlans() {
    return this.state.plans;
  }

  getItems() {
    return this.state.items;
  }

  getSubscriptionHistory(userId: string) {
    return this.state.subscriptionHistory.filter(t => t.userId === userId);
  }

  // Auth Actions
  registerUser(name: string, email: string, role: UserRole) {
    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      walletBalance: 0,
      currentPlanId: role === UserRole.SENDER ? 's-free' : 'p-free',
      itemsCountThisMonth: 0,
      verificationStatus: role === UserRole.ADMIN ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    this.state.allUsers.push(newUser);
    this.save();
    return newUser;
  }

  loginUser(email: string) {
    const user = this.state.allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      this.setCurrentUser(user);
      return user;
    }
    return null;
  }

  // Admin Actions
  verifyUser(userId: string, status: VerificationStatus) {
    const user = this.state.allUsers.find(u => u.id === userId);
    if (user) {
      user.verificationStatus = status;
      if (this.state.currentUser?.id === userId) {
        this.state.currentUser.verificationStatus = status;
      }
      this.save();
    }
  }

  updatePlan(planId: string, updates: Partial<SubscriptionPlan>) {
    const idx = this.state.plans.findIndex(p => p.id === planId);
    if (idx !== -1) {
      this.state.plans[idx] = { ...this.state.plans[idx], ...updates };
      this.save();
    }
  }

  // User Actions
  submitRegistration(data: any) {
    if (!this.state.currentUser) return;
    
    const userIdx = this.state.allUsers.findIndex(u => u.id === this.state.currentUser?.id);
    const updatedUser = {
      ...this.state.currentUser,
      ...data,
      idFrontUrl: data.idFront || this.state.currentUser.idFrontUrl,
      idBackUrl: data.idBack || this.state.currentUser.idBackUrl,
      selfieUrl: data.selfie || this.state.currentUser.selfieUrl,
      livenessVideo: data.livenessVideo || this.state.currentUser.livenessVideo,
      verificationStatus: VerificationStatus.PENDING
    };

    this.state.currentUser = updatedUser;
    if (userIdx !== -1) this.state.allUsers[userIdx] = updatedUser;
    
    this.save();
  }

  purchasePlan(plan: SubscriptionPlan, paymentMethod: 'wallet' | 'direct') {
    if (!this.state.currentUser) return false;
    
    if (paymentMethod === 'wallet') {
      if (this.state.currentUser.walletBalance < plan.price) {
        alert("Insufficient wallet balance.");
        return false;
      }
      this.state.currentUser.walletBalance -= plan.price;
    }
    
    const transaction: SubscriptionTransaction = {
      id: `sub-${Math.random().toString(36).substr(2, 9)}`,
      userId: this.state.currentUser.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      paymentMethod,
      timestamp: new Date().toISOString(),
      status: paymentMethod === 'wallet' ? 'COMPLETED' : 'PENDING'
    };

    this.state.subscriptionHistory.push(transaction);
    this.state.currentUser.currentPlanId = plan.id;
    const userIdx = this.state.allUsers.findIndex(u => u.id === this.state.currentUser?.id);
    if (userIdx !== -1) this.state.allUsers[userIdx] = this.state.currentUser;
    
    this.save();
    return true;
  }

  postItem(item: Omit<ShipmentItem, 'id' | 'createdAt' | 'status'>) {
    const newItem: ShipmentItem = {
      ...item,
      id: `it-${Math.random().toString(36).substr(2, 9)}`,
      status: ItemStatus.POSTED,
      createdAt: new Date().toISOString()
    };
    
    if (this.state.currentUser) {
      this.state.currentUser.itemsCountThisMonth += 1;
      const userIdx = this.state.allUsers.findIndex(u => u.id === this.state.currentUser?.id);
      if (userIdx !== -1) this.state.allUsers[userIdx] = this.state.currentUser;
    }
    
    this.state.items.push(newItem);
    this.save();
    return newItem;
  }

  pickItem(itemId: string, partnerId: string) {
    const item = this.state.items.find(i => i.id === itemId);
    if (item && item.status === ItemStatus.POSTED) {
      item.partnerId = partnerId;
      item.status = ItemStatus.REQUESTED;
      this.save();
    }
  }

  approvePicker(itemId: string) {
    const item = this.state.items.find(i => i.id === itemId);
    if (item && item.status === ItemStatus.REQUESTED) {
      item.status = ItemStatus.PICKED;
      this.save();
    }
  }

  updateItemStatus(itemId: string, status: ItemStatus) {
    const item = this.state.items.find(i => i.id === itemId);
    if (item) {
      item.status = status;
      this.save();
    }
  }

  getMessages(shipmentId: string) {
    return this.state.messages.filter(m => m.shipmentId === shipmentId);
  }

  sendMessage(shipmentId: string, senderId: string, text: string) {
    const msg: Message = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      shipmentId,
      senderId,
      text,
      timestamp: new Date().toISOString()
    };
    this.state.messages.push(msg);
    this.save();
    return msg;
  }
}

export const api = new MockApiService();
