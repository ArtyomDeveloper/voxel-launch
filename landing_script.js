document.addEventListener('DOMContentLoaded', () => {
    const fadeElements = document.querySelectorAll('.fade-in-section');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };
    const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
    fadeElements.forEach(el => scrollObserver.observe(el));

    const statNumbers = document.querySelectorAll('.stat-number');
    const animationDuration = 2000;

    const animateStat = (element) => {
        const target = +element.getAttribute('data-target');
        const prefix = element.getAttribute('data-prefix') || '';
        const suffix = element.getAttribute('data-suffix') || '';
        let current = 0;
        const increment = target / (animationDuration / 16);

        const updateCount = () => {
            current += increment;
            if (current < target) {
                element.textContent = prefix + Math.ceil(current).toLocaleString() + suffix;
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = prefix + target.toLocaleString() + suffix;
            }
        };
        requestAnimationFrame(updateCount);
    };

    const statObserverOptions = {
        root: null,
        threshold: 0.5
    };

    const statObserverCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStat(entry.target);
                observer.unobserve(entry.target);
            }
        });
    };

    const statObserver = new IntersectionObserver(statObserverCallback, statObserverOptions);
    statNumbers.forEach(numberEl => statObserver.observe(numberEl));

});