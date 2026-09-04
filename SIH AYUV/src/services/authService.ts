import { RoleName, UserProfile } from '../types/user';
import { DEMO_ROLES } from '../data/mockRoles';
import { mockFetch } from './api';

const AUTH_STORAGE_KEY = 'ayu_trial_user_role';

class AuthService {
  private currentRole: RoleName = 'Principal Investigator';

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    if (saved && DEMO_ROLES.some((r) => r.role === saved)) {
      this.currentRole = saved as RoleName;
    }
  }

  async getCurrentUser(): Promise<UserProfile> {
    const found = DEMO_ROLES.find((r) => r.role === this.currentRole) || DEMO_ROLES[0];
    return mockFetch(found.user, 50);
  }

  async getRoles(): Promise<{ role: RoleName; user: UserProfile }[]> {
    return mockFetch(DEMO_ROLES, 50);
  }

  async switchRole(role: RoleName): Promise<UserProfile> {
    const found = DEMO_ROLES.find((r) => r.role === role);
    if (!found) {
      throw new Error(`Role ${role} not found`);
    }
    this.currentRole = role;
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, role);
    }
    return mockFetch(found.user, 100);
  }
}

export const authService = new AuthService();
