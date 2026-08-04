import { RefObject } from 'react';

export const adjustHeight = (
    guestsEl: RefObject<HTMLDivElement>,
    outboundEl: RefObject<HTMLDivElement>,
    inboundEl: RefObject<HTMLDivElement>,
): void => {
    if (guestsEl.current && outboundEl.current && inboundEl.current) {
        const outboundEls = Array.from(outboundEl.current.children);
        const inboundEls = Array.from(inboundEl.current.children);

        Array.from(guestsEl.current.children).forEach((element, i) => {
            element.removeAttribute('style');
            outboundEls[i].removeAttribute('style');
            inboundEls[i].removeAttribute('style');

            const guestHeight = element.getBoundingClientRect().height;
            const outboundHeight = outboundEls[i].getBoundingClientRect().height;
            const inboundHeight = inboundEls[i].getBoundingClientRect().height;

            const maxHeight = Math.max(guestHeight, outboundHeight, inboundHeight);

            element.setAttribute('style', `height: ${maxHeight}px;`);
            outboundEls[i].setAttribute('style', `height: ${maxHeight}px;`);
            inboundEls[i].setAttribute('style', `height: ${maxHeight}px;`);
        });
    }
};
