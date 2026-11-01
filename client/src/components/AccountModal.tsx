import { useState } from 'react'
import type { Account } from '../types'
import { Icon } from './Icon'
import { accountColors } from './formatters'

export function AccountModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (
    value: Pick<Account, 'name' | 'type' | 'openingBalance' | 'color'>,
  ) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<Account['type']>('Checking')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [color, setColor] = useState(accountColors[0])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        name,
        type,
        openingBalance: Number(openingBalance),
        color,
      })
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not add this account.',
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
      <form className='modal compact-modal' onSubmit={submit}>
        <div className='modal-heading'>
          <div>
            <span className='eyebrow'>YOUR MONEY, ORGANIZED</span>
            <h2>Add an account</h2>
          </div>
          <button className='modal-close' type='button' onClick={onClose}>
            <Icon name='close' />
          </button>
        </div>
        {error && <div className='error-box'>{error}</div>}
        <label>
          Account name
          <input
            required
            maxLength={50}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='e.g. Everyday checking'
            autoFocus
          />
        </label>
        <label>
          Account type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as Account['type'])}
          >
            {['Checking', 'Savings', 'Credit card', 'Cash', 'Other'].map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
        <label>
          Starting balance
          <input
            required
            type='number'
            step='0.01'
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
            placeholder='0.00'
          />
        </label>
        <div className='color-field'>
          <span>Pick a color</span>
          <div>
            {accountColors.map((value) => (
              <button
                key={value}
                type='button'
                aria-label={`Select ${value} account color`}
                aria-pressed={color === value}
                className={color === value ? 'chosen' : ''}
                style={{ background: value }}
                onClick={() => setColor(value)}
              />
            ))}
          </div>
        </div>
        <div className='modal-actions'>
          <button
            type='button'
            className='button button-secondary'
            onClick={onClose}
          >
            Cancel
          </button>
          <button className='button button-primary' disabled={saving}>
            {saving ? 'Saving…' : 'Save account'}
          </button>
        </div>
      </form>
    </div>
  )
}
