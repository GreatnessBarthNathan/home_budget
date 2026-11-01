export type Account = {
  _id: string;
  name: string;
  type: "Checking" | "Savings" | "Credit card" | "Cash" | "Other";
  openingBalance: number;
  color: string;
  monthEndBalance?: number;
};

export type Household = {
  _id: string;
  name: string;
  inviteCode: string;
};

export type HouseholdMember = {
  id: string;
  email: string;
};

export type Transaction = {
  _id: string;
  description: string;
  amount: number;
  kind: "expense" | "income";
  category: string;
  account: string;
  date: string;
  note?: string;
  user?: string | { _id: string; email: string };
};

export type User = { id: string; email: string };

export type DashboardTab = "overview" | "transactions" | "accounts" | "activity";

export type Activity = {
  _id: string;
  action: "household_created" | "member_joined" | "account_created" | "transaction_created" | "transaction_deleted";
  description: string;
  createdAt: string;
  user: { _id: string; email: string };
};
