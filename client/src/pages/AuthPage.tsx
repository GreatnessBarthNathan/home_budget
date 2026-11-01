import { useState } from 'react'
import type { User } from '../types'
import { api } from '../api'
import { Icon } from '../components/Icon'

export function AuthPage({
  onAuthenticated,
}: {
  onAuthenticated: (token: string, user: User) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [joining, setJoining] = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.authenticate(
        email,
        password,
        mode,
        mode === 'register'
          ? joining
            ? { inviteCode }
            : { householdName }
          : undefined,
      )
      onAuthenticated(result.token, result.user)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className='auth-page'>
      <div className='auth-art'>
        <div className='brand'>
          <span className='brand-mark'>
            <Icon name='home' size={19} />
          </span>{' '}
          home budget
        </div>
        <div className='art-copy'>
          <span className='eyebrow'>A LITTLE MORE CLARITY</span>
          <h1>
            A calmer way
            <br />
            to spend at home.
          </h1>
          <p>
            Know what’s coming in, where it’s going, and what’s left for the
            things that matter.
          </p>
          <div className='art-decoration'>
            <span>✳</span>
            <div>
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <small>your money, in balance</small>
          </div>
        </div>
        <div className='art-footer'>Made for the life you’re building.</div>
      </div>
      <div className='auth-form-wrap'>
        <form className='auth-form' onSubmit={submit}>
          <span className='eyebrow'>
            {mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}
          </span>
          <h2>
            {mode === 'login'
              ? 'Your home, in balance.'
              : 'Make yourself at home.'}
          </h2>
          <p>
            {mode === 'login'
              ? 'Sign in to pick up where you left off.'
              : 'Create an account to start organizing your household finances.'}
          </p>
          {mode === 'register' && (
            <div className='family-signup'>
              <div className='type-toggle'>
                <button
                  type='button'
                  className={!joining ? 'selected' : ''}
                  onClick={() => setJoining(false)}
                >
                  Create family
                </button>
                <button
                  type='button'
                  className={joining ? 'selected' : ''}
                  onClick={() => setJoining(true)}
                >
                  Join with code
                </button>
              </div>
              {joining ? (
                <label>
                  Family invite code
                  <input
                    required
                    value={inviteCode}
                    onChange={(event) =>
                      setInviteCode(event.target.value.toUpperCase())
                    }
                    placeholder='Paste the code shared by your family'
                  />
                </label>
              ) : (
                <label>
                  Family name
                  <input
                    required
                    maxLength={60}
                    value={householdName}
                    onChange={(event) => setHouseholdName(event.target.value)}
                    placeholder='e.g. The Adeyemi family'
                  />
                </label>
              )}
              <small>
                {joining
                  ? 'Ask a family member for their private invite code.'
                  : 'You can share an invite code with family members after signing up.'}
              </small>
            </div>
          )}
          {error && <div className='error-box'>{error}</div>}
          <label>
            Email address
            <input
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder='you@example.com'
            />
          </label>
          <label>
            Password
            <input
              type='password'
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder='At least 8 characters'
            />
          </label>
          <button
            className='button button-primary auth-submit'
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}{' '}
            <span>→</span>
          </button>
          <div className='auth-switch'>
            {mode === 'login'
              ? 'New to Home Budget?'
              : 'Already have an account?'}{' '}
            <button
              type='button'
              onClick={() => {
                setError('')
                setJoining(false)
                setMode(mode === 'login' ? 'register' : 'login')
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
          <small className='auth-note'>
            No email confirmation needed. Your email is only used to sign in.
          </small>
        </form>
      </div>
    </main>
  )
}
