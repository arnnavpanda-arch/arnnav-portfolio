// Intro Screen & Terminal Logic
window.startTerminalSequence = function() {
    console.log("Terminal Sequence Started!");
    const introScreen = document.getElementById('intro-screen');
    const terminalScreen = document.getElementById('terminal-screen');
    
    // Immediately hide intro screen
    introScreen.style.display = 'none';
    introScreen.style.visibility = 'hidden';
    
    // Immediately show terminal screen
    terminalScreen.style.display = 'flex';
    terminalScreen.style.opacity = '1';
    terminalScreen.style.visibility = 'visible';
    terminalScreen.style.zIndex = '99999';
    terminalScreen.style.pointerEvents = 'auto';

    document.body.classList.add('terminal-active');

    setTimeout(() => {
        if (terminalScreen) {
            terminalScreen.style.display = 'none';
            terminalScreen.style.visibility = 'hidden';
        }
        document.body.classList.remove('intro-active');
    }, 5000);
};

// Lightbox Logic
window.openLightbox = function(imgSrc = null) {
    const lightbox = document.getElementById('photo-lightbox');
    const mainImg = document.getElementById('lightbox-main-img');
    if (lightbox && mainImg) {
        if (imgSrc) {
            mainImg.src = imgSrc;
            mainImg.style.display = 'block';
        } else {
            // If opening from the logo, use the logo's src if available
            const navImg = document.getElementById('nav-profile-img');
            if (navImg && navImg.src && navImg.style.display !== 'none') {
                mainImg.src = navImg.src;
                mainImg.style.display = 'block';
            }
        }
        lightbox.classList.add('active');
    }
};

window.closeLightbox = function() {
    const lightbox = document.getElementById('photo-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
    }
};

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

let galleryImages = [];
let gallerySlideshowInterval = null;
let currentSlideIndex = 0;

function startGallerySlideshow() {
    if (gallerySlideshowInterval) clearInterval(gallerySlideshowInterval);
    if (galleryImages.length === 0) return;
    
    // Set initial image
    updateInlineSlideshow(0);
    
    gallerySlideshowInterval = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % galleryImages.length;
        updateInlineSlideshow(currentSlideIndex);
    }, 5000);
}

function updateInlineSlideshow(index) {
    const img = galleryImages[index];
    if (!img) return;
    const mainImg = document.getElementById('inline-slideshow-img');
    const caption = document.getElementById('inline-slideshow-caption');
    if (mainImg && caption) {
        mainImg.style.opacity = 0;
        setTimeout(() => {
            mainImg.src = `/api/file/${img.file_id}`;
            caption.innerText = img.caption || '';
            mainImg.style.opacity = 1;
        }, 300);
    }
}

// Dynamic Data Loading
async function loadData() {
    try {
        const res = await fetch('/api/data');
        const data = await res.json();

        // About
        if (data.about && data.about.text) {
            document.getElementById('dyn-about').innerText = data.about.text;
        }

        // Resume
        if (data.resume) {
            const btn = document.getElementById('btn-download-cv');
            if (btn) {
                btn.href = 'javascript:void(0);';
                btn.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = `/api/file/${data.resume}`;
                };
                btn.classList.remove('hidden');
                btn.style.display = 'inline-flex'; // Ensure it becomes visible
            }
        }
        
        // Profile Photo
        if (data.profile_photo) {
            const navImg = document.getElementById('nav-profile-img');
            const lightboxImg = document.getElementById('lightbox-main-img');
            const url = `/api/file/${data.profile_photo}`;
            if (navImg) {
                navImg.src = url;
                navImg.style.display = 'block';
            }
            if (lightboxImg) {
                lightboxImg.src = url;
                lightboxImg.style.display = 'block';
            }
        }

        // Skills
        const skillsContainer = document.getElementById('dyn-skills');
        skillsContainer.innerHTML = '';
        data.skills.forEach(skill => {
            const tags = skill.items.map(i => `<span class="tag">${i}</span>`).join('');
            skillsContainer.innerHTML += `
                <div class="skill-category glass-card">
                    <h3>${skill.category}</h3>
                    <div class="tags">${tags}</div>
                </div>
            `;
        });

        // Projects (3D Gallery & Detailed View)
        const cubeContainer = document.getElementById('dyn-cube');
        const detailedProjContainer = document.getElementById('dyn-projects-detailed');
        cubeContainer.innerHTML = '';
        if (detailedProjContainer) detailedProjContainer.innerHTML = '';
        
        const numProjects = data.projects.length;
        if (numProjects > 0) {
            // Calculate dynamic translateZ based on number of projects to form a polygon
            const angleStep = 360 / numProjects;
            let isMobile = window.innerWidth <= 768;
            let translateZ = isMobile ? 150 : 250; 
            
            if (numProjects > 4) {
                const baseWidth = isMobile ? 180 : 280;
                translateZ = Math.max(isMobile ? 150 : 250, Math.round( (baseWidth / 2) / Math.tan(Math.PI / numProjects) ) + (isMobile ? 20 : 40));
            } else if (numProjects < 4 && numProjects > 0) {
                translateZ = isMobile ? 120 : 200;
            }
            
            data.projects.forEach((proj, index) => {
                // 3D Cube Card (Minimal)
                const angle = index * angleStep;
                const emoji = proj.emoji || '💻';
                const linkHTMLCube = proj.link ? `<a href="${proj.link}" target="_blank">View Project</a>` : '';
                
                cubeContainer.innerHTML += `
                    <div class="gallery-card" style="transform: rotateY(${angle}deg) translateZ(${translateZ}px);">
                        <div>${emoji}</div>
                        <h3>${proj.title}</h3>
                        ${linkHTMLCube}
                    </div>
                `;
                
                // Detailed Card (Full Info)
                if (detailedProjContainer) {
                    const linkHTMLDetailed = proj.link ? `<a href="${proj.link}" class="project-link" target="_blank"><i class="fa-brands fa-github"></i> View Repository</a>` : '';
                    detailedProjContainer.innerHTML += `
                        <div class="project-card glass-card">
                            <div class="project-header">
                                <h3 style="display:flex; align-items:center; gap:10px;"><span>${emoji}</span> ${proj.title}</h3>
                            </div>
                            <p class="project-desc">${proj.description}</p>
                            ${linkHTMLDetailed}
                        </div>
                    `;
                }
            });
            
            // Adjust animation duration based on number of items (approx 4.5s per item)
            cubeContainer.style.animationDuration = `${Math.max(15, numProjects * 4.5)}s`;
        } else {
            cubeContainer.innerHTML = '<p>No projects yet.</p>';
            cubeContainer.style.animation = 'none';
        }

        // Experience
        const expContainer = document.getElementById('dyn-experience');
        expContainer.innerHTML = '';
        data.experience.forEach(exp => {
            expContainer.innerHTML += `
                <div class="timeline-item glass-card">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <h3>${exp.title}</h3>
                        <h4>${exp.company}</h4>
                        <span class="timeline-date">${exp.date}</span>
                        <p>${exp.description}</p>
                    </div>
                </div>
            `;
        });

        // Education
        const eduContainer = document.getElementById('dyn-education');
        eduContainer.innerHTML = '';
        data.education.forEach(edu => {
            eduContainer.innerHTML += `
                <div class="edu-card glass-card" style="margin-bottom:1rem;">
                    <h3>${edu.degree}</h3>
                    <h4>${edu.institution}</h4>
                    <div class="edu-details">
                        <span>${edu.date}</span>
                    </div>
                    <p>${edu.description}</p>
                </div>
            `;
        });

        // Certifications
        const certContainer = document.getElementById('dyn-certifications');
        certContainer.innerHTML = '';
        if (data.certifications) {
            data.certifications.forEach(cert => {
                certContainer.innerHTML += `<li><strong>${cert.title}</strong><span>${cert.description}</span></li>`;
            });
        }
        
        // Awards
        const awdContainer = document.getElementById('dyn-awards');
        awdContainer.innerHTML = '';
        data.awards.forEach(awd => {
            awdContainer.innerHTML += `
                <div class="achievement-card glass-card" style="margin-bottom:1rem;">
                    <div class="icon">🏆</div>
                    <div>
                        <strong>${awd.title}</strong>
                        <p>${awd.description}</p>
                    </div>
                </div>
            `;
        });

        // Gallery
        const galContainer = document.getElementById('dyn-gallery');
        galleryImages = data.gallery; // Store for slideshow
        
        if (galleryImages.length > 0) {
            galContainer.innerHTML = `
                <div id="inline-slideshow" style="width: 100%; max-width: 800px; margin: 0 auto 2rem; border-radius: 10px; overflow: hidden; border: 2px solid var(--accent-primary); background: #0a0a0a;">
                    <img id="inline-slideshow-img" src="" style="width: 100%; height: 500px; object-fit: contain; transition: opacity 0.3s;">
                    <p id="inline-slideshow-caption" style="text-align: center; padding: 15px; background: rgba(0,0,0,0.8); margin: 0; color: white; font-weight: bold;"></p>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;" id="gal-thumbnails"></div>
            `;
            
            const thumbContainer = document.getElementById('gal-thumbnails');
            galleryImages.forEach((img, idx) => {
                const url = `/api/file/${img.file_id}`;
                thumbContainer.innerHTML += `
                    <div style="cursor: pointer; position: relative;" onclick="currentSlideIndex=${idx}; updateInlineSlideshow(${idx});">
                        <img src="${url}" alt="${img.caption}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid var(--accent-primary);">
                    </div>
                `;
            });
            
            // Restart slideshow if there are images
            startGallerySlideshow();
        } else {
            galContainer.innerHTML = '<p>No gallery images yet.</p>';
        }

        // Re-initialize Vanilla Tilt for dynamically added elements
        try {
            VanillaTilt.init(document.querySelectorAll(".glass-card"), {
                max: 5,
                speed: 400,
                glare: true,
                "max-glare": 0.2,
            });
        } catch(e) {
            console.log("VanillaTilt not found:", e);
        }

    } catch (error) {
        console.error("Failed to load dynamic data:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    // Socket.IO Real-time Sync
    const socket = io();
    socket.on('data_updated', function(msg) {
        console.log("Real-time update received! Refreshing data...");
        loadData();
    });
});

// Feedback Logic
let selectedStars = 0;
document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.fb-star');
    stars.forEach(star => {
        star.style.color = 'var(--text-secondary)';
        
        star.addEventListener('mouseover', (e) => {
            const val = parseInt(e.target.getAttribute('data-val'));
            stars.forEach(s => {
                s.style.color = parseInt(s.getAttribute('data-val')) <= val ? '#eab308' : 'var(--text-secondary)';
            });
        });
        
        star.addEventListener('mouseout', () => {
            stars.forEach(s => {
                s.style.color = parseInt(s.getAttribute('data-val')) <= selectedStars ? '#eab308' : 'var(--text-secondary)';
            });
        });
        
        star.addEventListener('click', (e) => {
            selectedStars = parseInt(e.target.getAttribute('data-val'));
        });
    });
});

async function submitFeedback() {
    const name = document.getElementById('fb-name').value;
    if (!name || selectedStars === 0) {
        alert("Please provide your name and select a star rating!");
        return;
    }
    
    const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, stars: selectedStars })
    });
    
    if (res.ok) {
        document.getElementById('fb-msg').style.display = 'block';
        document.getElementById('fb-name').value = '';
        selectedStars = 0;
        document.querySelectorAll('.fb-star').forEach(s => s.style.color = 'var(--text-secondary)');
        setTimeout(() => document.getElementById('fb-msg').style.display = 'none', 3000);
    }
}

// Terminal Intro Logic
document.addEventListener('DOMContentLoaded', () => {
    const btnEnter = document.getElementById('btn-enter');
    const overlay = document.getElementById('intro-terminal');
    
    if (btnEnter && overlay) {
        btnEnter.addEventListener('click', () => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restore scrolling
            }, 800);
        });
    }
});
