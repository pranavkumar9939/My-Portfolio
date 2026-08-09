// ── MOBILE NAV ──
        function toggleNav() {
            document.getElementById('nav-links').classList.toggle('open');
            document.getElementById('hamburger').classList.toggle('open');
        }
        document.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', () => {
                document.getElementById('nav-links').classList.remove('open');
                document.getElementById('hamburger').classList.remove('open');
            });
        });

        // ── NAV SCROLL ──
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
        });

        // ── NEURAL NETWORK CANVAS ──
        (function () {
            const canvas = document.getElementById('neural-canvas');
            const ctx = canvas.getContext('2d');
            canvas.style.opacity = '1';
            let neurons = [], signals = [], mouse = { x: -1000, y: -1000 }, raf, time = 0;

            const COLORS = [
                { r: 59, g: 130, b: 246 },   // blue
                { r: 96, g: 165, b: 250 },   // light blue
                { r: 124, g: 58, b: 237 },   // purple
                { r: 167, g: 139, b: 250 },  // light purple
                { r: 99, g: 102, b: 241 },   // indigo
                { r: 6, g: 182, b: 212 },    // teal
            ];

            function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

            function init() {
                neurons = []; signals = [];
                const count = Math.floor((canvas.width * canvas.height) / 28000);
                for (let i = 0; i < count; i++) {
                    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
                    const dendrites = [];
                    const numDendrites = Math.floor(Math.random() * 4) + 3;
                    for (let d = 0; d < numDendrites; d++) {
                        const angle = (d / numDendrites) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
                        const len = 12 + Math.random() * 25;
                        const branches = [];
                        if (Math.random() > 0.4) {
                            const bAngle = angle + (Math.random() - 0.5) * 0.9;
                            branches.push({ angle: bAngle, len: 6 + Math.random() * 12, frac: 0.5 + Math.random() * 0.4 });
                        }
                        dendrites.push({ angle, len, branches });
                    }
                    neurons.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 0.15,
                        vy: (Math.random() - 0.5) * 0.15,
                        r: 2.5 + Math.random() * 2.5,
                        col, dendrites,
                        phase: Math.random() * Math.PI * 2,
                        pulseSpeed: 1.5 + Math.random() * 1.5
                    });
                }
            }

            canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
            canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                time += 0.006;

                // Update positions
                for (const n of neurons) {
                    const mdx = n.x - mouse.x, mdy = n.y - mouse.y;
                    const md = Math.sqrt(mdx * mdx + mdy * mdy);
                    if (md < 100) {
                        n.vx += (mdx / md) * 0.5 * (1 - md / 100);
                        n.vy += (mdy / md) * 0.5 * (1 - md / 100);
                    }
                    n.vx *= 0.995; n.vy *= 0.995;
                    n.x += n.vx; n.y += n.vy;
                    if (n.x < -20) n.x = canvas.width + 20;
                    if (n.x > canvas.width + 20) n.x = -20;
                    if (n.y < -20) n.y = canvas.height + 20;
                    if (n.y > canvas.height + 20) n.y = -20;
                }

                // Draw axon connections between nearby neurons
                for (let i = 0; i < neurons.length; i++) {
                    for (let j = i + 1; j < neurons.length; j++) {
                        const dx = neurons[i].x - neurons[j].x;
                        const dy = neurons[i].y - neurons[j].y;
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < 160) {
                            const a = (1 - d / 160) * 0.18;
                            const ci = neurons[i].col, cj = neurons[j].col;
                            const grad = ctx.createLinearGradient(neurons[i].x, neurons[i].y, neurons[j].x, neurons[j].y);
                            grad.addColorStop(0, `rgba(${ci.r},${ci.g},${ci.b},${a})`);
                            grad.addColorStop(1, `rgba(${cj.r},${cj.g},${cj.b},${a})`);
                            ctx.beginPath();
                            ctx.moveTo(neurons[i].x, neurons[i].y);
                            ctx.lineTo(neurons[j].x, neurons[j].y);
                            ctx.strokeStyle = grad;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();

                            // Synaptic signal traveling along axon
                            if (Math.random() < 0.0008) {
                                signals.push({ from: i, to: j, t: 0, speed: 0.008 + Math.random() * 0.006 });
                            }
                        }
                    }
                }

                // Draw and update signals
                for (let s = signals.length - 1; s >= 0; s--) {
                    const sig = signals[s];
                    sig.t += sig.speed;
                    if (sig.t > 1) { signals.splice(s, 1); continue; }
                    const a = neurons[sig.from], b = neurons[sig.to];
                    const sx = a.x + (b.x - a.x) * sig.t;
                    const sy = a.y + (b.y - a.y) * sig.t;
                    const glow = Math.sin(sig.t * Math.PI);
                    const col = a.col;
                    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6);
                    sg.addColorStop(0, `rgba(${col.r},${col.g},${col.b},${0.7 * glow})`);
                    sg.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
                    ctx.beginPath();
                    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                    ctx.fillStyle = sg;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${0.6 * glow})`;
                    ctx.fill();
                }

                // Draw neurons
                for (const n of neurons) {
                    const pulse = 0.7 + 0.3 * Math.sin(time * n.pulseSpeed + n.phase);
                    const c = n.col;

                    // Dendrites
                    for (const d of n.dendrites) {
                        const ex = n.x + Math.cos(d.angle) * d.len;
                        const ey = n.y + Math.sin(d.angle) * d.len;
                        ctx.beginPath();
                        ctx.moveTo(n.x, n.y);
                        ctx.lineTo(ex, ey);
                        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.12 * pulse})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                        // Dendrite tip
                        ctx.beginPath();
                        ctx.arc(ex, ey, 0.8, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.2 * pulse})`;
                        ctx.fill();
                        // Branches
                        for (const br of d.branches) {
                            const bx = n.x + Math.cos(d.angle) * d.len * br.frac;
                            const by = n.y + Math.sin(d.angle) * d.len * br.frac;
                            const bex = bx + Math.cos(br.angle) * br.len;
                            const bey = by + Math.sin(br.angle) * br.len;
                            ctx.beginPath();
                            ctx.moveTo(bx, by);
                            ctx.lineTo(bex, bey);
                            ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.08 * pulse})`;
                            ctx.lineWidth = 0.4;
                            ctx.stroke();
                        }
                    }

                    // Soma glow (outer)
                    const somaGlow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
                    somaGlow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${0.1 * pulse})`);
                    somaGlow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
                    ctx.fillStyle = somaGlow;
                    ctx.fill();

                    // Soma membrane (ring)
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r * 1.8 * pulse, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${0.12 * pulse})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();

                    // Soma core (nucleus)
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.45 * pulse})`;
                    ctx.fill();

                    // Bright center
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r * 0.4 * pulse, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${Math.min(255, c.r + 80)},${Math.min(255, c.g + 80)},${Math.min(255, c.b + 80)},${0.5 * pulse})`;
                    ctx.fill();
                }

                raf = requestAnimationFrame(draw);
            }

            resize(); init(); draw();
            window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); init(); draw(); });
        })();

        // ── ANIMATED COUNTERS ──
        (function () {
            const counters = document.querySelectorAll('.stat-num[data-target]');
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting && !e.target.dataset.animated) {
                        e.target.dataset.animated = 'true';
                        const target = parseFloat(e.target.dataset.target);
                        const isDecimal = e.target.dataset.decimal === 'true';
                        const suffix = e.target.dataset.suffix || '';
                        const duration = 1600;
                        const start = performance.now();

                        function update(now) {
                            const elapsed = now - start;
                            const progress = Math.min(elapsed / duration, 1);
                            const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
                            const current = eased * target;
                            e.target.textContent = (isDecimal ? current.toFixed(2) : Math.floor(current)) + suffix;
                            if (progress < 1) requestAnimationFrame(update);
                        }
                        requestAnimationFrame(update);
                    }
                });
            }, { threshold: 0.5 });
            counters.forEach(c => obs.observe(c));
        })();

        // ── TYPING ──
        (function () {
            const el = document.getElementById('typed-text');
            const roles = ['AI & ML Student', 'Python Developer', 'Data Science Enthusiast', 'Problem Solver'];
            let ri = 0, ci = 0, del = false;

            function type() {
                const cur = roles[ri];
                el.innerHTML = (del ? cur.slice(0, ci - 1) : cur.slice(0, ci + 1)) + '<span class="cursor">|</span>';
                del ? ci-- : ci++;
                if (!del && ci === cur.length) setTimeout(() => { del = true; }, 2000);
                else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; }
                setTimeout(type, del ? 40 : 75);
            }
            type();
        })();

        // ── SCROLL REVEAL ──
        (function () {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('shown'); });
            }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
            document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
        })();

        // ── SMOOTH SCROLL ──
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const t = document.querySelector(this.getAttribute('href'));
                if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // ── TILT ON HERO CARD (desktop only) ──
        (function () {
            const card = document.querySelector('.hero-card');
            if (!card || window.innerWidth < 768) return;
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(600px) rotateY(0) rotateX(0)';
                card.style.transition = 'transform 0.4s ease';
            });
            card.addEventListener('mouseenter', () => { card.style.transition = 'none'; });
        })();
