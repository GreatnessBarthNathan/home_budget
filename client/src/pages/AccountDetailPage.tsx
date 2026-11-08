import type { Account, Transaction } from '../types'
import { Icon } from '../components/Icon'
import { TransactionList } from '../components/TransactionList'
import { money } from '../components/formatters'

type AccountDetailPageProps = {
  account: Account
  accounts: Account[]
  transactions: Transaction[]
  busy: boolean
  onBack: () => void
  onDelete: (id: string) => void
}

export function AccountDetailPage({
  account,
  accounts,
  transactions,
  busy,
  onBack,
  onDelete,
}: AccountDetailPageProps) {
  const accountTransactions = transactions.filter(
    (transaction) => transaction.account === account._id,
  )
  const income = accountTransactions
    .filter((transaction) => transaction.kind === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const expenses = accountTransactions
    .filter((transaction) => transaction.kind === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const balance =
    account.monthEndBalance ?? account.openingBalance + income - expenses
  const spendingByCategory = accountTransactions
    .filter((transaction) => transaction.kind === 'expense')
    .reduce<Record<string, number>>((totals, transaction) => {
      totals[transaction.category] =
        (totals[transaction.category] ?? 0) + transaction.amount
      return totals
    }, {})
  const categoryTotals = Object.entries(spendingByCategory).sort(
    (first, second) => second[1] - first[1],
  )
  const highestCategory = categoryTotals[0]

  return (
    <section className='account-detail-page'>
      <button className='text-button account-back' onClick={onBack}>
        <span>←</span> All accounts
      </button>
      <section className='account-detail-overview'>
        <div className='account-detail-name'>
          <span
            className='account-symbol'
            style={{
              color: account.color,
              backgroundColor: `${account.color}19`,
            }}
          >
            <Icon name='wallet' size={20} />
          </span>
          <div>
            <span className='eyebrow'>{account.type.toUpperCase()} ACCOUNT</span>
            <h2>{account.name}</h2>
          </div>
        </div>
        <div className='account-detail-balance'>
          <span className='eyebrow'>BALANCE</span>
          <strong>{money(balance)}</strong>
        </div>
      </section>

      <section className='account-detail-stats' aria-label='Account statistics'>
        <article className='summary-card'>
          <div className='card-title'>Money in</div>
          <strong className='positive'>{money(income)}</strong>
          <small>Income recorded this month</small>
        </article>
        <article className='summary-card'>
          <div className='card-title'>Money out</div>
          <strong>{money(expenses)}</strong>
          <small>Spending recorded this month</small>
        </article>
        <article className='summary-card'>
          <div className='card-title'>Highest spending</div>
          <strong className='account-high-category'>
            {highestCategory?.[0] ?? '—'}
          </strong>
          <small>
            {highestCategory
              ? `${money(highestCategory[1])} spent`
              : 'No spending recorded this month'}
          </small>
        </article>
      </section>

      <section className='panel account-spending-panel'>
        <div className='panel-heading'>
          <div>
            <h2>Spending by category</h2>
            <p>Where this account’s money went this month</p>
          </div>
          {highestCategory && (
            <span className='account-category-highlight'>
              Top: {highestCategory[0]}
            </span>
          )}
        </div>
        {categoryTotals.length ? (
          <div className='account-category-list'>
            {categoryTotals.map(([category, amount], index) => (
              <div className='account-category-row' key={category}>
                <span className={`category-dot tone-${index % 5}`} />
                <span>{category}</span>
                <span className='account-category-bar'>
                  <span
                    style={{
                      width: `${(amount / (categoryTotals[0]?.[1] ?? amount)) * 100}%`,
                    }}
                  />
                </span>
                <strong>{money(amount)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className='empty-panel'>
            <strong>No spending just yet</strong>
            <span>Account spending will appear here.</span>
          </div>
        )}
      </section>

      <section className='panel full-panel account-transactions-panel'>
        <div className='panel-heading'>
          <div>
            <h2>Account activity</h2>
            <p>{accountTransactions.length} transactions this month</p>
          </div>
        </div>
        <TransactionList
          transactions={accountTransactions}
          accounts={accounts}
          onDelete={onDelete}
          busy={busy}
        />
      </section>
    </section>
  )
}
