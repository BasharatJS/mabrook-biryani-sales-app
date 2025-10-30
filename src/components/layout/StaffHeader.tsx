'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function StaffHeader() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🍛</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">ARMANIA BIRYANI HOUSE</h1>
                <p className="text-sm text-primary-foreground/80">Staff Panel</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-primary-foreground/70 capitalize">{user?.role}</p>
                </div>
                
                <button
                  onClick={logout}
                  className="bg-danger text-danger-foreground px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}