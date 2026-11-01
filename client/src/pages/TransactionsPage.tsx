import type { Account, Transaction } from '../types'
import { Icon } from '../components/Icon'
import { TransactionList } from '../components/TransactionList'

type TransactionsPageProps = {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  accounts: Account[]
  busy: boolean
  handleDelete: (id: string) => void
  search: string
  setSearch: (value: string) => void
}

export function TransactionsPage({ transactions, filteredTransactions, accounts, busy, handleDelete, search, setSearch }: TransactionsPageProps) {
  return (
            <section className='panel full-panel'>
              <div className='panel-heading'>
                <div>
                  <h2>All transactions</h2>
                  <p>{transactions.length} recorded this month</p>
                </div>
                <label className='search-field'>
                  <Icon name='search' size={17} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder='Search transactions'
                  />
                </label>
              </div>
              <TransactionList
                transactions={filteredTransactions}
                accounts={accounts}
                onDelete={handleDelete}
                busy={busy}
              />
            </section>
  )
}
