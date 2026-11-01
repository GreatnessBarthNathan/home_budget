import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, saveToken } from './api'
import type { Account, Activity, DashboardTab, Household, HouseholdMember, Transaction, User } from './types'
import { AccountModal } from './components/AccountModal'
import { Icon } from './components/Icon'
import { TransactionModal } from './components/TransactionModal'
import { categories, currentMonthString, monthLabel, money } from './components/formatters'
import { AccountsPage } from './pages/AccountsPage'
import { ActivityPage } from './pages/ActivityPage'
import { AuthPage } from './pages/AuthPage'
import { OverviewPage } from './pages/OverviewPage'
import { TransactionsPage } from './pages/TransactionsPage'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [month, setMonth] = useState(currentMonthString)
  const [activeTab, setActiveTab] = useState<
    DashboardTab
  >('overview')
  const [modal, setModal] = useState<'transaction' | 'account' | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const [accountResult, transactionResult, activityResult, householdResult] = await Promise.all([
      api.accounts(month),
      api.transactions(month),
      api.activity(month),
      api.household(),
    ])
    setAccounts(accountResult.accounts)
    setTransactions(transactionResult.transactions)
    setActivities(activityResult.activities)
    setHousehold(householdResult.household)
    setMembers(householdResult.members)
  }, [month])

  useEffect(() => {
    if (!getToken()) {
      setAuthReady(true)
      return
    }
    api
      .me()
      .then((result) => setUser(result.user))
      .catch(() => {
        saveToken(null)
        setUser(null)
      })
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    if (!user) return
    setBusy(true)
    refresh()
      .catch((error) =>
        setNotice(
          error instanceof Error
            ? error.message
            : 'Could not load your budget.',
        ),
      )
      .finally(() => setBusy(false))
  }, [user, refresh])

  const monthlyExpenses = transactions
    .filter((item) => item.kind === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)
  const monthlyIncome = transactions
    .filter((item) => item.kind === 'income')
    .reduce((sum, item) => sum + item.amount, 0)
  const totalBalance = accounts.reduce((sum, account) => {
    const net = transactions
      .filter((item) => item.account === account._id)
      .reduce(
        (total, item) =>
          total + (item.kind === 'income' ? item.amount : -item.amount),
        0,
      )
    return sum + (account.monthEndBalance ?? account.openingBalance + net)
  }, 0)
  const categoryTotals = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          amount: transactions
            .filter(
              (item) => item.kind === 'expense' && item.category === category,
            )
            .reduce((sum, item) => sum + item.amount, 0),
        }))
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [transactions],
  )
  const chartData = useMemo(() => {
    const year = Number(month.slice(0, 4))
    const monthIndex = Number(month.slice(5, 7)) - 1
    const days = new Date(year, monthIndex + 1, 0).getDate()
    let running = accounts.reduce((sum, account) => {
      const monthNet = transactions
        .filter((item) => item.account === account._id)
        .reduce(
          (total, item) =>
            total + (item.kind === 'income' ? item.amount : -item.amount),
          0,
        )
      return (
        sum +
        (account.monthEndBalance ?? account.openingBalance + monthNet) -
        monthNet
      )
    }, 0)
    const byDay = new Map<number, number>()
    transactions.forEach((item) => {
      const day = Number(item.date.slice(0, 10).slice(-2))
      byDay.set(
        day,
        (byDay.get(day) ?? 0) +
          (item.kind === 'income' ? item.amount : -item.amount),
      )
    })
    return Array.from({ length: days }, (_, index) => {
      running += byDay.get(index + 1) ?? 0
      return { day: index + 1, balance: running }
    })
  }, [accounts, transactions, month])
  const filteredTransactions = transactions.filter((item) =>
    `${item.description} ${item.category} ${accounts.find((account) => account._id === item.account)?.name ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const topCategory = categoryTotals[0]
  const categoryPalette = [
    '#4c765f',
    '#d2a080',
    '#8f97c3',
    '#d5bd79',
    '#c27979',
  ]
  let categoryOffset = 0
  const categoryGradient = categoryTotals
    .slice(0, 5)
    .map((item, index) => {
      const start = categoryOffset
      categoryOffset += monthlyExpenses
        ? (item.amount / monthlyExpenses) * 100
        : 0
      return `${categoryPalette[index]} ${start}% ${categoryOffset}%`
    })
    .join(', ')

  async function handleAddTransaction(payload: Omit<Transaction, '_id'>) {
    const result = await api.addTransaction(payload)
    setModal(null)
    setNotice('Transaction added.')
    window.setTimeout(() => setNotice(''), 3000)
    setTransactions((current) => [
      {
        ...result.transaction,
        user: { _id: user!.id, email: user!.email },
      },
      ...current.filter((item) => item._id !== result.transaction._id),
    ].filter((item) => item.date.slice(0, 7) === month))
    try {
      const accountResult = await api.accounts(month)
      setAccounts(accountResult.accounts)
    } catch (error) {
      setNotice(
        error instanceof Error
          ? `Transaction saved, but account balances could not be refreshed: ${error.message}`
          : 'Transaction saved, but account balances could not be refreshed.',
      )
    }

  }
  async function handleAddAccount(
    payload: Pick<Account, 'name' | 'type' | 'openingBalance' | 'color'>,
  ) {
    await api.addAccount(payload)
    await refresh()
    setModal(null)
    setNotice('Account added.')
    window.setTimeout(() => setNotice(''), 3000)
  }
  async function handleDelete(id: string) {
    try {
      await api.deleteTransaction(id)
      await refresh()
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'Could not delete transaction.',
      )
    }
  }
  function signOut() {
    saveToken(null)
    setUser(null)
    setAccounts([])
    setTransactions([])
    setActivities([])
    setHousehold(null)
    setMembers([])
  }

  if (!authReady)
    return (
      <div className='loading-screen'>
        <span className='brand-mark'>
          <Icon name='home' />
        </span>
      </div>
    )
  if (!user)
    return (
      <AuthPage
        onAuthenticated={(token, authenticatedUser) => {
          saveToken(token)
          setUser(authenticatedUser)
        }}
      />
    )

  return (
    <div className='app-shell'>
      <aside className='sidebar'>
        <a
          className='brand sidebar-brand'
          href='#'
          onClick={(event) => {
            event.preventDefault()
            setActiveTab('overview')
          }}
        >
          <span className='brand-mark'>
            <Icon name='home' size={19} />
          </span>
          <span>
            home budget<small>HOUSEHOLD FINANCES</small>
          </span>
        </a>
        <div className='nav-label'>YOUR SPACE</div>
        <nav className='side-nav'>
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            <Icon name='home' /> Overview
          </button>
          <button
            className={activeTab === 'transactions' ? 'active' : ''}
            onClick={() => setActiveTab('transactions')}
          >
            <Icon name='receipt' /> Transactions
          </button>
          <button
            className={activeTab === 'accounts' ? 'active' : ''}
            onClick={() => setActiveTab('accounts')}
          >
            <Icon name='wallet' /> Accounts
          </button>
          <button
            className={activeTab === 'activity' ? 'active' : ''}
            onClick={() => setActiveTab('activity')}
          >
            <Icon name='activity' /> Family activity
          </button>
        </nav>
        <div className='sidebar-bottom'>
          <div className='sidebar-tip'>
            <span>✳</span>
            <p>A little awareness goes a long way.</p>
            <small>You’re doing great by keeping track.</small>
          </div>
          <button className='profile' onClick={signOut}>
            <span className='avatar'>
              {user.email.slice(0, 1).toUpperCase()}
            </span>
            <span className='profile-info'>
              {user.email}
              <small>{household?.name ?? 'Family account'}</small>
            </span>
            <Icon name='logout' size={17} />
          </button>
        </div>
      </aside>
      <nav className='mobile-nav' aria-label='Main navigation'>
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          aria-current={activeTab === 'overview' ? 'page' : undefined}
          onClick={() => setActiveTab('overview')}
        >
          <Icon name='home' size={19} />
          <span>Overview</span>
        </button>
        <button
          className={activeTab === 'transactions' ? 'active' : ''}
          aria-current={activeTab === 'transactions' ? 'page' : undefined}
          onClick={() => setActiveTab('transactions')}
        >
          <Icon name='receipt' size={19} />
          <span>Transactions</span>
        </button>
        <button
          className={activeTab === 'accounts' ? 'active' : ''}
          aria-current={activeTab === 'accounts' ? 'page' : undefined}
          onClick={() => setActiveTab('accounts')}
        >
          <Icon name='wallet' size={19} />
          <span>Accounts</span>
        </button>
        <button
          className={activeTab === 'activity' ? 'active' : ''}
          aria-current={activeTab === 'activity' ? 'page' : undefined}
          onClick={() => setActiveTab('activity')}
        >
          <Icon name='activity' size={19} />
          <span>Activity</span>
        </button>
      </nav>
      <main className='main-content'>
        <header className='topbar'>
          <div className='mobile-brand'>
            <span className='brand-mark'>
              <Icon name='home' size={18} />
            </span>{' '}
            home budget
          </div>
          <div className='breadcrumb'>
            <span>Your household</span>
            <span className='crumb-slash'>/</span>
            <strong>
              {activeTab === 'overview'
                ? 'Overview'
                : activeTab === 'transactions'
                  ? 'Transactions'
                  : activeTab === 'accounts'
                    ? 'Accounts'
                    : 'Family activity'}
            </strong>
          </div>
          <div className='topbar-right'>
            <button
              className='month-picker'
              onClick={() =>
                (
                  document.getElementById(
                    'month-select',
                  ) as HTMLInputElement | null
                )?.showPicker()
              }
            >
              <Icon name='calendar' size={17} />
              <span>{monthLabel(month)}</span>
              <Icon name='down' size={15} />
              <input
                id='month-select'
                aria-label='Select month'
                type='month'
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </button>
            <button
              className='avatar top-avatar'
              aria-label='Sign out'
              title='Sign out'
              onClick={signOut}
            >
              {user.email.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <div className='page-wrap'>
          {notice && (
            <div className='notice' role='status'>
              {notice}
              <button onClick={() => setNotice('')}>×</button>
            </div>
          )}
          <section className='page-heading'>
            <div>
              <span className='eyebrow'>
                {monthLabel(month).toUpperCase()} · YOUR MONEY AT A GLANCE
              </span>
              <h1>
                {activeTab === 'overview'
                  ? 'Good to see you.'
                  : activeTab === 'transactions'
                    ? 'Your transactions.'
                    : activeTab === 'accounts'
                      ? 'Your accounts.'
                      : 'Everyone’s contributions.'}
              </h1>
              <p>
                {activeTab === 'overview'
                  ? 'Here’s how things are looking around home.'
                  : activeTab === 'transactions'
                    ? 'Every little thing, all in one place.'
                    : activeTab === 'accounts'
                      ? 'Keep an eye on where your money lives.'
                      : 'See what your family has been up to.'}
              </p>
            </div>
            <button
              className='button button-primary'
              onClick={() => setModal('transaction')}
            >
              <Icon name='plus' size={18} /> Add transaction
            </button>
          </section>
          {activeTab === 'overview' && (
            <OverviewPage
              accounts={accounts}
              activities={activities}
              busy={busy}
              categoryGradient={categoryGradient}
              categoryTotals={categoryTotals}
              chartData={chartData}
              handleDelete={handleDelete}
              household={household}
              month={month}
              monthlyExpenses={monthlyExpenses}
              monthlyIncome={monthlyIncome}
              members={members}
              setActiveTab={setActiveTab}
              setModal={setModal}
              setNotice={setNotice}
              totalBalance={totalBalance}
              topCategory={topCategory}
              transactions={transactions}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsPage
              transactions={transactions}
              filteredTransactions={filteredTransactions}
              accounts={accounts}
              busy={busy}
              handleDelete={handleDelete}
              search={search}
              setSearch={setSearch}
            />
          )}
          {activeTab === 'activity' && <ActivityPage activities={activities} />}
          {activeTab === 'accounts' && (
            <AccountsPage
              accounts={accounts}
              month={month}
              setModal={setModal}
              totalBalance={totalBalance}
              transactions={transactions}
            />
          )}
          <footer className='page-footer'>
            <span>Taking care of the little things adds up.</span>
            <span>HOME BUDGET · YOUR HOME, IN BALANCE</span>
          </footer>
        </div>
      </main>
      {modal === 'transaction' && (
        <TransactionModal
          accounts={accounts}
          month={month}
          onClose={() => setModal(null)}
          onSave={handleAddTransaction}
        />
      )}
      {modal === 'account' && (
        <AccountModal
          onClose={() => setModal(null)}
          onSave={handleAddAccount}
        />
      )}
    </div>
  )
}

export default App
