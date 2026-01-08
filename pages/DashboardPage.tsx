import React from 'react';
import { User, UserRole } from '../types';
import SenderDashboard from './dashboards/SenderDashboard';
import PickerDashboard from './dashboards/PickerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

import { PublicSettings } from '../services/AdminService';

interface DashboardPageProps {
  user: User;
  publicSettings?: PublicSettings;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user, publicSettings }) => {
  // Route to the appropriate dashboard based on user role
  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard user={user} />;
  }

  if (user.role === UserRole.PICKER) {
    return <PickerDashboard user={user} publicSettings={publicSettings} />;
  }

  // Default: SENDER
  return <SenderDashboard user={user} />;
};

export default DashboardPage;
