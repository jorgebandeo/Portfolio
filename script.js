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
    function resizeCanvas() { const ratio = Math.min(window.devicePixelRatio || 1, 2); const rect = canvas.getBoundingClientRect(); canvas.width = Math.max(1, rect.width * ratio); canvas.height = Math.max(1, rect.height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); }
    function createParticles() { particles.length = 0; const count = Math.min(90, Math.max(36, Math.floor(canvas.clientWidth / 14))); for (let i = 0; i < count; i++) particles.push({x:Math.random()*canvas.clientWidth,y:Math.random()*canvas.clientHeight,speed:Math.random()*.7+.25,size:Math.random()*1.6+.4,alpha:Math.random()*.45+.12,drift:Math.random()*.18-.09}); }
    function drawFrame() { ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight); for (const particle of particles) { ctx.beginPath(); ctx.fillStyle=`rgba(255, 231, 201, ${particle.alpha})`; ctx.arc(particle.x,particle.y,particle.size,0,Math.PI*2); ctx.fill(); particle.y+=particle.speed; particle.x+=particle.drift; if(particle.y>canvas.clientHeight+5){particle.y=-5;particle.x=Math.random()*canvas.clientWidth;} if(particle.x>canvas.clientWidth+5)particle.x=-5;if(particle.x< -5)particle.x=canvas.clientWidth+5;} if(!prefersReducedMotion)requestAnimationFrame(drawFrame); }
    const rebuild=()=>{resizeCanvas();createParticles();drawFrame();}; window.addEventListener('resize',rebuild,{passive:true}); rebuild();
}

function setActiveNavigation() {
    const currentPage=(window.location.pathname.split('/').pop()||'index.html').toLowerCase();
    document.querySelectorAll('nav a').forEach(link=>{const href=(link.getAttribute('href')||'').split('#')[0].toLowerCase();if(href===currentPage||(currentPage===''&&href==='index.html')){link.classList.add('active');link.setAttribute('aria-current','page');}});
}

const discoveryTerms={
    featured:['destaque','featured','pesquisa','industrial','computer vision','visão computacional','machine learning','sistema','embedded','embarcado'],
    applied:['industrial','gestão','administração','automação','otimização','sistema','api','database','banco','integração','produto'],
    ai:['ai','ia','artificial intelligence','machine learning','deep learning','opencv','yolo','tensorflow','pytorch','keras','visão','vision'],
    software:['software','c#','java','python','c++','api','sql','database','arquitetura','solid','outbox','backend','desktop'],
    embedded:['hardware','embedded','embarcado','esp32','arduino','microcontroller','microcontrolador','iot','sensor','firmware','raspberry'],
    webmobile:['web','html','css','javascript','typescript','mobile','android','flutter','react','php'],
    academic:['pesquisa','research','acadêmico','academic','univali','tcc','pibic','cnpq','dataset','experimental','estudo']
};
const discoveryLabels={featured:'Destaques',applied:'Experiência aplicada',ai:'IA & Visão',software:'Software & Sistemas',embedded:'Embarcados',webmobile:'Web & Mobile',academic:'Acadêmicos & Pesquisa'};

function normalizeSearch(value=''){return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function toggleFilter(button){button.classList.toggle('active');button.setAttribute('aria-pressed',button.classList.contains('active')?'true':'false');applyFilters();}
function toggleDiscovery(button){document.querySelectorAll('.discovery-chip').forEach(chip=>{if(chip!==button){chip.classList.remove('active');chip.setAttribute('aria-pressed','false');}});button.classList.toggle('active');button.setAttribute('aria-pressed',button.classList.contains('active')?'true':'false');applyFilters();}

function applyFilters(){
    const search=normalizeSearch(document.getElementById('projectSearch')?.value||'');
    const activeFilters=[...document.querySelectorAll('.filter-button.active')].map(button=>button.dataset.category);
    const discovery=document.querySelector('.discovery-chip.active')?.dataset.discover||'';
    const discoveryNeedles=(discoveryTerms[discovery]||[]).map(normalizeSearch);
    const projects=[...document.querySelectorAll('.project')];
    let visible=0;
    projects.forEach(project=>{
        const haystack=normalizeSearch(project.dataset.search||project.textContent||'');
        const categoryMatch=activeFilters.length===0||activeFilters.some(filter=>project.classList.contains(filter));
        const searchMatch=!search||haystack.includes(search);
        let discoveryMatch=!discovery;
        if(discovery==='featured') discoveryMatch=project.dataset.featured==='true'||discoveryNeedles.some(term=>haystack.includes(term));
        else if(discovery) discoveryMatch=discoveryNeedles.some(term=>haystack.includes(term));
        const show=categoryMatch&&searchMatch&&discoveryMatch;project.hidden=!show;if(show)visible++;
    });
    const total=projects.length;
    const resultCount=document.getElementById('projectResultCount');if(resultCount)resultCount.textContent=String(visible||0).padStart(2,'0');
    const counter=document.querySelector('.project-counter');if(counter)counter.textContent=`${visible} de ${total} projetos visíveis`;
    const empty=document.getElementById('projectEmptyState');if(empty)empty.hidden=visible!==0||total===0;
    const clear=document.getElementById('clearProjectSearch');if(clear)clear.hidden=!search;
    const query=document.getElementById('projectActiveQuery');if(query){const parts=[];if(discovery)parts.push(discoveryLabels[discovery]);if(search)parts.push(`“${document.getElementById('projectSearch').value.trim()}”`);if(activeFilters.length)parts.push(activeFilters.join(' + ').toUpperCase());query.textContent=parts.length?`FILTRANDO // ${parts.join(' · ')}`:'TODOS OS PROJETOS // selecione uma área ou pesquise uma competência';}
}

function resetProjectDiscovery(){const search=document.getElementById('projectSearch');if(search)search.value='';document.querySelectorAll('.filter-button,.discovery-chip').forEach(button=>{button.classList.remove('active');button.setAttribute('aria-pressed','false');});applyFilters();}
function setupProjectDiscovery(){
    const search=document.getElementById('projectSearch');if(!search)return;
    let timer;search.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(applyFilters,80);});
    document.querySelectorAll('.filter-button').forEach(button=>button.addEventListener('click',()=>toggleFilter(button)));
    document.querySelectorAll('.discovery-chip').forEach(button=>button.addEventListener('click',()=>toggleDiscovery(button)));
    document.getElementById('clearProjectSearch')?.addEventListener('click',()=>{search.value='';search.focus();applyFilters();});
    document.getElementById('resetProjectFilters')?.addEventListener('click',resetProjectDiscovery);
    applyFilters();
}

function setupRevealAnimations(){const elements=document.querySelectorAll('.panel,.language-panel,.skills-panel,.project,.div_experience-block,.div_even,.contact-panel,.project-article');elements.forEach(element=>element.classList.add('reveal'));if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){elements.forEach(element=>element.classList.add('is-visible'));return;}const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.08});elements.forEach(element=>observer.observe(element));}

document.addEventListener('DOMContentLoaded',()=>{createRainEffect('rainCanvasHeader');createRainEffect('rainCanvasFooter');setActiveNavigation();setupProjectDiscovery();setupRevealAnimations();});
