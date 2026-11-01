import type { Activity } from '../types'
import { Icon } from './Icon'

export function ActivityList({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return (
      <div className='empty-panel'>
        <span className='empty-icon'>
          <Icon name='activity' size={22} />
        </span>
        <strong>No family activity yet</strong>
        <span>When someone adds an account or transaction, it will show up here.</span>
      </div>
    )
  }
  return (
    <div className='activity-list'>
      {activities.map((item) => (
        <div className='activity-row' key={item._id}>
          <span className='activity-avatar'>{item.user.email[0].toUpperCase()}</span>
          <div className='activity-copy'>
            <strong>{item.user.email}</strong>
            <span>{item.description}</span>
          </div>
          <time dateTime={item.createdAt}>
            {new Date(item.createdAt).toLocaleString('en-NG', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </time>
        </div>
      ))}
    </div>
  )
}
