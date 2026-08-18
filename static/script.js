// Intro Screen & Terminal Logic
window.startTerminalSequence = function() {
    console.log("Terminal Sequence Started!");
    const introScreen = document.getElementById('intro-screen');
    const terminalScreen = document.getElementById('terminal-screen');
    
    // Forcefully hide intro screen completely
    if (introScreen) {
        introScreen.style.display = 'none';
        introScreen.style.visibility = 'hidden';
        introScreen.style.opacity = '0';
    }
    
    // Forcefully show terminal completely
    if (terminalScreen) {
        terminalScreen.style.display = 'flex';
        terminalScreen.style.visibility = 'visible';
        terminalScreen.style.opacity = '1';
        terminalScreen.style.pointerEvents = 'all';
        terminalScreen.style.zIndex = '99999';
    }
    
    // Wait 5 seconds, hide terminal, show main content
    setTimeout(() => {
        if (terminalScreen) {
            terminalScreen.style.display = 'none';
            terminalScreen.style.visibility = 'hidden';
        }
        document.body.classList.remove('intro-active');
    }, 5000);
};

// Lightbox Logic
window.openLightbox = function() {
    const lightbox = document.getElementById('photo-lightbox');
    if (lightbox) {
        lightbox.classList.add('active');
    }
};

window.closeLightbox = function() {
    const lightbox = document.getElementById('photo-lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
    }
};

// Initialize Vanilla Tilt on all glass-cards
try {
    VanillaTilt.init(document.querySelectorAll(".glass-card"), {
        max: 5,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
    });
} catch(e) {
    console.log("VanillaTilt failed to load:", e);
}

// Contact Form Submission Logic
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-btn');
            const statusDiv = document.getElementById('form-status');
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            statusDiv.style.display = 'none';

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                statusDiv.style.display = 'block';
                if (response.ok) {
                    statusDiv.innerHTML = `<span style="color: #22c55e;">${result.message}</span>`;
                    contactForm.reset();
                } else {
                    statusDiv.innerHTML = `<span style="color: #ef4444;">${result.error || 'Failed to send message.'}</span>`;
                }
            } catch (error) {
                statusDiv.style.display = 'block';
                statusDiv.innerHTML = `<span style="color: #ef4444;">Error connecting to server.</span>`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            }
        });
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navHeight = document.querySelector('.glass-nav').offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0) translateZ(30px)'; // preserving 3D
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.glass-card:not(.hero-section)');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease, transform 0.6s ease`;
        observer.observe(card);
    });
});

/* -------------------------------------
 * THREE.JS 3D BACKGROUND ANIMATION 
 * ------------------------------------- */

try {
    const canvas = document.querySelector('#bg-canvas');
    if (canvas && typeof THREE !== 'undefined') {
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.001);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.position.z = 50;

        // Create Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 700;
        const posArray = new Float32Array(particlesCount * 3);

        for(let i = 0; i < particlesCount * 3; i++) {
            // Spread particles over a large area
            posArray[i] = (Math.random() - 0.5) * 200;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        // Material for particles
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.5,
            color: 0x00f2fe,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particleMesh);

        // Mouse Interaction
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        });

        // Animation Loop
        const clock = new THREE.Clock();

        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            // Rotate particles slowly
            particleMesh.rotation.y = elapsedTime * 0.05;
            particleMesh.rotation.x = elapsedTime * 0.02;

            // Add parallax effect on mouse move
            targetX = mouseX * 0.001;
            targetY = mouseY * 0.001;

            particleMesh.rotation.y += 0.05 * (targetX - particleMesh.rotation.y);
            particleMesh.rotation.x += 0.05 * (targetY - particleMesh.rotation.x);

            renderer.render(scene, camera);
        }

        animate();

        // Handle Resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
} catch (e) {
    console.warn("ThreeJS initialization error", e);
}
