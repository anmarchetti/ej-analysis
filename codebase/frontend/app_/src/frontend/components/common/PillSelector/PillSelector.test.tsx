import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import PillSelector, { IPillSelectorProps } from 'frontend/components/common/PillSelector/PillSelector';

const createProps = (): IPillSelectorProps => ({
    inputName: 'test-input',
    selectedValue: 0,
    options: [
        {
            value: 0,
            label: '0 Label',
        },
        {
            value: 1,
            label: '1 Label',
        },
    ],
    onChange: jest.fn(),
    dataTid: 'pill-selector',
    className: 'pill-selector-class',
});

let mockProps: IPillSelectorProps;

const scrollIntoViewMock = jest.fn();
Element.prototype.scrollIntoView = scrollIntoViewMock;

let mockUseMobileViewPort = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewPort,
}));

describe('PillSelector', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockUseMobileViewPort = false;
    });

    describe('given flexOptions prop', () => {
        it('should render wrapper with correct class name and data-tid', () => {
            render(<PillSelector {...mockProps} />);

            expect(screen.getByTestId(mockProps.dataTid!)).toHaveClass(mockProps.className!);
        });

        it('should render set number of pills', () => {
            render(<PillSelector {...mockProps} />);

            expect(screen.getAllByRole('radio').length).toEqual(mockProps.options.length);
        });

        it('should scroll checked pill into view on load on mobile', () => {
            mockUseMobileViewPort = true;
            render(<PillSelector {...mockProps} />);

            expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
            expect(scrollIntoViewMock).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        });

        it('should NOT scroll checked pill into view on load on desktop', () => {
            render(<PillSelector {...mockProps} />);

            expect(scrollIntoViewMock).not.toHaveBeenCalled();
        });

        describe('given selectedValue', () => {
            it('should have correct pill selected', () => {
                render(<PillSelector {...mockProps} />);

                const checkedRadio = screen.getAllByRole('radio').find((el: any) => el.checked) as HTMLInputElement;
                expect(Number.parseInt(checkedRadio.value)).toEqual(mockProps.selectedValue);
            });
        });

        describe('given user clicks input', () => {
            it('should call onChange', async () => {
                render(<PillSelector {...mockProps} />);

                await userEvent.click(screen.getByRole('radio', { name: /1 Label/i }));
                expect(mockProps.onChange).toHaveBeenCalledWith(mockProps.options[1].value);
            });

            it('should scroll pill into view on mobile when selected value is updated', () => {
                mockUseMobileViewPort = true;
                const { rerender } = render(<PillSelector {...mockProps} />);

                expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
                expect(scrollIntoViewMock).toHaveBeenCalledWith({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });

                mockProps.selectedValue = 1;
                rerender(<PillSelector {...mockProps} />);

                expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
            });
        });
    });

    it('should NOT render when no flexOptions', () => {
        mockProps.options = [];
        const { container } = render(<PillSelector {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
