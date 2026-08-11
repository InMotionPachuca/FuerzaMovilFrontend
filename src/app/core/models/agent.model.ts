export interface Agent {
  id?: number;
  fullName: string;
  username: string;
  password?: string;
  role?: string;
  active?: boolean;
}