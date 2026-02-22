// The URL where your backend is hosted (Render)
const RENDER_BACKEND_URL = 'https://online-resume-builder-client.onrender.com';

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api'
    : `${RENDER_BACKEND_URL}/api`;

const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.msg || 'Something went wrong');
        }

        return data;
    },

    auth: {
        async login(email, password) {
            const data = await api.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        },
        async register(userData) {
            const data = await api.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        },
        getUser() {
            return JSON.parse(localStorage.getItem('user'));
        }
    },

    resumes: {
        async getAll() {
            return api.request('/resumes');
        },
        async getById(id) {
            return api.request(`/resumes/${id}`);
        },
        async create(resumeData) {
            return api.request('/resumes', {
                method: 'POST',
                body: JSON.stringify(resumeData)
            });
        },
        async update(id, resumeData) {
            return api.request(`/resumes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(resumeData)
            });
        },
        async delete(id) {
            return api.request(`/resumes/${id}`, {
                method: 'DELETE'
            });
        }
    }
};

// Toast utility
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.display = 'block';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.display = 'none';
        document.body.removeChild(toast);
    }, 3000);
}

// Loader utility
function showLoader(show) {
    let overlay = document.querySelector('.loader-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loader-overlay';
        overlay.innerHTML = '<span class="loader"></span>';
        document.body.appendChild(overlay);
    }
    overlay.style.display = show ? 'flex' : 'none';
}
