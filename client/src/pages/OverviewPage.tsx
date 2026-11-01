import type { Account, Activity, Household, HouseholdMember, Transaction } from '../types'
import { AccountCards } from '../components/AccountCards'
import { ActivityList } from '../components/ActivityList'
import { FamilyPanel } from '../components/FamilyPanel'
import { Icon } from '../components/Icon'
import { TransactionList } from '../components/TransactionList'
import { monthLabel, money } from '../components/formatters'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type OverviewPageProps = {
  accounts: Account[]
  activities: Activity[]
  busy: boolean
  categoryGradient: string
  categoryTotals: { category: string; amount: number }[]
  chartData: { day: number; balance: number }[]
  handleDelete: (id: string) => void
  household: Household | null
  month: string
  monthlyExpenses: number
  monthlyIncome: number
  members: HouseholdMember[]
  setActiveTab: (tab: 'overview' | 'transactions' | 'accounts' | 'activity') => void
  setModal: (modal: 'transaction' | 'account' | null) => void
  setNotice: (message: string) => void
  totalBalance: number
  topCategory: { category: string; amount: number } | undefined
  transactions: Transaction[]
}

export function OverviewPage({ accounts, activities, busy, categoryGradient, categoryTotals, chartData, handleDelete, household, month, monthlyExpenses, monthlyIncome, members, setActiveTab, setModal, setNotice, totalBalance, topCategory, transactions }: OverviewPageProps) {
  return (
    <div className='overview-page'>
              <section className='summary-grid'>
                <article className='summary-card balance-card'>
                  <div className='card-title'>
                    Total balance{' '}
                    <span className='card-icon green'>
                      <Icon name='wallet' size={18} />
                    </span>
                  </div>
                  <strong>{money(totalBalance)}</strong>
                  <small>
                    Across {accounts.length}{' '}
                    {accounts.length === 1 ? 'account' : 'accounts'}
                  </small>
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
                      <h2>Balance over time</h2>
                      <p>A running look at your household balance</p>
                    </div>
                    <span className='chart-period'>{monthLabel(month)}</span>
                  </div>
                  {chartData.length && transactions.length ? (
                    <div className='chart-wrap'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <AreaChart
                          data={chartData}
                          margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id='balanceFill'
                              x1='0'
                              y1='0'
                              x2='0'
                              y2='1'
                            >
                              <stop
                                offset='0%'
                                stopColor='#63836d'
                                stopOpacity={0.19}
                              />
                              <stop
                                offset='95%'
                                stopColor='#63836d'
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke='#eeeee9'
                            strokeDasharray='3 5'
                          />
                          <XAxis
                            dataKey='day'
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#999b92', fontSize: 11 }}
                            tickFormatter={(day) => `${day}`}
                            interval='preserveStartEnd'
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#999b92', fontSize: 11 }}
                            tickFormatter={(value: number) =>
                              value === 0
                                ? '₦0'
                                : `₦${Math.round(value / 1000)}k`
                            }
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              money(value),
                              'Balance',
                            ]}
                            labelFormatter={(day) =>
                              `${monthLabel(month).split(' ')[0]} ${day}`
                            }
                            contentStyle={{
                              border: '1px solid #eeeee9',
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                          />
                          <Area
                            type='monotone'
                            dataKey='balance'
                            stroke='#64846d'
                            strokeWidth={2.5}
                            fill='url(#balanceFill)'
                            activeDot={{
                              r: 4,
                              fill: '#64846d',
                              stroke: '#fff',
                              strokeWidth: 2,
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className='empty-chart'>
                      <span className='empty-icon'>
                        <Icon name='chart' size={22} />
                      </span>
                      <strong>Your balance will take shape here</strong>
                      <span>
                        Add an account and a few transactions to see your
                        monthly trend.
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
                <AccountCards accounts={accounts} transactions={transactions} />
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
