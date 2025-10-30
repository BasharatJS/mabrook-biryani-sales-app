'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import OrderForm from '@/components/forms/OrderForm'
import Modal from '@/components/ui/Modal'

export default function Home() {
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'manager' | 'staff'>('staff')
  const [detectedRole, setDetectedRole] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const { login, register, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      setLoginSuccess(true)
      // Small delay to show the loading state before redirect
      setTimeout(() => {
        if (user.role === 'manager') {
          router.push('/dashboard')
        } else if (user.role === 'staff') {
          router.push('/staff-dashboard')
        }
      }, 1000)
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    try {
      await login(email, password)
      // Don't redirect here, let useEffect handle it with loading state
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password || !name) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      await register(email, password, name, role)
      // Don't redirect here, let useEffect handle it with loading state
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleOrderSuccess = () => {
    setShowOrderForm(false)
    // setOrderSuccess(true);
    // setTimeout(() => {
    //   setOrderSuccess(false);
    // }, 3000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-3">
            <span className="text-2xl">🍛</span>
          </div>
          <h1 className="text-4xl font-bold text-primary">
            ARMANIA BIRYANI HOUSE
          </h1>
        </div>
        <p className="text-lg text-secondary">
          Authentic Biryani Delivered Fresh
        </p>
      </div>

      {/* Success Message */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-success max-w-md mx-4 transform animate-scaleIn">
            <div className="text-center">
              {/* Animated Success Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <svg
                    className="w-10 h-10 text-white animate-bounce"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L5.53 12.7a.996.996 0 10-1.41 1.41L9 18.99l10.88-10.88a.996.996 0 10-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
                {/* Ripple Effect */}
                <div className="absolute inset-0 w-20 h-20 bg-success rounded-full mx-auto opacity-25 animate-ping"></div>
              </div>

              {/* Success Text */}
              <h3 className="text-2xl font-bold text-success mb-2 animate-fadeIn">
                🎉 Order Placed Successfully!
              </h3>
              <p className="text-lg text-gray-600 mb-2 animate-slideUp">
                Thank you for choosing ARMANIA BIRYANI HOUSE!
              </p>
              <p className="text-sm text-gray-500 animate-slideUp delay-100">
                We will call you soon to confirm your delicious biryani order
              </p>

              {/* Decorative Elements */}
              <div className="flex justify-center mt-4 space-x-2">
                <span className="text-2xl animate-bounce delay-75">🍛</span>
                <span className="text-2xl animate-bounce delay-150">📞</span>
                <span className="text-2xl animate-bounce delay-225">🚚</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Success Loading */}
      {loginSuccess && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-primary mb-2">
              Login Successful!
            </h3>
            <p className="text-secondary">Taking you to dashboard...</p>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-[60vh]">
          {/* Left Section - Customer Area */}
          <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl p-6 lg:p-8 text-white shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="h-full flex flex-col justify-center text-center">
              <div className="mb-6">
                <span className="text-5xl lg:text-6xl mb-4 block animate-bounce">
                  🍛
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                  Order Fresh Biryani
                </h2>
                <p className="text-lg lg:text-xl text-orange-100 mb-6 lg:mb-8">
                  Quick & Easy Ordering
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="w-full bg-white text-primary hover:bg-orange-50 py-3 lg:py-4 px-6 lg:px-8 rounded-xl font-bold text-lg lg:text-xl shadow-lg transform hover:scale-105 transition-all duration-200 animate-pulse hover:animate-none"
                >
                  🍽️ Order Biryani Now
                </button>

                <div className="bg-orange-600/30 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-orange-100 text-sm">
                    Quick order confirmation via WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Staff/Manager Login/Register */}
          <div className="bg-card rounded-2xl p-6 lg:p-8 shadow-xl border border-border hover:shadow-2xl transition-shadow duration-300">
            <div className="h-full flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                  {isLoginMode ? 'Staff/Manager Login' : 'Create Account'}
                </h2>
                <p className="text-secondary mt-2 text-sm lg:text-base">
                  {isLoginMode
                    ? 'Access your dashboard'
                    : 'Register as staff or manager'}
                </p>
              </div>

              <form
                onSubmit={isLoginMode ? handleLogin : handleRegister}
                className="space-y-4"
              >
                {!isLoginMode && (
                  <>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-foreground mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter your full name"
                        disabled={loading || loginSuccess}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-medium text-foreground mb-1"
                      >
                        User Type
                      </label>
                      <select
                        id="role"
                        value={role}
                        onChange={(e) =>
                          setRole(e.target.value as 'manager' | 'staff')
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={loading || loginSuccess}
                      >
                        <option value="staff">Staff Member</option>
                        <option value="manager">Manager</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Final role will be based on your database record
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your email"
                    disabled={loading || loginSuccess}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={
                      isLoginMode
                        ? 'Enter your password'
                        : 'Minimum 6 characters'
                    }
                    disabled={loading || loginSuccess}
                  />
                </div>

                {error && (
                  <div className="bg-danger/10 border border-danger/20 text-danger rounded-lg p-3 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || loginSuccess}
                  className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loginSuccess
                    ? 'Redirecting...'
                    : loading
                    ? isLoginMode
                      ? 'Signing In...'
                      : 'Creating Account...'
                    : isLoginMode
                    ? 'Sign In'
                    : 'Create Account'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(!isLoginMode)
                      setError('')
                      setEmail('')
                      setPassword('')
                      setName('')
                    }}
                    disabled={loading || loginSuccess}
                    className="text-primary hover:text-orange-600 text-sm font-medium transition-colors"
                  >
                    {isLoginMode
                      ? "Don't have an account? Sign Up"
                      : 'Already have an account? Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 mt-8">
        <div className="bg-card/50 backdrop-blur-sm rounded-lg p-4 mx-4 lg:mx-auto max-w-2xl border border-border">
          <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-secondary">
            <div className="flex items-center">
              <span className="text-lg mr-2">⏰</span>
              <span>Open 10:00 AM - 12:00 PM</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">📞</span>
              <span>Call for bulk orders</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">🚚</span>
              <span>Free delivery above ₹500</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order Modal */}
      <Modal
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        size="lg"
      >
        <OrderForm
          onSuccess={handleOrderSuccess}
          onCancel={() => setShowOrderForm(false)}
          isCustomerFlow={true}
        />
      </Modal>
    </div>
  )
}
