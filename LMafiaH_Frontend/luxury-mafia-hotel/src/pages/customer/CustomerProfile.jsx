import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '../../components/common/FormElements'
import { LoadingState } from '../../components/common/States'
import { userService } from '../../services/userService'

export default function CustomerProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, offers: true })

  useEffect(() => {
    userService.getProfile().then((data) => {
      setProfile(data)
      setLoading(false)
    })
  }, [])

  if (loading || !profile) return <LoadingState label="Loading your profile." />

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    await userService.updateProfile(profile)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-10">
      <div className="card-surface p-7">
        <p className="mb-6 font-display text-lg text-ivory">Profile Information</p>
        <div className="space-y-5">
          <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Input label="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        </div>
      </div>

      <div className="card-surface p-7">
        <p className="mb-6 font-display text-lg text-ivory">Password</p>
        <div className="space-y-5">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
        </div>
      </div>

      <div className="card-surface p-7">
        <p className="mb-6 font-display text-lg text-ivory">Notification Settings</p>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email notifications' },
            { key: 'sms', label: 'SMS alerts' },
            { key: 'offers', label: 'Private offers &amp; access' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between font-body text-sm text-ivory/70">
              {item.label.replace('&amp;', '&')}
              <input
                type="checkbox"
                checked={notifPrefs[item.key]}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                className="h-4 w-4 accent-[#C6A664]"
              />
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
      </button>
    </form>
  )
}
