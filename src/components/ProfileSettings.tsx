import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, Shield, Moon, Sun, CreditCard, Crown, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const ProfileSettings = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || email === user?.email) {
      toast.error('Please enter a new email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) throw error;

      toast.success('Email update requested! Please check your new email to confirm.');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast.error(error.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPermissions = () => {
    localStorage.removeItem('permissions_setup_complete');
    toast.success('Permissions reset! Please reload the app to re-run setup.');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Profile Settings</h3>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 space-y-6">
          {/* Current Account Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">Account Information</Label>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Email</p>
              <p className="font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-2">
                User ID: {user?.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Update Email */}
          <form onSubmit={handleUpdateEmail} className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              <Label htmlFor="email" className="text-base font-semibold">
                Update Email Address
              </Label>
            </div>
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="new@email.com"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                You'll need to verify your new email address before it takes effect
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || email === user?.email}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Email
                </>
              )}
            </Button>
          </form>

          {/* Update Password */}
          <form onSubmit={handleUpdatePassword} className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">Change Password</Label>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm">
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  minLength={6}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </form>

          {/* Admin Dashboard */}
          {isAdmin && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <Label className="text-base font-semibold">Admin</Label>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/admin')}
              >
                <Crown className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </div>
          )}

          {/* Subscription Management */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">Subscription</Label>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/subscription')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscription & Billing
            </Button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <Label className="text-base font-semibold">Appearance</Label>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </div>

          {/* Reset Permissions */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">App Permissions</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Re-run the permissions setup to grant or update access to location, SMS, motion sensors, and battery optimization.
            </p>
            <Button
              onClick={handleResetPermissions}
              variant="outline"
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Re-run Permissions Setup
            </Button>
          </div>

          {/* Legal Links */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">Legal</Label>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate('/terms')}
              >
                Terms of Service
              </Button>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                signOut();
                toast.success('Logged out successfully');
                navigate('/auth');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
