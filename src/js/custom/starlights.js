document.addEventListener('DOMContentLoaded', function() {
	const logo = document.querySelector('.starlights');
	if (!logo) return;

	let canvas, ctx, stars = [], animationId;
	let spawning = false;

	function initCanvas() {
		canvas = document.createElement('canvas');
		canvas.className = 'starlights-canvas';
		Object.assign(canvas.style, {
			position: 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			pointerEvents: 'none',
			zIndex: 10,
		});
		logo.style.position = 'relative';
		logo.appendChild(canvas);
		resizeCanvas();
	}

	function resizeCanvas() {
		const rect = logo.getBoundingClientRect();
		const dpr  = window.devicePixelRatio || 1;
		canvas.width  = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx = canvas.getContext('2d');
		ctx.scale(dpr, dpr);
	}

	function spawnStar() {
		const rect = logo.getBoundingClientRect();
		stars.push({
			x: Math.random() * rect.width,
			y: Math.random() * rect.height,
			vx: (Math.random() - 0.5) * 0.5,
			vy: (Math.random() - 0.5) * 0.5,
			life: 60 + Math.random() * 30
		});
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// bewegen und zeichnen
		for (let i = stars.length - 1; i >= 0; i--) {
			const s = stars[i];
			s.x += s.vx;
			s.y += s.vy;
			s.life--;
			if (s.life <= 0) {
				stars.splice(i, 1);
				continue;
			}
			ctx.fillStyle = 'rgba(255,255,255,' + (s.life / 60) + ')';
			ctx.fillRect(s.x, s.y, 1, 1);
		}
		// neue Sterne nur während Hover
		if (spawning) {
			for (let i = 0; i < 4; i++) spawnStar();
		}
		// wenn kein Hover mehr und alle Sterne weg, aufräumen
		if (!spawning && stars.length === 0) {
			cleanup();
			return;
		}
		animationId = requestAnimationFrame(draw);
	}

	function startStarlights() {
		if (!canvas) {
			initCanvas();
			window.addEventListener('resize', resizeCanvas);
		}
		spawning = true;
		draw();
	}

	function stopStarlights() {
		spawning = false;
	}

	function cleanup() {
		cancelAnimationFrame(animationId);
		window.removeEventListener('resize', resizeCanvas);
		if (canvas) {
			logo.removeChild(canvas);
			canvas = null;
			stars = [];
		}
	}

	logo.addEventListener('mouseenter', startStarlights);
	logo.addEventListener('mouseleave', stopStarlights);
});
