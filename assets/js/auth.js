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

window.signUp = async function() {
    try {
        console.log('Starting signup...');
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        console.log('Got email and password:', { email });

        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('User created successfully:', user.email);

        // Get token for API call
        const token = await user.getIdToken();
        console.log('Got token, redirecting to profile creation...');

        // Redirect to profile creation
        window.location.href = '/dashboard/create-profile.html';
    } catch (error) {
        console.error('Registration error:', error);
        alert('Error al registrar: ' + error.message);
    }
};

// Function to format name (e.g., "Cristian M. C.")
function formatDisplayName(nombre, apellido) {
    if (!nombre || !apellido) return '';
    
    const firstName = nombre.trim();
    const lastNames = apellido.trim().split(' ');
    const initials = lastNames.map(name => name.charAt(0).toUpperCase() + '.').join(' ');
    
    return `${firstName} ${initials}`;
}

// Auth state observer
auth.onAuthStateChanged(async (user) => {
    const authElements = document.querySelectorAll('[data-auth]');
    const nonAuthElements = document.querySelectorAll('[data-non-auth]');
    const userNameElements = document.querySelectorAll('[data-user-name]');
    
    if (user) {
        // User is signed in
        authElements.forEach(el => el.style.display = 'block');
        nonAuthElements.forEach(el => el.style.display = 'none');
        
        try {
            const token = await user.getIdToken(true);
            
            // Skip profile check if we're already on the create-profile page
            if (window.location.pathname.includes('/dashboard/create-profile.html')) {
                userNameElements.forEach(el => el.textContent = user.email);
                return;
            }

            // Get user profile
            const profileResponse = await fetch('http://localhost:5000/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            // If profile doesn't exist, redirect to create-profile
            if (profileResponse.status === 404) {
                window.location.href = '/dashboard/create-profile.html';
                return;
            }

            // If we have a profile, update the display name
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                const displayName = formatDisplayName(profileData.nombre, profileData.apellido);
                userNameElements.forEach(el => el.textContent = displayName || user.email);
            }

            // Get user role and redirect to appropriate dashboard
            const roleResponse = await fetch('http://localhost:5000/api/user/role', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (roleResponse.ok) {
                const { role } = await roleResponse.json();
                if (!window.location.pathname.includes('/dashboard/')) {
                    window.location.href = role === 'teacher' ? '/dashboard/teacher.html' : '/dashboard/student.html';
                }
            }
        } catch (error) {
            console.error('Error in auth state change:', error);
            userNameElements.forEach(el => el.textContent = user.email);
        }
    } else {
        // User is signed out
        authElements.forEach(el => el.style.display = 'none');
        nonAuthElements.forEach(el => el.style.display = 'block');
        userNameElements.forEach(el => el.textContent = '');
        
        // Redirect to home if on a protected page
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
