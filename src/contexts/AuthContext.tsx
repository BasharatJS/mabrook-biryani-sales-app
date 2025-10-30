'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserService } from '@/lib/firestore';

interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: 'manager' | 'staff';
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'manager' | 'staff') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Cache to prevent repeated Firestore reads for the same user
  const [userCache, setUserCache] = useState<Map<string, any>>(new Map());

  // Login with email validation against pre-authorized users
  const login = async (email: string, password: string) => {
    try {
      const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // First try to find user by UID (for already registered users)
      let userDoc = await getDoc(doc(db, 'users', result.user.uid));
      let userData: any = null;
      
      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        // If not found by UID, find by email (for users who have database entry but haven't registered yet)
        const emailCheck = await UserService.checkEmailExists(result.user.email || '');
        
        if (!emailCheck.exists) {
          await signOut(auth);
          throw new Error('This email is not authorized to access the system');
        }
        
        // Update the user document with the UID
        await updateDoc(doc(db, 'users', emailCheck.userData.id), {
          uid: result.user.uid,
          updatedAt: new Date()
        });
        
        userData = emailCheck.userData;
      }
      
      if (!userData.isActive) {
        await signOut(auth);
        throw new Error('Account is deactivated');
      }
      
      // Handle missing role field - default to staff
      const userRole = userData.role || 'staff';
      setUser({
        uid: result.user.uid,
        email: result.user.email || '',
        name: userData.name || (userRole === 'manager' ? 'Sales Manager' : 'Staff Member'),
        role: userRole,
        isActive: userData.isActive
      });
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error.message?.includes('not authorized') || error.message === 'Account is deactivated') {
        throw error;
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  };

  // Register only pre-authorized emails from database
  const register = async (email: string, password: string, name: string, role: 'manager' | 'staff') => {
    try {
      // Check if email exists in pre-authorized users database
      const emailCheck = await UserService.checkEmailExists(email);
      
      if (!emailCheck.exists) {
        throw new Error('This email is not authorized for registration. Please contact your administrator.');
      }

      const existingUserData = emailCheck.userData;
      
      // Check if user is active
      if (!existingUserData.isActive) {
        throw new Error('This account has been deactivated. Please contact your administrator.');
      }
      
      // Use role from database or form input as fallback
      const userRole = existingUserData.role || role;
      
      // Create Firebase Auth account
      const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        // Update existing user document with Firebase UID and complete info
        await updateDoc(doc(db, 'users', existingUserData.id), {
          uid: result.user.uid,
          email: email,
          name: name || existingUserData.name,
          role: userRole, // Use role from database or form
          isActive: existingUserData.isActive,
          registeredAt: new Date(),
          updatedAt: new Date()
        });
      } catch (updateError) {
        console.error('Firestore update error:', updateError);
        // If Firestore update fails, delete the Firebase Auth user
        await result.user.delete();
        throw new Error('Database update failed. Please check your permissions.');
      }
      
      setUser({
        uid: result.user.uid,
        email: result.user.email || '',
        name: name || existingUserData.name,
        role: userRole,
        isActive: existingUserData.isActive
      });
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email format');
      } else if (error.message?.includes('not authorized') || error.message?.includes('deactivated')) {
        throw error;
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };

  // Logout current user
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // Monitor auth state changes and sync with Firestore - OPTIMIZED with caching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          let userData: any = null;

          // OPTIMIZATION: Check cache first to avoid repeated Firestore reads
          const cachedUser = userCache.get(firebaseUser.uid);
          if (cachedUser) {
            userData = cachedUser;
          } else {
            // Cache miss - fetch from Firestore
            let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

            if (userDoc.exists()) {
              userData = userDoc.data();
            } else {
              // If not found by UID, try to find by email
              const emailCheck = await UserService.checkEmailExists(firebaseUser.email || '');

              if (emailCheck.exists) {
                // Update the user document with the UID
                await updateDoc(doc(db, 'users', emailCheck.userData.id), {
                  uid: firebaseUser.uid,
                  updatedAt: new Date()
                });
                userData = emailCheck.userData;
              }
            }

            // Cache the user data to prevent repeated reads
            if (userData) {
              setUserCache(prev => {
                const newCache = new Map(prev);
                newCache.set(firebaseUser.uid, userData);
                return newCache;
              });
            }
          }

          if (userData && userData.isActive) {
            // Handle missing role field - default to staff
            const userRole = userData.role || 'staff';
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || (userRole === 'manager' ? 'Sales Manager' : 'Staff Member'),
              role: userRole,
              isActive: userData.isActive
            });
          } else {
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userCache]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}