import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, SubscriptionType } from '../types';
import { dbService, PREMIUM_PLANS } from '../services/dbService';
import PremiumBadge from './PremiumBadge';

interface SubscriptionPageProps {
  user: User | null;
  onSubscriptionUpdate: (updatedUser: User) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const CheckIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);

const BENEFITS = [
  { icon: '🚀', title: 'Early Access to New Releases', desc: 'Get first-look access to new titles before the general public.' },
  { icon: '💰', title: 'Exclusive Discounts (10–20%)', desc: 'Save on every purchase with member-only pricing across all categories.' },
  { icon: '🤖', title: 'Personalised AI Recommendations', desc: 'Enhanced Lumina AI that learns your taste with deeper insights.' },
  { icon: '📚', title: 'Premium-Only Books', desc: 'Unlock rare editions, collector books, and premium annotated titles.' },
  { icon: '⚡', title: 'Priority Support', desc: 'Jump the queue with dedicated premium reader support.' },
  { icon: '🎁', title: 'Monthly Surprise Picks', desc: 'Curated monthly book drops chosen just for premium members.' },
];

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onSubscriptionUpdate, showToast }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'success'>('idle');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isPremium = user?.isPremium && user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate) > new Date()
    : false;

  const expiryDate = user?.subscriptionEndDate
    ? new Date(user.subscriptionEndDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : null;

  const daysRemaining = user?.subscriptionEndDate
    ? Math.max(0, Math.ceil((new Date(user.subscriptionEndDate).getTime() - Date.now()) / 86400000))
    : 0;

  const handleActivate = async () => {
    if (!user) { navigate('/login'); return; }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Simulate payment gateway delay (~1.5s)
      await new Promise(res => setTimeout(res, 1500));

      const premiumData = await dbService.subscribe(user.id, selectedPlan);
      const updatedUser: User = { ...user, ...premiumData };

      onSubscriptionUpdate(updatedUser);
      setPaymentStep('success');
      showToast(`🎉 Welcome to Premium! Your ${PREMIUM_PLANS[selectedPlan].label} plan is now active.`, 'success');
    } catch (err: any) {
      setPaymentStep('idle');
      showToast(err.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setIsCancelling(true);
    try {
      await dbService.cancelSubscription(user.id);
      const updatedUser: User = {
        ...user,
        isPremium: false,
        subscriptionType: undefined,
        subscriptionStartDate: undefined,
        subscriptionEndDate: undefined,
      };
      onSubscriptionUpdate(updatedUser);
      showToast('Your premium subscription has been cancelled.', 'success');
      setShowCancelConfirm(false);
    } catch (err: any) {
      showToast(err.message || 'Could not cancel. Please try again.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Success State ─────────────────────────────────────────────
  if (paymentStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center px-4 animate-in zoom-in duration-500">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d, #d97706)', boxShadow: '0 0 40px rgba(251,191,36,0.5)' }}
        >
          <svg className="w-14 h-14 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-4xl serif font-bold text-indigo-950 dark:text-indigo-100 mb-3">You're Premium!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-lg">Your <strong className="text-indigo-700">{PREMIUM_PLANS[selectedPlan].label}</strong> plan is now active.</p>
        <p className="text-gray-400 text-sm mb-10">
          Enjoy all premium benefits until <strong>{new Date(Date.now() + PREMIUM_PLANS[selectedPlan].durationDays * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl"
        >
          Explore Premium Library →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-700 mb-10 transition-colors uppercase tracking-wider"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 mb-4">
          <PremiumBadge size="lg" animate={false} />
        </div>
        <h1 className="text-5xl serif font-bold text-indigo-950 dark:text-indigo-100 mb-4">
          {isPremium ? 'Your Premium Membership' : 'Upgrade to Premium'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          {isPremium
            ? 'Manage your subscription and enjoy all the benefits of LuminaBooks Premium.'
            : 'Unlock the full LuminaBooks experience — exclusive titles, AI-powered picks, and more.'}
        </p>
      </div>

      {/* ── ACTIVE PREMIUM DASHBOARD ───────────────────────────── */}
      {isPremium ? (
        <div className="space-y-8">
          {/* Status Card */}
          <div
            className="rounded-3xl p-8 text-indigo-950 dark:text-white bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:via-indigo-900 dark:to-indigo-850 border border-indigo-200/50 dark:border-transparent shadow-xl dark:shadow-none relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-15 dark:opacity-10 select-none">
              <svg viewBox="0 0 600 300" className="w-full h-full" fill="none">
                {[...Array(5)].map((_, i) => (
                  <circle key={i} cx={120 * i} cy="150" r={60 + i * 25} stroke="currentColor" strokeWidth="0.5" className="text-indigo-300 dark:text-white" />
                ))}
              </svg>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <PremiumBadge size="lg" animate={false} />
                  <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                    Active
                  </span>
                </div>
                <h2 className="text-3xl font-bold mb-1 capitalize">{user?.subscriptionType} Plan</h2>
                <p className="text-indigo-650 dark:text-indigo-300 text-sm">
                  Member since {user?.subscriptionStartDate
                    ? new Date(user.subscriptionStartDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>

              <div className="bg-white/60 dark:bg-gray-900/10 backdrop-blur-sm rounded-2xl p-5 border border-indigo-200/50 dark:border-white/10 text-center min-w-[140px]">
                <p className="text-4xl font-black text-indigo-950 dark:text-white">{daysRemaining}</p>
                <p className="text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mt-1">Days Left</p>
                <p className="text-indigo-500 dark:text-indigo-400 text-[10px] mt-1">Renews {expiryDate}</p>
              </div>
            </div>
          </div>

          {/* Benefits grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(b => (
              <div key={b.title} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-100 mb-1">{b.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Cancel subscription */}
          {!showCancelConfirm ? (
            <div className="text-center pt-4">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-xs text-gray-400 hover:text-red-500 font-bold transition-colors underline underline-offset-2"
              >
                Cancel Subscription
              </button>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 text-center max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
              <p className="font-bold text-red-700 dark:text-red-300 mb-2">Cancel your premium plan?</p>
              <p className="text-red-500 dark:text-red-400 text-sm mb-6">You'll lose access to premium content immediately.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800"
                >
                  Keep Premium
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all flex items-center gap-2"
                >
                  {isCancelling
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── UPGRADE FLOW ─────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Left: Plan selection + CTA */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl font-bold text-indigo-950 dark:text-indigo-100 mb-2">Choose Your Plan</h2>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly */}
              <button
                id="plan-monthly"
                onClick={() => setSelectedPlan('monthly')}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  selectedPlan === 'monthly'
                    ? 'border-indigo-600 bg-gray-100 dark:bg-indigo-950/20 shadow-lg shadow-gray-200 dark:shadow-none'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                }`}
              >
                {selectedPlan === 'monthly' && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Monthly</p>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-black text-indigo-950 dark:text-indigo-100">₹199</span>
                  <span className="text-gray-400 dark:text-gray-500 text-sm mb-1">/month</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Billed monthly. Cancel anytime.</p>
              </button>

              {/* Yearly — recommended */}
              <button
                id="plan-yearly"
                onClick={() => setSelectedPlan('yearly')}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  selectedPlan === 'yearly'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 shadow-lg shadow-amber-100 dark:shadow-none'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-amber-300 dark:hover:border-amber-500/50'
                }`}
              >
                {/* Best Value badge */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full text-amber-900"
                  style={{ background: 'linear-gradient(90deg, #f59e0b, #fcd34d)' }}
                >
                  Best Value — Save 37%
                </div>

                {selectedPlan === 'yearly' && (
                  <div
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Yearly</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-indigo-950 dark:text-indigo-100">₹1,499</span>
                  <span className="text-gray-400 text-sm mb-1">/year</span>
                </div>
                <p className="text-xs text-pink-600 font-bold mb-1">You save ₹889!</p>
                <p className="text-xs text-gray-400">≈ ₹125/month · Best for avid readers</p>
              </button>
            </div>

            {/* Dummy Payment Form */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-100 mb-1 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Secure Payment
              </h3>
              <p className="text-[10px] text-gray-400 mb-4 uppercase tracking-widest font-bold">Demo mode — no real charge</p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Card Number</label>
                  <input
                    type="text"
                    defaultValue="4242 4242 4242 4242"
                    readOnly
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Expiry</label>
                    <input type="text" defaultValue="12/29" readOnly className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">CVC</label>
                    <input type="text" defaultValue="•••" readOnly className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 outline-none" />
                  </div>
                </div>
              </div>

              {/* Processing animation */}
              {isProcessing && (
                <div className="mt-5 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200">
                  <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-bold">Processing payment securely…</p>
                </div>
              )}
            </div>

            {/* CTA Button */}
            {!user ? (
              <Link
                to="/login"
                className="block w-full text-center py-5 rounded-2xl font-bold text-lg text-white transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
              >
                Sign In to Continue
              </Link>
            ) : (
              <button
                id="activate-premium-btn"
                onClick={handleActivate}
                disabled={isProcessing}
                className="w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-amber-900"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)',
                  boxShadow: '0 8px 32px rgba(251,191,36,0.4)',
                }}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                    Activating…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Activate {PREMIUM_PLANS[selectedPlan].label} — ₹{PREMIUM_PLANS[selectedPlan].price.toLocaleString('en-IN')}
                  </>
                )}
              </button>
            )}

            <p className="text-center text-xs text-gray-400">
              🔒 Demo mode — no real payment is processed
            </p>
          </div>

          {/* Right: Benefits */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-gradient-to-br dark:from-indigo-950 dark:to-indigo-900 rounded-3xl p-7 text-gray-900 dark:text-white border border-gray-200 dark:border-transparent sticky top-24">
              <h3 className="font-bold text-lg mb-1 serif">What you get</h3>
              <p className="text-indigo-650 dark:text-indigo-300 text-xs mb-6">Everything in Premium membership</p>
              <ul className="space-y-4">
                {BENEFITS.map(b => (
                  <li key={b.title} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-gray-900/10 flex items-center justify-center flex-shrink-0 text-sm mt-0.5">
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{b.title}</p>
                      <p className="text-gray-500 dark:text-indigo-300/80 text-xs leading-relaxed mt-0.5">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2 text-xs text-indigo-655 dark:text-indigo-300">
                  <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Cancel anytime — no hidden fees
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
