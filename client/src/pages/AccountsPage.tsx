import type { Account, Transaction } from '../types'
import { AccountCards } from '../components/AccountCards'
import { Icon } from '../components/Icon'
import { monthLabel, money } from '../components/formatters'

type AccountsPageProps = {
  accounts: Account[]
  month: string
  setModal: (modal: 'transaction' | 'account' | null) => void
  totalBalance: number
  transactions: Transaction[]
}

export function AccountsPage({ accounts, month, setModal, totalBalance, transactions }: AccountsPageProps) {
  return (
            <section className='account-page'>
              <div className='account-overview'>
                <div>
                  <span className='eyebrow'>END-OF-MONTH BALANCES</span>
                  <h2>{money(totalBalance)}</h2>
                  <p>
                    Across your {accounts.length}{' '}
                    {accounts.length === 1 ? 'account' : 'accounts'} in{' '}
                    {monthLabel(month)}
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
