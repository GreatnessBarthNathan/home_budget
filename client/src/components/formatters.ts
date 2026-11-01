export const categories = [
  'Housing',
  'Utilities',
  'Groceries',
  'Transport',
  'Dining',
  'Shopping',
  'Health',
  'Entertainment',
  'Other',
]
export const accountColors = ['#4c765f', '#cb8d62', '#7d86bd', '#d0a83f', '#bd7171']
export const localDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const currentMonthString = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
export const money = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(value)
export const monthLabel = (month: string) =>
  new Date(`${month}-02T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
