// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCvrU7BvAZNL7wMuJh0oQ9-8HuiFOmwVIo",
    authDomain: "eh-gen-x.firebaseapp.com",
    databaseURL: "https://eh-gen-x-default-rtdb.firebaseio.com",
    projectId: "eh-gen-x",
    storageBucket: "eh-gen-x.firebasestorage.app",
    messagingSenderId: "702774027026",
    appId: "1:702774027026:web:e290bfadd3aa99f41549cb",
    measurementId: "G-BDQ340MS33"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Variables
let posts = [];
let currentPage = 'home';

// ================ SIDEBAR FUNCTIONS ================
function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    let overlay = document.getElementById("overlay");
    
    if (!overlay) {
        overlay = createOverlay();
    }
    
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    
    // Prevent body scroll when menu is open
    if (sidebar.classList.contains("active")) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    
    const menuIcon = document.querySelector(".menu");
    menuIcon.innerHTML = sidebar.classList.contains("active") ? "✕" : "☰";
}

function createOverlay() {
    let overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.className = 'overlay';
    overlay.addEventListener('click', closeMenu);
    document.body.appendChild(overlay);
    return overlay;
}

function closeMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    
    if (sidebar) sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    
    document.body.style.overflow = '';
    
    const menuIcon = document.querySelector(".menu");
    if (menuIcon) menuIcon.innerHTML = "☰";
}

// ================ POSTS FUNCTIONS ================
function loadPosts() {
    const postsRef = database.ref('posts');
    postsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            posts = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            displayPosts(posts);
        } else {
            addDefaultPosts();
        }
    });
}

function addDefaultPosts() {
    const postsRef = database.ref('posts');
    const defaultPosts = [
        {
            title: "Free Website Source Code",
            description: "Download modern website HTML CSS JavaScript source code.",
            image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800",
            content: "This is a modern website template created using HTML, CSS and JavaScript. You can download and use this template for your own website project. It includes modern UI design, responsive layout and clean code.",
            features: "✔ Responsive Design\n✔ Modern UI\n✔ Easy to Customize\n✔ Free to Use",
            downloadUrl: "#",
            downloads: 0,
            views: 0,
            timestamp: Date.now()
        },
        {
            title: "Thumbnail Generator Tool",
            description: "Create AI YouTube thumbnails easily using this tool.",
            image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800",
            content: "Create stunning YouTube thumbnails with our AI-powered tool. Generate professional thumbnails in seconds with customizable templates.",
            features: "✔ AI Powered\n✔ Multiple Templates\n✔ HD Quality\n✔ Free to Use",
            downloadUrl: "#",
            downloads: 0,
            views: 0,
            timestamp: Date.now()
        },
        {
            title: "CapCut Pro Template",
            description: "Download trending CapCut template for video editing.",
            image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800",
            content: "Get access to premium CapCut Pro templates. Create viral videos with trending effects and transitions.",
            features: "✔ Pro Effects\n✔ Trending Templates\n✔ Easy to Edit\n✔ Regular Updates",
            downloadUrl: "#",
            downloads: 0,
            views: 0,
            timestamp: Date.now()
        }
    ];
    
    defaultPosts.forEach(post => {
        postsRef.push(post);
    });
}

function displayPosts(postsToShow) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';
    
    if (!postsToShow || postsToShow.length === 0) {
        postsContainer.innerHTML = '<div class="no-posts">No posts found</div>';
        return;
    }
    
    postsToShow.forEach(post => {
        const postElement = document.createElement('a');
        postElement.href = `details.html?id=${post.id}`;
        postElement.className = 'post';
        
        postElement.innerHTML = `
            <img src="${post.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'}" 
                 alt="${post.title}"
                 loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'">
            <div class="post-text">
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.description)}</p>
                <div class="post-meta">
                    <span><i class="fas fa-download"></i> ${post.downloads || 0}</span>
                    <span><i class="fas fa-eye"></i> ${post.views || 0}</span>
                </div>
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================ DETAILS PAGE FUNCTIONS ================
function loadPostDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        window.location.href = 'index.html';
        return;
    }
    
    // Track view
    trackPostView(postId);
    
    const postRef = database.ref(`posts/${postId}`);
    postRef.on('value', (snapshot) => {
        const post = snapshot.val();
        if (post) {
            displayPostDetails(post, postId);
        } else {
            window.location.href = 'index.html';
        }
    });
}

function displayPostDetails(post, postId) {
    const detailsContainer = document.getElementById('detailsContainer');
    if (!detailsContainer) return;
    
    // Format features as list
    let featuresHtml = '';
    if (post.features) {
        const features = post.features.split('\n').filter(f => f.trim());
        if (features.length > 0) {
            featuresHtml = `
                <div class="features-section">
                    <h3>Features:</h3>
                    <ul>
                        ${features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
    }
    
    detailsContainer.innerHTML = `
        <img src="${post.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'}" 
             class="details-img" 
             alt="${escapeHtml(post.title)}"
             onerror="this.src='https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'">
        
        <h1>${escapeHtml(post.title)}</h1>
        
        <div class="details-description">
            ${escapeHtml(post.description)}
        </div>
        
        <div class="details-content">
            ${escapeHtml(post.content).replace(/\n/g, '<br>')}
        </div>
        
        ${featuresHtml}
        
        <a href="${post.downloadUrl || '#'}" 
           class="download-btn" 
           onclick="return handleDownload(event, '${postId}')">
            <i class="fas fa-download"></i> Download Now
        </a>
        
        <div class="post-stats">
            <span><i class="fas fa-download"></i> Downloads: ${post.downloads || 0}</span>
            <span><i class="fas fa-eye"></i> Views: ${post.views || 0}</span>
        </div>
    `;
}

function trackPostView(postId) {
    const viewsRef = database.ref(`posts/${postId}/views`);
    viewsRef.transaction((current) => {
        return (current || 0) + 1;
    });
}

function handleDownload(event, postId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    const downloadLink = event.currentTarget.getAttribute('href');
    
    if (downloadLink && downloadLink !== '#') {
        // Update download count
        const downloadsRef = database.ref(`posts/${postId}/downloads`);
        downloadsRef.transaction((current) => {
            return (current || 0) + 1;
        });
        
        // Open in new tab
        window.open(downloadLink, '_blank');
        
        // Show success message
        showMessage('Download started!', 'success');
    } else {
        showMessage('Download link not available!', 'error');
    }
    
    return false;
}

function showMessage(text, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${text}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// ================ SEARCH FUNCTIONS ================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                displayPosts(posts);
            } else {
                const filteredPosts = posts.filter(post => 
                    (post.title && post.title.toLowerCase().includes(searchTerm)) || 
                    (post.description && post.description.toLowerCase().includes(searchTerm))
                );
                displayPosts(filteredPosts);
            }
        }, 300); // Debounce search
    });
}

// ================ PAGE NAVIGATION ================
function showContactPage() {
    closeMenu();
    
    const postsSection = document.querySelector('.posts');
    const contactBox = document.getElementById('contactBox');
    const developerBox = document.querySelector('.developer-box');
    
    if (postsSection) postsSection.style.display = 'none';
    if (contactBox) contactBox.style.display = 'block';
    if (developerBox) developerBox.style.display = 'none';
    
    currentPage = 'contact';
}

function showDeveloperPage() {
    closeMenu();
    
    const postsSection = document.querySelector('.posts');
    const contactBox = document.getElementById('contactBox');
    const developerBox = document.querySelector('.developer-box');
    
    if (postsSection) postsSection.style.display = 'none';
    if (contactBox) contactBox.style.display = 'none';
    if (developerBox) developerBox.style.display = 'block';
    
    currentPage = 'developer';
}

function showHomePage() {
    const postsSection = document.querySelector('.posts');
    const contactBox = document.getElementById('contactBox');
    const developerBox = document.querySelector('.developer-box');
    
    if (postsSection) postsSection.style.display = 'block';
    if (contactBox) contactBox.style.display = 'none';
    if (developerBox) developerBox.style.display = 'none';
    
    currentPage = 'home';
}

// ================ INITIALIZATION ================
document.addEventListener('DOMContentLoaded', function() {
    // Create overlay
    createOverlay();
    
    // Check which page we're on
    if (window.location.pathname.includes('details.html')) {
        loadPostDetails();
    } else {
        loadPosts();
        setupSearch();
    }
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });
    
    // Handle back button
    window.addEventListener('popstate', function() {
        if (currentPage !== 'home') {
            showHomePage();
        }
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(closeMenu, 100);
        });
    });
    
    // Add scroll effect to header
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

// Make functions global
window.toggleMenu = toggleMenu;
window.showContactPage = showContactPage;
window.showDeveloperPage = showDeveloperPage;
window.showHomePage = showHomePage;
window.handleDownload = handleDownload;