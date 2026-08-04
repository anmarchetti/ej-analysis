import { changeTooltipPosition } from './pillTooltip.utils';

describe('pillTooltip.utils', () => {
    describe('changeTooltipPosition', () => {
        it('should return [true, "icon-left"] when breakpoint < FLIGHT_GRID_MOBILE_SCREEN', () => {
            const newPosition = changeTooltipPosition(100, {
                parentElement: { offsetWidth: 200 },
                offsetLeft: 100,
            } as any);

            expect(newPosition).toEqual([true, 'icon-left']);
        });
    });

    it('should return [true, "icon-left"] when pill element NOT provided', () => {
        const cardType = changeTooltipPosition(1000);

        expect(cardType).toEqual([true, 'icon-left']);
    });

    it('should return [true, "right"] when offsetWidth - offsetLeft < MAX_PILL_OFFSET_RIGHT', () => {
        const newPosition = changeTooltipPosition(1000, {
            parentElement: { offsetWidth: 300 },
            offsetLeft: 250,
        } as any);

        expect(newPosition).toEqual([true, 'right']);
    });

    it('should return [true, "icon-left"] when offsetWidth - offsetLeft > MAX_PILL_OFFSET_RIGHT', () => {
        const newPosition = changeTooltipPosition(1000, {
            parentElement: { offsetWidth: 300 },
            offsetLeft: 100,
        } as any);

        expect(newPosition).toEqual([true, 'icon-left']);
    });
});
