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
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("'" + tabId + "'")) {
            btn.classList.add('active');
        }
    });
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    document.getElementById('tab-' + tabId).classList.remove('hidden');
}

// Data loading
async function loadData() {
    const res = await fetch('/api/data?t=' + new Date().getTime(), { cache: 'no-store' });
    const data = await res.json();
    
    if (data.about) {
        document.getElementById('about-text').value = data.about.text || '';
        if (document.getElementById('about-name')) document.getElementById('about-name').value = data.about.name || '';
        if (document.getElementById('about-role1')) document.getElementById('about-role1').value = data.about.role1 || '';
        if (document.getElementById('about-role2')) document.getElementById('about-role2').value = data.about.role2 || '';
        if (document.getElementById('about-location')) document.getElementById('about-location').value = data.about.location || '';
        if (document.getElementById('about-email')) document.getElementById('about-email').value = data.about.email || '';
        if (document.getElementById('about-linkedin')) document.getElementById('about-linkedin').value = data.about.linkedin || '';
        if (document.getElementById('about-github')) document.getElementById('about-github').value = data.about.github || '';
        if (document.getElementById('about-advice-link')) document.getElementById('about-advice-link').value = data.about.advice_link || data.advice_link || '';
    }
    
    renderList('skills-list', data.skills, item => `<b>${item.category}</b>: ${item.items.join(', ')}`, 'skills');
    renderList('projects-list', data.projects, item => {
        const gh = item.github_link || (item.link && item.link.includes('github.com') ? item.link : '');
        const dp = item.deploy_link || (item.link && !item.link.includes('github.com') ? item.link : '');
        return `
            <div>
                <b>${item.emoji || '💻'} ${item.title}</b>
                <div style="font-size: 0.85rem; margin-top: 4px;">
                    ${gh ? `<a href="${gh}" target="_blank" style="color: #60a5fa; text-decoration: underline; margin-right: 12px;">GitHub: ${gh}</a>` : '<span style="color: #9ca3af; margin-right: 12px;">(No GitHub link)</span>'}
                    ${dp ? `<a href="${dp}" target="_blank" style="color: #34d399; text-decoration: underline;">Live Demo: ${dp}</a>` : '<span style="color: #9ca3af;">(No Live link)</span>'}
                </div>
            </div>
        `;
    }, 'projects');
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

    const avatarContainer = document.getElementById('avatar-current');
    if (avatarContainer) {
        if (data.avatar_3d) {
            avatarContainer.innerHTML = `<p style="margin-top: 1rem; color: #3b82f6;">Current 3D Avatar Image:</p><img src="/api/file/${data.avatar_3d}" style="height:100px; border-radius:10px; margin-top:10px;">`;
        } else {
            avatarContainer.innerHTML = `<p style="margin-top: 1rem; color: #10b981;">Using Default 3D Avatar Image (/avatar-3d.png).</p><img src="/avatar-3d.png" style="height:100px; border-radius:10px; margin-top:10px;">`;
        }
    }

    const audioContainer = document.getElementById('audio-current');
    if (audioContainer) {
        if (data.intro_audio) {
            audioContainer.innerHTML = `<p style="margin-top: 1rem; color: #3b82f6;">Current Human Voice Audio:</p><audio controls src="/api/file/${data.intro_audio}" style="margin-top:8px;"></audio>`;
        } else {
            audioContainer.innerHTML = `<p style="margin-top: 1rem; color: #10b981;">Using Default Human Voice Audio (/intro-voice.m4a):</p><audio controls src="/intro-voice.m4a" style="margin-top:8px;"></audio>`;
        }
    }

    const videoContainer = document.getElementById('video-current');
    if (videoContainer) {
        if (data.avatar_video) {
            videoContainer.innerHTML = `<p style="margin-top: 1rem; color: #3b82f6;">Current Talking Avatar Video:</p><video controls src="/api/file/${data.avatar_video}" style="height:140px; border-radius:10px; margin-top:8px;"></video>`;
        } else {
            videoContainer.innerHTML = `<p style="margin-top: 1rem; color: #9ca3af;">No talking video uploaded (Using 3D avatar with animated mouth & hand).</p>`;
        }
    }

    // Render Section Audio Narrations
    ['about', 'feedback'].forEach(sec => {
        const c = document.getElementById(`audio-${sec}-current`);
        if (c) {
            const fileId = data[`${sec}_audio`];
            if (fileId) {
                c.innerHTML = `<p style="margin-top: 0.5rem; color: #3b82f6; font-size:0.85rem;">Active Custom Audio:</p><audio controls src="/api/file/${fileId}" style="margin-top:4px; height:36px;"></audio>`;
            } else {
                c.innerHTML = `<p style="margin-top: 0.5rem; color: #10b981; font-size:0.85rem;">Using Default Narration Audio (/audio/${sec}.m4a):</p><audio controls src="/audio/${sec}.m4a" style="margin-top:4px; height:36px;"></audio>`;
            }
        }
    });
}

function renderList(elementId, items, htmlFunc, collection) {
    const el = document.getElementById(elementId);
    el.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-row';
        
        let actionBtns = '';
        if (collection === 'gallery') {
            const isFeat = !!item.is_featured;
            actionBtns = `<button style="background: ${isFeat ? '#10b981' : '#f59e0b'}; margin-right: 10px;" onclick="setFeaturedGallery('${item._id}')">${isFeat ? '★ Featured (Big View)' : 'Set as Featured'}</button>`;
        } else if (collection !== 'feedback') {
            const itemJson = JSON.stringify(item).replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            actionBtns = `<button style="background: #3b82f6; margin-right: 10px;" onclick="editItem('${collection}', '${item._id}', '${itemJson}')">Edit</button>`;
        }
        
        div.innerHTML = `
            <div style="display:flex; align-items:center;">${htmlFunc(item)}</div>
            <div>
                ${actionBtns}
                <button onclick="deleteItem('${collection}', '${item._id}')">Delete</button>
            </div>
        `;
        el.appendChild(div);
    });
}

async function setFeaturedGallery(id) {
    const res = await fetch(`/api/admin/featured_gallery/${id}`, { method: 'POST' });
    if (res.ok) {
        loadData();
    }
}

// Add/Edit/Delete Functions
async function saveAbout() {
    const text = document.getElementById('about-text').value;
    const name = document.getElementById('about-name') ? document.getElementById('about-name').value : '';
    const role1 = document.getElementById('about-role1') ? document.getElementById('about-role1').value : '';
    const role2 = document.getElementById('about-role2') ? document.getElementById('about-role2').value : '';
    const location = document.getElementById('about-location') ? document.getElementById('about-location').value : '';
    const email = document.getElementById('about-email') ? document.getElementById('about-email').value : '';
    const linkedin = document.getElementById('about-linkedin') ? document.getElementById('about-linkedin').value : '';
    const github = document.getElementById('about-github') ? document.getElementById('about-github').value : '';
    const advice_link = document.getElementById('about-advice-link') ? document.getElementById('about-advice-link').value : '';

    await fetch('/api/admin/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, name, role1, role2, location, email, linkedin, github, advice_link })
    });
    alert('Brand & About information saved successfully!');
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
    
    if (collection === 'projects') {
        if (!('github_link' in item)) item.github_link = (item.link && item.link.includes('github.com')) ? item.link : '';
        if (!('deploy_link' in item)) item.deploy_link = (item.link && !item.link.includes('github.com')) ? item.link : '';
    }
    
    // Prompt the user for each key (except _id)
    for (let key in item) {
        if (key === '_id') continue;
        
        let currentValue = item[key] || '';
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
    
    if (collection === 'projects') {
        updatedItem.link = updatedItem.deploy_link || updatedItem.github_link || '';
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
    const github_link = document.getElementById('proj-github') ? document.getElementById('proj-github').value : '';
    const deploy_link = document.getElementById('proj-deploy') ? document.getElementById('proj-deploy').value : '';
    addItem('projects', {
        title,
        emoji,
        description,
        github_link,
        deploy_link,
        link: deploy_link || github_link
    });
    document.getElementById('proj-title').value = '';
    document.getElementById('proj-emoji').value = '';
    document.getElementById('proj-desc').value = '';
    if (document.getElementById('proj-github')) document.getElementById('proj-github').value = '';
    if (document.getElementById('proj-deploy')) document.getElementById('proj-deploy').value = '';
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

async function uploadAvatar3D() {
    const fileInput = document.getElementById('avatar-upload');
    if(!fileInput.files[0]) return alert("Select an image for 3D avatar!");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const res = await fetch('/api/upload_avatar_3d', { method: 'POST', body: formData });
    if(res.ok) {
        alert("3D Avatar updated successfully!");
        fileInput.value = '';
        loadData();
    } else {
        alert("3D Avatar upload failed.");
    }
}

async function removeAvatar3D() {
    if(!confirm("Reset 3D avatar to default?")) return;
    const res = await fetch('/api/admin/avatar_3d', { method: 'DELETE' });
    if(res.ok) {
        alert("3D Avatar reset to default!");
        loadData();
    }
}

async function uploadIntroAudio() {
    const fileInput = document.getElementById('audio-upload');
    if(!fileInput.files[0]) return alert("Select an audio file (.mp3, .wav, .m4a)!");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const res = await fetch('/api/upload_intro_audio', { method: 'POST', body: formData });
    if(res.ok) {
        alert("Real Human Voice Audio uploaded successfully!");
        fileInput.value = '';
        loadData();
    } else {
        alert("Audio upload failed.");
    }
}

async function removeIntroAudio() {
    if(!confirm("Reset human voice audio to default?")) return;
    const res = await fetch('/api/admin/intro_audio', { method: 'DELETE' });
    if(res.ok) {
        alert("Voice reset to default!");
        loadData();
    }
}

async function uploadAvatarVideo() {
    const fileInput = document.getElementById('video-upload');
    if(!fileInput.files[0]) return alert("Select a video file (.mp4, .webm)!");
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const res = await fetch('/api/upload_avatar_video', { method: 'POST', body: formData });
    if(res.ok) {
        alert("Talking Avatar Video uploaded successfully!");
        fileInput.value = '';
        loadData();
    } else {
        alert("Video upload failed.");
    }
}

async function removeAvatarVideo() {
    if(!confirm("Remove talking avatar video?")) return;
    const res = await fetch('/api/admin/avatar_video', { method: 'DELETE' });
    if(res.ok) {
        alert("Talking video removed! Switching back to 3D living avatar.");
        loadData();
    }
}

async function uploadSectionAudio(sec) {
    const fileInput = document.getElementById(`audio-${sec}-file`);
    if (!fileInput || !fileInput.files[0]) return alert(`Please select an audio file for ${sec}!`);
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    const res = await fetch(`/api/upload_section_audio/${sec}`, { method: 'POST', body: formData });
    if (res.ok) {
        alert(`${sec.toUpperCase()} audio uploaded successfully!`);
        fileInput.value = '';
        loadData();
    } else {
        alert(`Failed to upload ${sec} audio.`);
    }
}

async function removeSectionAudio(sec) {
    if (!confirm(`Reset ${sec} audio to default?`)) return;
    const res = await fetch(`/api/admin/section_audio/${sec}`, { method: 'DELETE' });
    if (res.ok) {
        alert(`${sec.toUpperCase()} audio reset to default!`);
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
