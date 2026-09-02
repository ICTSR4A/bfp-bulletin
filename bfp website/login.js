// ---------- Password visibility toggles ----------
document.querySelectorAll('.eye-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('.eye-open').classList.toggle('hidden', isHidden);
    btn.querySelector('.eye-closed').classList.toggle('hidden', !isHidden);
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

// ---------- Switch between login and signup cards ----------
const loginCard = document.getElementById('loginCard');
const signupCard = document.getElementById('signupCard');

document.getElementById('showSignup').addEventListener('click', () => {
  loginCard.classList.add('hidden');
  signupCard.classList.remove('hidden');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  signupCard.classList.add('hidden');
  loginCard.classList.remove('hidden');
});

// ---------- Sign up: confirm password match ----------
// NOTE: this is front-end only for now. Wire the actual account
// creation (e.g. Supabase auth.signUp + an insert into a profiles
// table with rank/full name/gender/office) once the design is approved.
const signupForm = document.getElementById('signupForm');
const signupError = document.getElementById('signupError');

signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;

  if (password !== confirm) {
    signupError.textContent = "Passwords don't match.";
    signupError.classList.remove('hidden');
    return;
  }

  signupError.classList.add('hidden');
  // TODO: hook up account creation here.
  alert('Account details look good. Backend hookup still to come.');
});

// ---------- Log in ----------
// NOTE: front-end only for now — wire to Supabase auth.signInWithPassword
// once this design is approved (see the bulletin app's app.js for the pattern).
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Login form looks good. Backend hookup still to come.');
});
