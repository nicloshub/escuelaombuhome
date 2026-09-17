'use strict';

// Sólo el selector de deportes y el cierre del menú necesitan JavaScript.
const tabs = [...document.querySelectorAll('[role="tab"][data-sport]')];

function selectSport(sport, moveFocus = false) {
  const selected = tabs.find(tab => tab.dataset.sport === sport);
  if (!selected) return;
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  }
  if (moveFocus) selected.focus();
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectSport(tab.dataset.sport));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectSport(tabs[next].dataset.sport, true);
  });
}

for (const link of document.querySelectorAll('[data-sport-link]')) {
  link.addEventListener('click', () => selectSport(link.dataset.sportLink));
}
for (const link of document.querySelectorAll('a[href="#precios"]')) {
  link.addEventListener('click', () => selectSport('kitesurf'));
}
for (const link of document.querySelectorAll('.mobile-menu a')) {
  link.addEventListener('click', () => { link.closest('details').open = false; });
}
document.addEventListener('keydown', event => {
  const menu = document.querySelector('.mobile-menu');
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
