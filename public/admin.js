class AdminPanel {
    constructor() {
        this.token = localStorage.getItem('token');
        this.admin = null;
        this.currentPage = 'dashboard';
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.token) {
            this.verifyAdmin();
        } else {
            this.showAdminLogin();
        }
    }

    setupEventListeners() {
        // Menu navigation
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) {
                    this.navigate(page);
                }
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Mobile menu toggle
        document.getElementById('mobileMenuToggle').addEventListener('click', () => {
            document.getElementById('adminSidebar').classList.toggle('mobile-open');
        });

        // Close modals on outside click
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    async verifyAdmin() {
        try {
            const response = await this.apiCall('/api/auth/profile', 'GET');
            if (response.user.role === 'admin') {
                this.admin = response.user;
                this.updateUI();
                this.loadDashboard();
            } else {
                this.showAdminLogin();
            }
        } catch (error) {
            this.showAdminLogin();
        }
    }

    showAdminLogin() {
        const content = `
            <div style="max-width: 400px; margin: 2rem auto;">
                <div class="user-form">
                    <h2>Admin Login</h2>
                    <form id="adminLoginForm">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Login</button>
                    </form>
                    <div style="margin-top: 2rem; padding: 1rem; background: #f7fafc; border-radius: 8px;">
                        <h4>Default Admin Credentials:</h4>
                        <p><strong>Username:</strong> Ntando</p>
                        <p><strong>Email:</strong> admin@ntando.app</p>
                        <p><strong>Password:</strong> Ntando</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('adminContent').innerHTML = content;
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => this.handleAdminLogin(e));
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            const result = await response.json();

            if (result.token && result.admin) {
                this.token = result.token;
                this.admin = result.admin;
                localStorage.setItem('token', this.token);
                this.updateUI();
                this.loadDashboard();
            } else {
                this.showError('Invalid admin credentials');
            }
        } catch (error) {
            this.showError('Login failed');
        }
    }

    updateUI() {
        document.getElementById('adminUsername').textContent = this.admin.username;
    }

    navigate(page) {
        this.currentPage = page;
        
        // Update menu active state
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            users: 'User Management',
            sites: 'Site Management',
            'create-user': 'Create New User',
            settings: 'System Settings'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Admin Panel';

        // Load page content
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'sites':
                this.loadSites();
                break;
            case 'create-user':
                this.showCreateUserForm();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboard() {
        try {
            const response = await this.apiCall('/api/admin/dashboard');
            const data = response;

            const content = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.stats.totalUsers}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.stats.totalSites}</div>
                        <div class="stat-label">Total Sites</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatBytes(data.stats.totalStorage)}</div>
                        <div class="stat-label">Total Storage Used</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.stats.planStats?.length || 0}</div>
                        <div class="stat-label">Active Plans</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div class="admin-table">
                        <h3>Recent Users</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.recentUsers.map(user => `
                                    <tr>
                                        <td>${user.username}</td>
                                        <td>${user.email}</td>
                                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="admin-table">
                        <h3>Recent Sites</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Domain</th>
                                    <th>Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.recentSites.map(site => `
                                    <tr>
                                        <td>${site.name}</td>
                                        <td>${site.subdomain}.ntando.app</td>
                                        <td>${site.userId.username}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            document.getElementById('adminContent').innerHTML = content;
        } catch (error) {
            this.showError('Failed to load dashboard');
        }
    }

    async loadUsers(page = 1) {
        try {
            const response = await this.apiCall(`/api/admin/users?page=${page}`);
            const data = response;

            const content = `
                <div style="margin-bottom: 2rem;">
                    <input type="text" id="userSearch" placeholder="Search users..." class="form-group" style="max-width: 300px;">
                    <button class="btn btn-primary" onclick="admin.searchUsers()">Search</button>
                </div>

                <div class="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Plan</th>
                                <th>Sites</th>
                                <th>Storage</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.users.map(user => `
                                <tr>
                                    <td>${user.username}</td>
                                    <td>${user.email}</td>
                                    <td><span class="badge badge-${user.plan}">${user.plan}</span></td>
                                    <td>${user.siteCount}</td>
                                    <td>${this.formatBytes(user.storageUsed)}</td>
                                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div class="user-actions">
                                            <button class="btn btn-secondary btn-small" onclick="admin.viewUser('${user._id}')">View</button>
                                            <button class="btn btn-primary btn-small" onclick="admin.editUser('${user._id}')">Edit</button>
                                            <button class="btn btn-secondary btn-small" onclick="admin.deleteUser('${user._id}')">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${this.renderPagination(data.pagination)}
            `;

            document.getElementById('adminContent').innerHTML = content;
        } catch (error) {
            this.showError('Failed to load users');
        }
    }

    async loadSites(page = 1) {
        try {
            const response = await this.apiCall(`/api/admin/sites?page=${page}`);
            const data = response;

            const content = `
                <div style="margin-bottom: 2rem;">
                    <input type="text" id="siteSearch" placeholder="Search sites..." class="form-group" style="max-width: 300px;">
                    <button class="btn btn-primary" onclick="admin.searchSites()">Search</button>
                </div>

                <div class="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Domain</th>
                                <th>Owner</th>
                                <th>Status</th>
                                <th>Storage</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.sites.map(site => `
                                <tr>
                                    <td>${site.name}</td>
                                    <td>${site.subdomain}.ntando.app</td>
                                    <td>${site.userId.username}</td>
                                    <td><span class="badge ${site.active ? 'badge-pro' : 'badge-free'}">${site.active ? 'Active' : 'Inactive'}</span></td>
                                    <td>${this.formatBytes(site.stats.storage)}</td>
                                    <td>${new Date(site.createdAt).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${this.renderPagination(data.pagination)}
            `;

            document.getElementById('adminContent').innerHTML = content;
        } catch (error) {
            this.showError('Failed to load sites');
        }
    }

    showCreateUserForm() {
        const content = `
            <div class="user-form">
                <h2>Create New User</h2>
                <form id="createUserForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required minlength="3" maxlength="30">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="plan">Plan</label>
                        <select id="plan" name="plan">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Create User</button>
                    <button type="button" class="btn btn-secondary" onclick="admin.navigate('users')">Cancel</button>
                </form>
            </div>
        `;

        document.getElementById('adminContent').innerHTML = content;
        document.getElementById('createUserForm').addEventListener('submit', (e) => this.createUser(e));
    }

    loadSettings() {
        const content = `
            <div class="user-form">
                <h2>System Settings</h2>
                <div class="form-group">
                    <label>System Status</label>
                    <p style="color: #48bb78;">🟢 All systems operational</p>
                </div>
                <div class="form-group">
                    <label>Admin Account</label>
                    <p><strong>Username:</strong> ${this.admin.username}</p>
                    <p><strong>Email:</strong> ${this.admin.email}</p>
                    <p><strong>Role:</strong> ${this.admin.role}</p>
                </div>
                <div class="form-group">
                    <label>Platform Features</label>
                    <p>✅ Custom Domains: ntando.app, ntando.cloud, ntando.zw, ntl.cloud, ntl.ai, ntl.zw</p>
                    <p>✅ Unlimited Admin Access</p>
                    <p>✅ User Management</p>
                    <p>✅ Site Management</p>
                    <p>✅ File Hosting</p>
                </div>
            </div>
        `;

        document.getElementById('adminContent').innerHTML = content;
    }

    async createUser(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            plan: formData.get('plan')
        };

        try {
            const response = await this.apiCall('/api/admin/users', 'POST', userData);
            this.showSuccess('User created successfully');
            this.navigate('users');
        } catch (error) {
            this.showError(error.message || 'Failed to create user');
        }
    }

    async viewUser(userId) {
        try {
            const response = await this.apiCall(`/api/admin/users/${userId}`);
            const data = response;

            const modalContent = `
                <div style="margin-bottom: 1rem;">
                    <h4> User Information</h4>
                    <p><strong>Username:</strong> ${data.user.username}</p>
                    <p><strong>Email:</strong> ${data.user.email}</p>
                    <p><strong>Plan:</strong> <span class="badge badge-${data.user.plan}">${data.user.plan}</span></p>
                    <p><strong>Joined:</strong> ${new Date(data.user.createdAt).toLocaleDateString()}</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <h4>Statistics</h4>
                    <p><strong>Total Sites:</strong> ${data.statistics.totalSites}</p>
                    <p><strong>Storage Used:</strong> ${this.formatBytes(data.statistics.totalStorage)}</p>
                    <p><strong>Total Visits:</strong> ${data.statistics.totalVisits}</p>
                    <p><strong>Active Sites:</strong> ${data.statistics.activeSites}</p>
                </div>
                <div>
                    <h4>Sites</h4>
                    ${data.sites.length > 0 ? `
                        <table style="width: 100%; margin-top: 0.5rem;">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Domain</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.sites.map(site => `
                                    <tr>
                                        <td>${site.name}</td>
                                        <td>${site.subdomain}.ntando.app</td>
                                        <td><span class="badge ${site.active ? 'badge-pro' : 'badge-free'}">${site.active ? 'Active' : 'Inactive'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No sites found</p>'}
                </div>
            `;

            this.showModal('User Details', modalContent);
        } catch (error) {
            this.showError('Failed to load user details');
        }
    }

    async editUser(userId) {
        try {
            const response = await this.apiCall(`/api/admin/users/${userId}`);
            const user = response.user;

            const modalContent = `
                <form id="editUserForm">
                    <input type="hidden" id="editUserId" value="${userId}">
                    <div class="form-group">
                        <label for="editUsername">Username</label>
                        <input type="text" id="editUsername" value="${user.username}" required>
                    </div>
                    <div class="form-group">
                        <label for="editEmail">Email</label>
                        <input type="email" id="editEmail" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label for="editPlan">Plan</label>
                        <select id="editPlan">
                            <option value="free" ${user.plan === 'free' ? 'selected' : ''}>Free</option>
                            <option value="pro" ${user.plan === 'pro' ? 'selected' : ''}>Pro</option>
                            <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editPassword">New Password (leave empty to keep current)</label>
                        <input type="password" id="editPassword" placeholder="New password">
                    </div>
                    <button type="submit" class="btn btn-primary">Update User</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal('userModal')">Cancel</button>
                </form>
            `;

            this.showModal('Edit User', modalContent);
            document.getElementById('editUserForm').addEventListener('submit', (e) => this.updateUser(e));
        } catch (error) {
            this.showError('Failed to load user for editing');
        }
    }

    async updateUser(e) {
        e.preventDefault();
        const userId = document.getElementById('editUserId').value;

        const userData = {
            username: document.getElementById('editUsername').value,
            email: document.getElementById('editEmail').value,
            plan: document.getElementById('editPlan').value
        };

        const password = document.getElementById('editPassword').value;
        if (password) {
            userData.password = password;
        }

        try {
            const response = await this.apiCall(`/api/admin/users/${userId}`, 'PUT', userData);
            this.showSuccess('User updated successfully');
            closeModal('userModal');
            this.loadUsers();
        } catch (error) {
            this.showError(error.message || 'Failed to update user');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This will also delete all their sites and files.')) {
            return;
        }

        try {
            const response = await this.apiCall(`/api/admin/users/${userId}`, 'DELETE');
            this.showSuccess('User deleted successfully');
            this.loadUsers();
        } catch (error) {
            this.showError(error.message || 'Failed to delete user');
        }
    }

    searchUsers() {
        const search = document.getElementById('userSearch').value;
        this.loadUsers(1, search);
    }

    searchSites() {
        const search = document.getElementById('siteSearch').value;
        this.loadSites(1, search);
    }

    renderPagination(pagination) {
        if (pagination.total <= 1) return '';

        let html = '<div style="margin-top: 2rem; text-align: center;">';
        for (let i = 1; i <= pagination.total; i++) {
            html += `<button class="btn btn-secondary btn-small" onclick="admin.loadUsers(${i})" ${i === pagination.current ? 'disabled' : ''}>${i}</button> `;
        }
        html += '</div>';
        return html;
    }

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('userModal').classList.add('active');
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Add authorization if we have a token
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }

        return result;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#f56565' : '#48bb78'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    logout() {
        this.token = null;
        this.admin = null;
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }
}

// Helper functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Initialize admin panel
const admin = new AdminPanel();