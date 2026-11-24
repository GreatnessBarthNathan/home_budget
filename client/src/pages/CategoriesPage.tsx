import { useState } from 'react'
import type { Category } from '../types'

type CategoriesPageProps = {
  categories: Category[]
  showCreateForm: boolean
  onShowCreateForm: (show: boolean) => void
  onCreate: (name: string) => Promise<void>
  onUpdate: (id: string, name: string) => Promise<void>
  onDelete: (category: Category) => Promise<void>
}

export function CategoriesPage({
  categories,
  showCreateForm,
  onShowCreateForm,
  onCreate,
  onUpdate,
  onDelete,
}: CategoriesPageProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function createCategory(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onCreate(newName)
      setNewName('')
      onShowCreateForm(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create this category.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCategory(event: React.FormEvent, category: Category) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onUpdate(category._id, editingName)
      setEditingId(null)
      setEditingName('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this category.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Delete “${category.name}”? Existing transactions will keep their recorded category name.`)) return
    setDeletingId(category._id)
    setError('')
    try {
      await onDelete(category)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not delete this category.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className='categories-page'>
      {error && <div className='error-box' role='alert'>{error}</div>}
      {showCreateForm && (
        <form className='panel category-create' onSubmit={createCategory}>
          <label htmlFor='new-category-name'>New category</label>
          <div className='category-create-controls'>
            <input
              id='new-category-name'
              required
              maxLength={30}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder='e.g. Pet care'
              autoFocus
            />
            <button className='button button-primary' disabled={saving}>
              {saving ? 'Saving…' : 'Create category'}
            </button>
            <button
              className='button button-secondary'
              type='button'
              onClick={() => {
                onShowCreateForm(false)
                setError('')
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      <section className='panel full-panel category-panel'>
        <div className='panel-heading'>
          <div>
            <h2>Your categories</h2>
            <p>{categories.length} available for organizing transactions</p>
          </div>
        </div>
        <div className='category-management-list'>
          {categories.map((category) => (
            <div className='managed-category' key={category._id}>
              {editingId === category._id ? (
                <form className='managed-category-edit' onSubmit={(event) => saveCategory(event, category)}>
                  <input
                    required
                    maxLength={30}
                    aria-label={`Rename ${category.name}`}
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    autoFocus
                  />
                  <button className='text-button' disabled={saving}>Save</button>
                  <button
                    className='text-button muted-action'
                    type='button'
                    onClick={() => {
                      setEditingId(null)
                      setError('')
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className='category-dot' />
                  <strong>{category.name}</strong>
                  <span className='category-kind'>
                    {category.isIncome ? 'Required' : category.isDefault ? 'Built-in' : 'Custom'}
                  </span>
                  {!category.isIncome && (
                    <div className='managed-category-actions'>
                      <button
                        className='text-button'
                        onClick={() => {
                          setEditingId(category._id)
                          setEditingName(category.name)
                          setError('')
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className='text-button category-delete'
                        disabled={deletingId === category._id}
                        onClick={() => deleteCategory(category)}
                      >
                        {deletingId === category._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <p className='category-help'>
          Renaming a category also updates existing transactions. Income is required by the app and can’t be changed.
        </p>
      </section>
    </section>
  )
}
