import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { TIME_UNITS } from 'code/dates';
import { mockMonths } from 'frontend/__mocks__/monthsAvailability';
import { KeyboardKey } from 'models/enum/KeyboardKey';

import MonthCarousel, { IMonthCarouselProps } from './MonthCarousel';

const mockCarouselButtonsGroup = jest.fn();
jest.mock('frontend/components/common/CarouselButtonsGroup/CarouselButtonsGroup', () => ({
    __esModule: true,
    default: props => {
        mockCarouselButtonsGroup(props);

        return <div data-tid='carousel-buttons-group' />;
    },
}));

let mockAfterChange: (prevSlideIndex: number, state: { currentSlide: number }) => void;
jest.mock('frontend/components/common/CarouselWrapper/CarouselWrapper', () => ({
    __esModule: true,
    default: ({ children, customButtonGroup, afterChange }) => {
        mockAfterChange = afterChange;

        return (
            <div data-tid='carousel'>
                {customButtonGroup}
                {children}
            </div>
        );
    },
}));

jest.mock('frontend/components/common/SearchBarDropdownWhen/components/MonthOption/MonthOption', () => ({
    __esModule: true,
    default: ({ onMonthChange, month, isVisible }) => (
        <input
            type='radio'
            name='month-option'
            onChange={onMonthChange}
            data-tid={`${month.monthName}-${month.year}-input`}
            aria-hidden={!isVisible}
        />
    ),
}));

let mockProps;

const createMockProps = (): IMonthCarouselProps => ({
    months: [...mockMonths],
    onMonthChange: jest.fn(),
});

describe('MonthCarousel', () => {
    beforeEach(() => {
        mockProps = createMockProps();
    });

    it('should show all months', () => {
        render(<MonthCarousel {...mockProps} />);

        const options = screen.getAllByRole('radio');

        expect(options).toHaveLength(12);
        expect(screen.getByTestId('July-2025-input')).toBeInTheDocument();
    });

    it('should render carousel with CarouselButtonsGroup if more than one slide exists', () => {
        render(<MonthCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.getByTestId('carousel-buttons-group')).toBeInTheDocument();
    });

    it('should NOT render CarouselButtonsGroup when monthsAvailability has 12 items (one slide)', () => {
        mockProps.months = mockMonths.slice(0, TIME_UNITS.monthsInYear);
        render(<MonthCarousel {...mockProps} />);

        expect(screen.getByTestId('carousel')).toBeInTheDocument();
        expect(screen.queryByTestId('carousel-buttons-group')).not.toBeInTheDocument();
        expect(mockCarouselButtonsGroup).not.toHaveBeenCalled();
    });

    it('should focus first enabled input when isKeyboardNav is true (via keydown on wrapper)', async () => {
        render(<MonthCarousel {...mockProps} />);

        const carousel = screen.getByTestId('carousel');

        fireEvent.keyDown(carousel, { code: KeyboardKey.ENTER });
        mockAfterChange(0, { currentSlide: 1 });

        const input = screen.getByTestId('July-2026-input');

        await waitFor(() => {
            expect(document.activeElement).toBe(input);
        });
    });

    it('should NOT focus input when keydown has unknown code (not in keys list)', async () => {
        render(<MonthCarousel {...mockProps} />);

        const carousel = screen.getByTestId('carousel');

        fireEvent.keyDown(carousel, { code: KeyboardKey.ESCAPE });

        mockAfterChange(0, { currentSlide: 1 });

        const input = screen.getByTestId('July-2026-input');

        await waitFor(() => {
            expect(input).toHaveAttribute('aria-hidden', 'false');
        });
        expect(document.activeElement).not.toBe(input);
    });

    it('should NOT focus input if isKeyboardNav = false (default state)', () => {
        render(<MonthCarousel {...mockProps} />);

        mockAfterChange(0, { currentSlide: 1 });

        const input = screen.getByTestId('July-2026-input');
        expect(document.activeElement).not.toBe(input);
    });

    it('should show months from the next slide when afterChange is triggered', async () => {
        render(<MonthCarousel {...mockProps} />);

        const secondSlideinput = screen.getByTestId('July-2026-input');
        expect(secondSlideinput).toHaveAttribute('aria-hidden', 'true');

        mockAfterChange(0, { currentSlide: 1 });

        await waitFor(() => {
            expect(secondSlideinput).toHaveAttribute('aria-hidden', 'false');
        });
        expect(secondSlideinput).toBeInTheDocument();
    });
});
