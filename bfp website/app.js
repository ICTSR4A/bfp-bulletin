import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ---- Configure these two values for your project ----
const SUPABASE_URL = 'https://awqnrdbytynmalgccocp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cW5yZGJ5dHlubWFsZ2Njb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMDg4NjYsImV4cCI6MjEwMzg4NDg2Nn0.1DDhapp1g_dy_xBPYvNNPJPd9jGgW9FyhaEe0mlegV8';
// -------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET = 'memo-attachments';

const feedEl = document.getElementById('feed');
const composer = document.getElementById('composer');
const composerToggle = document.getElementById('composerToggle');
const cancelPost = document.getElementById('cancelPost');
const postForm = document.getElementById('postForm');
const loginPanel = document.getElementById('loginPanel');
const loginForm = document.getElementById('loginForm');
const cancelLogin = document.getElementById('cancelLogin');
const submitLogin = document.getElementById('submitLogin');
const loginError = document.getElementById('loginError');
const accountEmail = document.getElementById('accountEmail');
const signOutBtn = document.getElementById('signOutBtn');
const imageInput = document.getElementById('postImages');
const imagePreview = document.getElementById('imagePreview');
const submitBtn = document.getElementById('submitPost');
const cardTemplate = document.getElementById('postCardTemplate');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

let activeFilter = 'all';
let allPosts = [];
let selectedFiles = [];
let currentUser = null;

// ---------- Auth state ----------
supabase.auth.getSession().then(({ data }) => {
  applyAuthState(data.session?.user ?? null);
});

supabase.auth.onAuthStateChange((_event, session) => {
  applyAuthState(session?.user ?? null);
});

function applyAuthState(user) {
  currentUser = user;
  if (user) {
    accountEmail.textContent = user.email;
    accountEmail.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
  } else {
    accountEmail.classList.add('hidden');
    signOutBtn.classList.add('hidden');
    composer.classList.add('hidden');
  }
}

// ---------- Composer open/close (gated behind sign-in) ----------
composerToggle.addEventListener('click', () => {
  if (currentUser) {
    composer.classList.remove('hidden');
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    loginPanel.classList.remove('hidden');
    loginPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
cancelPost.addEventListener('click', () => resetComposer());

function resetComposer() {
  postForm.reset();
  selectedFiles = [];
  imagePreview.innerHTML = '';
  composer.classList.add('hidden');
}

// ---------- Sign in / sign out ----------
cancelLogin.addEventListener('click', () => {
  loginForm.reset();
  loginError.classList.add('hidden');
  loginPanel.classList.add('hidden');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitLogin.disabled = true;
  submitLogin.textContent = 'Signing in…';
  loginError.classList.add('hidden');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
  } else {
    loginForm.reset();
    loginPanel.classList.add('hidden');
    composer.classList.remove('hidden');
    composer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submitLogin.disabled = false;
  submitLogin.textContent = 'Sign in';
});

signOutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// ---------- Image preview ----------
imageInput.addEventListener('change', () => {
  selectedFiles = Array.from(imageInput.files);
  imagePreview.innerHTML = '';
  selectedFiles.forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    imagePreview.appendChild(img);
  });
});

// ---------- Submit new post ----------
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Publishing…';

  try {
    const category = document.getElementById('postCategory').value;
    const title = document.getElementById('postTitle').value.trim();
    const body = document.getElementById('postBody').value.trim();
    const station = document.getElementById('postStation').value.trim();
    const province = document.getElementById('postProvince').value.trim();

    // 1. Upload images to Storage first, collect their public URLs
    const imageUrls = [];
    for (const file of selectedFiles) {
      const path = `${province || 'unassigned'}/${Date.now()}-${file.name}`.replace(/\s+/g, '-');
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      imageUrls.push(publicUrlData.publicUrl);
    }

    // 2. Insert the post row
    const { error: insertError } = await supabase.from('posts').insert({
      title,
      category,
      body,
      station,
      province,
      image_urls: imageUrls,
      posted_by: currentUser.id
    });

    if (insertError) throw insertError;

    resetComposer();
    await loadPosts();
  } catch (err) {
    console.error(err);
    alert('Something went wrong publishing this post: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publish';
  }
});

// ---------- Filters ----------
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderFeed();
  });
});

// ---------- Load + render ----------
async function loadPosts() {
  feedEl.innerHTML = '<p class="feed-loading">Loading posts…</p>';

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    feedEl.innerHTML = `<p class="feed-empty">Couldn't load posts: ${error.message}</p>`;
    return;
  }

  allPosts = data;
  renderFeed();
}

function renderFeed() {
  const posts = activeFilter === 'all'
    ? allPosts
    : allPosts.filter(p => p.category === activeFilter);

  feedEl.innerHTML = '';

  if (posts.length === 0) {
    feedEl.innerHTML = '<p class="feed-empty">No posts yet in this category.</p>';
    return;
  }

  posts.forEach(post => feedEl.appendChild(buildCard(post)));
}

function buildCard(post) {
  const node = cardTemplate.content.cloneNode(true);

  const stamp = node.querySelector('.stamp');
  stamp.textContent = post.category;
  stamp.classList.add(post.category);

  node.querySelector('.card-title').textContent = post.title;
  node.querySelector('.card-author').textContent = 'BFP Region IV-A';
  node.querySelector('.card-date').textContent = formatDate(post.created_at);
  node.querySelector('.card-station').textContent = [post.station, post.province].filter(Boolean).join(', ');
  node.querySelector('.card-body').textContent = post.body || '';

  const imagesWrap = node.querySelector('.card-images');
  (post.image_urls || []).forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = post.title;
    img.addEventListener('click', () => openLightbox(url));
    imagesWrap.appendChild(img);
  });

  return node;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ---------- Lightbox ----------
function openLightbox(url) {
  lightboxImg.src = url;
  lightbox.classList.remove('hidden');
}
lightboxClose.addEventListener('click', () => lightbox.classList.add('hidden'));
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) lightbox.classList.add('hidden');
});

// ---------- Init ----------
loadPosts();
