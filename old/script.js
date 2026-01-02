// ============ PERFORMANCE UTILITIES ============
let isPageVisible = true;
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
});

// ============ PORTFOLIO LIGHTBOX ============
(function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    const lightboxImage = lightbox.querySelector('.lightbox-image');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');
    const lightboxCurrent = lightbox.querySelector('.lightbox-current');
    const lightboxTotal = lightbox.querySelector('.lightbox-total');
    const lightboxBackdrop = lightbox.querySelector('.lightbox-backdrop');
    
    let currentImages = [];
    let currentIndex = 0;
    
    // Get all portfolio images
    function updateImageList() {
        const visibleItems = document.querySelectorAll('.portfolio-item[style*="display: block"], .portfolio-item:not([style*="display: none"])');
        currentImages = Array.from(visibleItems).map(item => {
            const img = item.querySelector('img');
            return img ? img.dataset.full || img.src : null;
        }).filter(Boolean);
    }
    
    // Open lightbox
    function openLightbox(index) {
        updateImageList();
        if (currentImages.length === 0) return;
        
        currentIndex = index;
        loadImage(currentIndex);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        lightboxTotal.textContent = currentImages.length;
    }
    
    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        lightboxImage.classList.remove('loaded');
    }
    
    // Load image with optional animation direction
    function loadImage(index, animDirection = 0) {
        lightboxImage.classList.remove('loaded', 'slide-left', 'slide-right');
        lightboxCurrent.textContent = index + 1;
        
        // Add exit animation
        if (animDirection !== 0) {
            lightboxImage.classList.add(animDirection > 0 ? 'slide-out-left' : 'slide-out-right');
        }
        
        const img = new Image();
        img.onload = () => {
            // Remove exit animation, add enter animation
            lightboxImage.classList.remove('slide-out-left', 'slide-out-right');
            lightboxImage.src = currentImages[index];
            
            if (animDirection !== 0) {
                lightboxImage.classList.add(animDirection > 0 ? 'slide-in-right' : 'slide-in-left');
                // Remove animation class after it completes
                setTimeout(() => {
                    lightboxImage.classList.remove('slide-in-left', 'slide-in-right');
                }, 300);
            }
            
            lightboxImage.classList.add('loaded');
        };
        img.src = currentImages[index];
    }
    
    // Navigate with animation
    function navigate(direction) {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = currentImages.length - 1;
        if (currentIndex >= currentImages.length) currentIndex = 0;
        loadImage(currentIndex, direction);
    }
    
    // Event listeners
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxBackdrop.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigate(-1));
    lightboxNext.addEventListener('click', () => navigate(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });
    
    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            navigate(diff > 0 ? 1 : -1);
        }
    }, { passive: true });
    
    // Click on portfolio items
    document.addEventListener('click', (e) => {
        const portfolioItem = e.target.closest('.portfolio-item');
        if (!portfolioItem) return;
        
        const img = portfolioItem.querySelector('img');
        if (!img) return;
        
        updateImageList();
        const fullSrc = img.dataset.full || img.src;
        const index = currentImages.indexOf(fullSrc);
        
        if (index !== -1) {
            openLightbox(index);
        }
    });
})();

// Throttle function for scroll/resize events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Unified animation loop for better performance
const animationCallbacks = [];
let animationRunning = false;

// Track which sections are visible
let megaCounterVisible = true;
let heroVisible = true;

function registerAnimation(callback) {
    animationCallbacks.push(callback);
    if (!animationRunning) {
        animationRunning = true;
        runAnimationLoop();
    }
}

function runAnimationLoop() {
    if (!isPageVisible) {
        requestAnimationFrame(runAnimationLoop);
        return;
    }
    
    for (let i = 0; i < animationCallbacks.length; i++) {
        animationCallbacks[i]();
    }
    
    requestAnimationFrame(runAnimationLoop);
}

// Setup visibility observers for heavy sections
function setupSectionVisibility() {
    const megaSection = document.getElementById('mega-counter');
    const heroSection = document.getElementById('hero');
    const comparisonSection = document.getElementById('comparison');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.target.id === 'mega-counter') {
                megaCounterVisible = entry.isIntersecting;
            } else if (entry.target.id === 'hero') {
                heroVisible = entry.isIntersecting;
            } else if (entry.target.id === 'comparison') {
                // Enable shine animation only when visible
                const shineElements = entry.target.querySelectorAll('.comparison-result-badge');
                shineElements.forEach(el => {
                    const before = el.querySelector('::before');
                    el.style.setProperty('--animation-state', entry.isIntersecting ? 'running' : 'paused');
                });
            }
        });
    }, { rootMargin: '100px' });
    
    if (megaSection) observer.observe(megaSection);
    if (heroSection) observer.observe(heroSection);
    if (comparisonSection) observer.observe(comparisonSection);
}

// Initialize after DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSectionVisibility);
} else {
    setupSectionVisibility();
}

// ============ CUSTOM CURSOR (Desktop only - FIXED) ============
const cursor = document.getElementById('cursor');
const cursorFollower = document.getElementById('cursor-follower');
let mouseX = -100, mouseY = -100; // Start offscreen to prevent flash
let cursorX = -100, cursorY = -100;
let followerX = -100, followerY = -100;
let cursorVisible = false;
let cursorEnlarged = false;

const isDesktop = window.innerWidth > 1024 && !('ontouchstart' in window);

if (isDesktop && cursor && cursorFollower) {
    // Hide cursor until mouse enters
    cursor.style.opacity = '0';
    cursorFollower.style.opacity = '0';
    
    document.addEventListener('mouseenter', () => {
        cursorVisible = true;
        cursor.style.opacity = '1';
        cursorFollower.style.opacity = '1';
    }, { passive: true });
    
    document.addEventListener('mouseleave', () => {
        cursorVisible = false;
        cursor.style.opacity = '0';
        cursorFollower.style.opacity = '0';
    }, { passive: true });
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (!cursorVisible) {
            cursorVisible = true;
            cursor.style.opacity = '1';
            cursorFollower.style.opacity = '1';
            // Snap to position on first move
            cursorX = mouseX;
            cursorY = mouseY;
            followerX = mouseX;
            followerY = mouseY;
        }
    }, { passive: true });

    // Smooth cursor animation - unified loop
    registerAnimation(function animateCursor() {
        if (cursorVisible) {
            // Main cursor - fast smooth follow
            cursorX += (mouseX - cursorX) * 0.4;
            cursorY += (mouseY - cursorY) * 0.4;
            cursor.style.left = cursorX + 'px';
            cursor.style.top = cursorY + 'px';

            // Follower - slightly delayed
            followerX += (mouseX - followerX) * 0.3;
            followerY += (mouseY - followerY) * 0.3;
            cursorFollower.style.left = followerX + 'px';
            cursorFollower.style.top = followerY + 'px';
        }
    });

    // Cursor hover effects - use event delegation
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a, button, .portfolio-item, .faq-item, [data-tilt], input, textarea, [data-magnetic]');
        if (target) {
            cursor.classList.add('hover');
            cursorEnlarged = true;
        }
    }, { passive: true });
    
    document.addEventListener('mouseout', (e) => {
        const target = e.target.closest('a, button, .portfolio-item, .faq-item, [data-tilt], input, textarea, [data-magnetic]');
        if (target) {
            cursor.classList.remove('hover');
            cursorEnlarged = false;
        }
    }, { passive: true });

    // Cursor click effect
    document.addEventListener('mousedown', () => cursor.classList.add('click'), { passive: true });
    document.addEventListener('mouseup', () => cursor.classList.remove('click'), { passive: true });
}

// ============ SPOTLIGHT EFFECT ============
const spotlight = document.createElement('div');
spotlight.className = 'cursor-spotlight';
document.body.appendChild(spotlight);

// Spotlight uses CSS variables - throttled for performance
if (isDesktop) {
    let spotlightX = 0, spotlightY = 0;
    let spotlightTargetX = 0, spotlightTargetY = 0;
    
    document.addEventListener('mousemove', (e) => {
        spotlightTargetX = e.clientX;
        spotlightTargetY = e.clientY;
    }, { passive: true });
    
    // Update spotlight in animation loop - smoother and batched
    registerAnimation(function updateSpotlight() {
        // Only update when near top of page (hero/mega visible)
        if (!megaCounterVisible && !heroVisible) return;
        
        spotlightX += (spotlightTargetX - spotlightX) * 0.15;
        spotlightY += (spotlightTargetY - spotlightY) * 0.15;
        spotlight.style.setProperty('--spotlight-x', spotlightX + 'px');
        spotlight.style.setProperty('--spotlight-y', spotlightY + 'px');
    });
}

// ============ PARTICLES (Global Interactive) ============
const particlesContainer = document.getElementById('particles');
const globalParticleCount = isDesktop ? 35 : 15;
const globalParticles = [];

function createGlobalParticles() {
    if (!particlesContainer) return;
    
    for (let i = 0; i < globalParticleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle global-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = 'none';
        
        const colors = ['rgba(52, 211, 153, 0.4)', 'rgba(34, 211, 238, 0.35)', 'rgba(167, 139, 250, 0.35)', 'rgba(252, 211, 77, 0.3)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.width = (2 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.boxShadow = `0 0 ${8 + Math.random() * 12}px ${color}`;
        particle.style.opacity = '1';
        particle.style.position = 'absolute';
        
        particlesContainer.appendChild(particle);
        
        globalParticles.push({
            el: particle,
            x: parseFloat(particle.style.left),
            y: parseFloat(particle.style.top),
            baseX: parseFloat(particle.style.left),
            baseY: parseFloat(particle.style.top),
            speed: 0.2 + Math.random() * 0.8,
            floatOffsetX: Math.random() * Math.PI * 2,
            floatOffsetY: Math.random() * Math.PI * 2,
            floatSpeedX: 0.15 + Math.random() * 0.25,
            floatSpeedY: 0.1 + Math.random() * 0.2,
            floatAmplitudeX: 0.5 + Math.random() * 1.5,
            floatAmplitudeY: 0.5 + Math.random() * 1.5
        });
    }
}
createGlobalParticles();

// Global particles with ambient motion + mouse interaction
if (particlesContainer) {
    let globalMouseX = 50, globalMouseY = 50;
    let globalTime = 0;
    
    if (isDesktop) {
        document.addEventListener('mousemove', (e) => {
            globalMouseX = (e.clientX / window.innerWidth) * 100;
            globalMouseY = (e.clientY / window.innerHeight) * 100;
        }, { passive: true });
    }
    
    registerAnimation(function animateGlobalParticles() {
        // Skip when scrolled past hero/mega sections
        if (!megaCounterVisible && !heroVisible) return;
        
        globalTime += 0.016;
        
        globalParticles.forEach(p => {
            const floatX = Math.sin(globalTime * p.floatSpeedX + p.floatOffsetX) * p.floatAmplitudeX;
            const floatY = Math.cos(globalTime * p.floatSpeedY + p.floatOffsetY) * p.floatAmplitudeY;
            
            let targetX = p.baseX + floatX;
            let targetY = p.baseY + floatY;
            
            if (isDesktop) {
                const dx = globalMouseX - p.baseX;
                const dy = globalMouseY - p.baseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 20;
                
                if (distance < maxDistance && distance > 0) {
                    const force = (maxDistance - distance) / maxDistance;
                    targetX += (dx / distance) * force * 8 * p.speed;
                    targetY += (dy / distance) * force * 8 * p.speed;
                }
            }
            
            p.x += (targetX - p.x) * 0.05;
            p.y += (targetY - p.y) * 0.05;
            
            p.el.style.left = p.x + '%';
            p.el.style.top = p.y + '%';
        });
    });
}

// ============ SCROLL PROGRESS ============
const scrollProgress = document.getElementById('scroll-progress');

if (scrollProgress) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = scrollPercent + '%';
    }, { passive: true });
}

// ============ YOUTUBE LOGOS - RANDOM POSITION & BLUR ON SCROLL ============
(function initYouTubeLogos() {
    var logos = document.querySelectorAll('.bg-youtube-logo');
    
    // Add random position variation (±5% offset)
    logos.forEach(function(logo) {
        var randomTopOffset = (Math.random() - 0.5) * 10; // -5% to +5%
        var randomLeftOffset = (Math.random() - 0.5) * 6; // -3% to +3%
        
        var currentTop = parseFloat(window.getComputedStyle(logo).top) || 0;
        var currentLeft = parseFloat(window.getComputedStyle(logo).left) || 0;
        var currentRight = window.getComputedStyle(logo).right;
        
        // Apply random offset via CSS custom properties
        if (currentRight !== 'auto') {
            logo.style.right = 'calc(' + currentRight + ' + ' + randomLeftOffset + '%)';
        } else {
            logo.style.left = 'calc(' + window.getComputedStyle(logo).left + ' + ' + randomLeftOffset + '%)';
        }
        logo.style.top = 'calc(' + window.getComputedStyle(logo).top + ' + ' + randomTopOffset + '%)';
    });
    
    // Blur on scroll
    var blurThreshold = window.innerHeight * 0.25;
    
    function updateLogosBlur() {
        var scrollY = window.scrollY;
        logos.forEach(function(logo) {
            if (scrollY > blurThreshold) {
                logo.classList.add('blurred');
            } else {
                logo.classList.remove('blurred');
            }
        });
    }
    
    window.addEventListener('scroll', updateLogosBlur, { passive: true });
    updateLogosBlur(); // Initial check
})();

// ============ HEADER SCROLL EFFECT ============
const header = document.getElementById('header');
let lastScrollY = 0;
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            if (currentScrollY > lastScrollY && currentScrollY > 400) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }

            lastScrollY = currentScrollY;
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

// ============ BACK TO TOP BUTTON ============
const backToTop = document.getElementById('back-to-top');

if (backToTop) {
    window.addEventListener('scroll', throttle(() => {
        if (window.scrollY > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }, 100), { passive: true });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============ MOBILE FIXED CTA ============
const mobileCta = document.getElementById('mobile-cta');

if (mobileCta) {
    const finalCtaSection = document.getElementById('cta');
    
    window.addEventListener('scroll', throttle(() => {
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        
        // Show after scrolling 500px
        if (scrollY > 500) {
            mobileCta.classList.add('visible');
            
            // Hide when near final CTA section to avoid duplicate buttons
            if (finalCtaSection) {
                const ctaRect = finalCtaSection.getBoundingClientRect();
                const isNearCta = ctaRect.top < windowHeight && ctaRect.bottom > 0;
                
                if (isNearCta) {
                    mobileCta.classList.add('hide-near-cta');
                } else {
                    mobileCta.classList.remove('hide-near-cta');
                }
            }
        } else {
            mobileCta.classList.remove('visible');
        }
    }, 100), { passive: true });
}

// ============ MOBILE MENU ============
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-nav-link, .mobile-cta-btn').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}


// ============ ANIMATED COUNTERS ============
// Global counter observer - will be set up once
let counterObserverInstance = null;

function animateCounterValue(element, target) {
    if (!element || !target) return;
    
    const duration = 2500;
    const easing = function(t) { 
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; 
    };
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        
        const current = Math.floor(target * easedProgress);
        
        if (progress < 1) {
            element.style.transform = 'translateY(' + (Math.sin(progress * Math.PI * 8) * 2) + 'px)';
        } else {
            element.style.transform = '';
        }
        
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target.toLocaleString();
        }
    }

    requestAnimationFrame(update);
}

function triggerCounterAnimation(counter) {
    // Check if already animated using a simple flag
    if (counter.className.indexOf('counter-animated') !== -1) return;
    
    var targetAttr = counter.getAttribute('data-target');
    if (!targetAttr) return;
    
    var target = parseInt(targetAttr, 10);
    if (isNaN(target) || target <= 0) return;
    
    // Mark as animated by adding class
    counter.className = counter.className + ' counter-animated';
    animateCounterValue(counter, target);
}

function checkCountersInView() {
    var counters = document.querySelectorAll('.counter');
    var windowHeight = window.innerHeight;
    
    for (var i = 0; i < counters.length; i++) {
        var counter = counters[i];
        if (counter.className.indexOf('counter-animated') === -1) {
            var rect = counter.getBoundingClientRect();
            // Very generous check - 300px margin
            if (rect.top < windowHeight + 300 && rect.bottom > -300) {
                triggerCounterAnimation(counter);
            }
        }
    }
}

function setupCounterObserver() {
    if (counterObserverInstance) return;
    
    var counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;
    
    // Use IntersectionObserver if available
    if (typeof IntersectionObserver !== 'undefined') {
        counterObserverInstance = new IntersectionObserver(function(entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    triggerCounterAnimation(entries[i].target);
                }
            }
        }, { 
            threshold: 0.01,
            rootMargin: '300px 0px 300px 0px'
        });
        
        for (var i = 0; i < counters.length; i++) {
            counterObserverInstance.observe(counters[i]);
        }
    }
    
    // Always add scroll listener as backup
    var scrollTimeout = null;
    window.addEventListener('scroll', function() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(checkCountersInView, 50);
        // Also check immediately
        checkCountersInView();
    }, { passive: true });
}

// Initialize when DOM is ready
function initializeCounters() {
    setupCounterObserver();
    checkCountersInView();
    
    // Multiple delayed checks
    setTimeout(checkCountersInView, 100);
    setTimeout(checkCountersInView, 250);
    setTimeout(checkCountersInView, 500);
    setTimeout(checkCountersInView, 1000);
    setTimeout(checkCountersInView, 1500);
    setTimeout(checkCountersInView, 2500);
}

// Ensure initialization happens
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCounters);
} else {
    initializeCounters();
}

// Also on window load
window.addEventListener('load', function() {
    initializeCounters();
    setTimeout(checkCountersInView, 200);
});

// ============ THUMBNAIL CAROUSEL ============
(function initThumbnailCarousel() {
    var carousel = document.getElementById('thumbnail-carousel');
    if (!carousel) return;
    
    var slides = carousel.querySelectorAll('.carousel-slide');
    var dots = carousel.querySelectorAll('.carousel-dot');
    var ctrElement = document.getElementById('carousel-ctr');
    var viewsElement = document.getElementById('carousel-views');
    var currentIndex = 0;
    var totalSlides = slides.length;
    var touchStartX = 0;
    var touchEndX = 0;
    
    // Animate stat value change
    function animateStatChange(element, newValue) {
        if (!element) return;
        
        // Add fade out
        element.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(function() {
            element.textContent = newValue;
            element.style.transform = 'translateY(10px)';
            
            setTimeout(function() {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 50);
        }, 200);
    }
    
    function updateStats() {
        var activeSlide = slides[currentIndex];
        var ctr = activeSlide.getAttribute('data-ctr');
        var views = activeSlide.getAttribute('data-views');
        var label = activeSlide.getAttribute('data-label') || 'Рост CTR';
        
        animateStatChange(ctrElement, ctr);
        animateStatChange(viewsElement, views);
        
        // Update label if different
        var labelElement = document.querySelector('.card-ctr .floating-card-label');
        if (labelElement && labelElement.textContent !== label) {
            labelElement.style.transition = 'opacity 0.2s ease';
            labelElement.style.opacity = '0';
            setTimeout(function() {
                labelElement.textContent = label;
                labelElement.style.opacity = '1';
            }, 200);
        }
    }
    
    function updateCarousel() {
        slides.forEach(function(slide, index) {
            slide.classList.remove('active', 'prev', 'next', 'hidden');
            
            if (index === currentIndex) {
                slide.classList.add('active');
            } else if (index === getPrevIndex()) {
                slide.classList.add('prev');
            } else if (index === getNextIndex()) {
                slide.classList.add('next');
            } else {
                slide.classList.add('hidden');
            }
        });
        
        dots.forEach(function(dot, index) {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Update stats with animation
        updateStats();
    }
    
    function getPrevIndex() {
        return (currentIndex - 1 + totalSlides) % totalSlides;
    }
    
    function getNextIndex() {
        return (currentIndex + 1) % totalSlides;
    }
    
    function goToSlide(index) {
        if (index === currentIndex) return;
        currentIndex = index;
        updateCarousel();
    }
    
    function nextSlide() {
        currentIndex = getNextIndex();
        updateCarousel();
    }
    
    function prevSlide() {
        currentIndex = getPrevIndex();
        updateCarousel();
    }
    
    // Click on slides
    slides.forEach(function(slide) {
        slide.addEventListener('click', function() {
            var index = parseInt(slide.getAttribute('data-index'));
            if (index === getPrevIndex()) {
                prevSlide();
            } else if (index === getNextIndex()) {
                nextSlide();
            }
        });
    });
    
    // Click on dots
    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            var index = parseInt(dot.getAttribute('data-index'));
            goToSlide(index);
        });
    });
    
    // Touch swipe support
    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        var swipeThreshold = 50;
        var diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left - next
            } else {
                prevSlide(); // Swipe right - prev
            }
        }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        var carouselRect = carousel.getBoundingClientRect();
        var isVisible = carouselRect.top < window.innerHeight && carouselRect.bottom > 0;
        
        if (isVisible) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        }
    });
    
    // Initialize
    updateCarousel();
})();

// ============ REVEAL ANIMATIONS ============
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '-30px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ============ A/B TESTING SECTION ANIMATIONS ============
(function() {
    // Animated elements observer - run only once per element
    const abAnimatedElements = document.querySelectorAll('.ab-test-interactive, .ab-titles-animated, .ab-formula-animated, .ab-checklist-animated, .ab-progress-animated, .ab-equation-animated, .ab-result');
    
    const abObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Only animate once - check if already animated
            if (entry.isIntersecting && !entry.target.classList.contains('ab-animated')) {
                entry.target.classList.add('ab-animated');
                // Stop observing after animation triggered
                abObserver.unobserve(entry.target);
                
                // Set CSS variables for animated bars
                entry.target.querySelectorAll('.ab-fill-animated').forEach(bar => {
                    const width = bar.dataset.width;
                    bar.style.setProperty('--target-width', width + '%');
                    setTimeout(() => {
                        bar.style.width = width + '%';
                    }, 100);
                });
                
                // Progress bars animation
                entry.target.querySelectorAll('.ab-bar-animate').forEach(bar => {
                    const width = bar.dataset.width;
                    bar.style.setProperty('--bar-width', width + '%');
                    setTimeout(() => {
                        bar.style.width = width + '%';
                    }, 100);
                });
                
                // Counter animation for values
                entry.target.querySelectorAll('.ab-counter').forEach(counter => {
                    const target = parseFloat(counter.dataset.target);
                    animateCounter(counter, target);
                });
                
                // Value counter for result equation
                entry.target.querySelectorAll('.ab-value-counter').forEach(counter => {
                    const target = parseInt(counter.dataset.target);
                    animateValueCounter(counter, target);
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-50px'
    });
    
    abAnimatedElements.forEach(el => abObserver.observe(el));
    
    // Counter animation function
    function animateCounter(element, target) {
        const duration = 1500;
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * easeProgress;
            element.textContent = current.toFixed(1);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
    
    // Value counter for big numbers
    function animateValueCounter(element, target) {
        const duration = 1200;
        const start = 0;
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (target - start) * easeProgress);
            element.textContent = '+' + current + '%';
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        
        requestAnimationFrame(update);
    }
})();

// ============ BEFORE/AFTER SLIDER (Smooth) ============
document.querySelectorAll('.compare-slider').forEach(slider => {
    const before = slider.querySelector('.compare-before');
    const handle = slider.querySelector('.compare-handle');
    let isDragging = false;
    let currentPercentage = 50;
    let targetPercentage = 50;
    let animationId = null;
    
    // Smooth animation loop
    function animateSlider() {
        // Smooth interpolation
        currentPercentage += (targetPercentage - currentPercentage) * 0.15;
        
        // Apply styles
        before.style.clipPath = 'inset(0 ' + (100 - currentPercentage) + '% 0 0)';
        handle.style.left = currentPercentage + '%';
        
        // Continue animation if not close enough
        if (Math.abs(targetPercentage - currentPercentage) > 0.1) {
            animationId = requestAnimationFrame(animateSlider);
        } else {
            currentPercentage = targetPercentage;
            before.style.clipPath = 'inset(0 ' + (100 - currentPercentage) + '% 0 0)';
            handle.style.left = currentPercentage + '%';
            animationId = null;
        }
    }
    
    function setTargetPercentage(x) {
        const rect = slider.getBoundingClientRect();
        targetPercentage = Math.min(Math.max((x - rect.left) / rect.width * 100, 0), 100);
        slider.classList.add('interacted');
        
        if (!animationId) {
            animationId = requestAnimationFrame(animateSlider);
        }
    }

    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        setTargetPercentage(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) setTargetPercentage(e.clientX);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    slider.addEventListener('touchstart', (e) => {
        isDragging = true;
        setTargetPercentage(e.touches[0].clientX);
    }, { passive: true });

    slider.addEventListener('touchmove', (e) => {
        if (isDragging) {
            setTargetPercentage(e.touches[0].clientX);
        }
    }, { passive: true });

    slider.addEventListener('touchend', () => {
        isDragging = false;
    });
});

// Portfolio filters moved to PORTFOLIO LOAD MORE & SHUFFLE section

// ============ FAQ ACCORDION ============
document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        document.querySelectorAll('.faq-item').forEach(i => {
            i.classList.remove('active');
        });

        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============ MAGNETIC BUTTONS (Desktop only) ============
if (isDesktop) {
    const magneticElements = document.querySelectorAll('[data-magnetic]');

    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    });
}

// ============ 3D TILT EFFECT WITH SHINE (Desktop only) ============
if (isDesktop) {
    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(el => {
        let tiltRAF = null;
        let targetRotateX = 0, targetRotateY = 0;
        let currentRotateX = 0, currentRotateY = 0;
        let isHovering = false;
        let lastMoveTime = 0;
        
        // Get max tilt from data attribute or default to 15
        const maxTilt = parseFloat(el.dataset.tiltMax) || 15;
        
        el.addEventListener('mouseenter', () => {
            if (el.dataset.tiltDisabled === 'true') return;
            isHovering = true;
            if (!tiltRAF) animateTilt();
        }, { passive: true });
        
        el.addEventListener('mousemove', (e) => {
            if (el.dataset.tiltDisabled === 'true') return;
            // Throttle mousemove to every 32ms (~30fps) for performance
            const now = performance.now();
            if (now - lastMoveTime < 32) return;
            lastMoveTime = now;
            
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            targetRotateX = (y - centerY) / (150 / maxTilt);
            targetRotateY = (centerX - x) / (150 / maxTilt);
        }, { passive: true });

        el.addEventListener('mouseleave', () => {
            isHovering = false;
            targetRotateX = 0;
            targetRotateY = 0;
        }, { passive: true });
        
        function animateTilt() {
            currentRotateX += (targetRotateX - currentRotateX) * 0.12;
            currentRotateY += (targetRotateY - currentRotateY) * 0.12;
            
            el.style.transform = `perspective(1000px) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            // Continue animation if hovering or still moving (with larger threshold)
            if (isHovering || Math.abs(targetRotateX - currentRotateX) > 0.05 || Math.abs(targetRotateY - currentRotateY) > 0.05) {
                tiltRAF = requestAnimationFrame(animateTilt);
            } else {
                el.style.transform = '';
                tiltRAF = null;
            }
        }
    });
}

// ============ CARD HOVER LIGHT EFFECT ============
if (isDesktop) {
    const cards = document.querySelectorAll('.step-card, .pricing-card, .case-stat');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', x + 'px');
            card.style.setProperty('--mouse-y', y + 'px');
        });
    });
}

// ============ RIPPLE EFFECT ON BUTTONS ============
const rippleButtons = document.querySelectorAll('.btn');

rippleButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// ============ URGENCY SLOTS - HOURLY RANDOM (2-5 slots) ============
function getHourlyRandomSlots() {
    // Use current hour as seed for consistent value within the hour
    const now = new Date();
    const hourSeed = now.getFullYear() * 1000000 + 
                     (now.getMonth() + 1) * 10000 + 
                     now.getDate() * 100 + 
                     now.getHours();
    
    // Simple seeded random based on hour
    const seededRandom = Math.sin(hourSeed * 9999) * 10000;
    const randomValue = seededRandom - Math.floor(seededRandom);
    
    // Return value between 2 and 5
    return Math.floor(randomValue * 4) + 2;
}

function updateAllSlotsCounts() {
    const slots = getHourlyRandomSlots();
    
    // Update header slots
    const slotsElement = document.getElementById('slots-count');
    if (slotsElement) {
        slotsElement.textContent = slots;
    }
    
    // Update CTA urgency slots
    const urgencyCount = document.querySelector('.urgency-count');
    if (urgencyCount) {
        urgencyCount.textContent = slots;
    }
}

// Initialize slots on page load
updateAllSlotsCounts();

// Check every minute if hour changed (to update slots)
setInterval(() => {
    updateAllSlotsCounts();
}, 60000);

// ============ PARALLAX EFFECT (Desktop only) ============
if (isDesktop) {
    // Cache DOM queries
    const shapes = document.querySelectorAll('.floating-shape');
    const orbs = document.querySelectorAll('.bg-orb');
    
    window.addEventListener('scroll', throttle(() => {
        if (!isPageVisible) return;
        const scrollY = window.scrollY;

        shapes.forEach((shape, index) => {
            const speed = 0.04 + (index * 0.02);
            shape.style.transform = `translateY(${scrollY * speed}px)`;
        });
        
        orbs.forEach((orb, index) => {
            const speed = 0.02 + (index * 0.01);
            orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }, 16), { passive: true }); // ~60fps
}

// ============ HERO MOUSE PARALLAX (Desktop only) ============
if (isDesktop) {
    const heroSection = document.querySelector('.hero');
    const heroVisual = document.querySelector('.hero-visual');
    const floatingCards = document.querySelectorAll('.floating-card');

    if (heroSection && heroVisual) {
        let heroTargetX = 0, heroTargetY = 0;
        let heroCurrentX = 0, heroCurrentY = 0;
        
        heroSection.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            heroTargetX = (clientX - innerWidth / 2) / innerWidth * 20;
            heroTargetY = (clientY - innerHeight / 2) / innerHeight * 20;
        }, { passive: true });
        
        // Smooth animation in unified loop
        registerAnimation(function animateHeroParallax() {
            // Only animate when in hero section
            const heroRect = heroSection.getBoundingClientRect();
            if (heroRect.bottom < 0 || heroRect.top > window.innerHeight) return;
            
            heroCurrentX += (heroTargetX - heroCurrentX) * 0.1;
            heroCurrentY += (heroTargetY - heroCurrentY) * 0.1;
            
            heroVisual.style.transform = `translate(${heroCurrentX}px, ${heroCurrentY}px)`;
            
            for (let i = 0; i < floatingCards.length; i++) {
                const depth = (i + 1) * 0.5;
                floatingCards[i].style.transform = `translate(${heroCurrentX * depth}px, ${heroCurrentY * depth}px)`;
            }
        });

        heroSection.addEventListener('mouseleave', () => {
            heroVisual.style.transform = '';
            floatingCards.forEach(card => {
                card.style.transform = '';
            });
        });
    }
}

// ============ TOUCH FEEDBACK FOR MOBILE ============
if (!isDesktop) {
    const touchElements = document.querySelectorAll('.portfolio-item, .step-card, .pricing-card, .client-logo');
    
    touchElements.forEach(el => {
        el.addEventListener('touchstart', () => {
            el.style.transform = 'scale(0.97)';
            el.style.transition = 'transform 0.1s ease';
        }, { passive: true });
        
        el.addEventListener('touchend', () => {
            el.style.transform = '';
        }, { passive: true });
    });
}

// ============ SECTION SCROLL ANIMATIONS ============
const sections = document.querySelectorAll('.section');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => sectionObserver.observe(section));

// ============ KEYBOARD NAVIGATION ============
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// ============ VISIBILITY CHANGE ============
document.addEventListener('visibilitychange', () => {
    const animatedElements = document.querySelectorAll('[class*="animate"], .particle, .bg-orb');
    if (document.hidden) {
        animatedElements.forEach(el => {
            el.style.animationPlayState = 'paused';
        });
    } else {
        animatedElements.forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }
});

// ============ WINDOW RESIZE ============
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const nowDesktop = window.innerWidth > 1024;
        
        if (cursor && cursorFollower) {
            if (!nowDesktop) {
                cursor.style.display = 'none';
                cursorFollower.style.display = 'none';
                spotlight.style.display = 'none';
            } else {
                cursor.style.display = '';
                cursorFollower.style.display = '';
                spotlight.style.display = '';
            }
        }
    }, 200);
});

// ============ PREVENT ZOOM ON DOUBLE TAP (iOS) ============
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loaded');
    
    // Trigger hero animations
    setTimeout(() => {
        document.querySelectorAll('.hero .reveal').forEach(el => {
            el.classList.add('visible');
        });
    }, 100);
    
    // Random avatars for +500 channels badge
    const channelAvatars = [
        'https://i.postimg.cc/qBXkWc8R/channels4-profile-(1).jpg', // The Q
        'https://i.postimg.cc/15n9Cx58/channels4-profile.jpg', // vanzai
        'https://i.postimg.cc/bYMTcb8W/unnamed-(54).jpg', // Top5s
        'https://i.postimg.cc/7YWjRbQ6/unnamed-(53).jpg', // OK Forever
        'https://i.postimg.cc/QxchcQdJ/channels4-profile-(6).jpg', // INSIDE FOOTBALL
        'https://i.postimg.cc/xdJmPpNd/channels4-profile-(2).jpg', // Олег Боков
        'https://i.postimg.cc/3JqmDHWS/channels4-profile-(8).jpg', // Otro Fútbol
        'https://i.postimg.cc/FR1hSwYZ/unnamed-(57).jpg', // WarsofTheWorld
        'https://i.postimg.cc/SRTQ3qHf/channels4-profile-(3).jpg', // Siarist
        'https://i.postimg.cc/tC4Nx5kG/channels4-profile-(7).jpg', // Mykkyta
        'https://i.postimg.cc/PJPnLDRk/channels4-profile-(4).jpg', // CriptoMind
        'https://i.postimg.cc/3Jk3Nss8/unnamed-(55).jpg', // Marcos Reviews
        'https://i.postimg.cc/FHKChv8Z/unnamed-(56).jpg', // Больше золота
        'https://i.postimg.cc/wBVC0FK6/channels4-profile-(5).jpg', // Shooterino
        'https://i.postimg.cc/ncy3yWBY/unnamed-(58).jpg', // Нулевой Пациент
    ];
    
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    const avatarStack = document.getElementById('random-avatars');
    if (avatarStack) {
        const avatars = avatarStack.querySelectorAll('.avatar');
        const randomAvatars = shuffleArray(channelAvatars).slice(0, 3);
        avatars.forEach((avatar, index) => {
            avatar.style.backgroundImage = `url('${randomAvatars[index]}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        });
    }
    
    // Channels expand/collapse functionality
    const channelsGrid = document.getElementById('channels-grid');
    const expandBtn = document.getElementById('channels-expand-btn');
    
    if (channelsGrid && expandBtn) {
        expandBtn.addEventListener('click', () => {
            channelsGrid.classList.toggle('expanded');
            expandBtn.classList.toggle('expanded');
            
            // Animate newly visible cards
            if (channelsGrid.classList.contains('expanded')) {
                const hiddenCards = channelsGrid.querySelectorAll('.channel-card:nth-child(n+7)');
                hiddenCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, index * 80);
                });
            }
        });
    }
    
    // Channel cards reveal on scroll
    const channelCards = document.querySelectorAll('.channel-card');
    
    const channelObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Only animate first 6 cards initially
                const card = entry.target;
                const index = Array.from(channelCards).indexOf(card);
                if (index < 6 || channelsGrid.classList.contains('expanded')) {
                    card.classList.add('visible');
                }
                channelObserver.unobserve(card);
            }
        });
    }, { threshold: 0.1, rootMargin: '50px' });
    
    channelCards.forEach(card => {
        channelObserver.observe(card);
    });
});

// ============ LOST REVENUE CALCULATOR ============
const calcBtn = document.getElementById('calc-btn');
const calcResults = document.getElementById('calc-results');
const avgViewsSlider = document.getElementById('avg-views');
const videoCountSlider = document.getElementById('video-count');
const avgViewsValue = document.getElementById('avg-views-value');
const videoCountValue = document.getElementById('video-count-value');

// Format number for display
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return Math.round(num / 1000).toLocaleString() + 'K';
    return num.toLocaleString();
}

function formatNumberWithSpaces(num) {
    return num.toLocaleString('ru-RU');
}

// Update slider values in real-time
if (avgViewsSlider && avgViewsValue) {
    avgViewsSlider.addEventListener('input', () => {
        avgViewsValue.textContent = formatNumberWithSpaces(parseInt(avgViewsSlider.value));
    });
}

if (videoCountSlider && videoCountValue) {
    videoCountSlider.addEventListener('input', () => {
        videoCountValue.textContent = videoCountSlider.value;
    });
}

// Animate count up
function animateCountUp(element, targetValue, duration = 1500) {
    const startValue = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
        element.textContent = formatNumber(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

if (calcBtn) {
    calcBtn.addEventListener('click', () => {
        const btnText = calcBtn.querySelector('.calc-btn-text');
        const btnLoading = calcBtn.querySelector('.calc-btn-loading');
        
        // Show loading state
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';
        calcBtn.disabled = true;
        
        // Simulate processing delay for effect
        setTimeout(() => {
            const avgViews = parseInt(avgViewsSlider?.value) || 10000;
            const videoCount = parseInt(videoCountSlider?.value) || 10;
            
            // Calculate loss range (30% to 70%)
            const totalViews = avgViews * videoCount;
            const lostViewsMin = Math.round(totalViews * 0.30);
            const lostViewsMax = Math.round(totalViews * 0.70);
            const lostViewsAvg = Math.round((lostViewsMin + lostViewsMax) / 2);
            
            // Calculate lost subscribers (1 in 10 viewers subscribes)
            const lostSubsMin = Math.round(lostViewsMin / 10);
            const lostSubsMax = Math.round(lostViewsMax / 10);
            const lostSubsAvg = Math.round((lostSubsMin + lostSubsMax) / 2);
            
            // Reset button state
            if (btnText) btnText.style.display = 'flex';
            if (btnLoading) btnLoading.style.display = 'none';
            calcBtn.disabled = false;
            
            // Show results with animation
            if (calcResults) {
                calcResults.style.display = 'block';
                calcResults.style.opacity = '0';
                calcResults.style.transform = 'translateY(20px)';
                
                requestAnimationFrame(() => {
                    calcResults.style.transition = 'all 0.6s ease';
                    calcResults.style.opacity = '1';
                    calcResults.style.transform = 'translateY(0)';
                });
                
                // Animate the numbers
                const lostViewsEl = document.getElementById('lost-views');
                const lostSubsEl = document.getElementById('lost-subs');
                
                if (lostViewsEl) {
                    setTimeout(() => animateCountUp(lostViewsEl, lostViewsAvg), 300);
                }
                if (lostSubsEl) {
                    setTimeout(() => animateCountUp(lostSubsEl, lostSubsAvg), 500);
                }
                
                // Update ranges and summary
                document.getElementById('lost-views-range').textContent = `от ${formatNumber(lostViewsMin)} до ${formatNumber(lostViewsMax)}`;
                document.getElementById('lost-subs-range').textContent = `от ${formatNumber(lostSubsMin)} до ${formatNumber(lostSubsMax)}`;
                document.getElementById('summary-views').textContent = formatNumber(lostViewsAvg);
                document.getElementById('summary-subs').textContent = formatNumber(lostSubsAvg);
                
                // Scroll to results
                setTimeout(() => {
                    calcResults.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }, 1200); // Loading delay for psychological effect
    });
}

// ============ MEGA COUNTER ============
const megaCounterEl = document.getElementById('mega-counter-value');
const megaParticlesContainer = document.getElementById('mega-particles');

// Calculate initial value immediately - before any other code runs
const baseDate = new Date('2024-12-10T00:00:00Z');
const baseViews = 847000000;
const avgViewsPerSecond = 11.5; // ~1M per day average

// Set initial value IMMEDIATELY to prevent flash of wrong number
if (megaCounterEl) {
    const initialViews = Math.floor(baseViews + ((new Date() - baseDate) / 1000 * avgViewsPerSecond));
    megaCounterEl.textContent = initialViews.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

if (megaCounterEl) {
    // Calculate initial value immediately to prevent flash of wrong number
    const initialViews = Math.floor(baseViews + ((new Date() - baseDate) / 1000 * avgViewsPerSecond));
    megaCounterEl.textContent = initialViews.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    // Randomization state - more chaotic
    let displayedViews = initialViews;
    let pendingViews = 0;
    let lastUpdate = Date.now();
    let currentSpeed = 1; // Speed multiplier
    let speedChangeTime = 0;
    let pauseUntil = 0;
    let burstQueue = []; // Queue of pending bursts
    
    // Perlin-like noise for organic feel
    let noiseOffset = Math.random() * 1000;
    function noise() {
        noiseOffset += 0.02;
        return (Math.sin(noiseOffset) + Math.sin(noiseOffset * 2.3) + Math.sin(noiseOffset * 0.7)) / 3;
    }
    
    function getBaseViews() {
        const now = new Date();
        const secondsElapsed = (now - baseDate) / 1000;
        return Math.floor(baseViews + (secondsElapsed * avgViewsPerSecond));
    }
    
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    
    // Random speed changes
    function updateSpeed() {
        const now = Date.now();
        if (now > speedChangeTime) {
            // New random speed and duration
            const rand = Math.random();
            if (rand < 0.1) {
                // 10%: Very slow or pause
                currentSpeed = Math.random() * 0.2;
                speedChangeTime = now + 1000 + Math.random() * 3000;
            } else if (rand < 0.25) {
                // 15%: Slow
                currentSpeed = 0.3 + Math.random() * 0.4;
                speedChangeTime = now + 500 + Math.random() * 2000;
            } else if (rand < 0.5) {
                // 25%: Fast
                currentSpeed = 1.5 + Math.random() * 1.5;
                speedChangeTime = now + 300 + Math.random() * 1500;
            } else if (rand < 0.65) {
                // 15%: Very fast burst
                currentSpeed = 3 + Math.random() * 3;
                speedChangeTime = now + 100 + Math.random() * 500;
            } else {
                // 35%: Normal-ish
                currentSpeed = 0.7 + Math.random() * 0.8;
                speedChangeTime = now + 500 + Math.random() * 2000;
            }
        }
    }
    
    // Schedule random bursts
    function maybeScheduleBurst() {
        if (Math.random() < 0.008) { // ~0.8% chance per frame
            const delay = Math.random() * 2000;
            const amount = Math.floor(Math.random() * 300) + 20;
            burstQueue.push({ time: Date.now() + delay, amount: amount });
        }
    }
    
    // Schedule random pauses
    function maybeSchedulePause() {
        if (pauseUntil === 0 && Math.random() < 0.003) { // ~0.3% chance
            pauseUntil = Date.now() + 500 + Math.random() * 2500;
        }
    }
    
    // Initialize
    displayedViews = getBaseViews();
    megaCounterEl.textContent = formatNumber(displayedViews);
    speedChangeTime = Date.now() + 1000;
    
    // Realistic counter animation
    function animateCounter() {
        if (!isPageVisible) {
            lastUpdate = Date.now();
            requestAnimationFrame(animateCounter);
            return;
        }
        
        const now = Date.now();
        const deltaTime = (now - lastUpdate) / 1000;
        lastUpdate = now;
        
        if (pauseUntil > 0) {
            if (now < pauseUntil) {
                requestAnimationFrame(animateCounter);
                return;
            }
            pauseUntil = 0;
        }
        
        for (let i = burstQueue.length - 1; i >= 0; i--) {
            if (now >= burstQueue[i].time) {
                pendingViews += burstQueue[i].amount;
                burstQueue.splice(i, 1);
            }
        }
        
        updateSpeed();
        maybeScheduleBurst();
        maybeSchedulePause();
        
        const noiseValue = noise();
        const noiseMult = 0.5 + (noiseValue + 1) * 0.75;
        const baseIncrement = avgViewsPerSecond * deltaTime;
        const finalIncrement = baseIncrement * currentSpeed * noiseMult;
        
        if (Math.random() < 0.03) {
            pendingViews += Math.floor(Math.random() * 15) + 1;
        }
        
        if (Math.random() > 0.08) {
            pendingViews += finalIncrement;
        }
        
        if (pendingViews >= 1) {
            const smoothing = 0.1 + Math.random() * 0.4;
            const toAdd = Math.min(pendingViews, Math.max(1, Math.ceil(pendingViews * smoothing)));
            displayedViews += Math.floor(toAdd);
            pendingViews -= toAdd;
            megaCounterEl.textContent = formatNumber(displayedViews);
        }
        
        requestAnimationFrame(animateCounter);
    }
    
    animateCounter();
}

// Mega Counter Interactive Particles
if (megaParticlesContainer) {
    const particleCount = isDesktop ? 55 : 20;
    const megaParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'mega-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        const colors = ['rgba(52, 211, 153, 0.9)', 'rgba(34, 211, 238, 0.85)', 'rgba(167, 139, 250, 0.8)', 'rgba(252, 211, 77, 0.75)'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.width = (3 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        particle.style.boxShadow = `0 0 ${12 + Math.random() * 15}px ${color}`;
        particle.style.opacity = '1';
        
        megaParticlesContainer.appendChild(particle);
        megaParticles.push({
            el: particle,
            x: parseFloat(particle.style.left),
            y: parseFloat(particle.style.top),
            baseX: parseFloat(particle.style.left),
            baseY: parseFloat(particle.style.top),
            speed: 0.3 + Math.random() * 1,
            floatOffsetX: Math.random() * Math.PI * 2,
            floatOffsetY: Math.random() * Math.PI * 2,
            floatSpeedX: 0.3 + Math.random() * 0.5,
            floatSpeedY: 0.2 + Math.random() * 0.4,
            floatAmplitudeX: 1 + Math.random() * 2,
            floatAmplitudeY: 1 + Math.random() * 2
        });
    }
    
    let megaMouseX = 50, megaMouseY = 50;
    let megaTime = 0;
    
    if (isDesktop) {
        megaParticlesContainer.parentElement.addEventListener('mousemove', (e) => {
            const rect = megaParticlesContainer.getBoundingClientRect();
            megaMouseX = ((e.clientX - rect.left) / rect.width) * 100;
            megaMouseY = ((e.clientY - rect.top) / rect.height) * 100;
        }, { passive: true });
    }
    
    registerAnimation(function animateMegaParticles() {
        // Skip when mega counter not visible
        if (!megaCounterVisible) return;
        
        megaTime += 0.016;
        
        megaParticles.forEach(p => {
            const floatX = Math.sin(megaTime * p.floatSpeedX + p.floatOffsetX) * p.floatAmplitudeX;
            const floatY = Math.cos(megaTime * p.floatSpeedY + p.floatOffsetY) * p.floatAmplitudeY;
            
            let targetX = p.baseX + floatX;
            let targetY = p.baseY + floatY;
            
            if (isDesktop) {
                const dx = megaMouseX - p.baseX;
                const dy = megaMouseY - p.baseY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 25;
                
                if (distance < maxDistance && distance > 0) {
                    const force = (maxDistance - distance) / maxDistance;
                    targetX += (dx / distance) * force * 12 * p.speed;
                    targetY += (dy / distance) * force * 12 * p.speed;
                }
            }
            
            p.x += (targetX - p.x) * 0.08;
            p.y += (targetY - p.y) * 0.08;
            
            p.el.style.left = p.x + '%';
            p.el.style.top = p.y + '%';
        });
    });
}

// ============ FLUID EFFECT ON COUNTER HOVER ============
const fluidCanvas = document.getElementById('mega-fluid-canvas');
const counterWrapper = document.getElementById('mega-counter-wrapper');

if (fluidCanvas && counterWrapper && isDesktop) {
    const ctx = fluidCanvas.getContext('2d');
    let fluidParticles = [];
    let isHovering = false;
    let hoverIntensity = 0;
    let fluidMouseX = 0, fluidMouseY = 0;
    
    function resizeFluidCanvas() {
        const rect = counterWrapper.getBoundingClientRect();
        fluidCanvas.width = rect.width + 200;
        fluidCanvas.height = rect.height + 200;
    }
    
    resizeFluidCanvas();
    window.addEventListener('resize', resizeFluidCanvas);
    
    // Create fluid particles
    for (let i = 0; i < 80; i++) {
        fluidParticles.push({
            x: Math.random() * fluidCanvas.width,
            y: Math.random() * fluidCanvas.height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            radius: 40 + Math.random() * 80,
            color: ['rgba(16, 185, 129, 0.08)', 'rgba(6, 182, 212, 0.06)', 'rgba(139, 92, 246, 0.05)'][Math.floor(Math.random() * 3)],
            baseX: Math.random() * fluidCanvas.width,
            baseY: Math.random() * fluidCanvas.height
        });
    }
    
    counterWrapper.addEventListener('mouseenter', () => { isHovering = true; });
    counterWrapper.addEventListener('mouseleave', () => { isHovering = false; });
    counterWrapper.addEventListener('mousemove', (e) => {
        const rect = counterWrapper.getBoundingClientRect();
        fluidMouseX = e.clientX - rect.left + 100;
        fluidMouseY = e.clientY - rect.top + 100;
    });
    
    registerAnimation(function animateFluid() {
        // Skip when mega counter not visible
        if (!megaCounterVisible) return;
        
        ctx.clearRect(0, 0, fluidCanvas.width, fluidCanvas.height);
        
        const targetIntensity = isHovering ? 1 : 0;
        hoverIntensity += (targetIntensity - hoverIntensity) * 0.03;
        
        fluidParticles.forEach(p => {
            if (isHovering && hoverIntensity > 0.1) {
                const dx = fluidMouseX - p.x;
                const dy = fluidMouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 5) {
                    p.vx += (dx / dist) * 0.15 * hoverIntensity;
                    p.vy += (dy / dist) * 0.15 * hoverIntensity;
                }
                
                p.vx += (Math.random() - 0.5) * 0.2;
                p.vy += (Math.random() - 0.5) * 0.2;
            } else {
                p.vx += (p.baseX - p.x) * 0.005;
                p.vy += (p.baseY - p.y) * 0.005;
            }
            
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < -50) p.x = fluidCanvas.width + 50;
            if (p.x > fluidCanvas.width + 50) p.x = -50;
            if (p.y < -50) p.y = fluidCanvas.height + 50;
            if (p.y > fluidCanvas.height + 50) p.y = -50;
            
            if (hoverIntensity > 0.01) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                const alpha = parseFloat(p.color.match(/[\d.]+(?=\))/)[0]) * hoverIntensity;
                const colorBase = p.color.replace(/[\d.]+\)$/, alpha + ')');
                gradient.addColorStop(0, colorBase);
                gradient.addColorStop(0.5, colorBase.replace(/[\d.]+\)$/, (alpha * 0.3) + ')'));
                gradient.addColorStop(1, 'transparent');
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        });
    });
}

// Mega Counter Scroll Click
const megaScroll = document.getElementById('mega-scroll');
if (megaScroll) {
    megaScroll.addEventListener('click', () => {
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ============ PORTFOLIO LOAD MORE & SHUFFLE ============
(function initPortfolioShowcase() {
    const grid = document.getElementById('portfolio-grid');
    const showMoreBtn = document.getElementById('show-more-btn');
    if (!grid || !showMoreBtn) {
        console.log('Portfolio: grid or button not found');
        return;
    }
    
    // Shuffle DOM elements once on page load
    function shuffleDOMElements() {
        const items = Array.from(grid.querySelectorAll('.portfolio-item'));
        // Fisher-Yates shuffle
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swap in DOM
            if (i !== j) {
                grid.insertBefore(items[i], items[j]);
                grid.insertBefore(items[j], items[i].nextSibling);
            }
        }
    }
    
    // Shuffle all items in DOM once
    shuffleDOMElements();
    
    const isMobile = window.innerWidth <= 768;
    const INITIAL_SHOW = isMobile ? 10 : 9;
    const LOAD_MORE_COUNT = 12;
    const SHUFFLE_INTERVAL = 10000;
    
    let allItems = Array.from(grid.querySelectorAll('.portfolio-item'));
    let visibleCount = INITIAL_SHOW;
    let shuffleTimer = null;
    let isShuffling = false;
    let currentFilter = 'all';
    let shufflePaused = false;
    
    // Track which items are visible/hidden separately from DOM
    let visibleSet = new Set();
    let hiddenSet = new Set();
    
    function getFilteredItems() {
        if (currentFilter === 'all') return allItems;
        return allItems.filter(item => item.dataset.category === currentFilter);
    }
    
    function initializeVisibility() {
        const filtered = getFilteredItems();
        visibleSet.clear();
        hiddenSet.clear();
        
        // Hide all first
        allItems.forEach(item => {
            item.style.display = 'none';
            item.classList.remove('portfolio-shuffle-in', 'portfolio-shuffle-out', 'portfolio-fade-in');
        });
        
        // Pick random indices for initial display
        const indices = filtered.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const visibleIndices = new Set(indices.slice(0, visibleCount));
        
        // Show random items without changing DOM order
        filtered.forEach((item, index) => {
            if (visibleIndices.has(index)) {
                item.style.display = '';
                visibleSet.add(item);
            } else {
                hiddenSet.add(item);
            }
        });
        
        // Update button visibility
        if (filtered.length <= visibleCount) {
            showMoreBtn.parentElement.style.display = 'none';
        } else {
            showMoreBtn.parentElement.style.display = '';
        }
    }
    
    function shuffleAllItems() {
        if (!isShuffling || shufflePaused) return;
        
        const visibleArray = Array.from(visibleSet);
        const hiddenArray = Array.from(hiddenSet);
        
        if (hiddenArray.length === 0 || visibleArray.length === 0) return;
        
        // Shuffle arrays to pick random items
        const shuffledHidden = [...hiddenArray].sort(() => Math.random() - 0.5);
        const shuffledVisible = [...visibleArray].sort(() => Math.random() - 0.5);
        
        // How many items we can swap
        const swapCount = Math.min(visibleArray.length, shuffledHidden.length);
        
        // Animate each item with staggered delay (no DOM reordering)
        shuffledVisible.slice(0, swapCount).forEach((itemToHide, index) => {
            const itemToShow = shuffledHidden[index];
            const delay = index * 80;
            
            setTimeout(() => {
                // Animate out old item
                itemToHide.classList.add('portfolio-shuffle-out');
                
                setTimeout(() => {
                    // Hide old item
                    itemToHide.classList.remove('portfolio-shuffle-out');
                    itemToHide.style.display = 'none';
                    visibleSet.delete(itemToHide);
                    hiddenSet.add(itemToHide);
                    
                    // Show new item with animation (keep in original DOM position)
                    itemToShow.style.display = '';
                    itemToShow.classList.add('portfolio-shuffle-in');
                    hiddenSet.delete(itemToShow);
                    visibleSet.add(itemToShow);
                    
                    setTimeout(() => {
                        itemToShow.classList.remove('portfolio-shuffle-in');
                    }, 500);
                }, 350);
            }, delay);
        });
    }
    
    function startShuffle() {
        if (shuffleTimer) return;
        isShuffling = true;
        shufflePaused = false;
        shuffleTimer = setInterval(shuffleAllItems, SHUFFLE_INTERVAL);
    }
    
    function stopShuffle() {
        isShuffling = false;
        if (shuffleTimer) {
            clearInterval(shuffleTimer);
            shuffleTimer = null;
        }
    }
    
    function pauseShuffle() {
        shufflePaused = true;
    }
    
    function resumeShuffle() {
        if (visibleCount <= INITIAL_SHOW && hiddenSet.size > 0) {
            shufflePaused = false;
            if (!shuffleTimer) startShuffle();
        }
    }
    
    let isExpanded = false;
    
    function updateButtonText() {
        // Find text node or span in button
        const btnContent = showMoreBtn.childNodes;
        for (let node of btnContent) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = isExpanded ? 'Свернуть ' : 'Показать ещё ';
                break;
            }
        }
    }
    
    function collapsePortfolio() {
        const filtered = getFilteredItems();
        visibleCount = INITIAL_SHOW;
        isExpanded = false;
        
        // Re-initialize with random 9 items
        visibleSet.clear();
        hiddenSet.clear();
        
        allItems.forEach(item => {
            item.style.display = 'none';
            item.classList.remove('portfolio-shuffle-in', 'portfolio-shuffle-out', 'portfolio-fade-in');
        });
        
        // Pick random indices
        const indices = filtered.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const visibleIndices = new Set(indices.slice(0, visibleCount));
        
        filtered.forEach((item, index) => {
            if (visibleIndices.has(index)) {
                item.style.display = '';
                item.classList.add('portfolio-fade-in');
                visibleSet.add(item);
                setTimeout(() => item.classList.remove('portfolio-fade-in'), 600);
            } else {
                hiddenSet.add(item);
            }
        });
        
        updateButtonText();
        
        // Scroll to portfolio section
        const portfolioSection = document.getElementById('portfolio');
        if (portfolioSection) {
            portfolioSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Restart shuffle
        if (filtered.length > INITIAL_SHOW) {
            setTimeout(startShuffle, 800);
        }
    }
    
    // Show more / Collapse button click
    showMoreBtn.addEventListener('click', () => {
        if (isExpanded) {
            // Collapse
            collapsePortfolio();
            return;
        }
        
        stopShuffle();
        
        const filtered = getFilteredItems();
        
        // First click: show first 9 + next 12 = 21 items in DOM order
        // Reset to show items in proper DOM order (no more random)
        visibleSet.clear();
        hiddenSet.clear();
        
        const newVisibleCount = Math.min(visibleCount + LOAD_MORE_COUNT, filtered.length);
        
        // Show items in DOM order up to newVisibleCount
        filtered.forEach((item, index) => {
            if (index < newVisibleCount) {
                if (item.style.display === 'none' || item.style.display === '') {
                    // Only animate newly shown items
                    const wasHidden = item.style.display === 'none';
                    item.style.display = '';
                    if (wasHidden && index >= visibleCount) {
                        item.classList.add('portfolio-fade-in');
                        setTimeout(() => item.classList.remove('portfolio-fade-in'), 600);
                    }
                }
                visibleSet.add(item);
            } else {
                item.style.display = 'none';
                hiddenSet.add(item);
            }
        });
        
        visibleCount = newVisibleCount;
        
        // Update button
        if (hiddenSet.size <= 0) {
            isExpanded = true;
            updateButtonText();
        }
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFilter = btn.dataset.filter;
            visibleCount = INITIAL_SHOW;
            isExpanded = false;
            
            // Reset all items
            allItems = Array.from(grid.querySelectorAll('.portfolio-item'));
            
            stopShuffle();
            initializeVisibility();
            updateButtonText();
            
            // Restart shuffle for new filter if enough items
            const filtered = getFilteredItems();
            if (filtered.length > INITIAL_SHOW) {
                setTimeout(startShuffle, 500);
            }
        });
    });
    
    // Initial setup
    initializeVisibility();
    
    const filtered = getFilteredItems();
    if (filtered.length > INITIAL_SHOW) {
        setTimeout(startShuffle, 1000);
    }
    
    // Track if section is visible and window is focused
    let sectionVisible = false;
    let windowFocused = document.hasFocus();
    
    function checkAndToggleShuffle() {
        if (sectionVisible && windowFocused && visibleCount <= INITIAL_SHOW && hiddenSet.size > 0) {
            if (!shuffleTimer) {
                shufflePaused = false;
                startShuffle();
            } else {
                shufflePaused = false;
            }
        } else {
            pauseShuffle();
        }
    }
    
    // Pause/resume shuffle based on section visibility
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                sectionVisible = entry.isIntersecting;
                checkAndToggleShuffle();
            });
        }, { threshold: 0.1 });
        observer.observe(portfolioSection);
    }
    
    // Pause when window loses focus, resume when focused
    document.addEventListener('visibilitychange', () => {
        windowFocused = !document.hidden;
        checkAndToggleShuffle();
    });
    
    window.addEventListener('blur', () => {
        windowFocused = false;
        checkAndToggleShuffle();
    });
    
    window.addEventListener('focus', () => {
        windowFocused = true;
        checkAndToggleShuffle();
    });
})();

// ============ CASES EXPAND/COLLAPSE (Mobile) ============
(function() {
    const casesList = document.querySelector('.cases-list');
    const casesExpandBtn = document.getElementById('cases-expand-btn');
    
    if (!casesList || !casesExpandBtn) return;
    
    // Only run on mobile
    if (window.innerWidth > 767) return;
    
    const cases = casesList.querySelectorAll('.case');
    const INITIAL_SHOW = 3;
    const SHOW_MORE = 3;
    let visibleCount = INITIAL_SHOW;
    
    function updateVisibility() {
        cases.forEach((caseEl, index) => {
            if (index < visibleCount) {
                caseEl.style.display = 'grid';
            } else {
                caseEl.style.display = 'none';
            }
        });
    }
    
    function updateButtonText() {
        const btnText = casesExpandBtn.querySelector('span');
        if (visibleCount >= cases.length) {
            btnText.textContent = 'Свернуть';
            casesExpandBtn.classList.add('expanded');
        } else {
            btnText.textContent = 'Показать ещё';
            casesExpandBtn.classList.remove('expanded');
        }
    }
    
    casesExpandBtn.addEventListener('click', () => {
        if (visibleCount >= cases.length) {
            // Collapse back to initial
            visibleCount = INITIAL_SHOW;
            updateVisibility();
            
            // Scroll to cases section
            const casesSection = document.getElementById('cases');
            if (casesSection) {
                setTimeout(() => {
                    casesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } else {
            // Show more
            const prevCount = visibleCount;
            visibleCount = Math.min(visibleCount + SHOW_MORE, cases.length);
            
            // Animate newly visible cases
            cases.forEach((caseEl, index) => {
                if (index >= prevCount && index < visibleCount) {
                    caseEl.style.display = 'grid';
                    caseEl.style.opacity = '0';
                    caseEl.style.transform = 'translateY(20px)';
                    
                    setTimeout(() => {
                        caseEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        caseEl.style.opacity = '1';
                        caseEl.style.transform = 'translateY(0)';
                    }, (index - prevCount) * 100);
                }
            });
        }
        
        updateButtonText();
    });
    
    // Initial setup
    updateVisibility();
    updateButtonText();
})();

// ============ CONSOLE ============
console.log('%c✨ Genial Design', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cThumbnails & Titles that convert!', 'font-size: 14px; color: #888;');
console.log('%c📧 studio@genial-design.com', 'font-size: 12px; color: #06b6d4;');
