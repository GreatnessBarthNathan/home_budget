import { useEffect, useState } from 'react'
import type { Account, Transaction } from '../types'
import { Icon } from './Icon'
import { localDateString } from './formatters'

export function TransactionModal({
  accounts,
  categories,
  month,
  transaction,
  onClose,
  onSave,
  onUpdate,
}: {
  accounts: Account[]
  categories: string[]
  month: string
  transaction?: Transaction
  onClose: () => void
  onSave: (value: Omit<Transaction, '_id'>) => Promise<void>
  onUpdate: (id: string, value: Omit<Transaction, '_id'>) => Promise<void>
}) {
  const [kind, setKind] = useState<'expense' | 'income'>(transaction?.kind ?? 'expense')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [category, setCategory] = useState(transaction?.category ?? 'Groceries')
  const [account, setAccount] = useState(transaction?.account ?? accounts[0]?._id ?? '')
  const [date, setDate] = useState(() => {
    if (transaction) return transaction.date.slice(0, 10)
    const today = localDateString(new Date())
    return today.slice(0, 7) === month ? today : `${month}-01`
  })
  const [note, setNote] = useState(transaction?.note ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const unavailableCategory =
    transaction && !categories.includes(transaction.category)
      ? [transaction.category]
      : []
  const categoryOptions = transaction
    ? transaction.kind === 'income'
      ? [...unavailableCategory, ...categories, 'Income']
      : [...unavailableCategory, ...categories]
    : kind === 'income'
      ? ['Income']
      : categories
  useEffect(() => {
    if (categoryOptions.length && !categoryOptions.includes(category)) {
      setCategory(categoryOptions[0])
    }
  }, [categoryOptions, category])
  useEffect(() => {
    if (!account && accounts.length) setAccount(accounts[0]._id)
  }, [account, accounts])
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!account) {
      setError('Add an account before recording a transaction.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        kind,
        description,
        amount: Number(amount),
        category: !transaction && kind === 'income' ? 'Income' : category,
        account,
        date,
        note,
      }
      if (transaction) await onUpdate(transaction._id, payload)
      else await onSave(payload)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not save this transaction.',
      )
    } finally {
      setSaving(false)
    }
  }
  return (
    <div
      className='modal-backdrop'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className='modal' onSubmit={submit}>
        <div className='modal-heading'>
          <div>
            <span className='eyebrow'>KEEPING TRACK</span>
            <h2>{transaction ? 'Edit transaction' : 'Add a transaction'}</h2>
          </div>
          <button className='modal-close' type='button' onClick={onClose}>
            <Icon name='close' />
          </button>
        </div>
        {error && <div className='error-box'>{error}</div>}
        {!transaction && (
          <div className='type-toggle'>
            <button
              type='button'
              className={kind === 'expense' ? 'selected' : ''}
              onClick={() => setKind('expense')}
            >
              Expense
            </button>
            <button
              type='button'
              className={kind === 'income' ? 'selected' : ''}
              onClick={() => setKind('income')}
            >
              Income
            </button>
          </div>
        )}
        <label>
          Description
          <input
            required
            maxLength={100}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder='e.g. Weekly groceries'
            autoFocus
          />
        </label>
        <div className='form-row'>
          <label>
            Amount
            <input
              required
              type='number'
              min='0.01'
              step='0.01'
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder='0.00'
            />
          </label>
          <label>
            Date
            <input
              required
              type='date'
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
        <div className='form-row'>
          <label>
            Category
            <select
              value={category}
              disabled={!transaction && kind === 'income'}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categoryOptions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Paid from
            <select
              required
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            >
              <option value='' disabled>
                Select account
              </option>
              {accounts.map((value) => (
                <option key={value._id} value={value._id}>
                  {value.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Note <span className='optional'>(optional)</span>
          <input
            maxLength={200}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder='Add a little context'
          />
        </label>
        <div className='modal-actions'>
          <button
            type='button'
            className='button button-secondary'
            onClick={onClose}
          >
            Cancel
          </button>
          <button className='button button-primary' disabled={saving}>
            {saving ? 'Saving…' : transaction ? 'Save changes' : 'Save transaction'}
          </button>
        </div>
      </form>
    </div>
  )
}
