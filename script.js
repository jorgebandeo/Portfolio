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
