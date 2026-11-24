import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, saveToken } from './api'
import type { Account, Activity, Category, DashboardTab, Household, HouseholdMember, Transaction, User } from './types'
import { AccountModal } from './components/AccountModal'
import { Icon } from './components/Icon'
import { TransactionModal } from './components/TransactionModal'
import { currentMonthString, monthLabel, money } from './components/formatters'
import { AccountsPage } from './pages/AccountsPage'
import { ActivityPage } from './pages/ActivityPage'
import { AuthPage } from './pages/AuthPage'
import { OverviewPage } from './pages/OverviewPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountDetailPage } from './pages/AccountDetailPage'
import { CategoriesPage } from './pages/CategoriesPage'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [month, setMonth] = useState(currentMonthString)
  const [activeTab, setActiveTab] = useState<
    DashboardTab
  >('overview')
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [modal, setModal] = useState<'transaction' | 'account' | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    const [accountResult, transactionResult, activityResult, householdResult, categoryResult] = await Promise.all([
      api.accounts(month),
      api.transactions(month),
      api.activity(month),
      api.household(),
      api.categories(),
    ])
    setAccounts(accountResult.accounts)
    setTransactions(transactionResult.transactions)
    setActivities(activityResult.activities)
    setHousehold(householdResult.household)
    setMembers(householdResult.members)
    setCategoryList(categoryResult.categories)
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
  const categoryTotals = useMemo(
    () =>
      categoryList
        .filter((category) => !category.isIncome)
        .map((category) => ({
          category: category.name,
          amount: transactions
            .filter(
              (item) => item.kind === 'expense' && item.category === category.name,
            )
            .reduce((sum, item) => sum + item.amount, 0),
        }))
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [transactions, categoryList],
  )
  const filteredTransactions = transactions.filter((item) =>
    `${item.description} ${item.category} ${accounts.find((account) => account._id === item.account)?.name ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  const topCategory = categoryTotals[0]
  const selectedAccount = accounts.find(
    (account) => account._id === selectedAccountId,
  )
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
    setEditingTransaction(null)
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
  async function handleUpdateTransaction(id: string, payload: Omit<Transaction, '_id'>) {
    const result = await api.updateTransaction(id, payload)
    setModal(null)
    setEditingTransaction(null)
    setNotice('Transaction updated.')
    window.setTimeout(() => setNotice(''), 3000)
    setTransactions((current) => {
      const previous = current.find((item) => item._id === id)
      const updated = { ...result.transaction, user: previous?.user ?? result.transaction.user }
      return [
        ...current.filter((item) => item._id !== id),
        ...(updated.date.slice(0, 7) === month ? [updated] : []),
      ].sort((first, second) => second.date.localeCompare(first.date))
    })
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
  function handleEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction)
    setModal('transaction')
  }
  function closeTransactionModal() {
    setModal(null)
    setEditingTransaction(null)
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
  async function handleCreateCategory(name: string) {
    const result = await api.addCategory(name)
    setCategoryList((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)))
    setNotice('Category created.')
    window.setTimeout(() => setNotice(''), 3000)
  }
  async function handleUpdateCategory(id: string, name: string) {
    const result = await api.updateCategory(id, name)
    setCategoryList((current) =>
      current.map((category) => category._id === id ? result.category : category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    )
    setNotice('Category updated.')
    window.setTimeout(() => setNotice(''), 3000)
  }
  async function handleDeleteCategory(category: Category) {
    await api.deleteCategory(category._id)
    setCategoryList((current) => current.filter((value) => value._id !== category._id))
    setNotice('Category deleted.')
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
    setCategoryList([])
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
            onClick={() => {
              setSelectedAccountId(null)
              setActiveTab('accounts')
            }}
          >
            <Icon name='wallet' /> Accounts
          </button>
          <button
            className={activeTab === 'activity' ? 'active' : ''}
            onClick={() => setActiveTab('activity')}
          >
            <Icon name='activity' /> Family activity
          </button>
          <button
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => setActiveTab('categories')}
          >
            <Icon name='tag' /> Categories
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
          onClick={() => {
            setSelectedAccountId(null)
            setActiveTab('accounts')
          }}
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
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          aria-current={activeTab === 'categories' ? 'page' : undefined}
          onClick={() => setActiveTab('categories')}
        >
          <Icon name='tag' size={19} />
          <span>Categories</span>
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
                    ? selectedAccount?.name ?? 'Accounts'
                    : activeTab === 'activity'
                      ? 'Family activity'
                      : 'Categories'}
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
                      ? selectedAccount
                        ? `${selectedAccount.name}.`
                        : 'Your accounts.'
                      : activeTab === 'activity'
                        ? 'Everyone’s contributions.'
                        : 'Your categories.'}
              </h1>
              <p>
                {activeTab === 'overview'
                  ? 'Here’s how things are looking around home.'
                  : activeTab === 'transactions'
                    ? 'Every little thing, all in one place.'
                    : activeTab === 'accounts'
                      ? selectedAccount
                        ? 'See what’s coming in, going out, and where you’re spending.'
                        : 'Keep an eye on where your money lives.'
                      : activeTab === 'activity'
                        ? 'See what your family has been up to.'
                        : 'Organize your spending with categories that work for your household.'}
              </p>
            </div>
            <button
              className='button button-primary'
              onClick={() => activeTab === 'categories' ? setShowCategoryForm(true) : setModal('transaction')}
            >
              <Icon name='plus' size={18} /> {activeTab === 'categories' ? 'Add category' : 'Add transaction'}
            </button>
          </section>
          {activeTab === 'overview' && (
            <OverviewPage
              accounts={accounts}
              activities={activities}
              busy={busy}
              categoryGradient={categoryGradient}
              categoryTotals={categoryTotals}
              handleDelete={handleDelete}
              handleEdit={handleEditTransaction}
              household={household}
              monthlyExpenses={monthlyExpenses}
              monthlyIncome={monthlyIncome}
              members={members}
              setActiveTab={setActiveTab}
              setModal={setModal}
              setNotice={setNotice}
              topCategory={topCategory}
              transactions={transactions}
              onAccountClick={(account) => {
                setSelectedAccountId(account._id)
                setActiveTab('accounts')
              }}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsPage
              transactions={transactions}
              filteredTransactions={filteredTransactions}
              accounts={accounts}
              busy={busy}
              handleDelete={handleDelete}
              handleEdit={handleEditTransaction}
              search={search}
              setSearch={setSearch}
            />
          )}
          {activeTab === 'activity' && <ActivityPage activities={activities} />}
          {activeTab === 'accounts' && (
            selectedAccount ? (
              <AccountDetailPage
                account={selectedAccount}
                accounts={accounts}
                transactions={transactions}
                busy={busy}
                onBack={() => setSelectedAccountId(null)}
                onDelete={handleDelete}
                onEdit={handleEditTransaction}
              />
            ) : (
              <AccountsPage
                accounts={accounts}
                month={month}
                setModal={setModal}
                transactions={transactions}
                onAccountClick={(account) => setSelectedAccountId(account._id)}
              />
            )
          )}
          {activeTab === 'categories' && (
            <CategoriesPage
              categories={categoryList}
              showCreateForm={showCategoryForm}
              onShowCreateForm={setShowCategoryForm}
              onCreate={handleCreateCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
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
          key={editingTransaction?._id ?? 'new'}
          accounts={accounts}
          categories={categoryList.filter((category) => !category.isIncome).map((category) => category.name)}
          month={month}
          transaction={editingTransaction ?? undefined}
          onClose={closeTransactionModal}
          onSave={handleAddTransaction}
          onUpdate={handleUpdateTransaction}
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
