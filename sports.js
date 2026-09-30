/**
 * Escuela Ombú - Subpáginas de Deportes (sports.js)
 * Interactividad limpia Mobile-First: Acordeón FAQ, Navegación Mobile y Smooth Scroll
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileDrawer();
  initFaqAccordion();
});

// Menú Drawer Mobile
function initMobileDrawer() {
  const btn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const header = document.querySelector('header.site-header');
  if (!btn || !drawer) return;

  function toggleDrawer(forceClose = false) {
    const isOpen = drawer.classList.contains('is-open');
    const nextState = forceClose ? false : !isOpen;

    drawer.classList.toggle('is-open', nextState);
    btn.setAttribute('aria-expanded', nextState ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', nextState ? 'false' : 'true');

    if (header) {
      header.classList.toggle('menu-active', nextState);
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDrawer();
  });

  // Cerrar al clickear cualquier link dentro del drawer
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleDrawer(true);
    });
  });

  // Cerrar al clickear fuera
  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !btn.contains(e.target)) {
      toggleDrawer(true);
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleDrawer(true);
      btn.focus();
    }
  });
}

// Acordeón de FAQs
function initFaqAccordion() {
  const questions = document.querySelectorAll('.faq-question-btn');
  if (!questions.length) return;

  questions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;

      const panel = item.querySelector('.faq-answer-panel');
      const isOpen = item.classList.contains('is-open');

      // Cerrar otros acordeones abiertos
      document.querySelectorAll('.faq-item.is-open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          const openPanel = openItem.querySelector('.faq-answer-panel');
          if (openPanel) openPanel.style.maxHeight = null;
        }
      });

      if (!isOpen && panel) {
        item.classList.add('is-open');
        panel.style.maxHeight = `${panel.scrollHeight + 16}px`;
      } else if (panel) {
        item.classList.remove('is-open');
        panel.style.maxHeight = null;
      }
    });
  });
}
