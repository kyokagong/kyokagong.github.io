/* ================================================================
   《量子计算》官方网站 - 主交互脚本
   Quantum Computing Official Website - Main JavaScript
   ================================================================ */

'use strict';

// ===================================================================
// 1. Particle / Star Field Background Animation
// ===================================================================
class ParticleBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 120 };
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    const count = Math.min(Math.floor(window.innerWidth * 0.05), 120);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() > 0.7 ? 190 : 260, // cyan or purple
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    // Touch support
    this.canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      this.mouse.x = touch.clientX;
      this.mouse.y = touch.clientY;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120;

        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.15;
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          this.ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p) => {
      // Mouse interaction
      if (this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.x -= Math.cos(angle) * force * 1.2;
          p.y -= Math.sin(angle) * force * 1.2;
        }
      }

      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around edges
      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      // Draw particle
      const color = p.hue === 190 ? '0, 212, 255' : '124, 58, 237';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
      this.ctx.fill();

      // Glow effect
      if (p.size > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${color}, ${p.opacity * 0.1})`;
        this.ctx.fill();
      }
    });

    this.drawConnections();
    requestAnimationFrame(() => this.animate());
  }
}

// ===================================================================
// 2. Scroll-based Reveal Animations
// ===================================================================
class ScrollRevealer {
  constructor() {
    this.items = document.querySelectorAll('.reveal');
    if (!this.items.length) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    this.items.forEach((el) => this.observer.observe(el));
  }
}

// ===================================================================
// 3. Reading Progress Bar
// ===================================================================
class ReadingProgress {
  constructor() {
    this.bar = document.getElementById('reading-progress');
    if (!this.bar) return;
    this.update();
    window.addEventListener('scroll', () => this.update(), { passive: true });
  }

  update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      this.bar.style.width = '100%';
      return;
    }
    const progress = (scrollTop / docHeight) * 100;
    this.bar.style.width = progress + '%';
  }
}

// ===================================================================
// 4. Theme Toggle (Dark / Light)
// ===================================================================
class ThemeToggle {
  constructor() {
    this.btn = document.getElementById('theme-toggle');
    if (!this.btn) return;
    this.icon = this.btn.querySelector('.theme-icon');
    this.loadTheme();
    this.btn.addEventListener('click', () => this.toggle());
  }

  loadTheme() {
    const saved = localStorage.getItem('quantum-theme') || 'dark';
    this.setTheme(saved);
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quantum-theme', theme);
    if (this.icon) {
      this.icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    this.setTheme(current === 'dark' ? 'light' : 'dark');
  }
}

// ===================================================================
// 5. Mobile Hamburger Menu
// ===================================================================
class MobileNav {
  constructor() {
    this.hamburger = document.getElementById('hamburger');
    this.nav = document.getElementById('nav-links');
    if (!this.hamburger || !this.nav) return;
    this.hamburger.addEventListener('click', () => this.toggle());
    // Close on link click
    this.nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => this.close());
    });
  }

  toggle() {
    this.hamburger.classList.toggle('active');
    this.nav.classList.toggle('open');
  }

  close() {
    this.hamburger.classList.remove('active');
    this.nav.classList.remove('open');
  }
}

// ===================================================================
// 6. Floating TOC (sidebar) for Chapter Pages
// ===================================================================
class ChapterTOC {
  constructor() {
    this.tocContainer = document.getElementById('chapter-toc');
    if (!this.tocContainer) return;
    this.toggleBtn = document.getElementById('toc-toggle');
    this.headings = document.querySelectorAll('.chapter-content h2, .chapter-content h3');
    this.tocList = this.tocContainer.querySelector('.toc-list');
    this.buildTOC();
    this.highlightOnScroll();
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.tocContainer.classList.toggle('open'));
    }
  }

  buildTOC() {
    if (!this.tocList) return;
    this.tocList.innerHTML = '';
    this.headings.forEach((heading, index) => {
      if (!heading.id) {
        heading.id = 'section-' + index;
      }
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + heading.id;
      a.textContent = heading.textContent;
      if (heading.tagName === 'H3') {
        a.classList.add('toc-h3');
      }
      li.appendChild(a);
      this.tocList.appendChild(li);
    });
  }

  highlightOnScroll() {
    const links = this.tocList.querySelectorAll('a');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.remove('active'));
            const activeLink = this.tocList.querySelector(`a[href="#${entry.target.id}"]`);
            if (activeLink) activeLink.classList.add('active');
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' }
    );
    this.headings.forEach((h) => observer.observe(h));
  }
}

// ===================================================================
// 7. Animated Progress Bars (dashboard)
// ===================================================================
class ProgressBars {
  constructor() {
    this.bars = document.querySelectorAll('.bar-fill');
    if (!this.bars.length) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target.getAttribute('data-progress');
            if (target) {
              entry.target.style.width = target + '%';
            }
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    this.bars.forEach((bar) => this.observer.observe(bar));
  }
}

// ===================================================================
// 8. Floating Back-to-Top Button
// ===================================================================
class BackToTop {
  constructor() {
    this.btn = document.getElementById('back-to-top');
    if (!this.btn) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        this.btn.classList.add('visible');
      } else {
        this.btn.classList.remove('visible');
      }
    }, { passive: true });
    this.btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ===================================================================
// 9. Active Nav Link Highlighting
// ===================================================================
class NavActiveTracker {
  constructor() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach((a) => {
      const href = a.getAttribute('href');
      if (currentPath.endsWith(href) || (href === 'index.html' && (currentPath.endsWith('/') || currentPath.endsWith('/website/')))) {
        a.classList.add('active');
      }
    });
  }
}

// ===================================================================
// 10. Smooth anchor scrolling (fallback for older browsers)
// ===================================================================
class SmoothScroll {
  constructor() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a[href^="#"]');
      if (!target) return;
      const id = target.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // TOC: close mobile sidebar
        const toc = document.getElementById('chapter-toc');
        if (toc) toc.classList.remove('open');
      }
    });
  }
}

// ===================================================================
// Initialize Everything on DOM Ready
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  new ParticleBackground('particle-canvas');
  new ScrollRevealer();
  new ReadingProgress();
  new ThemeToggle();
  new MobileNav();
  new ChapterTOC();
  new ProgressBars();
  new BackToTop();
  new NavActiveTracker();
  new SmoothScroll();
});
