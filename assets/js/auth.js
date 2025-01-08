// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBm1e-_RERs-KwLzREHKrr6tBkumMMKMGc",
  authDomain: "aplus-academy-67f52.firebaseapp.com",
  projectId: "aplus-academy-67f52",
  storageBucket: "aplus-academy-67f52.firebasestorage.app",
  messagingSenderId: "414936083132",
  appId: "1:414936083132:web:b9379090efa97693427eb9",
  measurementId: "G-V6ZGQFG9P9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Make functions globally available
window.handleSignOut = async function() {
  try {
    await auth.signOut();
    window.location.href = '/';
  } catch (error) {
    console.error('Error signing out:', error);
    alert(error.message);
  }
};

window.signIn = async function(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    // Don't show any error messages if login is successful
    const errorElement = document.querySelector('#loginError');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    const errorElement = document.querySelector('#loginError');
    if (errorElement) {
      errorElement.textContent = error.message;
      errorElement.style.display = 'block';
    }
    throw error;
  }
};

window.signUp = async function(email, password, displayName) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName });
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Auth state observer
auth.onAuthStateChanged(async (user) => {
  const authElements = document.querySelectorAll('[data-auth]');
  const nonAuthElements = document.querySelectorAll('[data-non-auth]');
  
  if (user) {
    // User is signed in
    authElements.forEach(el => el.style.display = 'block');
    nonAuthElements.forEach(el => el.style.display = 'none');
    
    // Get user role and redirect to appropriate dashboard
    try {
      const token = await user.getIdToken();
      const response = await fetch('http://localhost:5000/api/user/role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const { role } = await response.json();
      
      // Update UI based on role
      const userNameElements = document.querySelectorAll('[data-user-name]');
      userNameElements.forEach(el => {
        el.textContent = `${user.displayName || user.email} (${role})`;
      });

      // Redirect to appropriate dashboard if on index page
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        switch(role) {
          case 'admin':
          case 'teacher':
            window.location.href = '/dashboard/teacher.html';
            break;
          case 'student':
          default:
            window.location.href = '/dashboard/student.html';
            break;
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error);
      // Default to student dashboard if role fetch fails
      if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.location.href = '/dashboard/student.html';
      }
    }
  } else {
    // User is signed out
    authElements.forEach(el => el.style.display = 'none');
    nonAuthElements.forEach(el => el.style.display = 'block');
    
    // Redirect to home if on dashboard pages
    if (window.location.pathname.includes('/dashboard/')) {
      window.location.href = '/';
    }
  }
});

// Get current user's ID token
async function getCurrentUserToken() {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
}

// API calls with authentication
async function callAuthenticatedAPI(endpoint, options = {}) {
  const token = await getCurrentUserToken();
  if (!token) throw new Error('No authentication token available');

  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}
