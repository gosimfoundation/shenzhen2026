// Desktop and Mobile Navigation SubLinks Handling
const navItems = document.querySelectorAll('.main-nav-bar li, .mobile-nav-box li');

navItems.forEach(item => {
   // Check if the item has subLinks in the original links array
   const hasSubLinks = item.getAttribute('data-has-sublinks') === 'true';

   if (hasSubLinks) {
      // Create sublinks container
      const subLinksContainer = document.createElement('ul');
      subLinksContainer.classList.add('sub-links');

      // Parse and add sublinks
      const subLinksData = JSON.parse(item.getAttribute('data-sublinks'));
      subLinksData.forEach(subLink => {
         const subLinkItem = document.createElement('li');
         const subLinkAnchor = document.createElement('a');

         subLinkItem.classList.add('link');
         subLinkItem.classList.add('link-hover');
         subLinkAnchor.classList.add('link-click');

         subLinkAnchor.href = subLink.link;
         subLinkAnchor.textContent = subLink.text;

         if (subLink?.anchor) {
            subLinkAnchor.setAttribute('data-anchor-target', subLink.anchor);
            subLinkAnchor.setAttribute('data-page-title', subLink.text);
         }

         if (subLink.openInNewTab) {
            subLinkAnchor.target = '_blank';
            subLinkAnchor.rel = 'noopener noreferrer';
         }

         subLinkItem.appendChild(subLinkAnchor);
         subLinksContainer.appendChild(subLinkItem);
      });

      item.appendChild(subLinksContainer);

      // Mobile toggle functionality
      item.addEventListener('click', (e) => {
         // Prevent immediate navigation if sublinks exist
         if (hasSubLinks) {
            item.classList.toggle('active');
         }
      });
   }
});

gsap.registerPlugin(ScrollTrigger);

let scroll;

// Allow browser's natural scroll restoration
if ('scrollRestoration' in history) {
   history.scrollRestoration = 'auto';
}

// Initialize page on document ready
$(document).ready(function () {
   initSmoothScroll();
   initScript();

   // Check scroll position and update header state immediately
   updateHeaderBasedOnScrollPosition();

   // And check again after a brief delay (for back navigation cases)
   setTimeout(updateHeaderBasedOnScrollPosition, 100);
});

// Helper function to update header state based on current scroll position
function updateHeaderBasedOnScrollPosition() {
   const currentPos = window.pageYOffset || document.documentElement.scrollTop;
   const thresholdTop = 50;

   if (currentPos > thresholdTop) {
      $("[data-scrolling-started]").attr('data-scrolling-started', 'true');
      $("[data-scrolling-direction]").attr('data-scrolling-direction', 'down');
   } else {
      $("[data-scrolling-started]").attr('data-scrolling-started', 'false');
      $("[data-scrolling-direction]").attr('data-scrolling-direction', 'up');
   }
}

// Add popstate event handler for back/forward navigation
window.addEventListener('popstate', function () {
   // Short delay to let browser restore scroll position first
   setTimeout(updateHeaderBasedOnScrollPosition, 50);
});

function initSmoothScroll() {
   // Lenis: https://github.com/studio-freight/lenis
   initLenis();
   ScrollTrigger.refresh();
}

function initLenis() {
   // Get current scroll position before creating Lenis
   const currentScrollY = window.scrollY || document.documentElement.scrollTop;

   scroll = new Lenis({
      duration: 0.8
   });

   scroll.on('scroll', ScrollTrigger.update);

   // Make sure Lenis knows about current scroll position
   if (currentScrollY > 0) {
      scroll.scrollTo(currentScrollY, { immediate: true });
   }

   gsap.ticker.add((time) => {
      scroll.raf(time * 1000);
   });

   gsap.ticker.lagSmoothing(0);
}

/**
 * Fire all scripts on page load
 */
function initScript() {
   initFlickitySlider();
   initCheckWindowHeight();
   initBasicFunctions();
   initCheckScrollUpDown();
   initScrollToAnchor();
   initScrollTriggerDataBackground();
   initScrolltriggerAnimations();
}

/**
 * Window Inner Height Check
 */
function initCheckWindowHeight() {
   // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
   let vh = window.innerHeight * 0.01;
   document.documentElement.style.setProperty('--vh', `${vh}px`);

   // Add resize listener
   window.addEventListener('resize', () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
   });
}

/**
 * Basic Functions
 */
function initBasicFunctions() {
   // Toggle Navigation
   $('[data-navigation-toggle="toggle"]').click(function () {
      if ($('[data-navigation-status]').attr('data-navigation-status') == 'not-active') {
         $('[data-navigation-status]').attr('data-navigation-status', 'active');
      } else {
         $('[data-navigation-status]').attr('data-navigation-status', 'not-active');
      }
   });

   // Close Navigation
   $('[data-navigation-toggle="close"]').click(function () {
      $('[data-navigation-status]').attr('data-navigation-status', 'not-active');
   });

   // Key ESC - Close Navigation
   $(document).keydown(function (e) {
      if (e.keyCode == 27) {
         if ($('[data-navigation-status]').attr('data-navigation-status') == 'active') {
            $('[data-navigation-status]').attr('data-navigation-status', 'not-active');
         }
      }
   });

   // Toggle Filter
   $('[data-filter-toggle="toggle"]').click(function () {
      if ($('[data-nav-filter-status]').attr('data-nav-filter-status') == 'not-active') {
         $('[data-nav-filter-status]').attr('data-nav-filter-status', 'active');
      } else {
         $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active');
      }
   });

   // Close Filter
   $('[data-filter-toggle="close"]').click(function () {
      $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active');
   });

   // Hover Btn
   $('.btn-hover').on('mouseenter', function () {
      if ($(this).find('.btn-click').hasClass('active')) {
         // Nothing
      } else {
         $(this).find('.btn-click').removeClass("transitioning").addClass("hover");
      }
   });
   $('.btn-hover').on('mouseleave', function () {
      if ($(this).find('.btn-click').hasClass('active')) {
         // Nothing
      } else {
         $(this).find('.btn-click').addClass("transitioning").removeClass("hover").delay(450).queue(function (next) {
            $(this).removeClass("transitioning");
            next();
         });
      }
   });

   // Audience Reasons Toggle
   $(".section-home-why").each(function () {
      var sectionHomeWhy = $(this);
      sectionHomeWhy.find('[data-audience-toggle]').click(function () {
         var audienceName = $(this).attr('data-audience-name');
         if ($(this).attr('data-audience-status') == 'not-active') {
            sectionHomeWhy.find('[data-audience-name="' + audienceName + '"]').attr('data-audience-status', 'active').siblings().attr('data-audience-status', 'not-active');
         }
      });
   });

   // Filter
   $('[data-filter-section]').each(function () {

      var filterSection = $(this);
      var filterGroup = $('[data-filter-group]');
      var filterGrid = $('[data-filter-grid]');

      // Handle initial filter state from URL
      const urlParams = new URLSearchParams(window.location.search);
      const initialFilter = urlParams.get('filter');
      if (initialFilter) {
         const filterElement = filterGroup.find(`[data-filter-category="${initialFilter}"]`);
         if (filterElement.length) {
            // Manually trigger the filter state instead of clicking
            $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active');
            filterGrid.addClass('toggle-fade-out');
            filterElement.attr('data-filter-status', 'active').siblings().attr('data-filter-status', 'not-active');
            setTimeout(function () {
               filterGrid.find('[data-filter-category]').attr('data-filter-status', 'not-active');
               filterGrid.find(`[data-filter-category="${initialFilter}"]`).attr('data-filter-status', 'active');
               filterGrid.removeClass('toggle-fade-out').addClass('toggle-fade-in');
               filterCheckEvenOdd();
               scroll.destroy();
               initLenis();
               initCheckScrollUpDown();
               ScrollTrigger.refresh();
            }, 200);
            setTimeout(function () {
               filterGrid.removeClass('toggle-fade-in');
            }, 400);
         }
      }

      filterGroup.find('[data-filter-category]').click(function () {
         var clickedFilter = $(this);
         var clickedFilterCategory = $(this).data('filter-category');
         if (clickedFilter.attr('data-filter-status') == 'active') {
            // If active > Do nothing
         }
         // All Filter
         else if (clickedFilterCategory == 'all') {
            $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active');
            filterGrid.addClass('toggle-fade-out');
            filterGroup.find('[data-filter-category="' + clickedFilterCategory + '"]').attr('data-filter-status', 'active').siblings().attr('data-filter-status', 'not-active');
            setTimeout(function () {
               filterGrid.find('[data-filter-category]').attr('data-filter-status', 'active');
               filterGrid.removeClass('toggle-fade-out').addClass('toggle-fade-in');
               filterCheckEvenOdd();
               scroll.destroy();
               initLenis();
               initCheckScrollUpDown();
               ScrollTrigger.refresh();
            }, 200);
            setTimeout(function () {
               filterGrid.removeClass('toggle-fade-in');
            }, 400);
            // Update URL to remove filter
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('filter');
            history.pushState(null, '', currentUrl.toString());
         }
         // Category Filters
         else {
            $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active');
            filterGrid.addClass('toggle-fade-out');
            filterGroup.find('[data-filter-category="' + clickedFilterCategory + '"]').attr('data-filter-status', 'active').siblings().attr('data-filter-status', 'not-active');
            setTimeout(function () {
               filterGrid.find('[data-filter-category]').attr('data-filter-status', 'not-active');
               filterGrid.find('[data-filter-category="' + clickedFilterCategory + '"]').attr('data-filter-status', 'active');
               filterGrid.removeClass('toggle-fade-out').addClass('toggle-fade-in');
               filterCheckEvenOdd();
               scroll.destroy();
               initLenis();
               initCheckScrollUpDown();
               ScrollTrigger.refresh();
            }, 200);
            setTimeout(function () {
               filterGrid.removeClass('toggle-fade-in');
            }, 400);
            // Update URL with filter
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('filter', clickedFilterCategory.toLowerCase().replace(/ /g, '-'));
            history.pushState(null, '', currentUrl.toString());
         }
      });

      function filterCheckEvenOdd() {
         filterGrid.find('[data-filter-status="active"]').each(function (index) {
            if (index % 2 == 0) {
               $(this).attr('data-filter-index-even', 'true');
            } else {
               $(this).attr('data-filter-index-even', 'false');
            }
         });
      }
   });

   // Modal Cards
   var modalCards = $('[data-modal-grid]');

   modalCards.find('[data-modal-card-id]').click(function () {
      var clickedCard = $(this);
      var clickedCardId = $(this).data('modal-card-id');
      if (clickedCard.attr('data-modal-card-status') == 'active') {
         // If active > Do nothing
      } else {
         $('[data-modal-status]').attr('data-modal-status', 'active');
         $('[data-modal-card-id]').attr('data-modal-card-status', 'not-active');
         $('[data-modal-card-id="' + clickedCardId + '"]').attr('data-modal-card-status', 'active')
      }
   });

   // Prelaunch Modal
   $('[data-prelaunch-modal="toggle"]').click(function () {
      $('[data-modal-prelaunch-status]').attr('data-modal-prelaunch-status', 'active');
      $('[data-modal-card-id]').attr('data-modal-card-status', 'not-active');
      $('[data-modal-card-id="prelaunch"]').attr('data-modal-card-status', 'active')
   });

   // Tickets Modal
   $('[data-tickets-modal="toggle"]').click(function () {
      $('[data-modal-tickets-status]').attr('data-modal-tickets-status', 'active');
      $('[data-modal-card-id]').attr('data-modal-card-status', 'not-active');
      $('[data-modal-card-id="tickets"]').attr('data-modal-card-status', 'active')
      //Send an event (Add to cart) to the DataLayer
      dataLayer.push({ 'event': 'add_to_cart' });
   });

   // Close Modal
   $('[data-modal-toggle="close"]').click(function () {
      $('[data-modal-status]').attr('data-modal-status', 'not-active');
      $('[data-modal-prelaunch-status]').attr('data-modal-prelaunch-status', 'not-active');
      $('[data-modal-tickets-status]').attr('data-modal-tickets-status', 'not-active');
      $('[data-modal-card-id]').attr('data-modal-card-status', 'not-active');
   });

   $('[data-scroll-prevent]').mouseover(function () {
      scroll.stop();
   });

   $('[data-scroll-prevent]').mouseout(function () {
      scroll.start();
   });

   // Accordion
   $('[data-accordion-toggle]').click(function () {
      if ($(this).parent().attr('data-accordion-status') == 'active') {
         $(this).parent().attr('data-accordion-status', 'not-active').siblings().attr('data-accordion-status', 'not-active');
      }
      else {
         $(this).parent().siblings().attr('data-accordion-status', 'not-active');
         $(this).parent().attr('data-accordion-status', 'active');
      }
      setTimeout(function () {
         scroll.destroy();
         initLenis();
         initCheckScrollUpDown();
         ScrollTrigger.refresh();
      }, 300);
   });

   // Jury Toggle
   $('[data-jury-id]').on('click mouseover', function () {
      if ($(this).attr('data-jury-status') == 'not-active') {
         $(this).attr('data-jury-status', 'active').siblings().attr('data-jury-status', 'not-active');
      }
   });

   // Toggle Navigation
   $('[data-ticket-toggle="toggle"]').click(function () {
      if ($('[data-ticket-status]').attr('data-ticket-status') == 'not-active') {
         $('[data-ticket-status]').attr('data-ticket-status', 'active');
      } else {
         $('[data-ticket-status]').attr('data-ticket-status', 'not-active');
      }
   });

   // Close Navigation
   $('[data-ticket-toggle="close"]').click(function () {
      $('[data-ticket-status]').attr('data-ticket-status', 'not-active');
   });
}

/**
 * Lenis - Check Scroll up or Down
 */
function initCheckScrollUpDown() {
   var lastScrollTop = 0;
   var threshold = 50;
   var thresholdTop = 50;

   // Update header state based on initial scroll position
   updateHeaderBasedOnScrollPosition();

   function startCheckScroll() {
      scroll.on('scroll', (e) => {
         var nowScrollTop = e.targetScroll;

         if (Math.abs(lastScrollTop - nowScrollTop) >= threshold) {
            // Check Scroll Direction
            if (nowScrollTop > lastScrollTop) {
               $("[data-scrolling-direction]").attr('data-scrolling-direction', 'down');
            } else {
               $("[data-scrolling-direction]").attr('data-scrolling-direction', 'up');
            }
            lastScrollTop = nowScrollTop;

            // Check if Scroll Started
            if (nowScrollTop > thresholdTop) {
               $("[data-scrolling-started]").attr('data-scrolling-started', 'true');
            } else {
               $("[data-scrolling-started]").attr('data-scrolling-started', 'false');
            }
         }
      });
   }
   startCheckScroll();

   // Also detect browser's native scroll events as a backup
   window.addEventListener('scroll', function () {
      // Only run this if Lenis isn't actively handling the scroll
      if (!scroll || !scroll.isScrolling) {
         const currentPos = window.pageYOffset || document.documentElement.scrollTop;
         updateScrollHeaderState(currentPos);
      }
   }, { passive: true });

   // Function to update header state
   function updateScrollHeaderState(currentPos) {
      if (Math.abs(lastScrollTop - currentPos) >= threshold) {
         // Check Scroll Direction
         if (currentPos > lastScrollTop) {
            $("[data-scrolling-direction]").attr('data-scrolling-direction', 'down');
         } else {
            $("[data-scrolling-direction]").attr('data-scrolling-direction', 'up');
         }
         lastScrollTop = currentPos;

         // Check if Scroll Started
         if (currentPos > thresholdTop) {
            $("[data-scrolling-started]").attr('data-scrolling-started', 'true');
         } else {
            $("[data-scrolling-started]").attr('data-scrolling-started', 'false');
         }
      }
   }
}

/**
 * Lenis - ScrollTo Anchor Links
 */
function initScrollToAnchor() {
   var scrollToOffset = ($(".main-nav-bar").innerHeight() * -1);

   // Handle elements with data-anchor-target attribute
   $("[data-anchor-target]").click(function (e) {
      e.preventDefault(); // Prevent default anchor behavior

      let targetScrollToAnchorLenis = $(this).attr('data-anchor-target');

      // Update page title if provided
      const pageTitle = $(this).attr('data-page-title') || $(this).text();
      $('[data-change-page-title]').text(pageTitle);

      // Scroll to anchor
      scroll.scrollTo(targetScrollToAnchorLenis, {
         duration: 1,
         offset: scrollToOffset,
         easing: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
      });

      // Update URL without page reload
      if (history.pushState) {
         history.pushState(null, null, targetScrollToAnchorLenis);
      }
   });

   // Handle regular anchor links (href starting with #)
   $("a[href^='#']").click(function (e) {
      const href = $(this).attr('href');

      // Skip if it's an empty anchor or just #
      if (href === '#' || href === '') {
         return;
      }

      e.preventDefault(); // Prevent default anchor behavior

      // Scroll to anchor using Lenis
      scroll.scrollTo(href, {
         duration: 1,
         offset: scrollToOffset,
         easing: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
      });

      // Update URL without page reload
      if (history.pushState) {
         history.pushState(null, null, href);
      }
   });

   // Check for hash on page load and scroll to it
   $(window).on('load', function () {
      const hash = window.location.hash;
      if (hash) {
         setTimeout(() => {
            scroll.scrollTo(hash, {
               duration: 1,
               offset: scrollToOffset,
               easing: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
            });
         }, 500);
      }
   });

   $(".filter-container [data-filter-category]").click(function () {
      setTimeout(function () {
         scroll.scrollTo("#grid", {
            immediate: true,
            offset: scrollToOffset,
         });
      }, 200);
   });
}

/**
 * Scrolltrigger - Check Theme of Sections
 */
function initScrollTriggerDataBackground() {
   // Calculate offset navigation
   const navHeight = $(".main-nav-bar").innerHeight();

   // Check Theme (Dark/Light)
   $('[data-theme-section]').each(function () {
      var themeName = $(this).attr('data-theme-section');
      var singleSection = gsap.utils.toArray('[data-theme-section="' + themeName + '"]');

      singleSection.forEach(singleSection => {
         ScrollTrigger.create({
            trigger: singleSection,
            start: () => "0% " + navHeight,
            end: "100% " + navHeight,
            onEnter: () => functionAddTheme(),
            onEnterBack: () => functionAddTheme(),
            markers: false,
         });
         function functionAddTheme() {
            if ($('[data-theme-nav]').attr('data-theme-nav') == themeName) {
            } else {
               $('[data-theme-nav]').attr('data-theme-nav', themeName);
            }
         };
      });
   });

   // Check Background Color
   $('[data-bg-section]').each(function () {
      var bgColorName = $(this).attr('data-bg-section');
      var singleBgColor = gsap.utils.toArray('[data-bg-section="' + bgColorName + '"]');

      singleBgColor.forEach(singleBgColor => {
         ScrollTrigger.create({
            trigger: singleBgColor,
            start: () => "0% " + navHeight,
            end: "100% " + navHeight,
            onEnter: () => functionAddTheme(),
            onEnterBack: () => functionAddTheme(),
            markers: false,
         });
         function functionAddTheme() {
            if ($('[data-bg-nav]').attr('data-bg-nav') == bgColorName) {
            } else {
               $('[data-bg-nav]').attr('data-bg-nav', bgColorName);
            }
         };
      });
   });
}

/**
* Flickity Slider
*/
function initFlickitySlider() {
   // Source
   // https://flickity.metafizzy.co/

   // Slider type: Cards
   $('[data-flickity-slider-type="cards"]').each(function (index) {
      var sliderIndexID = 'flickity-slider-type-cards-id-' + index;
      $(this).attr('id', sliderIndexID);

      var sliderThis = $(this);

      var flickitySliderGroup = document.querySelector('#' + sliderIndexID + ' .flickity-carousel');
      var flickitySlider = sliderThis.find('.flickity-carousel').flickity({
         // options
         watchCSS: true,
         contain: true,
         wrapAround: false,
         dragThreshold: 10,
         prevNextButtons: false,
         pageDots: false,
         cellAlign: 'left',
         selectedAttraction: 0.015,
         friction: 0.25,
         percentPosition: true,
         freeScroll: false,
         on: {
            'dragStart': () => {
               flickitySlider.css("pointer-events", "none");
            },
            'dragEnd': () => {
               flickitySlider.css("pointer-events", "auto");
            },
            change: function () {
               updatePagination();
            }
         }
      });

      // Flickity instance
      var flkty = flickitySlider.data('flickity');

      // previous
      var prevButton = sliderThis.find('[data-flickity-control="prev"]').on('click', function () {
         flickitySlider.flickity('previous');
      });
      // next
      var nextButton = sliderThis.find('[data-flickity-control="next"]').on('click', function () {
         flickitySlider.flickity('next');
      });
      // Get the amount of columns variable and use to calc last slide
      var inviewColumns = window.getComputedStyle(flickitySliderGroup).getPropertyValue('--columns');

      function updatePagination() {
         // enable/disable previous/next buttons
         if (!flkty.cells[flkty.selectedIndex - 1]) {
            prevButton.attr('disabled', 'disabled');
            nextButton.removeAttr('disabled'); // <-- remove disabled from the next
         } else if (!flkty.cells[flkty.selectedIndex + parseInt(inviewColumns)]) {
            nextButton.attr('disabled', 'disabled');
            prevButton.removeAttr('disabled'); //<-- remove disabled from the prev
         } else {
            prevButton.removeAttr('disabled');
            nextButton.removeAttr('disabled');
         }
      }
   });
}

/**
* Scrolltrigger Animations Desktop + Mobile
*/
function initScrolltriggerAnimations() {
   if (document.querySelector('[data-filter-grid]')) {
      $('[data-filter-grid]').each(function () {
         let triggerElement = $(this);
         let targetElement = $('.filter-alpha-animate');

         let tl = gsap.timeline({
            scrollTrigger: {
               trigger: triggerElement,
               start: "0% 0%",
               end: "100% 0%",
               toggleActions: 'play reverse play reset',
               onLeave: () => $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active'),
               onLeaveBack: () => $('[data-nav-filter-status]').attr('data-nav-filter-status', 'not-active'),
            }
         });

         tl.to(targetElement, {
            autoAlpha: 1,
            duration: 0.3,
            ease: "Power1.easeInOut"
         });
      });
   }

   if (document.querySelector(".section-stats")) {
      $(".section-stats").each(function (index) {
         let triggerElement = $(this);
         let targetElement = $(this).find(".count-up");

         let tl = gsap.timeline({
            scrollTrigger: {
               trigger: triggerElement,
               start: "0% 70%",
               end: "100% 0%"
            }
         });
         tl.from(targetElement, {
            duration: 2.5,
            ease: Expo.easeOut,
            innerText: 0,
            roundProps: "innerText",
            stagger: 0,
            onUpdate: function () {
               this.targets().forEach(target => {
                  const val = gsap.getProperty(target, "innerText");
                  target.innerText = numberWithCommas(val);
               });
            },
         }, "<");

         function numberWithCommas(n) {
            var parts = n.toString().split(".");
            return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
         }
      });
   }

   ScrollTrigger.matchMedia({
      "(min-width: 1025px)": function () {
         if (document.querySelector('.animate-read')) {
            // Scrolltrigger Animation : Example
            $('.animate-read').each(function (index) {
               let triggerElement = $(this);
               let targetElement = $(this).find('.single-word');

               let tl = gsap.timeline({
                  scrollTrigger: {
                     trigger: triggerElement,
                     start: "0% 95%",
                     end: "100% 55%",
                     scrub: 1
                  }
               });

               tl.fromTo(targetElement, {
                  opacity: 0.1,
               }, {
                  duration: 0.1,
                  opacity: 1,
                  stagger: 0.01,
                  ease: "none"
               });
            });
         }
      }
   });
}

/**
 * Hero — GOSIM logo zoom tunnel effect
 * Pins the hero and scales up the GOSIM SVG so the viewport flies through the O
 */
function initHeroZoomTunnel() {
   var hero = document.querySelector('.section-home-header');
   if (!hero) return;

   var gosimSvg = hero.querySelector('.logo-gosim-scroll svg');
   if (!gosimSvg) return;

   var fadeElements = hero.querySelectorAll('.event-facts, .btn-home-wrap');

   // O center in SVG viewBox (0 0 85 30): x≈34.2 y≈8.0
   // As percentage: 40.2% x, 26.7% y
   gosimSvg.style.transformOrigin = '40.2% 26.7%';

   // Store default state so we can force-reset cleanly
   var defaultState = { scale: 1 };
   var defaultFade = { opacity: 1, y: 0 };

   var tl = gsap.timeline({
      scrollTrigger: {
         trigger: hero,
         start: "top top",
         end: "+=150%",
         scrub: true,
         pin: true,
         onLeaveBack: function () {
            // Kill any in-flight tweens then hard-reset to initial state
            gsap.killTweensOf(gosimSvg);
            gsap.killTweensOf(fadeElements);
            gsap.set(gosimSvg, defaultState);
            gsap.set(fadeElements, defaultFade);
         },
      }
   });

   // Date and buttons fade out first
   tl.to(fadeElements, {
      opacity: 0,
      y: -30,
      duration: 0.2,
      ease: "power1.in",
   }, 0);

   // GOSIM SVG zooms in — fly through the O counter
   tl.to(gosimSvg, {
      scale: 60,
      duration: 1,
      ease: "power2.in",
   }, 0.05);

   // Video overlay fades to black as we enter the tunnel
   var overlay = hero.querySelector('.overlay-gradient-v2');
   if (overlay) {
      tl.to(overlay, {
         backgroundColor: 'rgba(0,0,0,0.8)',
         duration: 0.4,
      }, 0.6);
   }
}