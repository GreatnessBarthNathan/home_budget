import type { Activity } from '../types'
import { ActivityList } from '../components/ActivityList'

type ActivityPageProps = { activities: Activity[] }

export function ActivityPage({ activities }: ActivityPageProps) {
  return (
            <section className='panel full-panel'>
              <div className='panel-heading'>
                <div>
                  <h2>Family activity</h2>
                  <p>Accounts and transactions added by your family</p>
                </div>
              </div>
              <ActivityList activities={activities} />
            </section>
  )
}
