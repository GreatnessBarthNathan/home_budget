import type { Account, Activity, Household, HouseholdMember, Transaction, User } from "./types";

const TOKEN_KEY = "home-budget-token";
const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Something went wrong. Please try again.");
  return body as T;
}

export const api = {
  authenticate: (email: string, password: string, mode: "login" | "register", family?: { householdName?: string; inviteCode?: string }) =>
    request<{ token: string; user: User }>(`/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ email, password, ...family })
    }),
  me: () => request<{ user: User }>("/auth/me"),
  household: () => request<{ household: Household; members: HouseholdMember[] }>("/household"),
  activity: (month: string) => request<{ activities: Activity[] }>(`/activity?month=${encodeURIComponent(month)}`),
  accounts: (month: string) => request<{ accounts: Account[] }>(`/accounts?month=${encodeURIComponent(month)}`),
  addAccount: (account: Pick<Account, "name" | "type" | "openingBalance" | "color">) =>
    request<{ account: Account }>("/accounts", { method: "POST", body: JSON.stringify(account) }),
  transactions: (month: string) =>
    request<{ transactions: Transaction[] }>(`/transactions?month=${encodeURIComponent(month)}`),
  addTransaction: (transaction: Omit<Transaction, "_id">) =>
    request<{ transaction: Transaction }>("/transactions", {
      method: "POST",
      body: JSON.stringify(transaction)
    }),
  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/transactions/${id}`, { method: "DELETE" })
};
