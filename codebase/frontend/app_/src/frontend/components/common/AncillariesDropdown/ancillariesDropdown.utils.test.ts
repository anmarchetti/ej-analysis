import { adjustHeight } from './ancillariesDropdown.utils';

describe('adjustHeight', () => {
    const createEls = (height1: number, height2: number, height3: number): HTMLDivElement => {
        const container = document.createElement('div');

        const el1 = document.createElement('div');
        jest.spyOn(el1, 'getBoundingClientRect').mockReturnValue({
            height: height1,
        } as DOMRect);

        const el2 = document.createElement('div');
        jest.spyOn(el2, 'getBoundingClientRect').mockReturnValue({
            height: height2,
        } as DOMRect);

        const el3 = document.createElement('div');
        jest.spyOn(el3, 'getBoundingClientRect').mockReturnValue({
            height: height3,
        } as DOMRect);

        container.appendChild(el1);
        container.appendChild(el2);
        container.appendChild(el3);

        return container;
    };

    const guestsEl = {
        current: createEls(10, 35, 45),
    };
    const outboundEl = {
        current: createEls(15, 25, 50),
    };
    const inboundEl = {
        current: createEls(20, 30, 40),
    };

    it('should set the highest heigh for all elements with the same idx', () => {
        adjustHeight(guestsEl, outboundEl, inboundEl);

        const guestsEls = Array.from(guestsEl.current!.children);
        const outboundEls = Array.from(outboundEl.current!.children);
        const inboundEls = Array.from(inboundEl.current!.children);

        expect(guestsEls[0].getAttribute('style')).toBe('height: 20px;');
        expect(outboundEls[0].getAttribute('style')).toBe('height: 20px;');
        expect(inboundEls[0].getAttribute('style')).toBe('height: 20px;');

        expect(guestsEls[1].getAttribute('style')).toBe('height: 35px;');
        expect(outboundEls[1].getAttribute('style')).toBe('height: 35px;');
        expect(inboundEls[1].getAttribute('style')).toBe('height: 35px;');

        expect(guestsEls[2].getAttribute('style')).toBe('height: 50px;');
        expect(outboundEls[2].getAttribute('style')).toBe('height: 50px;');
        expect(inboundEls[2].getAttribute('style')).toBe('height: 50px;');
    });
});
