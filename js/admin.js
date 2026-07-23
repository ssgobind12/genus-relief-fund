import { supabase, DEMO_MODE, getAllDonations, verifyDonation as sbVerify, rejectDonation as sbReject, deleteDonation as sbDelete, updateDonation as sbUpdate, getDonationStats } from './supabase.js';

// Demo Data (Fallback)
let DEMO_DONATIONS = [
  { id: '1', donor_name: 'Rahul Sharma', mobile: '9876543210', email: 'rahul@email.com', amount: 5000, transaction_id: 'UTR123456789', city: 'Jorhat', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', donor_name: 'Priya Das', mobile: '9876543211', email: 'priya@email.com', amount: 2500, transaction_id: 'UTR987654321', city: 'Sivasagar', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', donor_name: 'Anonymous', mobile: '9876543212', email: null, amount: 1000, transaction_id: 'UTR456789123', city: 'Guwahati', is_anonymous: true, is_verified: false, is_rejected: false, created_at: new Date(Date.now() - 10800000).toISOString() },
  { id: '4', donor_name: 'Amit Kumar', mobile: '9876543213', email: 'amit@email.com', amount: 10000, transaction_id: 'UTR789456123', city: 'Dibrugarh', is_anonymous: false, is_verified: true, is_rejected: false, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', donor_name: 'Neha Borah', mobile: '9876543214', email: null, amount: 500, transaction_id: 'UTR321654987', city: 'Tinsukia', is_anonymous: false, is_verified: false, is_rejected: false, created_at: new Date(Date.now() - 172800000).toISOString() },
];

let currentPage = 1;
const itemsPerPage = 5;
let currentDonationsList = [];

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
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

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwd = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('login-error');
    
    // For demo/simplicity, we check against the DB settings if live, or hardcoded for demo
    if (DEMO_MODE) {
        if (pwd === 'genus2026') {
            localStorage.setItem('admin_session', 'true');
            initAdmin();
        } else {
            errorEl.innerText = 'Invalid password.';
        }
    } else {
        try {
            const { data } = await supabase.from('settings').select('value').eq('key', 'admin_password').single();
            const realPwd = data ? data.value : 'genus2026'; // Fallback to schema default
            if (pwd === realPwd || pwd === 'genus2026') { // Allow default as fallback
                localStorage.setItem('admin_session', 'true');
                initAdmin();
            } else {
                errorEl.innerText = 'Invalid password.';
            }
        } catch (err) {
            errorEl.innerText = 'Error verifying password.';
        }
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
async function loadDashboard() {
    let stats = { total: 0, today: 0, weekly: 0, monthly: 0, donors: 0, pending: 0, verified: 0, avg: 0 };

    if (DEMO_MODE) {
        DEMO_DONATIONS.forEach(d => {
            stats.donors++;
            if (d.is_verified) {
                stats.total += d.amount;
                stats.verified++;
            } else if (!d.is_rejected) {
                stats.pending++;
            }
        });
        stats.avg = stats.verified > 0 ? stats.total / stats.verified : 0;
    } else {
        // Fetch real stats
        try {
            const { data, total } = await getAllDonations(1, 10000, {}); // Get all to calculate stats
            if (data) {
                data.forEach(d => {
                    stats.donors++;
                    if (d.is_verified) {
                        stats.total += d.amount;
                        stats.verified++;
                        const dDate = new Date(d.created_at);
                        const now = new Date();
                        if (now - dDate < 86400000) stats.today += d.amount;
                        if (now - dDate < 7 * 86400000) stats.weekly += d.amount;
                        if (now - dDate < 30 * 86400000) stats.monthly += d.amount;
                    } else if (!d.is_rejected) {
                        stats.pending++;
                    }
                });
                stats.avg = stats.verified > 0 ? stats.total / stats.verified : 0;
            }
        } catch (err) {
            console.error(err);
        }
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
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = isCurrency ? formatCurrency(end) : end;
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
        
        let actions = `<button class="action-btn btn-view" onclick="window.viewDonation('${d.id}')">View</button>
                       <button class="action-btn btn-view" style="background:#0056b3;" onclick="window.openEditModal('${d.id}')">Edit</button>`;
        
        if (!d.is_verified && !d.is_rejected) {
            actions += `<button class="action-btn btn-verify" onclick="window.verifyDonation('${d.id}')">Verify</button>
                        <button class="action-btn btn-reject" onclick="window.rejectDonation('${d.id}')">Reject</button>`;
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

async function loadDonations(page) {
    currentPage = page;
    
    const filters = {
        search: document.getElementById('donation-search').value,
        status: document.getElementById('filter-status').value
    };
    if (filters.status === 'all') delete filters.status;
    
    try {
        const { data, total } = await getAllDonations(page, itemsPerPage, filters);
        currentDonationsList = data;
        
        const totalPages = Math.ceil(total / itemsPerPage);
        document.getElementById('page-info').innerText = `Page ${page} of ${totalPages || 1}`;
        document.getElementById('prev-page').disabled = page === 1;
        document.getElementById('next-page').disabled = page >= totalPages;
        
        renderTableRows(data);
    } catch (err) {
        console.error("Error loading donations", err);
        showToast("Error loading donations", "error");
    }
}

// Modals
window.viewDonation = (id) => {
    const d = currentDonationsList.find(x => x.id === id);
    if (!d) return;
    
    const content = `
        <p><strong>Name:</strong> ${d.donor_name}</p>
        <p><strong>Mobile:</strong> ${d.mobile}</p>
        <p><strong>Email:</strong> ${d.email || 'N/A'}</p>
        <p><strong>City:</strong> ${d.city || 'N/A'}</p>
        <p><strong>Amount:</strong> ${formatCurrency(d.amount)}</p>
        <p><strong>Transaction ID:</strong> ${d.transaction_id}</p>
        <p><strong>Date:</strong> ${formatDate(d.created_at)}</p>
        <p><strong>Anonymous:</strong> ${d.is_anonymous ? 'Yes' : 'No'}</p>
        ${d.screenshot_url ? `<p><a href="${d.screenshot_url}" target="_blank">View Screenshot</a></p>` : ''}
    `;
    
    document.getElementById('modal-details-content').innerHTML = content;
    document.getElementById('detail-modal').style.display = 'flex';
    
    const vBtn = document.getElementById('modal-verify-btn');
    const rBtn = document.getElementById('modal-reject-btn');
    const delBtn = document.getElementById('modal-delete-btn');
    
    delBtn.style.display = 'inline-block';
    delBtn.onclick = () => {
        if (confirm("Are you sure you want to completely delete this donation?")) {
            window.deleteDonation(id);
            closeModals();
        }
    };
    
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

window.openEditModal = (id) => {
    const d = currentDonationsList.find(x => x.id === id);
    if (!d) return;
    
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = d.donor_name;
    document.getElementById('edit-mobile').value = d.mobile;
    document.getElementById('edit-amount').value = d.amount;
    document.getElementById('edit-txn').value = d.transaction_id;
    
    document.getElementById('edit-modal').style.display = 'flex';
};

document.getElementById('edit-donation-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const data = {
        donor_name: document.getElementById('edit-name').value,
        mobile: document.getElementById('edit-mobile').value,
        amount: parseFloat(document.getElementById('edit-amount').value),
        transaction_id: document.getElementById('edit-txn').value,
    };
    
    try {
        if (DEMO_MODE) {
            const index = DEMO_DONATIONS.findIndex(d => d.id === id);
            if (index !== -1) DEMO_DONATIONS[index] = { ...DEMO_DONATIONS[index], ...data };
        } else {
            await sbUpdate(id, data);
        }
        showToast('Donation updated successfully');
        closeModals();
        loadDonations(currentPage);
        loadDashboard();
    } catch (err) {
        showToast('Error updating donation', 'error');
    }
});

window.verifyDonation = async (id) => {
    if (DEMO_MODE) {
        const d = DEMO_DONATIONS.find(x => x.id === id);
        if (d) { d.is_verified = true; d.is_rejected = false; }
    } else {
        await sbVerify(id);
    }
    showToast('Verified donation');
    loadDonations(currentPage);
    loadDashboard();
};

window.rejectDonation = async (id) => {
    if (DEMO_MODE) {
        const d = DEMO_DONATIONS.find(x => x.id === id);
        if (d) { d.is_verified = false; d.is_rejected = true; }
    } else {
        await sbReject(id);
    }
    showToast('Rejected donation', 'error');
    loadDonations(currentPage);
    loadDashboard();
};

window.deleteDonation = async (id) => {
    if (DEMO_MODE) {
        DEMO_DONATIONS = DEMO_DONATIONS.filter(x => x.id !== id);
    } else {
        await sbDelete(id);
    }
    showToast('Donation deleted', 'success');
    loadDonations(currentPage);
    loadDashboard();
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

// Init
document.addEventListener('DOMContentLoaded', initAdmin);
