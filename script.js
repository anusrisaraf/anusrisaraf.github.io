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
});
