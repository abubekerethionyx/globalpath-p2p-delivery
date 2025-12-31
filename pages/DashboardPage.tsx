import React from 'react';
import { User, UserRole } from '../types';
import SenderDashboard from './dashboards/SenderDashboard';
import PickerDashboard from './dashboards/PickerDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

interface DashboardPageProps {
  user: User;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  // Route to the appropriate dashboard based on user role
  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard user={user} />;
  }

  if (user.role === UserRole.PICKER) {
    return <PickerDashboard user={user} />;
  }

  // Default: SENDER
  return <SenderDashboard user={user} />;
};

export default DashboardPage;
