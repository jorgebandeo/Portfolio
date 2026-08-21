function toggleNavOverlay() {
    const nav = document.getElementById("navMenu");
    if (!nav) return;
    nav.hidden = !nav.hidden;
}

function createRainEffect(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resizeCanvas() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, rect.width * ratio);
        canvas.height = Math.max(1, rect.height * ratio);
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function createParticles() {
        particles.length = 0;
        const count = Math.min(90, Math.max(36, Math.floor(canvas.clientWidth / 14)));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * canvas.clientWidth,
                y: Math.random() * canvas.clientHeight,
                speed: Math.random() * 0.7 + 0.25,
                size: Math.random() * 1.6 + 0.4,
                alpha: Math.random() * 0.45 + 0.12,
                drift: Math.random() * 0.18 - 0.09
            });
        }
    }

    function drawFrame() {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

        for (const particle of particles) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 231, 201, ${particle.alpha})`;
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            particle.y += particle.speed;
            particle.x += particle.drift;

            if (particle.y > canvas.clientHeight + 5) {
                particle.y = -5;
                particle.x = Math.random() * canvas.clientWidth;
            }
            if (particle.x > canvas.clientWidth + 5) particle.x = -5;
            if (particle.x < -5) particle.x = canvas.clientWidth + 5;
        }

        if (!prefersReducedMotion) requestAnimationFrame(drawFrame);
    }

    const rebuild = () => {
        resizeCanvas();
        createParticles();
        drawFrame();
    };

    window.addEventListener('resize', rebuild, { passive: true });
    rebuild();
}

function setActiveNavigation() {
    const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('nav a').forEach(link => {
        const href = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

function toggleFilter(button) {
    button.classList.toggle('active');
    button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
    applyFilters();
}

function applyFilters() {
    const activeFilters = [...document.querySelectorAll('.filter-button.active')]
        .map(button => button.dataset.category);
    const projects = [...document.querySelectorAll('.project')];

    let visible = 0;
    projects.forEach(project => {
        const show = activeFilters.length === 0 || activeFilters.some(filter => project.classList.contains(filter));
        project.hidden = !show;
        if (show) visible++;
    });

    const counter = document.querySelector('.project-counter');
    if (counter) {
        const total = projects.length;
        counter.textContent = activeFilters.length
            ? `${visible} de ${total} projetos visíveis`
            : `${total} projetos no painel`;
    }
}

function setupRevealAnimations() {
    const elements = document.querySelectorAll('.panel, .language-panel, .skills-panel, .project, .div_experience-block, .div_even, .contact-panel, .project-article');
    elements.forEach(element => element.classList.add('reveal'));

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        elements.forEach(element => element.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    elements.forEach(element => observer.observe(element));
}

document.addEventListener('DOMContentLoaded', () => {
    createRainEffect('rainCanvasHeader');
    createRainEffect('rainCanvasFooter');
    setActiveNavigation();
    applyFilters();
    setupRevealAnimations();
});
