(() => {
   'use strict';

   function initHeaderControls() {
      if (window.__liquidHeaderControls) return;
      window.__liquidHeaderControls = true;

      const navigationRoots = () => Array.from(document.querySelectorAll('[data-navigation-status]'));
      const filterRoots = () => Array.from(document.querySelectorAll('[data-nav-filter-status]'));

      const isOpen = (roots, attribute) => roots().some((root) => root.getAttribute(attribute) === 'active');
      const setState = (roots, attribute, open) => {
         roots().forEach((root) => root.setAttribute(attribute, open ? 'active' : 'not-active'));
      };

      const syncOverlayState = () => {
         const navOpen = isOpen(navigationRoots, 'data-navigation-status');
         const filterOpen = isOpen(filterRoots, 'data-nav-filter-status');
         document.body.setAttribute('data-liquid-overlay-open', String(navOpen || filterOpen));
         document.querySelectorAll('[data-navigation-toggle="toggle"]').forEach((toggle) => {
            toggle.setAttribute('aria-expanded', String(navOpen));
         });
         document.querySelectorAll('[data-filter-toggle="toggle"]').forEach((toggle) => {
            (toggle.closest('button') || toggle).setAttribute('aria-expanded', String(filterOpen));
         });
      };

      document.querySelectorAll('[data-navigation-toggle="toggle"]').forEach((toggle) => {
         if (toggle.dataset.liquidControlReady === 'true') return;
         toggle.dataset.liquidControlReady = 'true';
         toggle.addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            const open = !isOpen(navigationRoots, 'data-navigation-status');
            setState(navigationRoots, 'data-navigation-status', open);
            if (open) setState(filterRoots, 'data-nav-filter-status', false);
            syncOverlayState();
         }, { capture: true });
      });

      document.querySelectorAll('[data-navigation-toggle="close"]').forEach((control) => {
         const trigger = control.closest('button') || control;
         trigger.addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            setState(navigationRoots, 'data-navigation-status', false);
            syncOverlayState();
         }, { capture: true });
      });

      document.querySelectorAll('[data-filter-toggle="toggle"]').forEach((control) => {
         const trigger = control.closest('button') || control;
         if (trigger.dataset.liquidFilterReady === 'true') return;
         trigger.dataset.liquidFilterReady = 'true';
         trigger.addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            const open = !isOpen(filterRoots, 'data-nav-filter-status');
            setState(filterRoots, 'data-nav-filter-status', open);
            if (open) setState(navigationRoots, 'data-navigation-status', false);
            syncOverlayState();
         }, { capture: true });
      });

      document.querySelectorAll('[data-filter-toggle="close"]').forEach((control) => {
         const trigger = control.closest('button') || control;
         trigger.addEventListener('click', (event) => {
            event.stopImmediatePropagation();
            setState(filterRoots, 'data-nav-filter-status', false);
            syncOverlayState();
         }, { capture: true });
      });

      document.addEventListener('keydown', (event) => {
         if (event.key !== 'Escape') return;
         setState(navigationRoots, 'data-navigation-status', false);
         setState(filterRoots, 'data-nav-filter-status', false);
         syncOverlayState();
      });

      const setViewportHeight = () => {
         document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      };
      setViewportHeight();
      window.addEventListener('resize', setViewportHeight, { passive: true });
      syncOverlayState();
   }

   function initLiquidGooey() {
      if (window.__liquidGooeyReady) return;
      window.__liquidGooeyReady = true;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function bindIndicator(group, itemSelector, defaultSelector, followHover) {
         if (!group || group.dataset.liquidIndicatorReady === 'true') return;
         const items = Array.from(group.querySelectorAll(itemSelector));
         if (!items.length) return;

         group.dataset.liquidIndicatorReady = 'true';
         group.classList.add('liquid-selection-group');
         const indicator = document.createElement('span');
         indicator.className = 'liquid-selection';
         indicator.setAttribute('aria-hidden', 'true');
         group.prepend(indicator);

         let currentItem = null;
         let settleTimer;
         const activeItem = () => {
            const explicit = items.find((item) => item.matches('.active, [data-link-status="active"], [aria-current="page"]'));
            if (explicit) return explicit;
            if (defaultSelector === null) return null;
            return (defaultSelector ? group.querySelector(defaultSelector) : null) || items[0];
         };

         const moveTo = (item, instant) => {
            if (!(item instanceof HTMLElement) || !item.getClientRects().length) {
               indicator.dataset.visible = 'false';
               return;
            }
            const groupRect = group.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            const previousRect = currentItem instanceof HTMLElement ? currentItem.getBoundingClientRect() : itemRect;
            const travel = Math.hypot(itemRect.left - previousRect.left, itemRect.top - previousRect.top);
            const accent = window.getComputedStyle(item).getPropertyValue('--tc').trim();
            indicator.style.setProperty('--liquid-x', `${itemRect.left - groupRect.left + group.scrollLeft}px`);
            indicator.style.setProperty('--liquid-y', `${itemRect.top - groupRect.top + group.scrollTop}px`);
            indicator.style.setProperty('--liquid-w', `${itemRect.width}px`);
            indicator.style.setProperty('--liquid-h', `${itemRect.height}px`);
            indicator.style.setProperty('--liquid-stretch', String(Math.min(1.13, 1 + travel / 900)));
            if (accent) indicator.style.setProperty('--liquid-accent', accent);
            indicator.dataset.instant = String(Boolean(instant || reducedMotion));
            indicator.dataset.visible = 'true';
            indicator.dataset.moving = travel > 10 && !instant && !reducedMotion ? 'true' : 'false';
            currentItem = item;
            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(() => {
               indicator.dataset.moving = 'false';
               indicator.style.setProperty('--liquid-stretch', '1');
               indicator.dataset.instant = 'false';
            }, 280);
         };

         const moveToActive = (instant = false) => moveTo(activeItem(), instant);
         if (followHover) {
            items.forEach((item) => {
               item.addEventListener('pointerenter', () => moveTo(item, false));
               item.addEventListener('focusin', () => moveTo(item, false));
            });
            group.addEventListener('pointerleave', () => moveToActive(false));
            group.addEventListener('focusout', (event) => {
               if (!group.contains(event.relatedTarget)) moveToActive(false);
            });
         }

         const observer = new MutationObserver(() => requestAnimationFrame(() => moveToActive(false)));
         items.forEach((item) => observer.observe(item, {
            attributes: true,
            attributeFilter: ['class', 'data-link-status', 'aria-current'],
         }));
         if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(() => moveToActive(true));
            resizeObserver.observe(group);
         } else {
            window.addEventListener('resize', () => moveToActive(true), { passive: true });
         }
         requestAnimationFrame(() => moveToActive(true));
      }

      document.querySelectorAll('.main-nav-bar nav[aria-label="Navigation Desktop"] > ul').forEach((group) => bindIndicator(group, ':scope > li[data-barba-update]', null, true));
      document.querySelectorAll('.preview-sidebar').forEach((group) => bindIndicator(group, '[data-preview-track-button]', '.active', true));
      document.querySelectorAll('.preview-mobile-pills').forEach((group) => bindIndicator(group, '[data-preview-track-button]', '.active', true));
      document.querySelectorAll('.day-tabs-track').forEach((group) => bindIndicator(group, '.sched-day-btn', '.active', true));
      document.querySelectorAll('.sched-sidebar .track-group').forEach((group) => bindIndicator(group, '.sched-track-btn', '.active', true));
      document.querySelectorAll('.mobile-track-pills, .room-day-nav, .grid-day-tabs').forEach((group) => bindIndicator(group, 'button', '.active', true));
      document.querySelectorAll('.speaker-nav').forEach((group) => {
         bindIndicator(group, '.speaker-nav-btn', '.speaker-nav-all', true);
         group.classList.add('liquid-hover-group');
      });
      document.querySelectorAll('.ev-nav').forEach((group) => {
         bindIndicator(group, '.ev-nav-btn', '.ev-nav-all', true);
         group.classList.add('liquid-hover-group');
      });
      document.querySelectorAll('[data-speaker-filter-control]').forEach((control) => {
         control.addEventListener('click', () => {
            if (reducedMotion) return;
            control.classList.remove('liquid-pop');
            void control.offsetWidth;
            control.classList.add('liquid-pop');
         });
      });
      document.querySelectorAll('.language-dropdown').forEach((dropdown) => {
         const button = dropdown.querySelector('.language-btn');
         const setExpanded = (expanded) => button?.setAttribute('aria-expanded', String(expanded));
         dropdown.addEventListener('pointerenter', () => setExpanded(true));
         dropdown.addEventListener('pointerleave', () => setExpanded(false));
         dropdown.addEventListener('focusin', () => setExpanded(true));
         dropdown.addEventListener('focusout', (event) => {
            if (!dropdown.contains(event.relatedTarget)) setExpanded(false);
         });
      });
   }

   const init = () => {
      initHeaderControls();
      initLiquidGooey();
   };
   window.initLiquidGooey = initLiquidGooey;
   // This file is loaded with `defer`, so the document has already been parsed.
   // Initializing here also lets the legacy animation bundle detect these native
   // controls before it attaches its fallback handlers.
   init();
})();
