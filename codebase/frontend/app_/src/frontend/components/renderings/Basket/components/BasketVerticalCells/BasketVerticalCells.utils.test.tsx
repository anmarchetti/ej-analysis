import { resetScrollbarPosition, setContainerHeight } from './BasketVerticalCells.utils';

describe('BasketVerticalCells.utils', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('setContainerHeight', () => {
        it('should set container height when visible basket container exists', () => {
            const div = {
                offsetParent: '',
                offsetHeight: 200,
                style: {
                    setProperty: jest.fn((k, v) => (div[k] = v)),
                },
            } as unknown as HTMLDivElement;

            jest.spyOn(document, 'querySelectorAll').mockReturnValueOnce([
                div,
                { offsetParent: null },
            ] as unknown as NodeListOf<HTMLDivElement>);

            setContainerHeight();

            expect(div.style.setProperty).toHaveBeenCalledWith('--basket-summary-box-height', '200px');
            expect(div['--basket-summary-box-height']).toBe('200px');
        });

        it('should NOT container height when no visible basket container exists', () => {
            const div = {
                offsetParent: null,
                offsetHeight: '',
                style: {
                    setProperty: jest.fn(),
                },
            } as unknown as HTMLDivElement;

            jest.spyOn(document, 'querySelectorAll').mockReturnValueOnce([
                div,
                div,
            ] as unknown as NodeListOf<HTMLDivElement>);

            setContainerHeight();

            expect(div.style.setProperty).not.toHaveBeenCalled();
        });
    });

    describe('resetScrollbarPosition', () => {
        it('should reset scrollbar position when element exists', () => {
            document.body.innerHTML = '<div id="scrollable-wrapper" style="overflow: auto; height: 100px;"></div>';
            const scrollableWrapper = document.getElementById('scrollable-wrapper') as HTMLElement;
            scrollableWrapper.scroll = jest.fn();

            resetScrollbarPosition();

            expect(scrollableWrapper.scroll).toHaveBeenCalledWith(0, 0);
        });

        it('should do nothing when element does not exist', () => {
            document.body.innerHTML = '';

            expect(() => resetScrollbarPosition()).not.toThrow();
        });
    });
});
