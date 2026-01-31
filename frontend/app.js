const API_BASE = 'http://localhost:8080/api';

class SocialApp {
    constructor() {
        this.token = localStorage.getItem('nexus_token');
        this.username = localStorage.getItem('nexus_username');
        this.init();
    }

    init() {
        if (this.token) {
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
    }

    showApp() {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'block';
        document.getElementById('nav-username').textContent = `@${this.username}`;
        this.showHome();
        this.fetchProfiles();
    }

    showHome() {
        this.setActiveNav('nav-home');
        document.getElementById('page-title').querySelector('h3').textContent = 'Home Feed';
        document.getElementById('page-title').style.display = 'block';
        document.getElementById('create-post-box').style.display = 'block';
        this.fetchPosts(`${API_BASE}/posts/`);
    }

    showExplore() {
        this.setActiveNav('nav-explore');
        document.getElementById('page-title').querySelector('h3').textContent = 'Explore';
        document.getElementById('page-title').style.display = 'block';
        document.getElementById('create-post-box').style.display = 'none';
        this.fetchPosts(`${API_BASE}/posts/explore/`);
    }

    showNotifications() {
        this.setActiveNav('nav-notifications');
        document.getElementById('page-title').querySelector('h3').textContent = 'Notifications';
        document.getElementById('posts-list').innerHTML = '<div class="glass" style="padding:2rem; text-align:center;">No new notifications.</div>';
        document.getElementById('create-post-box').style.display = 'none';
    }

    async showProfile() {
        this.setActiveNav('nav-profile');
        document.getElementById('page-title').querySelector('h3').textContent = 'My Profile';
        document.getElementById('create-post-box').style.display = 'none';
        
        // Fetch current user posts (filtering by own ID would be better, but for now relying on backend filter if implemented or just client side)
        // For now, let's fetch all and filter client side as a quick hack or implement 'me' endpoint for posts. 
        // Actually, let's just use the explore feed and filter client side for specific user for simplicity
        try {
            const response = await fetch(`${API_BASE}/posts/explore/`, {
                headers: { 'Authorization': `Token ${this.token}` }
            });
            const posts = await response.json();
            const myPosts = posts.filter(p => p.author.username === this.username);
            this.renderPosts(myPosts);
        } catch (e) {
            console.error(e);
        }
    }

    setActiveNav(id) {
        document.querySelectorAll('.side-nav a').forEach(a => a.style.color = 'var(--text)');
        const el = document.getElementById(id);
        if(el) el.style.color = 'var(--primary)';
    }

    handleFileSelect(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const preview = document.getElementById('media-preview');
            preview.style.display = 'block';
            if (file.type.startsWith('image/')) {
                preview.innerHTML = `<img src="${URL.createObjectURL(file)}" style="max-height: 200px; border-radius: 0.5rem;">`;
            } else if (file.type.startsWith('video/')) {
                preview.innerHTML = `<video src="${URL.createObjectURL(file)}" style="max-height: 200px; border-radius: 0.5rem;" controls></video>`;
            }
        }
    }

    toggleAuth() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    async login() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.username = data.username || username;
                localStorage.setItem('nexus_token', this.token);
                localStorage.setItem('nexus_username', this.username);
                this.showApp();
            } else {
                const errorData = await response.json();
                console.error("Login Error Details:", errorData);
                alert('Login failed: ' + (errorData.non_field_errors || errorData.detail || JSON.stringify(errorData)));
            }
        } catch (error) {
            console.error('Error during login:', error);
        }
    }

    async register() {
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch(`${API_BASE}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.token = data.token;
                this.username = data.username;
                localStorage.setItem('nexus_token', this.token);
                localStorage.setItem('nexus_username', this.username);
                this.showApp();
            } else {
                const errors = await response.json();
                alert('Registration failed: ' + JSON.stringify(errors));
            }
        } catch (error) {
            console.error('Error during registration:', error);
        }
    }

    logout() {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_username');
        window.location.reload();
    }

    async fetchPosts(url) {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Token ${this.token}` }
            });
            const posts = await response.json();
            this.renderPosts(posts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    }

    renderPosts(posts) {
        const container = document.getElementById('posts-list');
        if (posts.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No posts to show.</div>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post-card fade-in">
                <div class="post-header">
                    <img src="${post.author.avatar || 'https://api.dicebear.com/6.x/avataaars/svg?seed=' + post.author.username}" class="avatar" alt="avatar">
                    <div>
                        <div style="font-weight: 600">${post.author.username}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted)">${new Date(post.created_at).toLocaleString()}</div>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                ${post.image ? `<img src="${post.image}" class="post-image">` : ''}
                ${post.video ? `<video src="${post.video}" class="post-image" controls></video>` : ''}
                
                <div class="post-actions">
                    <button class="action-btn" onclick="app.likePost(${post.id})">
                        <i class="fa-regular fa-heart"></i> ${post.likes_count || 0}
                    </button>
                    <button class="action-btn" onclick="app.toggleComments(${post.id})">
                        <i class="fa-regular fa-comment"></i> ${post.comments ? post.comments.length : 0}
                    </button>
                    <button class="action-btn" onclick="app.sharePost(${post.id})">
                        <i class="fa-regular fa-share-from-square"></i> Share
                    </button>
                </div>

                <!-- Comments Section -->
                <div id="comments-${post.id}" style="display: none; padding: 1rem; border-top: 1px solid var(--glass-border);">
                    <div style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem;">
                        ${post.comments.map(c => `
                            <div style="margin-bottom: 0.5rem; font-size: 0.9rem;">
                                <strong>${c.author.username}</strong>: ${c.content}
                            </div>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." class="glass" style="padding: 0.5rem; flex: 1; border-radius: 0.5rem;">
                        <button class="btn btn-primary" style="width: auto; padding: 0.5rem 1rem;" onclick="app.submitComment(${post.id})">Post</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleComments(postId) {
        const el = document.getElementById(`comments-${postId}`);
        if(el.style.display === 'none') el.style.display = 'block';
        else el.style.display = 'none';
    }

    async submitComment(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value;
        if (!content) return;

        try {
            const response = await fetch(`${API_BASE}/comments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${this.token}`
                },
                body: JSON.stringify({ post: postId, content })
            });

            if (response.ok) {
                input.value = '';
                // Refresh current view
                const currentView = document.getElementById('nav-explore').style.color === 'var(--primary)' ? 'explore/' : '';
                this.fetchPosts(`${API_BASE}/posts/${currentView}`);
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        }
    }

    sharePost(postId) {
        // Dummy share
        const url = `${window.location.origin}/post/${postId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert('Link copied to clipboard!');
        });
    }

    async createPost() {
        const content = document.getElementById('post-input').value;
        if (!content) return;

        try {
            const response = await fetch(`${API_BASE}/posts/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${this.token}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                document.getElementById('post-input').value = '';
                // Clear file input if any
                const fileInput = document.getElementById('media-upload');
                if(fileInput) fileInput.value = '';
                if(document.getElementById('media-preview')) document.getElementById('media-preview').style.display = 'none';
                
                this.showHome();
            }
        } catch (error) {
            console.error('Error creating post:', error);
        }
    }

    async likePost(postId) {
        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/like/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${this.token}` }
            });
            if (response.ok) {
                // Refresh current view instead of just fetchPosts default
                const currentView = document.getElementById('nav-explore').style.color === 'var(--primary)' ? 'explore/' : '';
                this.fetchPosts(`${API_BASE}/posts/${currentView}`);
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }

    async fetchProfiles() {
        try {
            const response = await fetch(`${API_BASE}/profiles/`, {
                headers: { 'Authorization': `Token ${this.token}` }
            });
            const profiles = await response.json();
            this.renderSuggestions(profiles);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        }
    }

    renderSuggestions(profiles) {
        const container = document.getElementById('suggestions-list');
        // Filter out current user
        const others = profiles.filter(p => p.user.username !== this.username).slice(0, 5);
        container.innerHTML = others.map(profile => `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${profile.avatar || 'https://api.dicebear.com/6.x/avataaars/svg?seed=' + profile.user.username}" class="avatar" style="width: 32px; height: 32px;">
                    <div style="font-size: 0.9rem; font-weight: 500">${profile.user.username}</div>
                </div>
                <button class="action-btn" style="color: var(--primary); font-size: 0.8rem; font-weight: 600" onclick="app.followUser(${profile.id})">Follow</button>
            </div>
        `).join('');
    }

    async followUser(profileId) {
        try {
            const response = await fetch(`${API_BASE}/profiles/${profileId}/follow/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${this.token}` }
            });
            if (response.ok) {
                alert('Followed!');
                this.fetchProfiles();
            }
        } catch (error) {
            console.error('Error following user:', error);
        }
    }
}

const app = new SocialApp();
