/**
 * Escuela Ombú - Subpáginas de Deportes (sports.js)
 * Manejo interactivo de FAQs, navegación móvil, dropdown y smooth scroll
 */

document.addEventListener('DOMContentLoaded', () => {
  initSubpageMobileMenu();
  initSubpageSportsDropdown();
  initSubpageFaq();
});

// Dropdown de Deportes en Navbar
function initSubpageSportsDropdown() {
  const trigger = document.getElementById('navSportsTrigger');
  const viewport = document.getElementById('navSportsViewport');
  const dropdown = document.getElementById('navSportsDropdown');
  const pill = document.getElementById('dropdownHoverPill');
  const items = document.querySelectorAll('.dropdown-sport-item');

  if (!trigger || !dropdown) return;

  function openDropdown() {
    trigger.setAttribute('aria-expanded', 'true');
    dropdown.classList.add('is-open');
  }

  function closeDropdown() {
    trigger.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('is-open');
    if (pill) pill.style.opacity = '0';
  }

  dropdown.addEventListener('mouseenter', openDropdown);
  dropdown.addEventListener('mouseleave', closeDropdown);

  trigger.addEventListener('click', (e) => {
    // Si estamos en mobile o click manual
    if (window.innerWidth <= 1024) {
      e.preventDefault();
      const isOpen = dropdown.classList.contains('is-open');
      if (isOpen) closeDropdown();
      else openDropdown();
    }
  });

  // Microinteracción pill de fondo en dropdown
  if (pill && items.length) {
    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        const itemRect = item.getBoundingClientRect();
        const menuRect = item.parentElement.getBoundingClientRect();
        pill.style.top = `${itemRect.top - menuRect.top}px`;
        pill.style.left = `${itemRect.left - menuRect.left}px`;
        pill.style.width = `${itemRect.width}px`;
        pill.style.height = `${itemRect.height}px`;
        pill.style.opacity = '1';
      });
    });

    const menuEl = document.querySelector('.nav-dropdown-menu');
    if (menuEl) {
      menuEl.addEventListener('mouseleave', () => {
        pill.style.opacity = '0';
      });
    }
  }
}

// Menú Drawer Mobile
function initSubpageMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const header = document.querySelector('header.site-header');
  if (!btn || !drawer || !header) return;

  function toggleMenu(forceClose = false) {
    const shouldOpen = forceClose ? false : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', shouldOpen);
    btn.classList.toggle('is-active', shouldOpen);
    header.classList.toggle('menu-open', shouldOpen);
    btn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(true);
    });
  });

  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) {
      toggleMenu(true);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      toggleMenu(true);
      btn.focus();
    }
  });
}

// Acordeón de FAQs
function initSubpageFaq() {
  const faqButtons = document.querySelectorAll('.sport-faq-question');
  if (!faqButtons.length) return;

  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.sport-faq-item');
      const answer = item.querySelector('.sport-faq-answer');
      const isOpen = item.classList.contains('is-open');

      // Cerrar otros abiertos (comportamiento acordeón limpio)
      document.querySelectorAll('.sport-faq-item.is-open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.sport-faq-answer').style.maxHeight = null;
        }
      });

      if (!isOpen) {
        item.classList.add('is-open');
        answer.style.maxHeight = `${answer.scrollHeight + 20}px`;
      } else {
        item.classList.remove('is-open');
        answer.style.maxHeight = null;
      }
    });
  });
}
