document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.particles');
    if (!container) return;

    let canvas = null,
        ctx,
        particles = [],
        shootingStars = [],
        animationId;
    let spawning = false;

    const MIN_VX = 0.5;
    const START_VX = 1.0;    // reduzierte Startgeschwindigkeit für Partikel
    const MAX_VX = 2.5;      // maximale Partikel-Geschwindigkeit
    const ACCEL_RATE = 0.5;  // Beschleunigung pro Frame
    const DECEL_RATE = 0.3;  // Verzögerung pro Frame nach Verlassen

    function initCanvas() {
        if (canvas) return;
        canvas = document.createElement('canvas');
        Object.assign(canvas.style, {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%', boxSizing: 'border-box',
            pointerEvents: 'none'
        });
        container.style.position = 'relative';
        container.appendChild(canvas);
        resizeCanvas();
    }

    function resizeCanvas() {
        if (!canvas) return;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    }

    function spawnParticle() {
        const rect = container.getBoundingClientRect();
        const life = 100 + Math.random() * 50;
        particles.push({
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            vx: START_VX,
            vy: 0,
            life: life,
            initialLife: life
        });
    }

    function spawnShootingStar() {
        const rect = container.getBoundingClientRect();
        const tail = 200 + Math.random() * 100; // längerer Schweif
        const xStart = -tail;
        const yStart = Math.random() * rect.height * 0.8;
        const speed = 15 + Math.random() * 10;    // deutlich höhere Geschwindigkeit
        shootingStars.push({
            x: xStart,
            y: yStart,
            vx: speed,
            vy: speed * 0.3,
            tail: tail,
            life: tail / speed
        });
    }

    function draw() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const rect = container.getBoundingClientRect();
        const width = rect.width;

        // normale Partikel
        particles = particles.filter(p => {
            // Beschleunigung oder Verzögerung
            p.vx = spawning ? Math.min(p.vx + ACCEL_RATE, MAX_VX) : Math.max(p.vx - DECEL_RATE, MIN_VX);
            p.x += p.vx;
            p.life--;
            if (p.life <= 0 || p.x > width) return false;
            const alpha = p.life / p.initialLife;
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fillRect(p.x, p.y, 2, 2);
            return true;
        });

        // Shooting Stars prominenter darstellen
        shootingStars = shootingStars.filter(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.life--;
            if (s.life <= 0 || s.x - s.tail > width || s.y > rect.height) return false;
            const prog = s.life / (s.tail / s.vx);
            ctx.lineWidth = 4;
            ctx.strokeStyle = `rgba(255,255,200,${prog})`; // leicht gelblicher Schimmer
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * (s.tail / (s.tail / s.vx)), s.y - s.vy * (s.tail / (s.tail / s.vx)));
            ctx.stroke();
            // Kopf des Shooting Stars
            ctx.fillStyle = `rgba(255,255,200,${prog})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1;
            return true;
        });

        if (spawning) {
            spawnParticle();
            if (Math.random() < 0.05) spawnShootingStar(); // erhöhte Wahrscheinlichkeit
        }

        if (!spawning && particles.length + shootingStars.length === 0) {
            cleanup();
            return;
        }

        animationId = requestAnimationFrame(draw);
    }

    function startParticles() {
        initCanvas();
        spawning = true;
        for (let i = 0; i < 8; i++) spawnParticle();
        if (Math.random() < 0.5) spawnShootingStar(); // initial möglich
        draw();
    }

    function stopParticles() {
        spawning = false;
    }

    function cleanup() {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resizeCanvas);
        if (canvas) {
            container.removeChild(canvas);
            canvas = null;
            particles = [];
            shootingStars = [];
        }
    }

    window.addEventListener('resize', resizeCanvas);
    container.addEventListener('mouseenter', startParticles);
    container.addEventListener('mouseleave', stopParticles);
});