const API_BASE = '/api';

// Toast notification system
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container') || this.createContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    static createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    static getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

// Loading overlay
class LoadingOverlay {
    static show() {
        let overlay = document.getElementById('loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
    }
    
    static hide() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
}

// API client
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            const response = await fetch(url, config);
            let data;
            
            try {
                data = await response.json();
            } catch (e) {
                data = { detail: response.statusText || 'An error occurred' };
            }
            
            if (!response.ok) {
                const error = new Error(data.detail || 'An error occurred');
                error.detail = data.detail;
                error.status = response.status;
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    static async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    static async post(endpoint, data) {
        return this.request(endpoint, { method: 'POST', body: data });
    }
    
    static async put(endpoint, data) {
        return this.request(endpoint, { method: 'PUT', body: data });
    }
    
    static async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    static async patch(endpoint, data = null) {
        return this.request(endpoint, { method: 'PATCH', body: data });
    }
}

// Stats manager
class StatsManager {
    static async updateStats() {
        try {
            const stats = await API.get('/stats');
            document.getElementById('stat-total-rules').textContent = stats.total_rules || 0;
            document.getElementById('stat-active-rules').textContent = stats.active_rules || 0;
            document.getElementById('stat-inactive-rules').textContent = stats.inactive_rules || 0;
            document.getElementById('stat-total-templates').textContent = stats.total_templates || 0;
        } catch (error) {
            console.error('Failed to update stats:', error);
        }
    }
}

// Rules manager
class RulesManager {
    // Convert form data to JSON for conditions
    static formToConditions() {
        const conditions = {};
        const sender = document.getElementById('condition-sender')?.value.trim();
        const subject = document.getElementById('condition-subject')?.value.trim();
        const body = document.getElementById('condition-body')?.value.trim();
        const hasAttachment = document.getElementById('condition-has-attachment')?.checked;
        
        if (sender) conditions.sender = sender;
        if (subject) conditions.subject_contains = subject;
        if (body) conditions.body_contains = body;
        if (hasAttachment) conditions.has_attachment = true;
        
        return JSON.stringify(conditions);
    }
    
    // Convert form data to JSON for actions
    static formToActions() {
        const actions = {};
        const folder = document.getElementById('action-folder')?.value.trim();
        const markRead = document.getElementById('action-mark-read')?.checked;
        const markImportant = document.getElementById('action-mark-important')?.checked;
        const label = document.getElementById('action-label')?.value.trim();
        const template = document.getElementById('action-template')?.value;
        
        if (folder) actions.move_to_folder = folder;
        if (markRead) actions.mark_as_read = true;
        if (markImportant) actions.mark_as_important = true;
        if (label) actions.add_label = label;
        if (template) actions.auto_reply_template = template;
        
        return JSON.stringify(actions);
    }
    
    // Parse JSON conditions to form fields
    static conditionsToForm(conditionsJson) {
        try {
            const conditions = JSON.parse(conditionsJson || '{}');
            if (document.getElementById('condition-sender')) {
                document.getElementById('condition-sender').value = conditions.sender || '';
            }
            if (document.getElementById('condition-subject')) {
                document.getElementById('condition-subject').value = conditions.subject_contains || '';
            }
            if (document.getElementById('condition-body')) {
                document.getElementById('condition-body').value = conditions.body_contains || '';
            }
            if (document.getElementById('condition-has-attachment')) {
                document.getElementById('condition-has-attachment').checked = conditions.has_attachment || false;
            }
        } catch (e) {
            console.error('Error parsing conditions:', e);
        }
    }
    
    // Parse JSON actions to form fields
    static actionsToForm(actionsJson) {
        try {
            const actions = JSON.parse(actionsJson || '{}');
            if (document.getElementById('action-folder')) {
                document.getElementById('action-folder').value = actions.move_to_folder || '';
            }
            if (document.getElementById('action-mark-read')) {
                document.getElementById('action-mark-read').checked = actions.mark_as_read || false;
            }
            if (document.getElementById('action-mark-important')) {
                document.getElementById('action-mark-important').checked = actions.mark_as_important || false;
            }
            if (document.getElementById('action-label')) {
                document.getElementById('action-label').value = actions.add_label || '';
            }
            if (document.getElementById('action-template')) {
                document.getElementById('action-template').value = actions.auto_reply_template || '';
            }
        } catch (e) {
            console.error('Error parsing actions:', e);
        }
    }
    
    // Format conditions for display
    static formatConditions(conditionsJson) {
        try {
            const conditions = JSON.parse(conditionsJson || '{}');
            const parts = [];
            if (conditions.sender) parts.push(`From: ${conditions.sender}`);
            if (conditions.subject_contains) parts.push(`Subject: "${conditions.subject_contains}"`);
            if (conditions.body_contains) parts.push(`Body: "${conditions.body_contains}"`);
            if (conditions.has_attachment) parts.push('Has attachment');
            return parts.length > 0 ? parts.join(', ') : 'No conditions';
        } catch (e) {
            return conditionsJson || 'Invalid JSON';
        }
    }
    
    // Format actions for display
    static formatActions(actionsJson) {
        try {
            const actions = JSON.parse(actionsJson || '{}');
            const parts = [];
            if (actions.move_to_folder) parts.push(`Move to: ${actions.move_to_folder}`);
            if (actions.mark_as_read) parts.push('Mark as read');
            if (actions.mark_as_important) parts.push('Mark as important');
            if (actions.add_label) parts.push(`Label: ${actions.add_label}`);
            if (actions.auto_reply_template) parts.push(`Auto-reply: ${actions.auto_reply_template}`);
            return parts.length > 0 ? parts.join(', ') : 'No actions';
        } catch (e) {
            return actionsJson || 'Invalid JSON';
        }
    }
    
    static async loadRules(search = '') {
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const rules = await API.get(`/rules${params}`);
            this.renderRules(rules);
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to load rules';
            Toast.show(message, 'error');
            document.getElementById('rules-list').innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 40px; color: #f45c43;">
                        <div>Error loading rules: ${this.escapeHtml(message)}</div>
                    </td>
                </tr>
            `;
        }
    }
    
    static renderRules(rules) {
        const container = document.getElementById('rules-list');
        if (!container) return;
        
        if (rules.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No Rules Found</h3>
                    <p>Create your first email sorting rule to get started</p>
                    <button class="btn btn-primary" onclick="RulesManager.showCreateModal()">Create Rule</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = rules.map(rule => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(rule.name)}</strong>
                    <div style="font-size: 0.875rem; color: #718096; margin-top: 4px;">
                        Priority: ${rule.priority}
                    </div>
                </td>
                <td>
                    <span class="badge ${rule.is_active ? 'badge-success' : 'badge-danger'}">
                        ${rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td style="max-width: 300px;">
                    <div style="font-size: 0.875rem; line-height: 1.5;">
                        ${this.escapeHtml(this.formatConditions(rule.conditions))}
                    </div>
                </td>
                <td style="max-width: 300px;">
                    <div style="font-size: 0.875rem; line-height: 1.5;">
                        ${this.escapeHtml(this.formatActions(rule.actions))}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-secondary btn-sm" onclick="RulesManager.toggleRule(${rule.id})" title="Toggle">
                            ${rule.is_active ? '⏸' : '▶'}
                        </button>
                        <button class="action-btn btn-primary btn-sm" onclick="RulesManager.showEditModal(${rule.id})" title="Edit">
                            ✏
                        </button>
                        <button class="action-btn btn-danger btn-sm" onclick="RulesManager.deleteRule(${rule.id})" title="Delete">
                            🗑
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    static async createRule(data) {
        try {
            LoadingOverlay.show();
            await API.post('/rules', data);
            Toast.show('Rule created successfully', 'success');
            await this.loadRules();
            await StatsManager.updateStats();
            this.hideModal();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to create rule';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static async updateRule(id, data) {
        try {
            LoadingOverlay.show();
            await API.put(`/rules/${id}`, data);
            Toast.show('Rule updated successfully', 'success');
            await this.loadRules();
            await StatsManager.updateStats();
            this.hideModal();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to update rule';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static async deleteRule(id) {
        if (!confirm('Are you sure you want to delete this rule?')) {
            return;
        }
        
        try {
            LoadingOverlay.show();
            await API.delete(`/rules/${id}`);
            Toast.show('Rule deleted successfully', 'success');
            await this.loadRules();
            await StatsManager.updateStats();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to delete rule';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static async toggleRule(id) {
        try {
            LoadingOverlay.show();
            await API.patch(`/rules/${id}/toggle`);
            Toast.show('Rule status updated', 'success');
            await this.loadRules();
            await StatsManager.updateStats();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to toggle rule';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static async showCreateModal() {
        const modal = document.getElementById('rule-modal');
        if (!modal) return;
        
        document.getElementById('rule-modal-title').textContent = 'Create New Rule';
        document.getElementById('rule-form').reset();
        
        // Load templates for auto-reply dropdown
        await this.loadTemplatesForDropdown();
        
        document.getElementById('rule-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            // Validate that at least one condition or action is set
            const conditions = this.formToConditions();
            const actions = this.formToActions();
            
            if (conditions === '{}' && actions === '{}') {
                Toast.show('Please set at least one condition or action', 'error');
                return;
            }
            
            RulesManager.createRule({
                name: formData.get('name'),
                conditions: conditions,
                actions: actions,
                priority: parseInt(formData.get('priority')) || 0,
                is_active: formData.get('is_active') === 'on'
            });
        };
        
        modal.classList.add('active');
    }
    
    static async loadTemplatesForDropdown() {
        try {
            const templates = await API.get('/templates');
            const select = document.getElementById('action-template');
            if (!select) return;
            
            // Clear existing options except the first "None" option
            select.innerHTML = '<option value="">None</option>';
            
            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id;
                option.textContent = template.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load templates for dropdown:', error);
        }
    }
    
    static async showEditModal(id) {
        try {
            LoadingOverlay.show();
            const rule = await API.get(`/rules/${id}`);
            const modal = document.getElementById('rule-modal');
            if (!modal) return;
            
            document.getElementById('rule-modal-title').textContent = 'Edit Rule';
            document.getElementById('rule-name').value = rule.name;
            document.getElementById('rule-priority').value = rule.priority;
            document.getElementById('rule-is-active').checked = rule.is_active;
            
            // Parse and populate conditions and actions
            this.conditionsToForm(rule.conditions);
            this.actionsToForm(rule.actions);
            
            // Load templates for auto-reply dropdown
            await this.loadTemplatesForDropdown();
            
            // Set the selected template if it exists
            try {
                const actions = JSON.parse(rule.actions || '{}');
                if (actions.auto_reply_template && document.getElementById('action-template')) {
                    document.getElementById('action-template').value = actions.auto_reply_template;
                }
            } catch (e) {
                console.error('Error setting template:', e);
            }
            
            document.getElementById('rule-form').onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // Validate that at least one condition or action is set
                const conditions = this.formToConditions();
                const actions = this.formToActions();
                
                if (conditions === '{}' && actions === '{}') {
                    Toast.show('Please set at least one condition or action', 'error');
                    return;
                }
                
                RulesManager.updateRule(id, {
                    name: formData.get('name'),
                    conditions: conditions,
                    actions: actions,
                    priority: parseInt(formData.get('priority')) || 0,
                    is_active: formData.get('is_active') === 'on'
                });
            };
            
            modal.classList.add('active');
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to load rule';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static hideModal() {
        const modal = document.getElementById('rule-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Templates manager
class TemplatesManager {
    static async loadTemplates(search = '', category = '') {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (category) params.append('category', category);
            const query = params.toString() ? `?${params}` : '';
            const templates = await API.get(`/templates${query}`);
            this.renderTemplates(templates);
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to load templates';
            Toast.show(message, 'error');
            document.getElementById('templates-list').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center" style="padding: 40px; color: #f45c43;">
                        <div>Error loading templates: ${this.escapeHtml(message)}</div>
                    </td>
                </tr>
            `;
        }
    }
    
    static renderTemplates(templates) {
        const container = document.getElementById('templates-list');
        if (!container) return;
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📧</div>
                    <h3>No Templates Found</h3>
                    <p>Create your first email template to get started</p>
                    <button class="btn btn-primary" onclick="TemplatesManager.showCreateModal()">Create Template</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = templates.map(template => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(template.name)}</strong>
                    <div style="font-size: 0.875rem; color: #718096; margin-top: 4px;">
                        ${this.escapeHtml(template.subject)}
                    </div>
                </td>
                <td>
                    <span class="badge badge-info">${this.escapeHtml(template.category)}</span>
                </td>
                <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${this.escapeHtml(template.body)}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-primary btn-sm" onclick="TemplatesManager.showEditModal(${template.id})" title="Edit">
                            ✏
                        </button>
                        <button class="action-btn btn-danger btn-sm" onclick="TemplatesManager.deleteTemplate(${template.id})" title="Delete">
                            🗑
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    static async createTemplate(data) {
        try {
            LoadingOverlay.show();
            await API.post('/templates', data);
            Toast.show('Template created successfully', 'success');
            await this.loadTemplates();
            await StatsManager.updateStats();
            this.hideModal();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to create template';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static async updateTemplate(id, data) {
        try {
            LoadingOverlay.show();
            await API.put(`/templates/${id}`, data);
            Toast.show('Template updated successfully', 'success');
            await this.loadTemplates();
            this.hideModal();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to update template';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static async deleteTemplate(id) {
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }
        
        try {
            LoadingOverlay.show();
            await API.delete(`/templates/${id}`);
            Toast.show('Template deleted successfully', 'success');
            await this.loadTemplates();
            await StatsManager.updateStats();
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to delete template';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static showCreateModal() {
        const modal = document.getElementById('template-modal');
        if (!modal) return;
        
        document.getElementById('template-modal-title').textContent = 'Create New Template';
        document.getElementById('template-form').reset();
        document.getElementById('template-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            TemplatesManager.createTemplate({
                name: formData.get('name'),
                subject: formData.get('subject'),
                body: formData.get('body'),
                category: formData.get('category') || 'general'
            });
        };
        
        modal.classList.add('active');
    }
    
    static async showEditModal(id) {
        try {
            LoadingOverlay.show();
            const template = await API.get(`/templates/${id}`);
            const modal = document.getElementById('template-modal');
            if (!modal) return;
            
            document.getElementById('template-modal-title').textContent = 'Edit Template';
            document.getElementById('template-name').value = template.name;
            document.getElementById('template-subject').value = template.subject;
            document.getElementById('template-body').value = template.body;
            document.getElementById('template-category').value = template.category;
            
            document.getElementById('template-form').onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                TemplatesManager.updateTemplate(id, {
                    name: formData.get('name'),
                    subject: formData.get('subject'),
                    body: formData.get('body'),
                    category: formData.get('category') || 'general'
                });
            };
            
            modal.classList.add('active');
        } catch (error) {
            const message = error.message || (error.detail && (typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail))) || 'Failed to load template';
            Toast.show(message, 'error');
        } finally {
            LoadingOverlay.hide();
        }
    }
    
    static hideModal() {
        const modal = document.getElementById('template-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Navigation
function switchTab(tabName, event) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach((tab, index) => {
            if (tab.textContent.toLowerCase().includes(tabName)) {
                tab.classList.add('active');
            }
        });
    }
    
    document.getElementById(`${tabName}-section`).classList.add('active');
    
    if (tabName === 'rules') {
        RulesManager.loadRules();
    } else if (tabName === 'templates') {
        TemplatesManager.loadTemplates();
    }
}

// Search functionality with debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    // Close modals on close button
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').classList.remove('active');
        });
    });
    
    // Search handlers
    const rulesSearch = document.getElementById('rules-search');
    if (rulesSearch) {
        rulesSearch.addEventListener('input', debounce((e) => {
            RulesManager.loadRules(e.target.value);
        }, 300));
    }
    
    const templatesSearch = document.getElementById('templates-search');
    if (templatesSearch) {
        templatesSearch.addEventListener('input', debounce((e) => {
            TemplatesManager.loadTemplates(e.target.value);
        }, 300));
    }
    
    // Load initial data
    await StatsManager.updateStats();
    RulesManager.loadRules();
    
    // Show dashboard by default
    document.getElementById('dashboard-section').classList.add('active');
    document.querySelector('.nav-tab[onclick*="dashboard"]')?.classList.add('active');
});

