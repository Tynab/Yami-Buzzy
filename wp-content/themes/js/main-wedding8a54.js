const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

//AOS ANIMATION
AOS.init({
    once: true,
    duration: 700,
    offset: 60,
    disable: () => reduceMotion,
});

// SWIPER
var swiper1 = new Swiper(".album-slide", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    rewind: true,
    coverflowEffect: {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true,
    },
    autoplay: reduceMotion ? false : {
        delay: 3000,
        pauseOnMouseEnter: true,
    },
});

// only autoplay the albums that are on screen
if (!reduceMotion && 'IntersectionObserver' in window) {
    const albumObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const autoplay = entry.target.swiper?.autoplay;
            if (!autoplay) return;
            entry.isIntersecting ? autoplay.start() : autoplay.stop();
        });
    });

    document.querySelectorAll('.album-slide').forEach((el) => albumObserver.observe(el));
}

// FANCY BOX
Fancybox.bind("[data-fancybox]", {
});

// AUDIO toggle lives in the inline script in index.html
