// frontend/js/api.js
class FINAPI {
    constructor() {
        // Usar a mesma URL do seu backend existente
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('fin_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.token ? `Bearer ${this.token}` : '',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Se for 204 No Content, retorna sucesso
            if (response.status === 204) {
                return { success: true };
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints - baseado na sua estrutura existente
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getProfile() {
        return this.request('/users/profile');
    }

    async logout() {
        localStorage.removeItem('fin_token');
        this.token = null;
        return this.request('/auth/logout');
    }

    // Admin endpoints
    async getAdminStats() {
        return this.request('/admin/stats');
    }

    async getUsers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/admin/users?${query}`);
    }

    async getUser(userId) {
        return this.request(`/admin/users/${userId}`);
    }

    async updateUser(userId, userData) {
        return this.request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async promoteToMentor(userId) {
        return this.request(`/admin/users/${userId}/promote`, {
            method: 'PATCH'
        });
    }

    async toggleUserStatus(userId, status) {
        return this.request(`/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async getMentors() {
        return this.request('/admin/mentors');
    }

    async getMentorships(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/admin/mentorships?${query}`);
    }

    async createMentorship(mentorshipData) {
        return this.request('/admin/mentorships', {
            method: 'POST',
            body: JSON.stringify(mentorshipData)
        });
    }

    async updateMentorship(mentorshipId, mentorshipData) {
        return this.request(`/admin/mentorships/${mentorshipId}`, {
            method: 'PUT',
            body: JSON.stringify(mentorshipData)
        });
    }

    async getContent() {
        return this.request('/admin/content');
    }

    async createArticle(articleData) {
        return this.request('/admin/content/articles', {
            method: 'POST',
            body: JSON.stringify(articleData)
        });
    }

    async updateArticle(articleId, articleData) {
        return this.request(`/admin/content/articles/${articleId}`, {
            method: 'PUT',
            body: JSON.stringify(articleData)
        });
    }

    // Upload de arquivos
    async uploadFile(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.request('/upload', {
            method: 'POST',
            headers: {
                'Authorization': this.token ? `Bearer ${this.token}` : '',
            },
            body: formData
        });
    }
}

// Singleton instance
const finAPI = new FINAPI();