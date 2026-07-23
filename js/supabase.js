import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const DEMO_MODE = !supabaseUrl || supabaseUrl === 'https://your-project.supabase.co';

export const supabase = DEMO_MODE ? null : createClient(supabaseUrl, supabaseKey);

// Demo data
const DEMO_DONATIONS = [
  { id: '1', donor_name: 'Rahul Sharma', mobile: '9876543210', email: 'rahul@email.com', amount: 5000, transaction_id: 'UTR123456789', city: 'Jorhat', is_anonymous: false, is_verified: true, is_rejected: false, message: 'Stay strong!', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: '2', donor_name: 'Priya Das', mobile: '9876543211', email: 'priya@email.com', amount: 2500, transaction_id: 'UTR987654321', city: 'Sivasagar', is_anonymous: false, is_verified: true, is_rejected: false, message: null, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: '3', donor_name: 'Anonymous', mobile: '9876543212', email: null, amount: 1000, transaction_id: 'UTR456789123', city: 'Guwahati', is_anonymous: true, is_verified: true, is_rejected: false, message: 'God bless all', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', donor_name: 'Amit Kumar', mobile: '9876543213', email: 'amit@email.com', amount: 10000, transaction_id: 'UTR789456123', city: 'Dibrugarh', is_anonymous: false, is_verified: true, is_rejected: false, message: null, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '5', donor_name: 'Neha Borah', mobile: '9876543214', email: null, amount: 500, transaction_id: 'UTR321654987', city: 'Tinsukia', is_anonymous: false, is_verified: true, is_rejected: false, message: 'Small help', created_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '6', donor_name: 'Vikram Singh', mobile: '9876543215', email: 'vikram@email.com', amount: 3000, transaction_id: 'UTR654321789', city: 'Nagaon', is_anonymous: false, is_verified: true, is_rejected: false, message: null, created_at: new Date(Date.now() - 28800000).toISOString() },
  { id: '7', donor_name: 'Deepa Rajput', mobile: '9876543216', email: 'deepa@email.com', amount: 7500, transaction_id: 'UTR159753468', city: 'Jorhat', is_anonymous: false, is_verified: true, is_rejected: false, message: 'For the children', created_at: new Date(Date.now() - 43200000).toISOString() },
  { id: '8', donor_name: 'Kavita Devi', mobile: '9876543217', email: null, amount: 2000, transaction_id: 'UTR753159468', city: 'Sivasagar', is_anonymous: false, is_verified: true, is_rejected: false, message: null, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '9', donor_name: 'Rajan Gogoi', mobile: '9876543218', email: 'rajan@email.com', amount: 15000, transaction_id: 'UTR951753456', city: 'Jorhat', is_anonymous: false, is_verified: true, is_rejected: false, message: 'For Assam', created_at: new Date(Date.now() - 129600000).toISOString() },
  { id: '10', donor_name: 'Meera Phukan', mobile: '9876543219', email: null, amount: 1500, transaction_id: 'UTR357159468', city: 'Guwahati', is_anonymous: true, is_verified: true, is_rejected: false, message: null, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '11', donor_name: 'Sanjay Patel', mobile: '9876543220', email: 'sanjay@email.com', amount: 20000, transaction_id: 'UTR147258369', city: 'Dibrugarh', is_anonymous: false, is_verified: true, is_rejected: false, message: 'Praying for everyone', created_at: new Date(Date.now() - 216000000).toISOString() },
  { id: '12', donor_name: 'Ankita Roy', mobile: '9876543221', email: null, amount: 800, transaction_id: 'UTR258369147', city: 'Tinsukia', is_anonymous: false, is_verified: true, is_rejected: false, message: null, created_at: new Date(Date.now() - 259200000).toISOString() },
];

// Helper functions
export async function getDonationStats() {
  if (DEMO_MODE) {
    const verified = DEMO_DONATIONS.filter(d => d.is_verified);
    const total = verified.reduce((s, d) => s + d.amount, 0);
    const today = verified.filter(d => new Date(d.created_at).toDateString() === new Date().toDateString()).reduce((s, d) => s + d.amount, 0);
    return {
      total_donors: verified.length,
      total_amount: total,
      today_amount: today,
      today_donors: verified.filter(d => new Date(d.created_at).toDateString() === new Date().toDateString()).length,
      families_supported: Math.floor(total / 500),
    };
  }
  const { data } = await supabase.from('donation_stats').select('*').single();
  return data || { total_donors: 0, total_amount: 0, today_amount: 0, families_supported: 0 };
}

export async function getRecentDonations(limit = 20) {
  if (DEMO_MODE) {
    return DEMO_DONATIONS.filter(d => d.is_verified).slice(0, limit).map(d => ({
      ...d,
      donor_name: d.is_anonymous ? 'Anonymous' : d.donor_name,
    }));
  }
  const { data } = await supabase.from('donations').select('*').eq('is_verified', true).eq('is_rejected', false).order('created_at', { ascending: false }).limit(limit);
  return data || [];
}

export async function getTargetAmount() {
  if (DEMO_MODE) return 500000;
  const { data } = await supabase.from('settings').select('target_amount').single();
  return data ? parseInt(data.target_amount) : 500000;
}

export async function submitDonation(donationData) {
  if (DEMO_MODE) {
    // Simulate submission
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, id: 'demo-' + Date.now() };
  }
  const { data, error } = await supabase.from('donations').insert([donationData]).select().single();
  if (error) throw error;
  return { success: true, id: data.id };
}

export async function uploadScreenshot(file) {
  if (DEMO_MODE) {
    await new Promise(r => setTimeout(r, 1000));
    return 'demo-screenshot-url';
  }
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from('donation-screenshots').upload(fileName, file);
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('donation-screenshots').getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function getSettings() {
  if (DEMO_MODE) {
    return {
      target_amount: '500000',
      admin_password: 'genus2026',
      upi_id: 'ssgobind12@okaxis',
      contact_phone: '+91 9216013070',
      contact_email: 'shubham.singh@genus.in',
    };
  }
  const { data } = await supabase.from('settings').select('*').single();
  return data || {};
}

export async function getGalleryImages() {
  if (DEMO_MODE) return [];
  const { data } = await supabase.from('gallery').select('*').order('sort_order');
  return data || [];
}

// Subscribe to real-time updates
export function subscribeToUpdates(callback) {
  if (DEMO_MODE) {
    // Simulate periodic updates in demo
    setInterval(() => callback(), 30000);
    return { unsubscribe: () => {} };
  }
  return supabase
    .channel('donations-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => callback())
    .subscribe();
}

// For admin - get all donations including unverified
export async function getAllDonations(page = 1, pageSize = 20, filters = {}) {
  if (DEMO_MODE) {
    let filtered = [...DEMO_DONATIONS];
    if (filters.status === 'verified') filtered = filtered.filter(d => d.is_verified);
    if (filters.status === 'pending') filtered = filtered.filter(d => !d.is_verified && !d.is_rejected);
    if (filters.status === 'rejected') filtered = filtered.filter(d => d.is_rejected);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(d => d.donor_name.toLowerCase().includes(q) || d.transaction_id.toLowerCase().includes(q));
    }
    if (filters.minAmount) filtered = filtered.filter(d => d.amount >= filters.minAmount);
    if (filters.maxAmount) filtered = filtered.filter(d => d.amount <= filters.maxAmount);
    if (filters.dateFrom) filtered = filtered.filter(d => new Date(d.created_at) >= new Date(filters.dateFrom));
    if (filters.dateTo) filtered = filtered.filter(d => new Date(d.created_at) <= new Date(filters.dateTo));
    const start = (page - 1) * pageSize;
    return { data: filtered.slice(start, start + pageSize), total: filtered.length };
  }
  let query = supabase.from('donations').select('*', { count: 'exact' });
  if (filters.status === 'verified') query = query.eq('is_verified', true);
  if (filters.status === 'pending') query = query.eq('is_verified', false).eq('is_rejected', false);
  if (filters.status === 'rejected') query = query.eq('is_rejected', true);
  if (filters.search) query = query.or(`donor_name.ilike.%${filters.search}%,transaction_id.ilike.%${filters.search}%`);
  if (filters.minAmount) query = query.gte('amount', filters.minAmount);
  if (filters.maxAmount) query = query.lte('amount', filters.maxAmount);
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
  const start = (page - 1) * pageSize;
  query = query.order('created_at', { ascending: false }).range(start, start + pageSize - 1);
  const { data, count } = await query;
  return { data: data || [], total: count || 0 };
}

export async function verifyDonation(id) {
  if (DEMO_MODE) { return true; }
  const { error } = await supabase.from('donations').update({ is_verified: true, verified_at: new Date().toISOString() }).eq('id', id);
  return !error;
}

export async function rejectDonation(id) {
  if (DEMO_MODE) { return true; }
  const { error } = await supabase.from('donations').update({ is_rejected: true, is_verified: false }).eq('id', id);
  return !error;
}

export async function deleteDonation(id) {
  if (DEMO_MODE) { return true; }
  const { error } = await supabase.from('donations').delete().eq('id', id);
  return !error;
}

export async function updateDonation(id, data) {
  if (DEMO_MODE) { return true; }
  const { error } = await supabase.from('donations').update(data).eq('id', id);
  return !error;
}
