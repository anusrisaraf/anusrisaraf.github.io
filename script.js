document.addEventListener('DOMContentLoaded', () => {
    const isHome = document.body.classList.contains('home');
    const bubblesContainer = document.querySelector('.bubbles');
    const bubbles = document.querySelectorAll('.bubble:not(.bubble2)');
    const bubble2Elements = document.querySelectorAll('.bubble2');
    let scrollPosition = window.pageYOffset;
    const scrollThreshold = 300;

    function parallaxScroll() {
        const currentScroll = window.pageYOffset;
        const scrollDiff = currentScroll - scrollPosition;

        bubbles.forEach((bubble, index) => {
            const speed = 0.1 + (index * 0.05);
            const yOffset = -scrollDiff * speed;
            const scale = Math.max(0.6, 1 - (currentScroll * 0.001));

            bubble.style.transform = `translateY(${yOffset}px) scale(${scale})`;
        });

        if (currentScroll > scrollThreshold) {
            bubble2Elements.forEach(bubble => {
                bubble.classList.add('visible');
            });
            if (isHome && bubblesContainer) {
                bubblesContainer.classList.add('scrolled');
            }
        } else {
            bubble2Elements.forEach(bubble => {
                bubble.classList.remove('visible');
            });
            if (isHome && bubblesContainer) {
                bubblesContainer.classList.remove('scrolled');
            }
        }

        scrollPosition = currentScroll;
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                parallaxScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    parallaxScroll();

    const navDots = document.querySelectorAll('.nav-dots li');
    const sectionRailLabels = document.querySelectorAll('.section-rail-label');
    const sections = document.querySelectorAll('.section');
    const subtleNav = document.querySelector('.subtle-nav');

    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }

    navDots.forEach(dot => {
        dot.addEventListener('click', function() {
            scrollToSection(this.getAttribute('data-section'));
        });
    });

    sectionRailLabels.forEach(label => {
        label.addEventListener('click', function() {
            scrollToSection(this.getAttribute('data-section'));
        });
    });

    function updateActiveDot() {
        let currentSectionId = '';
        const viewportScroll = window.scrollY + window.innerHeight / 3;

        if (subtleNav && !isHome && window.scrollY > 100) {
            subtleNav.classList.add('visible');
        } else if (subtleNav && !isHome) {
            subtleNav.classList.remove('visible');
        }

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (viewportScroll >= sectionTop && viewportScroll < sectionTop + sectionHeight) {
                currentSectionId = section.id;
            }
        });

        navDots.forEach(dot => {
            if (dot.getAttribute('data-section') === currentSectionId) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        sectionRailLabels.forEach(label => {
            if (label.getAttribute('data-section') === currentSectionId) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveDot);
    updateActiveDot();
    window.addEventListener('resize', updateActiveDot);

    let scrollTimer;
    window.addEventListener('scroll', function() {
        if (isHome) {
            return;
        }

        clearTimeout(scrollTimer);

        if (window.scrollY > 100 && subtleNav) {
            subtleNav.classList.add('visible');

            scrollTimer = setTimeout(function() {
                if (!subtleNav.matches(':hover')) {
                    subtleNav.classList.remove('visible');
                }
            }, 1000);
        }
    });
});
