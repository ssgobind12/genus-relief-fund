import { supabase, DEMO_MODE } from './supabase.js';

// Demo Data
let DEMO_DONATIONS = [
  { id: '1', donor_name: 'Rahul Sharma', mobile: '9876543210', email: 'rahul@email.com', amount: 5000, transaction_id: 'UTR123456789', city: 'Jorhat', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', donor_name: 'Priya Das', mobile: '9876543211', email: 'priya@email.com', amount: 2500, transaction_id: 'UTR987654321', city: 'Sivasagar', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', donor_name: 'Anonymous', mobile: '9876543212', email: null, amount: 1000, transaction_id: 'UTR456789123', city: 'Guwahati', is_anonymous: true, is_verified: false, is_rejected: false, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: '4', donor_name: 'Amit Kumar', mobile: '9876543213', email: 'amit@email.com', amount: 10000, transaction_id: 'UTR789456123', city: 'Dibrugarh', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', donor_name: 'Neha Borah', mobile: '9876543214', email: null, amount: 500, transaction_id: 'UTR321654987', city: 'Tinsukia', is_anonymous: false, is_verified: false, is_rejected: false, created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '6', donor_name: 'Vikram Singh', mobile: '9876543215', email: 'vikram@email.com', amount: 3000, transaction_id: 'UTR654321789', city: 'Nagaon', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '7', donor_name: 'Deepa Rajput', mobile: '9876543216', email: 'deepa@email.com', amount: 7500, transaction_id: 'UTR159753468', city: 'Jorhat', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 345600000).toISOString() },
  { id: '8', donor_name: 'Suresh Nath', mobile: '9876543217', email: null, amount: 2000, transaction_id: 'UTR753159468', city: 'Sivasagar', is_anonymous: false, is_verified: false, is_rejected: true, created_at: new Date(Date.now() - 432000000).toISOString() },
];

let currentPage = 1;
const itemsPerPage = 5;
let currentDonationsList = [...DEMO_DONATIONS];

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Authentication
function initAdmin() {
    const session = localStorage.getItem('admin_session');
    if (session) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        loadDashboard();
        loadDonations(currentPage);
    } else {
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-dashboard').style.display = 'none';
    }
}

document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    
    if (DEMO_MODE) {
        if (pwd === 'genus2026') {
            localStorage.setItem('admin_session', 'true');
            initAdmin();
        } else {
            errorEl.innerText = 'Invalid password. (Demo: genus2026)';
        }
    } else {
        // Real auth logic via Supabase
        errorEl.innerText = 'Login logic pending for real database';
    }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('admin_session');
    initAdmin();
});

// Navigation
document.querySelectorAll('.nav-item[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        document.getElementById('page-title').innerText = e.target.innerText;
        
        if (targetId === 'dashboard-section') loadDashboard();
        if (targetId === 'donations-section') loadDonations(1);
    });
});

// Dashboard
function loadDashboard() {
    let stats = {
        total: 0,
        today: 0,
        weekly: 0,
        monthly: 0,
        donors: 0,
        pending: 0,
        verified: 0,
        avg: 0
    };

    if (DEMO_MODE) {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        
        DEMO_DONATIONS.forEach(d => {
            stats.donors++;
            if (d.is_verified) {
                stats.total += d.amount;
                stats.verified++;
                
                const dDate = new Date(d.created_at);
                if (now - dDate < oneDay) stats.today += d.amount;
                if (now - dDate < oneDay * 7) stats.weekly += d.amount;
                if (now - dDate < oneDay * 30) stats.monthly += d.amount;
            } else if (!d.is_rejected) {
                stats.pending++;
            }
        });
        
        stats.avg = stats.verified > 0 ? stats.total / stats.verified : 0;
    }

    animateValue('stat-total-amount', 0, stats.total, 1000, true);
    animateValue('stat-today', 0, stats.today, 1000, true);
    animateValue('stat-weekly', 0, stats.weekly, 1000, true);
    animateValue('stat-monthly', 0, stats.monthly, 1000, true);
    animateValue('stat-donors', 0, stats.donors, 1000, false);
    animateValue('stat-average', 0, stats.avg, 1000, true);
    animateValue('stat-pending', 0, stats.pending, 1000, false);
    animateValue('stat-verified', 0, stats.verified, 1000, false);
}

function animateValue(id, start, end, duration, isCurrency) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.innerHTML = isCurrency ? formatCurrency(currentVal) : currentVal;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = isCurrency ? formatCurrency(end) : end;
        }
    };
    window.requestAnimationFrame(step);
}

// Donations Table
function renderTableRows(data) {
    const tbody = document.getElementById('donations-tbody');
    tbody.innerHTML = '';
    
    data.forEach((d, index) => {
        const row = document.createElement('tr');
        
        let statusBadge = '<span class="badge badge-pending">Pending</span>';
        if (d.is_verified) statusBadge = '<span class="badge badge-verified">Verified</span>';
        if (d.is_rejected) statusBadge = '<span class="badge badge-rejected">Rejected</span>';
        
        let actions = `
            <button class="action-btn btn-view" onclick="window.viewDonation('${d.id}')">View</button>
        `;
        if (!d.is_verified && !d.is_rejected) {
            actions += `
                <button class="action-btn btn-verify" onclick="window.verifyDonation('${d.id}')">Verify</button>
                <button class="action-btn btn-reject" onclick="window.rejectDonation('${d.id}')">Reject</button>
            `;
        }

        row.innerHTML = `
            <td>${(currentPage - 1) * itemsPerPage + index + 1}</td>
            <td>${d.donor_name}</td>
            <td>${d.mobile}</td>
            <td>${formatCurrency(d.amount)}</td>
            <td>${d.transaction_id}</td>
            <td>${formatDate(d.created_at)}</td>
            <td>${statusBadge}</td>
            <td>${actions}</td>
        `;
        tbody.appendChild(row);
    });
}

function loadDonations(page) {
    currentPage = page;
    
    // Apply filters locally for DEMO
    let filtered = [...DEMO_DONATIONS];
    
    const search = document.getElementById('donation-search').value.toLowerCase();
    if (search) {
        filtered = filtered.filter(d => 
            d.donor_name.toLowerCase().includes(search) || 
            d.transaction_id.toLowerCase().includes(search)
        );
    }
    
    const status = document.getElementById('filter-status').value;
    if (status !== 'all') {
        filtered = filtered.filter(d => {
            if (status === 'pending') return !d.is_verified && !d.is_rejected;
            if (status === 'verified') return d.is_verified;
            if (status === 'rejected') return d.is_rejected;
            return true;
        });
    }
    
    currentDonationsList = filtered;
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    document.getElementById('page-info').innerText = `Page ${page} of ${totalPages || 1}`;
    
    document.getElementById('prev-page').disabled = page === 1;
    document.getElementById('next-page').disabled = page === totalPages || totalPages === 0;
    
    const start = (page - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    renderTableRows(paginated);
}

// Global scope for onclick handlers
window.viewDonation = (id) => {
    const d = DEMO_DONATIONS.find(x => x.id === id);
    if (!d) return;
    
    const content = `
        <p><strong>Name:</strong> ${d.donor_name}</p>
        <p><strong>Mobile:</strong> ${d.mobile}</p>
        <p><strong>Email:</strong> ${d.email || 'N/A'}</p>
        <p><strong>City:</strong> ${d.city}</p>
        <p><strong>Amount:</strong> ${formatCurrency(d.amount)}</p>
        <p><strong>Transaction ID:</strong> ${d.transaction_id}</p>
        <p><strong>Date:</strong> ${formatDate(d.created_at)}</p>
        <p><strong>Anonymous:</strong> ${d.is_anonymous ? 'Yes' : 'No'}</p>
    `;
    
    document.getElementById('modal-details-content').innerHTML = content;
    document.getElementById('detail-modal').style.display = 'flex';
    
    const vBtn = document.getElementById('modal-verify-btn');
    const rBtn = document.getElementById('modal-reject-btn');
    
    if (d.is_verified || d.is_rejected) {
        vBtn.style.display = 'none';
        rBtn.style.display = 'none';
    } else {
        vBtn.style.display = 'inline-block';
        rBtn.style.display = 'inline-block';
        vBtn.onclick = () => { window.verifyDonation(id); closeModals(); };
        rBtn.onclick = () => { window.rejectDonation(id); closeModals(); };
    }
};

window.verifyDonation = (id) => {
    const d = DEMO_DONATIONS.find(x => x.id === id);
    if (d) {
        d.is_verified = true;
        d.is_rejected = false;
        showToast('Verified donation from ' + d.donor_name);
        loadDonations(currentPage);
        loadDashboard();
    }
};

window.rejectDonation = (id) => {
    const d = DEMO_DONATIONS.find(x => x.id === id);
    if (d) {
        d.is_verified = false;
        d.is_rejected = true;
        showToast('Rejected donation from ' + d.donor_name, 'error');
        loadDonations(currentPage);
        loadDashboard();
    }
};

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModals);
});

// Filters
document.getElementById('donation-search')?.addEventListener('input', debounce(() => loadDonations(1), 300));
document.getElementById('filter-status')?.addEventListener('change', () => loadDonations(1));

document.getElementById('prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) loadDonations(currentPage - 1);
});
document.getElementById('next-page')?.addEventListener('click', () => {
    loadDonations(currentPage + 1);
});

// Export (Mock)
document.getElementById('export-csv')?.addEventListener('click', () => {
    showToast('Exporting CSV...');
    // Add real export logic
});
document.getElementById('export-excel')?.addEventListener('click', () => {
    showToast('Exporting Excel...');
});
document.getElementById('export-pdf')?.addEventListener('click', () => {
    showToast('Exporting PDF...');
});

// Init
document.addEventListener('DOMContentLoaded', initAdmin);
