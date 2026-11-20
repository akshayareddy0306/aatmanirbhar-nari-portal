
// ===== Splash Screen (index.html) =====
// ===== Splash Screen (index.html) =====
const splash = document.getElementById('splash');
if (splash) {
  setTimeout(() => {
    splash.classList.add('hide');
  }, 2200);
}

// ===== Auth page: role selection (login.html) =====
const roleBuyer = document.getElementById('role-buyer');
const roleSeller = document.getElementById('role-seller');
if (roleBuyer && roleSeller) {
  roleBuyer.addEventListener('click', () => {
    roleBuyer.classList.add('selected');
    roleSeller.classList.remove('selected');
  });
  roleSeller.addEventListener('click', () => {
    roleSeller.classList.add('selected');
    roleBuyer.classList.remove('selected');
  });
}

// ===== Auth page: tab + link switching between Sign up / Login =====
const tabRegister = document.getElementById('tab-register');
const tabLogin = document.getElementById('tab-login');
const formRegister = document.getElementById('form-register');
const formLogin = document.getElementById('form-login');

function showRegister() {
  formRegister.style.display = 'block';
  formLogin.style.display = 'none';
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
}
function showLogin() {
  formRegister.style.display = 'none';
  formLogin.style.display = 'block';
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
}

if (tabRegister && tabLogin) {
  tabRegister.addEventListener('click', showRegister);
  tabLogin.addEventListener('click', showLogin);

  const linkToLogin = document.getElementById('link-to-login');
  const linkToRegister = document.getElementById('link-to-register');
  if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
  if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
}

