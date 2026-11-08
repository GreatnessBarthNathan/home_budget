import type { Account, Activity, Household, HouseholdMember, Transaction } from '../types'
import { AccountCards } from '../components/AccountCards'
import { ActivityList } from '../components/ActivityList'
import { FamilyPanel } from '../components/FamilyPanel'
import { Icon } from '../components/Icon'
import { TransactionList } from '../components/TransactionList'
import { money } from '../components/formatters'

type OverviewPageProps = {
  accounts: Account[]
  activities: Activity[]
  busy: boolean
  categoryGradient: string
  categoryTotals: { category: string; amount: number }[]
  handleDelete: (id: string) => void
  household: Household | null
  monthlyExpenses: number
  monthlyIncome: number
  members: HouseholdMember[]
  setActiveTab: (tab: 'overview' | 'transactions' | 'accounts' | 'activity') => void
  setModal: (modal: 'transaction' | 'account' | null) => void
  setNotice: (message: string) => void
  topCategory: { category: string; amount: number } | undefined
  transactions: Transaction[]
  onAccountClick: (account: Account) => void
}

export function OverviewPage({ accounts, activities, busy, categoryGradient, categoryTotals, handleDelete, household, monthlyExpenses, monthlyIncome, members, setActiveTab, setModal, setNotice, topCategory, transactions, onAccountClick }: OverviewPageProps) {
  return (
    <div className='overview-page'>
              <section className='summary-grid'>
                <article className='summary-card balance-card'>
                  <div className='card-title'>
                    Accounts{' '}
                    <span className='card-icon green'>
                      <Icon name='wallet' size={18} />
                    </span>
                  </div>
                  <strong>{accounts.length}</strong>
                  <small>Each account has its own balance</small>
                  <div className='balance-accent'>
                    <span />
                    <span />
                    <span />
                  </div>
                </article>
                <article className='summary-card'>
                  <div className='card-title'>
                    Spent this month{' '}
                    <span className='card-icon peach'>
                      <Icon name='arrow' size={17} />
                    </span>
                  </div>
                  <strong>{money(monthlyExpenses)}</strong>
                  <small>
                    <span className='muted'>
                      across {categoryTotals.length}{' '}
                      {categoryTotals.length === 1 ? 'category' : 'categories'}
                    </span>
                  </small>
                </article>
                <article className='summary-card'>
                  <div className='card-title'>
                    Money in{' '}
                    <span className='card-icon lilac'>
                      <Icon name='arrow' size={17} />
                    </span>
                  </div>
                  <strong>{money(monthlyIncome)}</strong>
                  <small>
                    <span className='muted'>income recorded this month</span>
                  </small>
                  <div className='summary-foot'>
                    <span className='foot-dot' /> Keep it up
                  </div>
                </article>
              </section>
              {household && (
                <FamilyPanel
                  household={household}
                  members={members}
                  onNotice={setNotice}
                />
              )}
              <section className='dashboard-grid'>
                <article className='panel trend-panel'>
                  <div className='panel-heading'>
                    <div>
                      <h2>Balance by account</h2>
                      <p>Each account is shown separately</p>
                    </div>
                  </div>
                  {accounts.length ? (
                    <div className='account-balance-list'>
                      {accounts.map((account) => {
                        const activity = transactions.filter(
                          (transaction) => transaction.account === account._id,
                        )
                        const net = activity.reduce(
                          (sum, transaction) =>
                            sum +
                            (transaction.kind === 'income'
                              ? transaction.amount
                              : -transaction.amount),
                          0,
                        )
                        return (
                          <button
                            className='account-balance-row'
                            key={account._id}
                            onClick={() => onAccountClick(account)}
                          >
                            <span
                              className='account-symbol'
                              style={{
                                color: account.color,
                                backgroundColor: `${account.color}19`,
                              }}
                            >
                              <Icon name='wallet' size={16} />
                            </span>
                            <span className='account-balance-name'>
                              <strong>{account.name}</strong>
                              <small>{account.type}</small>
                            </span>
                            <strong>
                              {money(account.monthEndBalance ?? account.openingBalance + net)}
                            </strong>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className='empty-chart'>
                      <span className='empty-icon'>
                        <Icon name='wallet' size={22} />
                      </span>
                      <strong>Your account balances will appear here</strong>
                      <span>
                        Add an account to see its balance.
                      </span>
                    </div>
                  )}
                </article>
                <article className='panel spending-panel'>
                  <div className='panel-heading'>
                    <div>
                      <h2>Where it goes</h2>
                      <p>Your spending by category</p>
                    </div>
                    <span className='panel-more'>
                      <Icon name='arrow' size={16} />
                    </span>
                  </div>
                  {categoryTotals.length ? (
                    <>
                      <div className='category-feature'>
                        <div
                          className='category-ring'
                          style={{
                            background: `conic-gradient(${categoryGradient})`,
                          }}
                        >
                          <div>
                            <small>TOP CATEGORY</small>
                            <strong>
                              {topCategory?.category ?? categoryTotals[0]?.category}
                            </strong>
                          </div>
                        </div>
                        <div className='category-total'>
                          <strong>{money(monthlyExpenses)}</strong>
                          <small>total spent</small>
                        </div>
                      </div>
                      <div className='category-list'>
                        {categoryTotals.slice(0, 5).map((item, index) => (
                          <div className='category-row' key={item.category}>
                            <span
                              className={`category-dot tone-${index % 5}`}
                            />{' '}
                            <span>{item.category}</span>
                            <strong>{money(item.amount)}</strong>
                            <small>
                              {monthlyExpenses
                                ? Math.round(
                                    (item.amount / monthlyExpenses) * 100,
                                  )
                                : 0}
                              %
                            </small>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className='empty-panel'>
                      <span className='empty-icon'>
                        <Icon name='chart' size={22} />
                      </span>
                      <strong>No spending just yet</strong>
                      <span>Your spending breakdown will appear here.</span>
                    </div>
                  )}
                </article>
              </section>
              <section className='panel transactions-panel'>
                <div className='panel-heading'>
                  <div>
                    <h2>Recent transactions</h2>
                    <p>The latest coming and going</p>
                  </div>
                  <button
                    className='text-button'
                    onClick={() => setActiveTab('transactions')}
                  >
                    See all <span>→</span>
                  </button>
                </div>
                <TransactionList
                  transactions={transactions.slice(0, 5)}
                  accounts={accounts}
                  onDelete={handleDelete}
                  busy={busy}
                />
              </section>
              <section className='panel transactions-panel overview-activity-preview'>
                <div className='panel-heading'>
                  <div>
                    <h2>Family activity</h2>
                    <p>Who’s been doing what around the household</p>
                  </div>
                  <button
                    className='text-button'
                    onClick={() => setActiveTab('activity')}
                  >
                    See all <span>→</span>
                  </button>
                </div>
                <ActivityList activities={activities.slice(0, 5)} />
              </section>
              <section className='account-strip overview-account-preview'>
                <div className='strip-heading'>
                  <div>
                    <h2>Your accounts</h2>
                    <p>Month-end balances, all together</p>
                  </div>
                  <button
                    className='text-button'
                    onClick={() => setActiveTab('accounts')}
                  >
                    All accounts <span>→</span>
                  </button>
                </div>
                <AccountCards
                  accounts={accounts}
                  transactions={transactions}
                  onAccountClick={onAccountClick}
                />
                <button
                  className='add-account-link'
                  onClick={() => setModal('account')}
                >
                  <Icon name='plus' size={16} /> Add another account
                </button>
              </section>
    </div>
  )
}
