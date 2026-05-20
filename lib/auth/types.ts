export type UserRole = "admin" | "manager" | "detailer";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string;
  active: boolean;
};

export type HubAccess = {
  profile: Profile;
  isManager: boolean;
  isAdmin: boolean;
};
