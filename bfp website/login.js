import { supabase } from './supabaseClient.js';

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

// ---------- Log in ----------
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
    return;
  }
  window.location.href = 'index.html';
});

// ---------- Sign up: confirm password match, then create account ----------
const signupForm = document.getElementById('signupForm');
const signupError = document.getElementById('signupError');
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;
  if (password !== confirm) {
    signupError.textContent = "Passwords don't match.";
    signupError.classList.remove('hidden');
    return;
  }
  signupError.classList.add('hidden');

  const email = document.getElementById('signupEmail').value.trim();
  const rank = document.getElementById('signupRank').value.trim();
  const fullName = document.getElementById('signupName').value.trim();
  const gender = document.getElementById('signupGender').value;
  const office = document.getElementById('signupOffice').value;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    signupError.textContent = error.message;
    signupError.classList.remove('hidden');
    return;
  }

  await supabase.from('profiles').insert({
    id: data.user.id,
    rank, full_name: fullName, gender, office
  });

  window.location.href = 'index.html';
});
