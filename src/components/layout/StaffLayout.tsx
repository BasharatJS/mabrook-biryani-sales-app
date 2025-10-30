import StaffHeader from './StaffHeader';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface StaffLayoutProps {
  children: React.ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  return (
    <ProtectedRoute requiredRole="staff">
      <div className="min-h-screen flex flex-col bg-background">
        <StaffHeader />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}