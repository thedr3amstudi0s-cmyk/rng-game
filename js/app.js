// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
  }, 1000);
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
      showGameScreen();
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

function showGameScreen() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  setupGameListeners();
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
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showAuthError('login', 'Please fill in all fields');
    return;
  }
  
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      showGameScreen();
    })
    .catch(error => {
      showAuthError('login', error.message);
    });
}

function handleRegister() {
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
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
  
  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      // Create user profile in Firestore
      return db.collection('users').doc(userCredential.user.uid).set({
        username: username,
        email: email,
        coins: 400,
        inventory: [],
        createdAt: new Date(),
        lastActive: new Date()
      });
    })
    .then(() => {
      showGameScreen();
    })
    .catch(error => {
      showAuthError('reg', error.message);
    });
}

function showAuthError(form, message) {
  document.getElementById(form + '-error').textContent = message;
}

// ============================================================
// GAME LISTENERS
// ============================================================
function setupGameListeners() {
  const user = auth.currentUser;
  if (user) {
    document.getElementById('nav-username').textContent = user.email;
    
    // Load user data
    loadUserData(user.uid);
  }
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', function() {
    auth.signOut().then(() => {
      showAuthScreen();
    });
  });
  
  // Page navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      const page = this.dataset.page;
      navigateToPage(page);
    });
  });
}

function loadUserData(uid) {
  db.collection('users').doc(uid).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById('coin-balance').textContent = userData.coins || 0;
        console.log('User data loaded:', userData);
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
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector('[data-page="' + page + '"]').classList.add('active');
}

console.log('app.js loaded successfully');
