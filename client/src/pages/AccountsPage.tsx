import type { Account, Transaction } from '../types'
import { AccountCards } from '../components/AccountCards'
import { Icon } from '../components/Icon'
import { monthLabel } from '../components/formatters'

type AccountsPageProps = {
  accounts: Account[]
  month: string
  setModal: (modal: 'transaction' | 'account' | null) => void
  transactions: Transaction[]
  onAccountClick: (account: Account) => void
}

export function AccountsPage({ accounts, month, setModal, transactions, onAccountClick }: AccountsPageProps) {
  return (
            <section className='account-page'>
              <div className='account-overview'>
                <div>
                  <span className='eyebrow'>YOUR ACCOUNTS</span>
                  <h2>{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</h2>
                  <p>
                    Each balance is shown separately for {monthLabel(month)}.
                  </p>
                </div>
                <button
                  className='button button-secondary'
                  onClick={() => setModal('account')}
                >
                  <Icon name='plus' size={17} /> Add account
                </button>
              </div>
              <AccountCards
                accounts={accounts}
                transactions={transactions}
                expanded
                onAccountClick={onAccountClick}
              />
              <div className='accounts-note'>
                <span>✳</span>
                <span>
                  Balances include each account’s opening balance and all income
                  and spending recorded this month.
                </span>
              </div>
            </section>
  )
}
