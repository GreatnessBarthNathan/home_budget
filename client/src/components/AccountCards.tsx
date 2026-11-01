import type { Account, Transaction } from '../types'
import { Icon } from './Icon'
import { money } from './formatters'

export function AccountCards({
  accounts,
  transactions,
  expanded = false,
}: {
  accounts: Account[]
  transactions: Transaction[]
  expanded?: boolean
}) {
  if (!accounts.length)
    return (
      <div className='no-accounts'>
        <span className='empty-icon'>
          <Icon name='wallet' size={22} />
        </span>
        <div>
          <strong>Your accounts start here</strong>
          <p>
            Add a checking, savings, or cash account to see your household
            balance.
          </p>
        </div>
      </div>
    )
  return (
    <div className={`account-grid ${expanded ? 'expanded' : ''}`}>
      {accounts.map((account) => {
        const net = transactions
          .filter((item) => item.account === account._id)
          .reduce(
            (sum, item) =>
              sum + (item.kind === 'income' ? item.amount : -item.amount),
            0,
          )
        return (
          <article className='account-card' key={account._id}>
            <div className='account-card-top'>
              <span
                className='account-symbol'
                style={{
                  color: account.color,
                  backgroundColor: `${account.color}19`,
                }}
              >
                <Icon name='wallet' size={18} />
              </span>
              <span className='account-type'>{account.type}</span>
              <span className='account-menu-dot'>•••</span>
            </div>
            <strong>
              {money(account.monthEndBalance ?? account.openingBalance + net)}
            </strong>
            <span className='account-name'>{account.name}</span>
            <div className='account-card-bottom'>
              <span>
                {expanded ? 'Balance at month end' : 'Month-end balance'}
              </span>
              <span className={net > 0 ? 'positive' : ''}>
                {net >= 0 ? '+' : '−'}
                {money(Math.abs(net))} this month
              </span>
            </div>
          </article>
        )
      })}
    </div>
  )
}
