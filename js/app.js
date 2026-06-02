// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAJnboCJ0RwHjik8X7M-ESavSlV-cZYaeM",
  authDomain: "rng-game-13854.firebaseapp.com",
  databaseURL: "https://rng-game-13854-default-rtdb.firebaseio.com",
  projectId: "rng-game-13854",
  storageBucket: "rng-game-13854.appspot.com",
  messagingSenderId: "60292248542",
  appId: "1:60292248542:web:2942a3a407dab5d51a234f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded - Initializing CrateVault...');
  
  // Remove loading overlay after a short delay to simulate loading
  setTimeout(function() {
    hideLoadingOverlay();
    initializeUI();
  }, 1500);
});

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('fade-out');
  console.log('Loading overlay hidden');
}

function initializeUI() {
  // Check if user is logged in
  auth.onAuthStateChanged(function(user) {
    if (user) {
      console.log('User logged in:', user.email);
      showGameScreen(user);
    } else {
      console.log('No user logged in');
      showAuthScreen();
    }
  });
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('game-screen').classList.remove('active');
  setupAuthListeners();
}

function showGameScreen(user) {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  setupGameListeners(user);
}

// ============================================================
// AUTH LISTENERS
// ============================================================
function setupAuthListeners() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
      
      this.classList.add('active');
      document.getElementById(tabName + '-form').classList.remove('hidden');
    });
  });
  
  // Login button
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  
  // Register button
  document.getElementById('register-btn').addEventListener('click', handleRegister);
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showAuthError('login', 'Please fill in all fields');
    return;
  }
  
  // Disable button during login
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';
  
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      console.log('Login successful:', userCredential.user.email);
      showGameScreen(userCredential.user);
    })
    .catch(error => {
      console.error('Login error:', error);
      showAuthError('login', error.message);
      btn.disabled = false;
      btn.textContent = 'ENTER THE VAULT';
    });
}

function handleRegister() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  
  if (!username || !email || !password) {
    showAuthError('reg', 'Please fill in all fields');
    return;
  }
  
  if (username.length < 3 || username.length > 20) {
    showAuthError('reg', 'Username must be 3-20 characters');
    return;
  }
  
  if (password.length < 6) {
    showAuthError('reg', 'Password must be at least 6 characters');
    return;
  }
  
  // Disable button during registration
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating Account...';
  
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Create user profile in Firestore
      return db.collection('users').doc(userCredential.user.uid).set({
        username: username,
        email: email,
        coins: 400,
        inventory: [],
        createdAt: new Date(),
        lastActive: new Date(),
        stats: {
          cratesOpened: 0,
          totalSpent: 0,
          totalWon: 0
        }
      }).then(() => userCredential.user);
    })
    .then(user => {
      console.log('Registration successful:', user.email);
      showGameScreen(user);
    })
    .catch(error => {
      console.error('Registration error:', error);
      showAuthError('reg', error.message);
      btn.disabled = false;
      btn.textContent = 'CREATE ACCOUNT';
    });
}

function showAuthError(form, message) {
  document.getElementById(form + '-error').textContent = message;
}

// ============================================================
// GAME LISTENERS
// ============================================================
function setupGameListeners(user) {
  if (user) {
    document.getElementById('nav-username').textContent = user.email.split('@')[0];
    
    // Load user data
    loadUserData(user.uid);
  }
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', function() {
    auth.signOut().then(() => {
      console.log('User logged out');
      showAuthScreen();
      // Clear forms
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      document.getElementById('reg-username').value = '';
      document.getElementById('reg-email').value = '';
      document.getElementById('reg-password').value = '';
    });
  });
  
  // Page navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const page = this.dataset.page;
      navigateToPage(page);
    });
  });
  
  // Chat functionality (basic)
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  
  if (chatInput && chatSend) {
    chatSend.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendChatMessage();
    });
  }
}

function loadUserData(uid) {
  db.collection('users').doc(uid).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById('coin-balance').textContent = userData.coins || 0;
        console.log('User data loaded:', userData);
      } else {
        console.log('User document not found');
      }
    })
    .catch(error => {
      console.error('Error loading user data:', error);
    });
}

function navigateToPage(page) {
  // Remove active class from all pages and nav items
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  // Add active class to selected page and nav item
  const pageEl = document.getElementById('page-' + page);
  const navEl = document.querySelector('[data-page="' + page + '"]');
  
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');
  
  console.log('Navigated to page:', page);
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  const user = auth.currentUser;
  if (!user) return;
  
  // Save message to Firestore
  db.collection('chat').add({
    username: user.email.split('@')[0],
    message: message,
    timestamp: new Date(),
    uid: user.uid
  }).then(() => {
    input.value = '';
    console.log('Message sent');
  }).catch(error => {
    console.error('Error sending message:', error);
  });
}

console.log('✅ CrateVault app.js loaded successfully with real Firebase config');
