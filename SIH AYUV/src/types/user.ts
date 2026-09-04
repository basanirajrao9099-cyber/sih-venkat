export type RoleName = 
  | 'Principal Investigator'
  | 'Trial Coordinator'
  | 'Monitor'
  | 'Ethics Reviewer'
  | 'Pharmacovigilance'
  | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  institution: string;
  avatar: string;
  permissions: string[];
}
