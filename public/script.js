class NtandoHosting {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.sites = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        if (this.token) {
            this.verifyToken();
        }
        this.setupSmoothScrolling();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('navToggle').addEventListener('click', () => this.toggleMobileMenu());
        document.getElementById('getStartedBtn').addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('demoBtn').addEventListener('click', () => this.showDemo());
        document.getElementById('authBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('dashboardLink').addEventListener('click', () => this.showDashboard());

        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal('authModal'));
        document.getElementById('closeDashboard').addEventListener('click', () => this.closeModal('dashboardModal'));
        document.getElementById('authSwitchLink').addEventListener('click', (e) => this.switchAuthMode(e));
        document.getElementById('authForm').addEventListener('submit', (e) => this.handleAuth(e));

        // Dashboard
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('createSiteForm').addEventListener('submit', (e) => this.createSite(e));
        document.getElementById('quickAddSite').addEventListener('click', () => this.switchTab('new-site'));
        document.getElementById('generateApiKey').addEventListener('click', () => this.generateApiKey());

        // Subdomain validation
        document.getElementById('subdomain').addEventListener('input', (e) => this.checkSubdomainAvailability(e));

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Pricing buttons
        document.querySelectorAll('[data-plan]').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectPlan(e.target.dataset.plan));
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => this.handleModalClick(e));
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    toggleMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.toggle('active');
    }

    showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        const title = document.getElementById('authTitle');
        const submitBtn = document.getElementById('authSubmit');
        const nameField = document.getElementById('nameField');
        const switchText = document.getElementById('authSwitchText');
        const switchLink = document.getElementById('authSwitchLink');

        if (mode === 'register') {
            title.textContent = 'Sign Up';
            submitBtn.textContent = 'Sign Up';
            nameField.style.display = 'block';
            switchText.textContent = 'Already have an account?';
            switchLink.textContent = 'Sign In';
        } else {
            title.textContent = 'Sign In';
            submitBtn.textContent = 'Sign In';
            nameField.style.display = 'none';
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = 'Sign Up';
        }

        modal.classList.add('active');
        document.getElementById('authForm').dataset.mode = mode;
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    switchAuthMode(e) {
        e.preventDefault();
        const form = document.getElementById('authForm');
        const currentMode = form.dataset.mode;
        this.showAuthModal(currentMode === 'login' ? 'register' : 'login');
    }

    async handleAuth(e) {
        e.preventDefault();
        const form = e.target;
        const mode = form.dataset.mode;
        const formData = new FormData(form);

        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        if (mode === 'register') {
            data.username = formData.get('username');
        }

        try {
            const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
            const response = await this.apiCall(endpoint, 'POST', data);

            if (response.token) {
                this.token = response.token;
                this.user = response.user;
                localStorage.setItem('token', this.token);
                this.closeModal('authModal');
                this.updateUI();
                this.showDashboard();
            }
        } catch (error) {
            this.showError(error.message || 'Authentication failed');
        }
    }

    async verifyToken() {
        try {
            const response = await this.apiCall('/api/auth/profile', 'GET');
            this.user = response.user;
            this.updateUI();
        } catch (error) {
            this.logout();
        }
    }

    updateUI() {
        const authBtn = document.getElementById('authBtn');
        const dashboardLink = document.getElementById('dashboardLink');
        const adminLink = document.getElementById('adminLink');

        if (this.user) {
            authBtn.textContent = `Welcome, ${this.user.username}`;
            authBtn.onclick = () => this.showDashboard();
            dashboardLink.style.display = 'block';
            
            // Show admin link if user is admin
            if (this.user.role === 'admin') {
                adminLink.style.display = 'block';
            } else {
                adminLink.style.display = 'none';
            }
        } else {
            authBtn.textContent = 'Sign In';
            authBtn.onclick = () => this.showAuthModal('login');
            dashboardLink.style.display = 'none';
            adminLink.style.display = 'none';
        }
    }

    showDashboard() {
        if (!this.user) {
            this.showAuthModal('login');
            return;
        }

        const modal = document.getElementById('dashboardModal');
        modal.classList.add('active');
        this.loadUserData();
        this.loadSites();
    }

    async loadUserData() {
        try {
            document.getElementById('userUsername').textContent = this.user.username;
            document.getElementById('userEmail').textContent = this.user.email;
            document.getElementById('userPlan').textContent = this.user.plan;
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadSites() {
        try {
            const response = await this.apiCall('/api/sites', 'GET');
            this.sites = response.sites;
            this.renderSites();
        } catch (error) {
            console.error('Error loading sites:', error);
            this.showError('Failed to load sites');
        }
    }

    renderSites() {
        const sitesList = document.getElementById('sitesList');
        
        if (this.sites.length === 0) {
            sitesList.innerHTML = '<p>No sites yet. Create your first site!</p>';
            return;
        }

        sitesList.innerHTML = this.sites.map(site => `
            <div class="site-card">
                <div class="site-info">
                    <h4>${site.name}</h4>
                    <div class="site-url">${site.subdomain}.ntando.app</div>
                    <div class="site-stats">
                        <small>Created: ${new Date(site.createdAt).toLocaleDateString()}</small>
                    </div>
                </div>
                <div class="site-actions">
                    <button class="btn btn-primary" onclick="app.openSiteManager('${site._id}')">Manage</button>
                    <button class="btn btn-secondary" onclick="app.visitSite('${site.subdomain}')">Visit</button>
                </div>
            </div>
        `).join('');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.style.display = 'block';
        }
    }

    async checkSubdomainAvailability(e) {
        const subdomain = e.target.value.toLowerCase();
        const domain = document.getElementById('domainSelect').value;
        const statusDiv = document.getElementById('subdomainStatus');

        if (subdomain.length < 3) {
            statusDiv.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/domains/check/${domain}/${subdomain}`, {
                headers: this.getHeaders()
            });
            const data = await response.json();

            if (data.available) {
                statusDiv.innerHTML = `<span class="text-success">✓ ${data.fullDomain} is available</span>`;
                statusDiv.className = 'subdomain-status available';
            } else {
                statusDiv.innerHTML = `<span class="text-error">✗ ${data.fullDomain} is already taken</span>`;
                statusDiv.className = 'subdomain-status taken';
            }
        } catch (error) {
            statusDiv.innerHTML = '<span class="text-error">Error checking availability</span>';
        }
    }

    async createSite(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const data = {
            name: formData.get('siteName'),
            subdomain: formData.get('subdomain').toLowerCase()
        };

        try {
            const response = await this.apiCall('/api/sites', 'POST', data);
            this.showSuccess('Site created successfully!');
            form.reset();
            this.switchTab('sites');
            this.loadSites();
        } catch (error) {
            this.showError(error.message || 'Failed to create site');
        }
    }

    async generateApiKey() {
        try {
            const name = prompt('Enter a name for this API key:');
            if (!name) return;

            const response = await this.apiCall('/api/auth/api-key', 'POST', { name });
            this.showSuccess(`API Key generated: ${response.apiKey}`);
            
            // Reload user data to show new API key
            await this.loadUserData();
        } catch (error) {
            this.showError(error.message || 'Failed to generate API key');
        }
    }

    openSiteManager(siteId) {
        // This would open a file manager interface
        // For now, we'll show a simple message
        alert(`File manager for site ${siteId} would open here. This feature is coming soon!`);
    }

    visitSite(subdomain) {
        window.open(`https://${subdomain}.ntando.app`, '_blank');
    }

    selectPlan(plan) {
        if (!this.user) {
            this.showAuthModal('register');
            return;
        }
        
        alert(`Plan selection for ${plan} would be processed here. This feature is coming soon!`);
    }

    showDemo() {
        // Create a demo site to showcase the platform
        this.showSuccess('Demo site would be created here. This feature is coming soon!');
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        this.closeModal('dashboardModal');
        this.updateUI();
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: this.getHeaders()
        };

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

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    handleModalClick(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'error' ? '#f56565' : type === 'success' ? '#48bb78' : '#667eea'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the app
const app = new NtandoHosting();

// Make app globally available for inline event handlers
window.app = app;