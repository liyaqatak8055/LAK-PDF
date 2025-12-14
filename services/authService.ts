import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const USERS_KEY = 'lakpdf_users_db';
const SESSION_KEY = 'lakpdf_session';
const RESET_TOKENS_KEY = 'lakpdf_reset_tokens';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Register a new user
   */
  async register(name: string, email: string, password: string): Promise<User> {
    await delay(800); // Fake network latency

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Check if email exists
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser = {
      id: uuidv4(),
      name,
      email,
      password, // In a real app, this would be hashed!
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Auto login after register
    const userToReturn = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userToReturn));
    
    return userToReturn;
  },

  /**
   * Login existing user
   */
  async login(email: string, password: string): Promise<User> {
    await delay(800); // Fake network latency

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const userToReturn = { id: user.id, name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userToReturn));

    return userToReturn;
  },

  /**
   * Request Password Reset (Generate OTP)
   */
  async requestPasswordReset(email: string): Promise<string> {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u: any) => u.email === email);
    
    // Security: Don't reveal if user exists in production, but for mock app we throw
    if (!user) throw new Error("No account found with this email");

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP
    const tokens = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '{}');
    tokens[email] = otp;
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
    
    console.log(`[MOCK EMAIL SERVICE] OTP for ${email} is ${otp}`);
    return otp;
  },

  /**
   * Reset Password with OTP
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    await delay(800);
    const tokens = JSON.parse(localStorage.getItem(RESET_TOKENS_KEY) || '{}');
    
    if (!tokens[email] || tokens[email] !== otp) {
      throw new Error("Invalid or expired OTP");
    }

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email);
    
    if (userIndex === -1) throw new Error("User not found");

    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Cleanup OTP
    delete tokens[email];
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
  },

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  /**
   * Get current session
   */
  getCurrentUser(): User | null {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }
};