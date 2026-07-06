const isNode = typeof window === 'undefined';

const usersKey = 'femmora_users';
const tokenKey = 'femmora_token';
const lastEmailKey = 'femmora_last_email';

const storage = isNode ? null : window.localStorage;

const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms));

const loadUsers = () => {
  if (!storage) return {};
  try {
    return JSON.parse(storage.getItem(usersKey) || '{}');
  } catch (e) {
    return {};
  }
};

const saveUsers = (users) => {
  if (!storage) return;
  storage.setItem(usersKey, JSON.stringify(users));
};

export const authClient = {
  auth: {
    async register({ email, password }) {
      if (!email || !password) throw new Error('Missing fields');
      await delay();
      const users = loadUsers();
      if (users[email]) throw new Error('User already exists');
      users[email] = { email, password, role: 'user' };
      saveUsers(users);
      if (storage) storage.setItem(lastEmailKey, email);
      return { success: true };
    },

    async verifyOtp({ email, otpCode } = {}) {
      await delay();
      const token = `fake-token-${Date.now()}`;
      if (storage) {
        storage.setItem(tokenKey, token);
        if (email) storage.setItem(lastEmailKey, email);
      }
      return { access_token: token };
    },

    setToken(token) {
      if (storage) storage.setItem(tokenKey, token);
    },

    async loginViaEmailPassword(email, password) {
      await delay();
      const users = loadUsers();
      const user = users[email];
      if (!user || user.password !== password) throw new Error('Invalid email or password');
      const token = `fake-token-${Date.now()}`;
      if (storage) {
        storage.setItem(tokenKey, token);
        storage.setItem(lastEmailKey, email);
      }
      return { access_token: token };
    },

    loginWithProvider(provider, redirect = '/') {
      // For local development just redirect or set a fake token
      if (storage) {
        storage.setItem(tokenKey, `fake-${provider}-token`);
      }
      if (typeof window !== 'undefined') {
        window.location.href = redirect;
      }
    },

    async resendOtp(email) {
      await delay(50);
      return true;
    },

    async resetPasswordRequest(email) {
      await delay(50);
      return true;
    },

    async resetPassword({ resetToken, newPassword } = {}) {
      await delay(50);
      // Try to update password for last known email
      if (!storage) throw new Error('Not supported in this environment');
      const email = storage.getItem(lastEmailKey);
      if (!email) throw new Error('Invalid token');
      const users = loadUsers();
      if (!users[email]) throw new Error('User not found');
      users[email].password = newPassword;
      saveUsers(users);
      return true;
    },

    async me() {
      await delay(50);
      if (!storage) throw new Error('Not supported in this environment');
      const token = storage.getItem(tokenKey);
      if (!token) throw new Error('Not authenticated');
      const email = storage.getItem(lastEmailKey);
      const users = loadUsers();
      const user = users[email];
      if (!user) throw new Error('Not authenticated');
      const { password, ...safe } = user;
      return safe;
    },
  },
};
