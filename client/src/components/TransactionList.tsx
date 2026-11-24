import type { Account, Transaction } from '../types'
import { Icon } from './Icon'
import { money } from './formatters'

export function TransactionList({
  transactions,
  accounts,
  onEdit,
  busy,
}: {
  transactions: Transaction[]
  accounts: Account[]
  onEdit: (transaction: Transaction) => void
  busy: boolean
}) {
  if (busy)
    return (
      <div className='empty-panel'>
        <strong>Loading your transactions…</strong>
      </div>
    )
  if (!transactions.length)
    return (
      <div className='empty-panel'>
        <span className='empty-icon'>
          <Icon name='receipt' size={22} />
        </span>
        <strong>No transactions this month</strong>
        <span>Add your first expense or income to get started.</span>
      </div>
    )
  return (
    <div className='transaction-list'>
      {transactions.map((item) => {
        const account = accounts.find((value) => value._id === item.account)
        const actor =
          typeof item.user === 'object' ? item.user.email : undefined
        return (
          <div className='transaction-row' key={item._id}>
            <span className={`transaction-icon ${item.kind}`}>
              <Icon
                name={item.kind === 'income' ? 'arrow' : 'receipt'}
                size={18}
              />
            </span>
            <span className='transaction-main'>
              <strong>{item.description}</strong>
              <small>
                {item.category} <span>·</span> {account?.name ?? 'Account'}
                {actor && (
                  <>
                    <span>·</span> by {actor}
                  </>
                )}
              </small>
            </span>
            <span className='transaction-date'>
              {new Date(
                `${item.date.slice(0, 10)}T12:00:00`,
              ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <strong className={`transaction-amount ${item.kind}`}>
              {item.kind === 'income' ? '+' : '−'}
              {money(item.amount)}
            </strong>
            <span className='transaction-actions'>
              <button
                className='edit-transaction'
                aria-label={`Edit ${item.description}`}
                title='Edit transaction'
                onClick={() => onEdit(item)}
              >
                <Icon name='edit' size={15} />
              </button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
