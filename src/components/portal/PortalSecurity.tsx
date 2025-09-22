import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lock, Shield, Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PortalSecurityProps {
  isOpen: boolean;
  onAuthenticated: (customer: any) => void;
  onClose: () => void;
  customers: any[];
}

interface SecuritySettings {
  enablePinCode: boolean;
  enablePassword: boolean;
  enableEmailOnly: boolean;
  pinCodeLength: number;
  maxAttempts: number;
  lockoutDuration: number; // in minutes
}

export const PortalSecurity = ({ isOpen, onAuthenticated, onClose, customers }: PortalSecurityProps) => {
  const [securityMethod, setSecurityMethod] = useState<'email' | 'pin' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutEnd, setLockoutEnd] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Default security settings - these would normally come from app settings
  const [securitySettings] = useState<SecuritySettings>({
    enablePinCode: true,
    enablePassword: true,
    enableEmailOnly: true,
    pinCodeLength: 4,
    maxAttempts: 3,
    lockoutDuration: 15
  });

  // Check lockout status
  useEffect(() => {
    const checkLockout = () => {
      if (lockoutEnd && new Date() < lockoutEnd) {
        const remaining = Math.ceil((lockoutEnd.getTime() - new Date().getTime()) / 1000);
        setTimeRemaining(remaining);
        setIsLocked(true);
      } else {
        setIsLocked(false);
        setTimeRemaining(0);
        setAttempts(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  const handleFailedAttempt = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= securitySettings.maxAttempts) {
      const lockEnd = new Date();
      lockEnd.setMinutes(lockEnd.getMinutes() + securitySettings.lockoutDuration);
      setLockoutEnd(lockEnd);
      setIsLocked(true);
      toast.error(`Too many failed attempts. Portal locked for ${securitySettings.lockoutDuration} minutes.`);
    } else {
      toast.error(`Invalid credentials. ${securitySettings.maxAttempts - newAttempts} attempts remaining.`);
    }
  };

  const handleEmailLogin = () => {
    if (isLocked) return;

    const customer = customers.find(c => 
      c.email.toLowerCase() === email.toLowerCase() && c.allowLogin
    );
    
    if (!customer) {
      handleFailedAttempt();
      return;
    }

    onAuthenticated(customer);
    resetForm();
  };

  const handlePinLogin = () => {
    if (isLocked) return;

    // Check if PIN matches any customer's PIN
    const customer = customers.find(c => 
      c.portalPin === pinCode && c.allowLogin
    );
    
    if (!customer) {
      handleFailedAttempt();
      return;
    }

    onAuthenticated(customer);
    resetForm();
  };

  const handlePasswordLogin = () => {
    if (isLocked) return;

    // Check if password matches any customer's portal password
    const customer = customers.find(c => 
      c.portalPassword === password && c.allowLogin
    );
    
    if (!customer) {
      handleFailedAttempt();
      return;
    }

    onAuthenticated(customer);
    resetForm();
  };

  const resetForm = () => {
    setEmail('');
    setPinCode('');
    setPassword('');
    setAttempts(0);
    setShowPassword(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Secure Portal Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose your preferred authentication method
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Method Selection */}
          <div className="flex flex-wrap gap-2 justify-center">
            {securitySettings.enableEmailOnly && (
              <Button
                variant={securityMethod === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSecurityMethod('email')}
                disabled={isLocked}
              >
                <Key className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
            {securitySettings.enablePinCode && (
              <Button
                variant={securityMethod === 'pin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSecurityMethod('pin')}
                disabled={isLocked}
              >
                <Lock className="w-4 h-4 mr-2" />
                PIN Code
              </Button>
            )}
            {securitySettings.enablePassword && (
              <Button
                variant={securityMethod === 'password' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSecurityMethod('password')}
                disabled={isLocked}
              >
                <Shield className="w-4 h-4 mr-2" />
                Password
              </Button>
            )}
          </div>

          {/* Lockout Alert */}
          {isLocked && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Portal is locked due to multiple failed attempts. 
                Time remaining: {formatTime(timeRemaining)}
              </AlertDescription>
            </Alert>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && !isLocked && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {securitySettings.maxAttempts - attempts} attempts remaining before lockout
              </AlertDescription>
            </Alert>
          )}

          {/* Email Login */}
          {securityMethod === 'email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLocked}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
                />
              </div>
              <Button 
                onClick={handleEmailLogin} 
                className="w-full"
                disabled={isLocked || !email.trim()}
              >
                Access Portal
              </Button>
            </div>
          )}

          {/* PIN Code Login */}
          {securityMethod === 'pin' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">
                  {securitySettings.pinCodeLength}-Digit PIN Code
                </Label>
                <Input
                  id="pin"
                  type="password"
                  value={pinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= securitySettings.pinCodeLength) {
                      setPinCode(value);
                    }
                  }}
                  placeholder="••••"
                  maxLength={securitySettings.pinCodeLength}
                  disabled={isLocked}
                  className="text-center text-lg tracking-widest"
                  onKeyPress={(e) => e.key === 'Enter' && handlePinLogin()}
                />
              </div>
              <Button 
                onClick={handlePinLogin} 
                className="w-full"
                disabled={isLocked || pinCode.length !== securitySettings.pinCodeLength}
              >
                Access Portal
              </Button>
            </div>
          )}

          {/* Password Login */}
          {securityMethod === 'password' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Portal Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your portal password"
                    disabled={isLocked}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordLogin()}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handlePasswordLogin} 
                className="w-full"
                disabled={isLocked || !password.trim()}
              >
                Access Portal
              </Button>
            </div>
          )}

          {/* Security Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Secure Access
              </Badge>
              <Badge variant="outline" className="text-xs">
                Max {securitySettings.maxAttempts} Attempts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Only customers with portal access enabled can log in
            </p>
          </div>

          {/* Cancel Button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};