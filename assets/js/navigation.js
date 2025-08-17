// Navigation scroll functionality
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll behavior
    function smoothScrollTo(targetElement) {
        if (targetElement) {
            const offsetTop = targetElement.offsetTop;
            window.scrollTo({
                top: offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }

    // Navigation click handlers
    const navLinks = document.querySelectorAll('.menu a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const linkText = this.textContent.trim();
            let targetElement;
            
            switch(linkText) {
                case '전시소개':
                    targetElement = document.querySelector('.intro-container');
                    break;
                case '출품작':
                    targetElement = document.querySelector('.entry.entry-bg');
                    break;
                case '수상작':
                    targetElement = document.querySelector('.prize1st-wrapper');
                    break;
            }
            
            if (targetElement) {
                smoothScrollTo(targetElement);
            }
            
            return false;
        });
    });
});
