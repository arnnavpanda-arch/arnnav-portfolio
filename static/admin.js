document.addEventListener('DOMContentLoaded', checkAuth);

async function checkAuth() {
    const res = await fetch('/api/check_auth?t=' + new Date().getTime(), {
        cache: 'no-store'
    });
    const data = await res.json();
    if (data.authenticated) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadData();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
}

async function login() {
    const btn = document.querySelector('button[onclick="login()"]');
    if(btn) { btn.innerText = "Authenticating..."; btn.disabled = true; }
    
    const pass = document.getElementById('admin-password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    
    if (data.success) {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadData();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
    
    if(btn) { btn.innerText = "Login"; btn.disabled = false; }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    checkAuth();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    event.target.classList.add('active');
    document.getElementById('tab-' + tabId).classList.remove('hidden');
}

// Data loading
async function loadData() {
    const res = await fetch('/api/data?t=' + new Date().getTime(), { cache: 'no-store' });
    const data = await res.json();
    
    if (data.about) document.getElementById('about-text').value = data.about.text || '';
    
    renderList('skills-list', data.skills, item => `<b>${item.category}</b>: ${item.items.join(', ')}`, 'skills');
    renderList('projects-list', data.projects, item => `<b>${item.emoji || '💻'} ${item.title}</b>`, 'projects');
    renderList('experience-list', data.experience, item => `<b>${item.title}</b> at ${item.company}`, 'experience');
    renderList('education-list', data.education, item => `<b>${item.degree}</b> at ${item.institution}`, 'education');
    renderList('awards-list', data.awards, item => `<b>${item.title}</b>`, 'awards');
    renderList('certifications-list', data.certifications, item => `<b>${item.title}</b>`, 'certifications');
    renderList('gallery-list', data.gallery, item => `<img src="/api/file/${item.file_id}" style="height:50px; margin-right:10px; border-radius:5px;"> ${item.caption}`, 'gallery');
    
    // Render Feedback
    if (data.feedback) {
        renderList('feedback-list', data.feedback, item => `<b>${item.name}</b>: ${'⭐'.repeat(item.stars)}`, 'feedback');
    }
    
    if (data.resume) {
        const resumeContainer = document.getElementById('resume-current');
        if (resumeContainer) {
            resumeContainer.innerHTML = `<p style="margin-top: 1rem; color: #3b82f6;">Current Resume: <a href="/api/file/${data.resume}" target="_blank" style="color: #3b82f6; text-decoration: underline; font-weight: bold;">Download / View</a></p>`;
        }
    } else {
        const resumeContainer = document.getElementById('resume-current');
        if (resumeContainer) {
            resumeContainer.innerHTML = `<p style="margin-top: 1rem; color: #ef4444;">No resume currently uploaded.</p>`;
        }
    }
    
    if (data.profile_photo) {
        const profileContainer = document.getElementById('profile-current');
        if (profileContainer) {
            profileContainer.innerHTML = `<p style="margin-top: 1rem; color: #3b82f6;">Current Profile Photo:</p><img src="/api/file/${data.profile_photo}" style="height:100px; border-radius:10px; margin-top:10px;">`;
        }
    } else {
        const profileContainer = document.getElementById('profile-current');
        if (profileContainer) {
            profileContainer.innerHTML = `<p style="margin-top: 1rem; color: #ef4444;">No custom profile photo uploaded.</p>`;
        }
    }
}

function renderList(elementId, items, htmlFunc, collection) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        // Exclude gallery from being editable via prompt (since it has a file_id)
        let editBtn = '';
        if (collection !== 'gallery' && collection !== 'feedback') {
            const itemJson = JSON.stringify(item).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            editBtn = `<button style="background: #3b82f6; margin-right: 10px;" onclick="editItem('${collection}', '${item._id}', '${itemJson}')">Edit</button>`;
        }
        
        div.innerHTML = `
            <div style="display:flex; align-items:center;">${htmlFunc(item)}</div>
            <div>
                ${editBtn}
                <button onclick="deleteItem('${collection}', '${item._id}')">Delete</button>
            </div>
        `;
        el.appendChild(div);
    });
}

// Add/Edit/Delete Functions
async function saveAbout() {
    const text = document.getElementById('about-text').value;
    await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    alert('About saved!');
}

async function addItem(collection, data) {
    await fetch(`/api/admin/${collection}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    loadData();
}

async function deleteItem(collection, id) {
    if(confirm('Are you sure you want to delete this?')) {
        await fetch(`/api/admin/${collection}/${id}`, { method: 'DELETE' });
        loadData();
    }
}

async function editItem(collection, id, itemJson) {
    const item = JSON.parse(itemJson);
    const updatedItem = {};
    
    // Prompt the user for each key (except _id)
    for (let key in item) {
        if (key === '_id') continue;
        
        let currentValue = item[key];
        if (Array.isArray(currentValue)) {
            currentValue = currentValue.join(', ');
        }
        
        let newValue = prompt(`Edit ${key}:`, currentValue);
        if (newValue === null) return; // User cancelled
        
        if (Array.isArray(item[key])) {
            updatedItem[key] = newValue.split(',').map(s => s.trim());
        } else {
            updatedItem[key] = newValue;
        }
    }
    
    // Send PUT request
    await fetch(`/api/admin/${collection}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
    });
    loadData();
}

function addSkill() {
    const cat = document.getElementById('skill-cat').value;
    const items = document.getElementById('skill-items').value.split(',').map(s => s.trim());
    addItem('skills', { category: cat, items });
}

function addProject() {
    const title = document.getElementById('proj-title').value;
    const emoji = document.getElementById('proj-emoji').value;
    const description = document.getElementById('proj-desc').value;
    const link = document.getElementById('proj-link').value;
    addItem('projects', { title, emoji, description, link });
}

function addExperience() {
    const title = document.getElementById('exp-title').value;
    const company = document.getElementById('exp-company').value;
    const date = document.getElementById('exp-date').value;
    const description = document.getElementById('exp-desc').value;
    addItem('experience', { title, company, date, description });
}

function addEducation() {
    const degree = document.getElementById('edu-degree').value;
    const institution = document.getElementById('edu-inst').value;
    const date = document.getElementById('edu-date').value;
    const description = document.getElementById('edu-desc').value;
    addItem('education', { degree, institution, date, description });
}

function addAward() {
    const title = document.getElementById('awd-title').value;
    const description = document.getElementById('awd-desc').value;
    addItem('awards', { title, description });
}

function addCertification() {
    const title = document.getElementById('cert-title').value;
    const description = document.getElementById('cert-desc').value;
    addItem('certifications', { title, description });
}

// File Uploads
async function uploadGallery() {
    const fileInput = document.getElementById('gal-file');
    const caption = document.getElementById('gal-caption').value;
    const status = document.getElementById('gal-status');
    
    if(!fileInput.files[0]) return alert("Select an image!");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('caption', caption);
    
    status.innerText = "Uploading...";
    const res = await fetch('/api/upload_gallery', { method: 'POST', body: formData });
    
    if(res.ok) {
        status.innerText = "Uploaded successfully!";
        fileInput.value = '';
        document.getElementById('gal-caption').value = '';
        loadData();
    } else {
        status.innerText = "Upload failed.";
    }
}

async function uploadResume() {
    const fileInput = document.getElementById('res-file');
    const status = document.getElementById('res-status');
    
    if(!fileInput.files[0]) return alert("Select a PDF/DOC!");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    status.innerText = "Uploading...";
    const res = await fetch('/api/upload_resume', { method: 'POST', body: formData });
    
    if(res.ok) {
        status.innerText = "Resume Uploaded successfully!";
        fileInput.value = '';
    } else {
        status.innerText = "Upload failed.";
    }
}

async function removeResume() {
    if(!confirm('Are you sure you want to remove the current resume?')) return;
    
    const res = await fetch('/api/admin/resume', { method: 'DELETE' });
    if(res.ok) {
        alert("Resume removed successfully!");
        loadData();
    } else {
        alert("Failed to remove resume.");
    }
}

async function uploadProfilePhoto() {
    const fileInput = document.getElementById('profile-upload');
    if(!fileInput.files[0]) return alert("Select an image!");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const res = await fetch('/api/upload_profile_photo', { method: 'POST', body: formData });
    if(res.ok) {
        alert("Profile photo updated!");
        fileInput.value = '';
        loadData();
    } else {
        alert("Upload failed.");
    }
}

async function removeProfilePhoto() {
    if(!confirm("Are you sure you want to remove the profile photo?")) return;
    const res = await fetch('/api/admin/profile_photo', { method: 'DELETE' });
    if(res.ok) {
        alert("Profile photo removed!");
        loadData();
    }
}

// Real-time Updates for Admin Dashboard
try {
    const socket = io();
    socket.on('data_updated', () => {
        // Only reload data if the admin is logged in (to prevent unauthorized errors)
        if (!document.getElementById('login-screen').classList.contains('hidden')) return;
        loadData();
    });
} catch (e) {
    console.warn("Socket.io could not be loaded", e);
}
