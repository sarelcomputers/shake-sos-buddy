import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/alfa22-logo.png';
import { getDeviceId, isDeviceRegistered, registerDevice } from '@/utils/deviceRegistration';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Check if this is a password reset redirect
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsResettingPassword(true);
      setIsForgotPassword(false);
      setIsLogin(false);
    }
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      if (!email) {
        toast.error('Please enter your email');
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) throw error;
        toast.success('Password reset link sent to your email!');
        setIsForgotPassword(false);
        setEmail('');
      } catch (error: any) {
        console.error('Password reset error:', error);
        toast.error(error.message || 'Failed to send reset email');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isResettingPassword) {
      if (!newPassword) {
        toast.error('Please enter a new password');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;
        toast.success('Password updated successfully!');
        setIsResettingPassword(false);
        setIsLogin(true);
        setNewPassword('');
        navigate('/');
      } catch (error: any) {
        console.error('Password update error:', error);
        toast.error(error.message || 'Failed to update password');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success('Logged in successfully!');
        navigate('/');
      } else {
        // Check device registration before signup
        const deviceId = await getDeviceId();
        const deviceAlreadyRegistered = await isDeviceRegistered(deviceId);
        
        if (deviceAlreadyRegistered) {
          toast.error('This device has already been used to create an account. Multiple accounts per device are not allowed.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        
        // Register the device after successful signup
        if (data.user) {
          await registerDevice(data.user.id, deviceId);
        }
        
        toast.success('Account created successfully!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Alfa22 Security" className="h-24 w-auto" />
          </div>
          <CardTitle className="text-2xl text-center">
            {isResettingPassword 
              ? 'Reset Password' 
              : isForgotPassword 
              ? 'Forgot Password' 
              : isLogin 
              ? 'Welcome Back' 
              : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center">
            {isResettingPassword 
              ? 'Enter your new password' 
              : isForgotPassword 
              ? 'Enter your email to receive a password reset link' 
              : isLogin 
              ? 'Sign in to your emergency alert account' 
              : 'Sign up to secure your emergency contacts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isResettingPassword ? (
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      minLength={6}
                      required
                    />
                  </div>
                )}
              </>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResettingPassword 
                ? 'Update Password' 
                : isForgotPassword 
                ? 'Send Reset Link' 
                : isLogin 
                ? 'Sign In' 
                : 'Sign Up'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            {!isResettingPassword && !isForgotPassword && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setIsLogin(false);
                  }}
                  className="text-primary hover:underline block w-full"
                  disabled={loading}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                  disabled={loading}
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </>
            )}
            {(isForgotPassword || isResettingPassword) && (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsResettingPassword(false);
                  setIsLogin(true);
                }}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Back to sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
