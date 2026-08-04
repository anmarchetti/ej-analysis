import isBackend from 'frontend/utils/isBackend';

import {
    disableScroll,
    enableScroll,
    getScrollbarWidth,
    lockBodyScroll,
    scrollParentToChild,
    scrollToElement,
    scrollToElementWithOffset,
    smoothScrollIntoView,
    unLockBodyScroll,
} from './ui.utils';

const scrollTo = jest.fn();

Object.defineProperty(window, 'scrollTo', { value: scrollTo });

Object.defineProperty(window, 'scrollY', {
    value: 100,
});

Object.defineProperty(global, 'requestAnimationFrame', {
    writable: true,
    value: jest.fn(cb =>
        setTimeout(() => {
            cb(performance.now());
        }, 16),
    ),
});

jest.mock('frontend/utils/isBackend');

describe('ui.utils', () => {
    describe('scrollToElement', () => {
        it('should scroll to element without parents and with position relative', () => {
            scrollToElement({ offsetTop: 123 } as HTMLElement);
            expect(scrollTo).toBeCalledWith({ behavior: 'smooth', top: 123 });
        });

        it('should scroll to element with one parent and with position relative', () => {
            scrollToElement({ offsetTop: 123, offsetParent: { offsetTop: 1 } } as any);
            expect(scrollTo).toBeCalledWith({ behavior: 'smooth', top: 124 });
        });

        it('should scroll to element with multiple parents and with position relative', () => {
            scrollToElement({
                offsetTop: 123,
                offsetParent: { offsetTop: 1, offsetParent: { offsetTop: 1 } },
            } as any);
            expect(scrollTo).toBeCalledWith({ behavior: 'smooth', top: 125 });
        });

        it('should scroll to element with additionalOffset', () => {
            scrollToElement({ offsetTop: 123 } as HTMLElement, 5);
            expect(scrollTo).toBeCalledWith({ behavior: 'smooth', top: 118 });
        });
    });

    describe('scrollParentToChild', () => {
        const parent = {
            getBoundingClientRect: () => ({ top: 0, bottom: 100, height: 120 }),
            scrollTop: 0,
            scrollTo: jest.fn(),
        } as any;
        const child = { getBoundingClientRect: () => ({ top: 0, bottom: 0 }), scrollTop: 0 } as any;

        it('should not scroll if child is in view', () => {
            child.getBoundingClientRect = () => ({ top: 0, bottom: 0 });

            scrollParentToChild(parent, child);
            expect(parent.scrollTo).not.toHaveBeenCalled();
        });

        it('should scroll to child if it is not visible and placed in the top of the scrollable area', () => {
            child.getBoundingClientRect = () => ({ top: -20, bottom: -10 });
            parent.scrollTop = 20;

            scrollParentToChild(parent, child);

            const expectedScrollTop = { behavior: 'smooth', top: 0 };
            expect(parent.scrollTo).toHaveBeenCalledWith(expectedScrollTop);
        });

        it('should scroll to child if it is not visible and placed in the bottom of the scrollable area', () => {
            child.getBoundingClientRect = () => ({ top: 110, bottom: 120 });
            parent.scrollTop = 0;
            const mockMarginBottom = 40;
            jest.spyOn(window, 'getComputedStyle').mockReturnValueOnce({
                marginBottom: mockMarginBottom,
            } as unknown as CSSStyleDeclaration);

            scrollParentToChild(parent, child);

            const expectedScrollBottom = { behavior: 'smooth', top: 60 };
            expect(parent.scrollTo).toHaveBeenCalledWith(expectedScrollBottom);
        });
    });

    describe('lockBodyScroll', () => {
        it('should block scrolling at element when it is defined', () => {
            const element = {
                style: {
                    position: '',
                    width: '',
                    top: '',
                    overflowY: '',
                },
            } as HTMLElement;

            lockBodyScroll(element);

            expect(element).toStrictEqual({
                style: {
                    overflowY: 'scroll',
                    position: 'fixed',
                    top: '-100px',
                    width: '100%',
                },
            });
        });

        it('should block scrolling at body when target is undefined', () => {
            lockBodyScroll();

            expect(document.body.style).toStrictEqual(
                expect.objectContaining({
                    overflowY: 'scroll',
                    position: 'fixed',
                    top: '-100px',
                    width: '100%',
                }),
            );
        });
    });

    describe('unLockBodyScroll', () => {
        it('should block scrolling at element when it is defined', () => {
            const element = {
                style: {
                    overflowY: 'scroll',
                    position: 'fixed',
                    top: '-100px',
                    width: '100%',
                },
            } as HTMLElement;

            unLockBodyScroll(element);

            expect(element).toStrictEqual({
                style: {
                    overflowY: '',
                    position: '',
                    top: '',
                    width: '',
                },
            });
            expect(scrollTo).toHaveBeenCalledWith(0, 100);
        });

        it('should block scrolling at body when target is undefined', () => {
            document.body.style.position = 'fixed';
            document.body.style.top = '-100px';
            document.body.style.width = '100%';
            document.body.style.overflowY = 'scroll';

            unLockBodyScroll();

            expect(document.body.style).toStrictEqual(
                expect.objectContaining({
                    overflowY: '',
                    position: '',
                    top: '',
                    width: '',
                }),
            );
            expect(scrollTo).toHaveBeenCalledWith(0, 100);
        });
    });

    describe('disableScroll', () => {
        it('should disable scroll', () => {
            jest.mocked(isBackend).mockReturnValue(false);
            Object.defineProperty(window, 'innerWidth', { value: 1200 });
            Object.defineProperty(document.documentElement, 'clientWidth', { value: 1180 });
            disableScroll();

            expect(document.body.style).toStrictEqual(
                expect.objectContaining({
                    overflow: 'hidden',
                    paddingRight: '20px',
                }),
            );
        });

        it('should not disable scroll in backend', () => {
            document.body.style.overflow = 'unset';
            document.body.style.paddingRight = '0px';
            jest.mocked(isBackend).mockReturnValue(true);
            disableScroll();

            expect(document.body.style.overflow).toBe('unset');
            expect(document.body.style.paddingRight).toBe('0px');
        });
    });

    it('enableScroll', () => {
        enableScroll();

        expect(document.body.style).toStrictEqual(
            expect.objectContaining({
                overflow: 'unset',
                paddingRight: '0px',
            }),
        );
    });

    describe('getScrollbarWidth', () => {
        it('should return correct scrollbar width', () => {
            Object.defineProperty(window, 'innerWidth', { value: 1200 });
            Object.defineProperty(document.documentElement, 'clientWidth', { value: 1180 });

            expect(getScrollbarWidth()).toBe(20);
        });
    });

    describe('scrollToElementWithOffset', () => {
        it('should scroll to the Element that corresponds to the given selector with the correct offset', () => {
            // Arrange
            const mockElement = {
                getBoundingClientRect: jest.fn(() => ({ bottom: 500 })),
            } as unknown as HTMLElement;

            jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);
            const mockScrollTo = jest.fn();
            Object.defineProperty(window, 'scrollTo', { value: mockScrollTo });

            Object.defineProperty(window, 'scrollY', { value: 100 });
            Object.defineProperty(window, 'innerHeight', { value: 800 });

            // Act
            scrollToElementWithOffset('#test-selector', 50);

            // Assert
            expect(mockScrollTo).toHaveBeenCalledWith({
                top: -150,
                behavior: 'smooth',
            });
        });
    });

    describe('smoothScrollIntoView', () => {
        const mockElement = {
            getBoundingClientRect: jest.fn(() => ({ top: 100, bottom: 200, height: 100 })),
        } as unknown as HTMLElement;

        it('should scroll to the start of the element smoothly', async () => {
            const mockScrollTo = jest.fn();
            Object.defineProperty(window, 'scrollTo', { value: mockScrollTo, writable: true });

            Object.defineProperty(window, 'scrollY', { value: 50, writable: true });

            await smoothScrollIntoView(mockElement, { block: 'start' });

            expect(mockScrollTo).toHaveBeenCalledWith(0, 150);
        });

        it('should scroll to the center of the element smoothly', async () => {
            const mockScrollTo = jest.fn();
            Object.defineProperty(window, 'scrollTo', { value: mockScrollTo, writable: true });

            Object.defineProperty(window, 'scrollY', { value: 50, writable: true });

            Object.defineProperty(window, 'innerHeight', { value: 800 });

            await smoothScrollIntoView(mockElement, { block: 'center' });

            expect(mockScrollTo).toHaveBeenCalledWith(0, -200);
        });

        it('should scroll to the end of the element smoothly', async () => {
            const mockScrollTo = jest.fn();
            Object.defineProperty(window, 'scrollTo', { value: mockScrollTo, writable: true });

            Object.defineProperty(window, 'scrollY', { value: 50, writable: true });

            Object.defineProperty(window, 'innerHeight', { value: 800 });

            await smoothScrollIntoView(mockElement, { block: 'end' });

            expect(mockScrollTo).toHaveBeenCalledWith(0, -550);
        });
    });
});
