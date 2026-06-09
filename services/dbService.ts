import { Book, Order, Subscription, SubscriptionType, User, UserRole } from '../types';
import { supabase } from './supabaseClient';
import { pdfStorage } from './pdfStorage';

// Premium pricing config
export const PREMIUM_PLANS = {
  monthly: { price: 199, label: 'Monthly', durationDays: 30 },
  yearly:  { price: 1499, label: 'Yearly',  durationDays: 365 },
} as const;

export const dbService = {
  getBooks: async (): Promise<Book[]> => {
    const { data, error } = await supabase.from('books').select('*');
    if (error) throw new Error(error.message);

    const localPDFs = JSON.parse(localStorage.getItem('LuminaBooks_LocalPDFs') || '{}');

    return data.map((b: any) => ({
      ...b,
      coverImage: b.cover_image,
      isBestseller: b.is_bestseller,
      isPremiumOnly: b.is_premium_only ?? false,
      pdfUrl: localPDFs[b.id] || b.pdf_url,
    }));
  },

  getBookById: async (id: string): Promise<Book | undefined> => {
    const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
    if (error) return undefined;

    const localPDFs = JSON.parse(localStorage.getItem('LuminaBooks_LocalPDFs') || '{}');

    return {
      ...data,
      coverImage: data.cover_image,
      isBestseller: data.is_bestseller,
      isPremiumOnly: data.is_premium_only ?? false,
      pdfUrl: localPDFs[data.id] || data.pdf_url,
    };
  },

  addBook: async (bookData: Omit<Book, 'id'>): Promise<Book> => {
    const newId = Math.random().toString(36).substr(2, 9);
    const { pdfUrl, ...supabaseData } = bookData as any;

    const { data, error } = await supabase.from('books').insert({
      id: newId,
      title: supabaseData.title,
      author: supabaseData.author,
      price: supabaseData.price,
      category: supabaseData.category,
      description: supabaseData.description,
      cover_image: supabaseData.coverImage,
      rating: supabaseData.rating,
      stock: supabaseData.stock,
      is_bestseller: supabaseData.isBestseller,
      is_premium_only: supabaseData.isPremiumOnly ?? false,
    }).select().single();

    if (error) throw new Error(error.message);

    if (pdfUrl) {
      const localPDFs = JSON.parse(localStorage.getItem('LuminaBooks_LocalPDFs') || '{}');
      localPDFs[data.id] = pdfUrl;
      localStorage.setItem('LuminaBooks_LocalPDFs', JSON.stringify(localPDFs));
    }

    return {
      ...data,
      coverImage: data.cover_image,
      isBestseller: data.is_bestseller,
      isPremiumOnly: data.is_premium_only ?? false,
      pdfUrl: pdfUrl,
    };
  },

  updateBook: async (id: string, updates: Partial<Book>): Promise<Book> => {
    const dbUpdates: any = { ...updates };
    const pdfUrl = dbUpdates.pdfUrl;
    delete dbUpdates.pdfUrl;

    if (updates.coverImage !== undefined) {
      dbUpdates.cover_image = updates.coverImage;
      delete dbUpdates.coverImage;
    }
    if (updates.isBestseller !== undefined) {
      dbUpdates.is_bestseller = updates.isBestseller;
      delete dbUpdates.isBestseller;
    }
    if (updates.isPremiumOnly !== undefined) {
      dbUpdates.is_premium_only = updates.isPremiumOnly;
      delete dbUpdates.isPremiumOnly;
    }

    const { data, error } = await supabase.from('books').update(dbUpdates).eq('id', id).select().single();

    if (error) throw new Error(error.message);

    if (pdfUrl !== undefined) {
      const localPDFs = JSON.parse(localStorage.getItem('LuminaBooks_LocalPDFs') || '{}');
      if (pdfUrl) {
        localPDFs[data.id] = pdfUrl;
      } else {
        delete localPDFs[data.id];
      }
      localStorage.setItem('LuminaBooks_LocalPDFs', JSON.stringify(localPDFs));
    }

    const localPDFs = JSON.parse(localStorage.getItem('LuminaBooks_LocalPDFs') || '{}');

    return {
      ...data,
      coverImage: data.cover_image,
      isBestseller: data.is_bestseller,
      isPremiumOnly: data.is_premium_only ?? false,
      pdfUrl: localPDFs[data.id] || data.pdf_url,
    };
  },

  deleteBook: async (id: string): Promise<void> => {
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) throw new Error(error.message);

    // Clean up local PDFs
    const localPDFs = JSON.parse(localStorage.getItem('LuminaBooks_LocalPDFs') || '{}');
    delete localPDFs[id];
    localStorage.setItem('LuminaBooks_LocalPDFs', JSON.stringify(localPDFs));
    try {
      await pdfStorage.deletePDF(id);
    } catch (err) {
      console.warn("Failed to delete PDF from local storage", err);
    }
  },

  // ─── Auth ────────────────────────────────────────────────────
  login: async (email: string, password: string): Promise<User | null> => {
    // Hardcoded Admin fallback
    if (email === 'admin@lumina.com' && password === 'admin123') {
      return {
        id: 'admin-1',
        name: 'Harsha',
        email: 'admin@lumina.com',
        role: UserRole.ADMIN,
        avatar: `https://ui-avatars.com/api/?name=Harsha&background=6366f1&color=fff`,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;

    // Fetch premium profile data
    const profile = await dbService._getProfile(data.user.id);

    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || 'User',
      email: data.user.email!,
      role: UserRole.USER,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.user_metadata?.name || 'User')}&background=6366f1&color=fff`,
      ...profile,
    };
  },

  register: async (name: string, email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed.');

    return {
      id: data.user.id,
      name,
      email: data.user.email!,
      role: UserRole.USER,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
      isPremium: false,
    };
  },

  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
  },

  // ─── Internal: fetch premium profile ─────────────────────────
  _getProfile: async (userId: string): Promise<Partial<User>> => {
    const { data } = await supabase
      .from('profiles')
      .select('is_premium, subscription_type, subscription_start_date, subscription_end_date')
      .eq('id', userId)
      .single();

    if (!data) return { isPremium: false };

    // Auto-expiry: if end date is in the past, downgrade
    if (data.is_premium && data.subscription_end_date) {
      const expired = new Date(data.subscription_end_date) < new Date();
      if (expired) {
        await dbService._downgradeUser(userId);
        return { isPremium: false };
      }
    }

    return {
      isPremium: data.is_premium ?? false,
      subscriptionType: data.subscription_type,
      subscriptionStartDate: data.subscription_start_date,
      subscriptionEndDate: data.subscription_end_date,
    };
  },

  _downgradeUser: async (userId: string): Promise<void> => {
    await supabase.from('profiles').update({
      is_premium: false,
      subscription_type: null,
      subscription_start_date: null,
      subscription_end_date: null,
    }).eq('id', userId);

    // Mark subscription as expired
    await supabase.from('subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active');
  },

  // ─── Subscription APIs ───────────────────────────────────────

  /**
   * POST /subscribe — Activate a premium subscription.
   * Uses mock payment (1.5s delay simulated in UI).
   */
  subscribe: async (userId: string, plan: SubscriptionType): Promise<User> => {
    const planConfig = PREMIUM_PLANS[plan];
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + planConfig.durationDays);

    const subscriptionId = `SUB-${Date.now()}`;

    // Insert subscription record
    const { error: subError } = await supabase.from('subscriptions').insert({
      id: subscriptionId,
      user_id: userId,
      plan,
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      amount_paid: planConfig.price,
    });

    if (subError) {
      // If subscriptions table doesn't exist yet (pre-migration), skip gracefully
      console.warn('Subscriptions table not found, skipping audit insert:', subError.message);
    }

    // Update user profile with premium fields
    const { error: profileError } = await supabase.from('profiles').update({
      is_premium: true,
      subscription_type: plan,
      subscription_start_date: now.toISOString(),
      subscription_end_date: endDate.toISOString(),
    }).eq('id', userId);

    if (profileError) {
      // If columns don't exist yet (pre-migration), throw helpful error
      throw new Error(`Could not activate premium: ${profileError.message}. Make sure you've run the schema migration in Supabase.`);
    }

    return {
      isPremium: true,
      subscriptionType: plan,
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
    } as any;
  },

  /**
   * GET /subscription-status — Check if user's subscription is still active.
   * Auto-downgrades if expired.
   */
  getSubscriptionStatus: async (userId: string): Promise<Partial<User>> => {
    return dbService._getProfile(userId);
  },

  /**
   * Cancel an active subscription (immediate downgrade).
   */
  cancelSubscription: async (userId: string): Promise<void> => {
    await dbService._downgradeUser(userId);
  },

  // ─── Orders ──────────────────────────────────────────────────
  createOrder: async (orderData: any): Promise<Order> => {
    const orderId = `ORD-${Date.now()}`;

    for (const item of orderData.items) {
      const { data: bookData, error: fetchErr } = await supabase
        .from('books').select('stock, title').eq('id', item.id).single();

      if (fetchErr || !bookData) throw new Error(`Could not verify stock for "${item.title}".`);

      const needed = item.quantity;
      if (bookData.stock < needed) {
        throw new Error(`"${bookData.title}" only has ${bookData.stock} unit${bookData.stock !== 1 ? 's' : ''} left. Please update your cart.`);
      }

      const { error: updateErr } = await supabase
        .from('books').update({ stock: bookData.stock - needed }).eq('id', item.id);

      if (updateErr) throw new Error(`Failed to update stock for "${item.title}": ${updateErr.message}`);
    }

    const { data, error } = await supabase.from('orders').insert({
      id: orderId,
      user_id: orderData.userId,
      items: orderData.items,
      total: orderData.total,
      status: 'pending'
    }).select().single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      userId: data.user_id,
      items: data.items,
      total: data.total,
      status: data.status,
      date: data.date
    };
  },

  // ─── Admin Methods ────────────────────────────────────────────
  getOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
    if (error) throw new Error(error.message);

    return data.map((o: any) => ({
      id: o.id,
      userId: o.user_id,
      items: o.items,
      total: o.total,
      status: o.status,
      date: o.date
    }));
  },

  updateOrderStatus: async (id: string, status: 'pending' | 'processing' | 'completed' | 'cancelled'): Promise<void> => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error) throw new Error(error.message);

    return data.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email || 'N/A',
      role: u.role as UserRole,
      avatar: u.avatar_url,
      isPremium: u.is_premium ?? false,
      subscriptionType: u.subscription_type,
      subscriptionEndDate: u.subscription_end_date,
    }));
  },

  updateUserRole: async (id: string, role: string): Promise<void> => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw new Error(error.message);
  }
};
