document.documentElement.classList.add('js');
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-navigation');
const headerEl = document.querySelector('.site-header');
function closeMenu() {
  toggle?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('is-open');
  headerEl?.classList.remove('is-open');
}
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation?.classList.toggle('is-open', open);
  headerEl?.classList.toggle('is-open', open);
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu(); toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header-inner')) closeMenu();
});
const chips = document.querySelector('.mobile-section-nav');
const hero = document.querySelector('.hero-section');
if (chips && hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    chips.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
  }).observe(hero);
}

// Motion FAQ Accordion (Unlumen UI interaction: spring reveal, single open)
function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach(acc => {
    acc.addEventListener('click', event => {
      const trigger = event.target.closest('.motion-accordion-trigger');
      if (!trigger) return;
      const item = trigger.closest('.motion-accordion-item');
      if (!item) return;
      const wasOpen = item.classList.contains('is-open');

      acc.querySelectorAll('.motion-accordion-item').forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('.motion-accordion-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });

      if (wasOpen) {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAccordion);
} else {
  initAccordion();
}

