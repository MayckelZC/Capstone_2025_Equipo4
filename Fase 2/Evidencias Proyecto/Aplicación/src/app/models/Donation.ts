export interface Donation {
  id: string;
  userId: string;
  shelterId?: string; // Optional: for donating to a specific shelter
  amount: number;
  createdAt: Date;
}
