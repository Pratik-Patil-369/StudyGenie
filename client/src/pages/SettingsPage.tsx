import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'
import { User, Bell, Lock, Loader2 } from 'lucide-react'
import { apiPut } from '../utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
    const { user, fetchUser } = useAuth()

    const [name, setName] = useState(user?.full_name || '')
    const [email] = useState(user?.email || '')
    const [savingProfile, setSavingProfile] = useState(false)

    // @ts-ignore
    const [dailyReminders, setDailyReminders] = useState(user?.daily_reminders !== undefined ? user.daily_reminders : true)
    // @ts-ignore
    const [studyHours, setStudyHours] = useState(user?.study_hours || '2')
    const [savingPrefs, setSavingPrefs] = useState(false)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [savingPassword, setSavingPassword] = useState(false)

    const handleSaveProfile = async () => {
        try {
            setSavingProfile(true)
            await apiPut('/users/profile', { full_name: name })
            await fetchUser()
            toast('Profile updated successfully!', 'success')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to save profile', 'error')
        } finally {
            setSavingProfile(false)
        }
    }

    const handleSavePrefs = async () => {
        try {
            setSavingPrefs(true)
            await apiPut('/users/profile', { daily_reminders: dailyReminders, study_hours: studyHours })
            await fetchUser()
            toast('Preferences saved successfully!', 'success')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to save preferences', 'error')
        } finally {
            setSavingPrefs(false)
        }
    }

    const handleUpdatePassword = async (e: FormEvent) => {
        e.preventDefault()
        if (!currentPassword || !newPassword) { toast('Please fill in both password fields', 'error'); return }
        if (newPassword.length < 6) { toast('New password must be at least 6 characters', 'error'); return }
        try {
            setSavingPassword(true)
            await apiPut('/users/password', { current_password: currentPassword, new_password: newPassword })
            toast('Password updated successfully!', 'success')
            setCurrentPassword('')
            setNewPassword('')
        } catch (error: any) {
            toast(error.message || 'Failed to update password', 'error')
        } finally {
            setSavingPassword(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences and study configurations</p>
            </div>

            {/* Profile */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-5 w-5 text-blue-400" /> Profile Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input type="email" value={email} disabled title="Email cannot be changed" className="bg-muted/50" />
                    </div>
                    <Button variant="outline" onClick={handleSaveProfile} disabled={savingProfile}>
                        {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Update Profile'}
                    </Button>
                </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Bell className="h-5 w-5 text-primary" /> Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dailyReminders}
                            onChange={e => setDailyReminders(e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Receive daily study reminders via email</span>
                    </label>

                    <div className="space-y-2">
                        <Label>Preferred Study Hours (per day)</Label>
                        <select
                            value={studyHours}
                            onChange={e => setStudyHours(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="1">1 Hour (Light)</option>
                            <option value="2">2 Hours (Standard)</option>
                            <option value="3">3 Hours (Intensive)</option>
                            <option value="4+">4+ Hours (Immersive)</option>
                        </select>
                    </div>

                    <Button variant="outline" onClick={handleSavePrefs} disabled={savingPrefs}>
                        {savingPrefs ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save Preferences'}
                    </Button>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Lock className="h-5 w-5 text-violet-400" /> Security
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                        </div>
                        <Button type="submit" variant="outline" disabled={savingPassword}>
                            {savingPassword ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating...</> : 'Update Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
