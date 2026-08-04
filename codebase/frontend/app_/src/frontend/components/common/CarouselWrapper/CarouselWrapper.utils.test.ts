import { updateFocusableElements } from './CarouselWrapper.utils';

describe('updateFocusableElements', () => {
    let carouselRef: any;
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        carouselRef = {
            containerRef: { current: container },
        };
    });

    it('should do nothing if carouselRef or containerRef.current is missing', () => {
        expect(() => updateFocusableElements(null)).not.toThrow();
        expect(() => updateFocusableElements({ containerRef: { current: null } } as any)).not.toThrow();
    });

    it('should set tabIndex=-1 for hidden slides and tabIndex=0 for visible slides', () => {
        const hiddenSlide = document.createElement('div');
        hiddenSlide.className = 'react-multi-carousel-item';
        hiddenSlide.setAttribute('aria-hidden', 'true');
        const visibleSlide = document.createElement('div');
        visibleSlide.className = 'react-multi-carousel-item';
        visibleSlide.setAttribute('aria-hidden', 'false');

        const hiddenButton = document.createElement('button');
        const visibleButton = document.createElement('button');
        hiddenSlide.appendChild(hiddenButton);
        visibleSlide.appendChild(visibleButton);

        container.appendChild(hiddenSlide);
        container.appendChild(visibleSlide);

        updateFocusableElements(carouselRef);

        expect(hiddenButton.tabIndex).toBe(-1);
        expect(visibleButton.tabIndex).toBe(0);
    });

    it('should set tabIndex correctly for all types of focusable elements', () => {
        const slide = document.createElement('div');
        slide.className = 'react-multi-carousel-item';
        slide.setAttribute('aria-hidden', 'false');

        const anchor = document.createElement('a');
        const button = document.createElement('button');
        const input = document.createElement('input');
        const textarea = document.createElement('textarea');
        const select = document.createElement('select');
        const details = document.createElement('details');
        const customTab = document.createElement('div');
        customTab.setAttribute('tabindex', '2');

        slide.appendChild(anchor);
        slide.appendChild(button);
        slide.appendChild(input);
        slide.appendChild(textarea);
        slide.appendChild(select);
        slide.appendChild(details);
        slide.appendChild(customTab);

        container.appendChild(slide);

        updateFocusableElements(carouselRef);

        expect(anchor.tabIndex).toBe(0);
        expect(button.tabIndex).toBe(0);
        expect(input.tabIndex).toBe(0);
        expect(textarea.tabIndex).toBe(0);
        expect(select.tabIndex).toBe(0);
        expect(details.tabIndex).toBe(0);
        expect(customTab.tabIndex).toBe(0);

        slide.setAttribute('aria-hidden', 'true');
        updateFocusableElements(carouselRef);

        expect(anchor.tabIndex).toBe(-1);
        expect(button.tabIndex).toBe(-1);
        expect(input.tabIndex).toBe(-1);
        expect(textarea.tabIndex).toBe(-1);
        expect(select.tabIndex).toBe(-1);
        expect(details.tabIndex).toBe(-1);
        expect(customTab.tabIndex).toBe(-1);
    });

    it('should work correctly if there are no focusable elements in the slide', () => {
        const slide = document.createElement('div');
        slide.className = 'react-multi-carousel-item';
        slide.setAttribute('aria-hidden', 'false');
        container.appendChild(slide);

        expect(() => updateFocusableElements(carouselRef)).not.toThrow();
    });
});
