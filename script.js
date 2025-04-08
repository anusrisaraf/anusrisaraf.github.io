document.addEventListener('DOMContentLoaded', () => {
    // No hover effects needed - all handled by CSS

    const bubbles = document.querySelectorAll('.bubble');
    const bubble2Elements = document.querySelectorAll('.bubble2');
    let scrollPosition = window.pageYOffset;
    const scrollThreshold = 300; // When to start showing bubble2 elements

    function parallaxScroll() {
        const currentScroll = window.pageYOffset;
        const scrollDiff = currentScroll - scrollPosition;
        
        // Handle regular bubbles parallax
        bubbles.forEach((bubble, index) => {
            const speed = 0.1 + (index * 0.05); // Different speeds for each bubble
            const yOffset = -scrollDiff * speed;
            const scale = Math.max(0.6, 1 - (currentScroll * 0.001));
            
            bubble.style.transform = `translateY(${yOffset}px) scale(${scale})`;
        });

        // Handle bubble2 visibility
        if (currentScroll > scrollThreshold) {
            bubble2Elements.forEach(bubble => {
                bubble.classList.add('visible');
            });
        } else {
            bubble2Elements.forEach(bubble => {
                bubble.classList.remove('visible');
            });
        }

        // Update scroll position
        scrollPosition = currentScroll;
    }

    // Throttle scroll event for better performance
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

    // Initial check
    parallaxScroll();

    const navDots = document.querySelectorAll('.nav-dots li');
    const sections = document.querySelectorAll('.section');
    
    // Function to handle smooth scrolling to sections
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            window.scrollTo({
                top: section.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }
    
    // Add click event to nav dots
    navDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            scrollToSection(sectionId);
        });
    });
    
    // Function to update active nav dot based on scroll position and visibility
    function updateActiveDot() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + window.innerHeight / 3;
        const subtleNav = document.querySelector('.subtle-nav');
        
        // Show nav dots after scrolling a little (100px)
        if (window.scrollY > 100) {
            subtleNav.classList.add('visible');
        } else {
            subtleNav.classList.remove('visible');
        }
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
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
    }
    
    // Listen for scroll events
    window.addEventListener('scroll', updateActiveDot);
    
    // Initial update on page load
    updateActiveDot();
    
    // Update active dot when window is resized
    window.addEventListener('resize', updateActiveDot);
    
    // Hide dots after 2 seconds of inactivity
    let scrollTimer;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        const subtleNav = document.querySelector('.subtle-nav');
        
        // If we've scrolled enough to show the nav
        if (window.scrollY > 100) {
            subtleNav.classList.add('visible');
            
            // Set timer to hide the nav after 2 seconds of no scrolling
            scrollTimer = setTimeout(function() {
                if (!subtleNav.matches(':hover')) {
                    subtleNav.classList.remove('visible');
                }
            }, 1000);
        }
    });
});
