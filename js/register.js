// ===== Register page: role selection =====
const roleCustomer = document.getElementById('role-customer');
const roleSeller = document.getElementById('role-seller');
const businessFields = document.getElementById('business-fields');
const locationField = document.getElementById('location-field');
 
let selectedRole = 'customer'; // default
 
function setRole(role) {
  selectedRole = role;
 
  if (role === 'customer') {
    roleCustomer.classList.add('selected');
    roleSeller.classList.remove('selected');
    businessFields.classList.remove('show');
    locationField.style.display = 'block';
  } else {
    roleSeller.classList.add('selected');
    roleCustomer.classList.remove('selected');
    businessFields.classList.add('show');
    locationField.style.display = 'none'; // seller uses business-location instead
  }
}
 
if (roleCustomer && roleSeller) {
  roleCustomer.addEventListener('click', () => setRole('customer'));
  roleSeller.addEventListener('click', () => setRole('seller'));
}
 
// ===== Register page: form submit =====
const registerForm = document.getElementById('register-form');
const formError = document.getElementById('form-error');
 
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
 
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
 
    // Basic validation for fields common to both roles
    if (!fullName || !email || !phone || !password) {
      formError.textContent = 'Please fill in all required fields.';
      formError.classList.add('show');
      return;
    }
 
    // Build the user object depending on role
    let userData = {
      role: selectedRole,
      fullName,
      email,
      phone,
      // NOTE: storing plain-text passwords in localStorage is only OK for
      // this frontend-only demo stage. A real backend must hash passwords.
      password
    };
 
    if (selectedRole === 'customer') {
      const location = document.getElementById('location').value.trim();
      if (!location) {
        formError.textContent = 'Please enter your location for nearby recommendations.';
        formError.classList.add('show');
        return;
      }
      userData.location = location;
 
    } else {
      const businessName = document.getElementById('business-name').value.trim();
      const businessCategory = document.getElementById('business-category').value;
      const businessLocation = document.getElementById('business-location').value.trim();
      const businessDescription = document.getElementById('business-description').value.trim();
 
      if (!businessName || !businessCategory || !businessLocation) {
        formError.textContent = 'Please fill in your business details.';
        formError.classList.add('show');
        return;
      }
 
      userData.businessName = businessName;
      userData.businessCategory = businessCategory;
      userData.businessLocation = businessLocation;
      userData.businessDescription = businessDescription;
      userData.approvalStatus = 'pending'; // admin approval step, per your flow
    }
 
    formError.classList.remove('show');
 
    // Temporary storage until a real backend exists.
    // Each registered user is pushed into a "users" array in localStorage.
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    existingUsers.push(userData);
    localStorage.setItem('users', JSON.stringify(existingUsers));
 
    // Keep track of who's currently logged in
    localStorage.setItem('currentUser', JSON.stringify(userData));
 
    // Redirect based on role
    if (selectedRole === 'customer') {
      window.location.href = 'pages/customer/dashboard.html';
    } else {
      window.location.href = 'pages/entrepreneur/dashboard.html';
    }
  })}