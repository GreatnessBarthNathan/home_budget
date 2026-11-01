import type { Household, HouseholdMember } from '../types'
import { Icon } from './Icon'

export function FamilyPanel({
  household,
  members,
  onNotice,
}: {
  household: Household
  members: HouseholdMember[]
  onNotice: (message: string) => void
}) {
  async function copyInviteCode() {
    try {
      await navigator.clipboard.writeText(household.inviteCode)
      onNotice('Family invite code copied.')
      window.setTimeout(() => onNotice(''), 3000)
    } catch {
      onNotice('Copy is unavailable here. Select and copy the invite code manually.')
    }
  }
  return (
    <section className='family-panel'>
      <div className='family-panel-main'>
        <span className='family-panel-icon'>
          <Icon name='home' size={19} />
        </span>
        <div>
          <span className='eyebrow'>YOUR SHARED FAMILY SPACE</span>
          <h2>{household.name}</h2>
          <p>
            {members.length} {members.length === 1 ? 'member' : 'members'} ·
            everyone sees the same accounts and transactions
          </p>
          <div className='family-members'>
            {members.map((member) => (
              <span className='member-chip' key={member.id}>
                <span className='member-avatar'>{member.email[0].toUpperCase()}</span>
                {member.email}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className='invite-box'>
        <span>INVITE FAMILY</span>
        <strong>{household.inviteCode}</strong>
        <button className='button button-secondary' onClick={copyInviteCode}>
          Copy code
        </button>
      </div>
    </section>
  )
}
