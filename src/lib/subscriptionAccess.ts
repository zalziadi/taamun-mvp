// Using native Date methods instead of date-fns

// Feature types that can be access-checked
export type Feature = 
  | 'day_steps_1_3' 
  | 'day_steps_4_5' 
  | 'guide' 
  | 'journey' 
  | 'book' 
  | 'tasbeeh' 
  | 'journal';

// Access check result
export interface AccessResult {
  allowed: boolean;
  reason?: string;
  paywallType?: 'trial_active_locked' | 'trial_ended' | 'guide_limit_reached';
}

// Profile type (matches your existing structure)
interface Profile {
  id: string;
  email: string;
  subscription_tier: 'trial' | 'quarterly' | 'annual' | 'vip' | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  is_admin: boolean;
}

// Check if user is in active trial period
export function isTrialActive(profile: Profile): boolean {
  if (profile.subscription_tier !== 'trial') return false;
  if (!profile.subscription_start_date) return false;
  
  const trialDays = getTrialDaysUsed(profile);
  return trialDays <= 7;
}

// Check if trial has expired
export function isTrialExpired(profile: Profile): boolean {
  if (profile.subscription_tier !== 'trial') return false;
  if (!profile.subscription_start_date) return false;
  
  const trialDays = getTrialDaysUsed(profile);
  return trialDays > 7;
}

// Get number of days since trial started
export function getTrialDaysUsed(profile: Profile): number {
  if (!profile.subscription_start_date) return 0;
  
  // Parse the date and get start of day
  const startDate = new Date(profile.subscription_start_date);
  startDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include first day
  
  return Math.max(1, days); // Always at least 1 day
}

// Main access control function
export function checkAccess(feature: Feature, profile: Profile | null): AccessResult {
  // No profile = no access
  if (!profile) {
    return { 
      allowed: false, 
      reason: 'يرجى تسجيل الدخول للوصول',
      paywallType: 'trial_ended'
    };
  }

  // Admins bypass all checks
  if (profile.is_admin) {
    return { allowed: true };
  }

  // Paid subscribers (quarterly, annual, vip) get full access
  const paidTiers = ['quarterly', 'annual', 'vip'];
  if (profile.subscription_tier && paidTiers.includes(profile.subscription_tier)) {
    return { allowed: true };
  }

  // Handle trial users
  if (profile.subscription_tier === 'trial') {
    const trialActive = isTrialActive(profile);
    const trialExpired = isTrialExpired(profile);

    // Trial expired = only verse allowed
    if (trialExpired) {
      if (feature === 'day_steps_1_3') {
        // Only allow verse viewing (step 2) after trial
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'انتهت تجربتك المجانية',
        paywallType: 'trial_ended'
      };
    }

    // Active trial access matrix
    switch (feature) {
      case 'day_steps_1_3':
        return { allowed: true };
        
      case 'day_steps_4_5':
        return {
          allowed: false,
          reason: 'الخطوات المتقدمة للمشتركين فقط',
          paywallType: 'trial_active_locked'
        };
        
      case 'guide':
        // Guide has special daily limit logic (handled in guide component)
        return { allowed: true };
        
      case 'journey':
        return {
          allowed: false,
          reason: 'الرحلة الكاملة تنتظرك… ٢٨ يوماً من التحوّل',
          paywallType: 'trial_active_locked'
        };
        
      case 'book':
        return {
          allowed: false,
          reason: 'الكتاب هو الأساس الذي بُنيت عليه رحلتك',
          paywallType: 'trial_active_locked'
        };
        
      case 'tasbeeh':
        return {
          allowed: false,
          reason: 'مسبحة الأسماء الحسنى تُفتح مع اشتراكك',
          paywallType: 'trial_active_locked'
        };
        
      case 'journal':
        return {
          allowed: false,
          reason: 'دفترك الشخصي ينتظر أول تأمل',
          paywallType: 'trial_active_locked'
        };
        
      default:
        return {
          allowed: false,
          paywallType: 'trial_active_locked'
        };
    }
  }

  // No subscription = no access
  return {
    allowed: false,
    reason: 'يرجى الاشتراك للوصول',
    paywallType: 'trial_ended'
  };
}

// Helper to check guide daily limit
export function checkGuideLimit(profile: Profile): { withinLimit: boolean; count: number } {
  if (!profile || profile.subscription_tier !== 'trial') {
    return { withinLimit: true, count: 0 };
  }

  const today = new Date().toISOString().split('T')[0];
  const key = `taamun.guide.daily.${today}`;
  const count = parseInt(localStorage.getItem(key) || '0', 10);
  
  return {
    withinLimit: count < 5,
    count
  };
}

// Helper to increment guide usage
export function incrementGuideUsage(): void {
  const today = new Date().toISOString().split('T')[0];
  const key = `taamun.guide.daily.${today}`;
  const current = parseInt(localStorage.getItem(key) || '0', 10);
  localStorage.setItem(key, String(current + 1));
}

// Helper to determine subscription status
export function getSubscriptionStatus(profile: Profile | null): 
  'none' | 'trial_active' | 'trial_expired' | 'paid' | 'admin' {
  
  if (!profile) return 'none';
  if (profile.is_admin) return 'admin';
  
  const paidTiers = ['quarterly', 'annual', 'vip'];
  if (profile.subscription_tier && paidTiers.includes(profile.subscription_tier)) {
    return 'paid';
  }
  
  if (profile.subscription_tier === 'trial') {
    return isTrialActive(profile) ? 'trial_active' : 'trial_expired';
  }
  
  return 'none';
}