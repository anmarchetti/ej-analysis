import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { DateViewDropdown, IDateViewDropdownProps } from './DateViewDropdown';

const mockWhenFieldDesktopProps = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWhen/components/WhenFieldDesktop/WhenFieldDesktop', () => ({
    __esModule: true,
    default: ({
        clearDate,

        ...props
    }) => {
        mockWhenFieldDesktopProps(props);
        const { refCalendarClear, refCalendarClose, refCalendarBefore, focusElementNearCalendar } = props;

        return (
            <div data-tid='when-field-desktop'>
                <button ref={refCalendarClear} onClick={clearDate}>
                    clearDate
                </button>
                <button ref={refCalendarClose}>close</button>
                <button ref={refCalendarBefore}>refCalendarBefore</button>
                <button onClick={() => focusElementNearCalendar(true)}>focusElementNearCalendar-true</button>
                <button onClick={() => focusElementNearCalendar(false)}>focusElementNearCalendar-false</button>
            </div>
        );
    },
}));

const mockWhenFieldMobileProps = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWhen/components/WhenFieldMobile/WhenFieldMobile', () => ({
    __esModule: true,
    default: props => {
        mockWhenFieldMobileProps(props);

        return <div data-tid='when-field-mobile' />;
    },
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getCountOfNightLabel: jest.fn(number => `${number} selected`),
}));

const resetMocks = (): IDateViewDropdownProps => ({
    value: [],
    selectedNumberOfNights: 9,
    isScreenMedium: true,
    getPhrase: jest.fn(),
    onClose: jest.fn(),
    onApply: jest.fn(),
    getSetting: jest.fn(),
    availableDates: null,
    changeDateAvailabilityInterval: jest.fn(),
    clearErrorMessage: jest.fn(),
    earliestDateField: null,
    flexDays: 0,
    isAvailableDatesLoading: false,
    isFlexible: false,
    isOneMonthPromoPage: false,
    isPromoPage: false,
    lastAvailableDate: null,
    minDate: undefined,
    onChangeFlexible: jest.fn(),
    onClearDates: jest.fn(),
    promoMaxDate: null,
    promoMinDate: null,
    resetDateAvailabilityInterval: jest.fn(),
    setAvailableDatesLoading: jest.fn(),
    updateAvailableDates: jest.fn(),
    isTitleHidden: false,
});

let mocks = resetMocks();

describe('DateViewDropdown', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render desktop when screen not medium', () => {
        render(<DateViewDropdown {...mocks} />);

        expect(mockWhenFieldDesktopProps).toHaveBeenCalledWith(
            expect.objectContaining({
                nightsNum: 9,
                nightsSelectedLabel: '9 selected',
                refCalendarClear: expect.anything(),
                refCalendarClose: expect.anything(),
            }),
        );
    });

    it('should call clearErrorMessage when call clearDate', () => {
        render(<DateViewDropdown {...mocks} />);

        fireEvent.click(screen.getByRole('button', { name: 'clearDate' }));

        expect(mocks.clearErrorMessage).toHaveBeenCalled();
    });

    it('should render mobile when screen medium', () => {
        mocks.isScreenMedium = false;
        mocks.selectedNumberOfNights = 0;
        render(<DateViewDropdown {...mocks} />);

        expect(mockWhenFieldMobileProps).toHaveBeenCalledWith(
            expect.objectContaining({
                nightsNum: 0,
                nightsSelectedLabel: '0 selected',
            }),
        );
    });

    describe('focusElementNearCalendar', () => {
        it('should focus clear button when value array is not empty and focusElementNearCalendar is called with true param', () => {
            mocks.value = [new Date()];

            render(<DateViewDropdown {...mocks} />);

            const clearBtn = screen.getByRole('button', { name: 'clearDate' });
            const focusSpy = jest.spyOn(clearBtn, 'focus');
            const triggerFocusBtn = screen.getByRole('button', {
                name: 'focusElementNearCalendar-true',
            });

            fireEvent.click(triggerFocusBtn);

            expect(focusSpy).toHaveBeenCalled();
        });

        it('should focus close button when value array is empty and focusElementNearCalendar is called with true param', () => {
            render(<DateViewDropdown {...mocks} />);

            const clearBtn = screen.getByRole('button', { name: 'close' });
            const focusSpy = jest.spyOn(clearBtn, 'focus');
            const triggerFocusBtn = screen.getByRole('button', {
                name: 'focusElementNearCalendar-true',
            });

            fireEvent.click(triggerFocusBtn);

            expect(focusSpy).toHaveBeenCalled();
        });

        it('should focus refCalendarBefore when value array is empty and focusElementNearCalendar is called with false param', () => {
            render(<DateViewDropdown {...mocks} />);

            const clearBtn = screen.getByRole('button', { name: 'refCalendarBefore' });
            const focusSpy = jest.spyOn(clearBtn, 'focus');
            const triggerFocusBtn = screen.getByRole('button', {
                name: 'focusElementNearCalendar-false',
            });

            fireEvent.click(triggerFocusBtn);

            expect(focusSpy).toHaveBeenCalled();
        });
    });
});
