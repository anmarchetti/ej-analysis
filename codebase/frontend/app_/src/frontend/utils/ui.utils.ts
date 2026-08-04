import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';

import { Anchor } from 'code/anchors';
import { TEN } from 'code/commonNumbers';
import isBackend from 'frontend/utils/isBackend';

export function bodyScrollListener(): void {
    window['bodyScrollPosition'] = `${window.pageYOffset}px`;
}

export function prepareBodyScrollLock(): void {
    if (window['bodyScrollPosition']) {
        window['bodyScrollPosition'] = `${window.pageYOffset}px`;
    }

    window.removeEventListener('scroll', bodyScrollListener);
    window.addEventListener('scroll', bodyScrollListener);
}

export const getScrollbarWidth = (): number => window.innerWidth - document.documentElement.clientWidth;

//analogue lockBodyScroll but lockBodyScroll causes scrolling to the top of the page when called
export const disableScroll = (): void => {
    if (isBackend()) {
        return;
    }

    const scrollbarWidth = getScrollbarWidth();
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
};

export const enableScroll = (): void => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
};

export function lockBodyScroll(target: HTMLElement = document.body): void {
    const scrollY = window.scrollY;

    target.style.position = 'fixed';
    target.style.width = '100%';
    target.style.top = `-${scrollY}px`;
    target.style.overflowY = 'scroll';
}

export function unLockBodyScroll(target: HTMLElement = document.body): void {
    const scrollY = target.style.top.replace(/[A-z]/g, '');

    target.style.position = '';
    target.style.top = '';
    target.style.width = '';
    target.style.overflowY = '';

    window.scrollTo(0, Math.abs(parseInt(scrollY || '0')));
}

export const scrollToErrorBlock = (): void => {
    const el = document.getElementsByClassName('error');

    if (el.length > 0) {
        scrollIntoViewIfNeeded(el[0], { block: 'center', behavior: 'smooth' });
    }
};

const getStickyBarOffsetHeight = (): number => {
    const stickyBarWrapper =
        document.querySelector('.search-bar-wr--fixed') ||
        document.querySelector('.search-bar-wr--sticky') ||
        document.querySelector('.search-bar-wr');

    return (stickyBarWrapper?.querySelector('.search-bar-wr__sticky-box') as HTMLElement)?.offsetHeight || 0;
};

export const scrollToOfferConditions = (id: Anchor): void => {
    const el = document.querySelector(id) as HTMLElement | null;

    if (!el) {
        return;
    }

    const offsetTop = getTargetElementOffsetTop(el, 20);
    const stickyOffsetOriginal = getStickyBarOffsetHeight();

    // Scroll to Offers & Conditions (with adjust to sticky header)
    window.scrollTo({
        left: 0,
        top: offsetTop - stickyOffsetOriginal,
        behavior: 'smooth',
    });

    // If sticky bar appears after scrolling, need scroll up by this bar height
    setTimeout(() => {
        const stickyOffset = getStickyBarOffsetHeight();
        stickyOffset && stickyOffset !== stickyOffsetOriginal && window.scrollBy(0, -stickyOffset);
    }, 500);
};

/**
 * Set cursor position of input element.
 * If position is greater than element's value length, then cursor is set to the end.
 */
export const moveInputCursor = (input: HTMLInputElement, cursorPosition: number): void => {
    if (input.setSelectionRange) {
        input.setSelectionRange(cursorPosition, cursorPosition);
    } else if ((input as any).createTextRange) {
        // IE fix
        const range = (input as any).createTextRange();
        range.collapse(true);
        range.moveEnd('character', cursorPosition);
        range.moveStart('character', cursorPosition);
        range.select();
    }
};

export const setBodyOverflow = (value: string): void => {
    document.body.style.overflow = value;
};

export const scrollToElement = (element: HTMLElement, additionalOffset: number = 0): void => {
    window.scrollTo({
        top: getTargetElementOffsetTop(element, additionalOffset),
        behavior: 'smooth',
    });
};

const getTargetElementOffsetTop = (element: HTMLElement, additionalOffset: number = 0): number =>
    getClientOffset(element) - additionalOffset;

/**
 * Get real element offset including offsetParents (parents with non static position)
 * @param el - element of interest
 * @return  top offset
 */
const getClientOffset = (el: HTMLElement): number => {
    function getOffset(el: HTMLElement, top = 0) {
        if (!el.offsetTop || !(el.offsetParent as HTMLElement)?.offsetTop) {
            return top + el.offsetTop;
        }

        return getOffset(el.offsetParent as HTMLElement, top + el.offsetTop);
    }

    return getOffset(el);
};

export const scrollParentToChild = (parent: Element, child: Element): void => {
    const parentRect = parent.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();

    const isChildElementViewable =
        childRect.top >= parentRect.top && childRect.bottom < parentRect.top + parentRect.height;

    if (!isChildElementViewable) {
        const scrollTop = childRect.top - parentRect.top;
        const scrollBot = childRect.bottom - parentRect.bottom;

        if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
            // we are near the top of the scrollable area
            parent.scrollTo({
                top: parent.scrollTop + scrollTop,
                behavior: 'smooth',
            });
        } else {
            // we are near the bottom of the scrollable area
            parent.scrollTo({
                top: parent.scrollTop + scrollBot + parseInt(window.getComputedStyle(child).marginBottom, TEN),
                behavior: 'smooth',
            });
        }
    }
};

export const scrollToElementWithOffset = (selector: string, offset: number): void => {
    const element = document.querySelector(selector);

    if (!element) {
        return;
    }

    const elementRect = element.getBoundingClientRect();

    const scrollPosition = window.scrollY + elementRect.bottom - window.innerHeight + offset;

    window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth',
    });
};

export const smoothScrollIntoView = (element: HTMLElement, { duration = 400, block = 'center' } = {}): Promise<void> =>
    new Promise(resolve => {
        const rect = element.getBoundingClientRect();

        const startY = window.scrollY;

        let targetY;

        switch (block) {
            case 'start':
                targetY = rect.top + startY;
                break;

            case 'center':
                targetY = rect.top + startY - window.innerHeight / 2 + rect.height / 2;
                break;

            case 'end':
                targetY = rect.bottom + startY - window.innerHeight;
                break;

            default:
                targetY = rect.top + startY;
        }

        const diff = targetY - startY;
        const startTime = performance.now();

        const step = (currentTime: number): void => {
            const elapsed = currentTime - startTime;

            const progress = Math.min(elapsed / duration, 1);

            // easeOutCubic
            const ease = 1 - Math.pow(1 - progress, 3);

            window.scrollTo(0, startY + diff * ease);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(step);
    });
