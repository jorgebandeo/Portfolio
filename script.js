function toggleNavOverlay() {
    var nav = document.getElementById("navMenu");
    if (nav.style.display === "block") {
        nav.style.display = "none";
    } else {
        nav.style.display = "block";
    }
}
function createRainEffect(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    const drops = [];

    // Ajusta o tamanho do canvas para se adaptar ao elemento pai
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Função para criar gotas
    function createDrops() {
        for (let i = 0; i < 100; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: Math.random() * 3 + 1,
                radius: Math.random() * 1 + 0.5
            });
        }
    }
    createDrops();

    // Função para desenhar gotas
    function drawRain() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        for (const drop of drops) {
            ctx.moveTo(drop.x, drop.y);
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        updateRain();
        requestAnimationFrame(drawRain);
    }

    // Atualiza a posição das gotas
    function updateRain() {
        for (const drop of drops) {
            drop.y += drop.speed;
            if (drop.y > canvas.height) {
                drop.y = 0;
                drop.x = Math.random() * canvas.width;
                drop.speed = Math.random() * 3 + 1;
                drop.radius = Math.random() * 1 + 0.5;
            }
        }
    }

    drawRain();
}

// Chama a função para aplicar o efeito em ambos os canvas
document.addEventListener('DOMContentLoaded', function() {
    createRainEffect('rainCanvasHeader');
    createRainEffect('rainCanvasFooter');
});


// ---------------------- projetos -------------------------------
// Função para alternar o estado dos botões de filtro
function toggleFilter(button) {
    button.classList.toggle('active'); // Alterna a classe 'active' para indicar estado ativo/inativo
    applyFilters();
  }
  
  // Função para aplicar os filtros com base nos botões ativos
  function applyFilters() {
    const activeFilters = Array.from(document.querySelectorAll('.filter-button.active')).map(button => button.getAttribute('data-category'));
    const projects = document.querySelectorAll('.project');
  
    if (activeFilters.length === 0) {
      // Se nenhum filtro estiver ativo, mostra todos os projetos
      projects.forEach(project => project.style.display = 'block');
    } else {
      projects.forEach(project => {
        const projectCategories = project.classList;
        const showProject = activeFilters.some(filter => projectCategories.contains(filter));
        
        // Exibe ou oculta projetos com base nos filtros ativos
        project.style.display = showProject ? 'block' : 'none';
      });
    }
  }
  
  // Exibe todos os projetos ao carregar a página
  document.addEventListener('DOMContentLoaded', () => {
    applyFilters(); // Aplica os filtros ao carregar a página
  });
  
