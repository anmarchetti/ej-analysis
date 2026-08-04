import Carousel from 'react-multi-carousel';

export const updateFocusableElements = (carouselRef: Carousel | null): void => {
    if (!carouselRef?.containerRef.current) {
        return;
    }

    const slides = carouselRef.containerRef.current.querySelectorAll('.react-multi-carousel-item');

    slides.forEach(slide => {
        const isHidden = slide.getAttribute('aria-hidden') === 'true';
        const focusableElements = slide.querySelectorAll(
            'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
        );

        focusableElements.forEach(el => {
            (el as HTMLElement).tabIndex = isHidden ? -1 : 0;
        });
    });
};
