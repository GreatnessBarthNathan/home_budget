# Home Budget

Home Budget is a single-deployment household finance app. The React and Tailwind CSS frontend is built into `client/dist`, and the Node.js/Express backend serves that build as well as the API. MongoDB stores account, transaction, and user data.

## Requirements

- Node.js 20+
- A MongoDB connection string (local or hosted)

## Configure and run

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your MongoDB connection string and set `JWT_SECRET` to a random secret of at least 32 characters.
3. Install dependencies with `npm install`.
4. Start the frontend and backend in development with `npm run dev`.
5. Create a production build with `npm run build`, then serve the combined application with `npm start` and `NODE_ENV=production`.

The development frontend runs on Vite and proxies `/api` requests to the Express server at port 4000. In production, Express serves the built frontend and API from the same origin. Deploy the project as one Node.js service and configure its environment variables; no separate frontend deployment is needed.

## Features

- Sign up and sign in with a unique email address and password. Email addresses are not verified and no email is sent. Password recovery by email is not part of this app.
- Create a shared family space or join one using a private invite code. Share the code with family members so they can create their own sign-ins and join the same budget.
- Every family member can create accounts, record expenses and income, and see the same shared account balances and transactions.
- Review monthly spending by category, recent transactions, and the month-end balance of each account.
- See a family activity feed showing who created accounts, added transactions, or deleted transactions.

All family data endpoints require a signed-in user and restrict records to their shared household. Existing users and their budget records are assigned a private family space on their next sign-in.
