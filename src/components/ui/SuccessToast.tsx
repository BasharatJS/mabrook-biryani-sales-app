'use client';

import { useEffect } from 'react';

interface SuccessToastProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({
  isOpen,
  message,
  onClose,
  duration = 3000
}: SuccessToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none animate-fadeIn">
      {/* Toast Container */}
      <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform animate-scaleIn border-4 border-green-500">
        {/* Success Header with Gradient */}
        <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 p-6 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20 animate-pulse delay-300" />
          </div>

          {/* Success Icon Container */}
          <div className="relative flex justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg
                  className="w-10 h-10 text-green-600 animate-scaleIn"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Success Title */}
          <h3 className="relative text-2xl font-bold text-white text-center mb-2">
            Success!
          </h3>

          {/* Success Message */}
          <p className="relative text-white text-center text-base">
            {message}
          </p>
        </div>

        {/* Decorative Bottom Section */}
        <div className="bg-green-50 p-4">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Operation completed successfully</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-green-200 relative overflow-hidden">
          <div
            className="h-full bg-green-600 absolute top-0 left-0 animate-progress"
            style={{
              animation: `progressBar ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
    </div>
  );
}
