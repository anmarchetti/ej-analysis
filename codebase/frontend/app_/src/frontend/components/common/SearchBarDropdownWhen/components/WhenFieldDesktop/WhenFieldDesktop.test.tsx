import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { getDate } from 'frontend/utils/date.utils';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import WhenFieldDesktop from './WhenFieldDesktop';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('react-focus-within', () => ({ onFocus, onBlur, children }) => (
    <div data-tid='react-focus-withi'>
        <button data-tid='react-focus-within-focus' onClick={onFocus} />
        <button data-tid='react-focus-within-blur' onClick={onBlur} />
        {children({ getFocusProps: () => ({}) })}
    </div>
));

jest.mock('frontend/components/common/Pills/FlexibilityPills/FlexibilityPills', () => () => (
    <div data-tid='flexibility-pills' />
));

const mockWhenFieldButtonsProps = jest.fn();
jest.mock('frontend/components/common/SearchBarDropdownWhen/components/WhenFieldButtons/WhenFieldButtons', () => ({
    __esModule: true,
    default: props => {
        mockWhenFieldButtonsProps(props);

        return <div data-tid='when-field-buttons' />;
    },
}));

jest.mock(
    'frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox',
    () =>
        ({ children }) =>
            <div data-tid='search-bar-dropdown-scrollable-box'>{children}</div>,
);

jest.mock('frontend/components/common/Calendar/components/FlatPickerDynamic', () => ({
    __esModule: true,
    DynamicFlatPicker: () => (
        <div data-tid='flat-picker-dynamic'>
            <button data-tid='flatpickr-day' className='flatpickr-day' />
        </div>
    ),
}));

const mockSwipeableProps = jest.fn();
jest.mock('react-swipeable', () => ({
    __esModule: true,
    Swipeable: props => {
        mockSwipeableProps(props);

        return <div>{props.children}</div>;
    },
}));

const createProps = () => ({
    refCalendarBefore: 'test',
    focusElementNearCalendar: jest.fn(() => false),
    renderError: jest.fn(() => <p>Error</p>),
    nightsNum: 10,
    nightsSelectedLabel: 'nightsSelectedLabel',
    value: [],
    isTitleHidden: false,
    onChangeFlexible: jest.fn(),
});

const createStores = () =>
    createMockStores({
        layoutStore: { isPromoPage: false },
        searchStore: {
            searchWhen: {
                firstAvailableDepartureDate: getDate('2023-01-01'),
                onChangeDates: jest.fn(),
                lastAvailableDate: getDate('2023-04-01'),
            },
        },
        promoPageStore: { availableDateStart: getDate('2023-01-01'), availableDateEnd: getDate('2023-04-01') },
        appStore: {},
    });

let mockProps;
let mockStores;

describe('<WhenFieldDesktop />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render search-bar__dropdown', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByRole('dialog')).toHaveClass('search-bar__dropdown');
    });

    describe('Hint message', () => {
        it('should render SearchPodLabelsWhenDropdown when value is empty', () => {
            render(<WhenFieldDesktop {...mockProps} />);

            expect(
                screen.getByRole('heading', { name: SitecoreDictionary.SearchPodLabelsWhenDropdown }),
            ).toBeInTheDocument();
        });

        it('should render SearchPodLabelsWhenReturnDate when value includes one date', () => {
            mockProps.value = [new Date()];
            render(<WhenFieldDesktop {...mockProps} />);

            expect(
                screen.getByRole('heading', { name: SitecoreDictionary.SearchPodLabelsWhenReturnDate }),
            ).toBeInTheDocument();
        });

        it('should render SearchPodLabelsWhenBothDates when value includes two dates', () => {
            mockProps.value = [new Date(), new Date()];
            render(<WhenFieldDesktop {...mockProps} />);

            expect(
                screen.getByRole('heading', { name: SitecoreDictionary.SearchPodLabelsWhenBothDates }),
            ).toBeInTheDocument();
        });

        it('should NOT render title when isTitleHidden is true', () => {
            mockProps.isTitleHidden = true;
            render(<WhenFieldDesktop {...mockProps} />);

            expect(screen.queryByTestId('when-field-title')).not.toBeInTheDocument();
        });
    });

    it('should render SearchBarDropdownScrollableBox component', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByTestId('search-bar-dropdown-scrollable-box')).toBeInTheDocument();
    });

    it('should render nightsSelectedLabel when nights number > 0', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByText('nightsSelectedLabel')).toBeInTheDocument();
    });

    it('should NOT render nightsSelectedLabel when nights number = 0', () => {
        mockProps.nightsNum = 0;
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.queryByText('nightsSelectedLabel')).not.toBeInTheDocument();
    });

    it('should render FlexibilityPills component', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByTestId('flexibility-pills')).toBeInTheDocument();
    });

    it('should render calendarBefore and calendarAfter', () => {
        const { container } = render(<WhenFieldDesktop {...mockProps} />);

        expect(container.getElementsByClassName('skip-calendar-link-box').length).toBe(2);
    });

    it('should NOT render hide-arrow when NOT isHideNextArrow', () => {
        const { container } = render(<WhenFieldDesktop {...mockProps} />);

        expect(container.getElementsByClassName('hide-arrow').length).toBe(0);
    });

    it('should render hide-arrow when isHideNextArrow', () => {
        mockProps.value = [new Date()];
        mockProps.maxDate = new Date();
        const { container, rerender } = render(<WhenFieldDesktop {...mockProps} />);
        mockProps = {
            isOneMonthPromoPage: true,
            maxDate: new Date(),
            refCalendarBefore: 't',
            focusElementNearCalendar: jest.fn(() => false),
            renderError: jest.fn(() => <p>Error2</p>),
            nightsNum: 10,
            nightsSelectedLabel: 'nights',
            value: '',
            refFpCalendar: {
                current: {
                    flatpickr: {
                        currentYear: 'year',
                        currentMonth: 'month',
                        clear: jest.fn(),
                        jumpToDate: jest.fn(),
                    },
                },
            },
        };
        rerender(<WhenFieldDesktop {...mockProps} />);

        expect(container.getElementsByClassName('hide-arrow').length).toBe(1);
    });

    it('should render calendar-box--not-foxused when FocusWithin NOT focused', () => {
        const { container } = render(<WhenFieldDesktop {...mockProps} />);

        expect(container.getElementsByClassName('calendar-box--not-foxused').length).toBe(1);
    });

    it('should render Swipeable component', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(mockSwipeableProps).toHaveBeenCalledWith(
            expect.objectContaining({
                trackTouch: true,
            }),
        );
    });

    it('should render Flatpickr component', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByTestId('flat-picker-dynamic')).toBeInTheDocument();
    });

    it('should render Error', () => {
        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should render WhenFieldButtons component', () => {
        mockProps.refCalendarClear = React.createRef();
        mockProps.refCalendarClose = React.createRef();

        render(<WhenFieldDesktop {...mockProps} />);

        expect(screen.getByTestId('when-field-buttons')).toBeInTheDocument();
        expect(mockWhenFieldButtonsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                refCalendarClear: mockProps.refCalendarClear,
                refCalendarClose: mockProps.refCalendarClose,
            }),
        );
    });

    describe('keydown', () => {
        it('should NOT call focusElementNearCalendar when calendar not focused', () => {
            render(<WhenFieldDesktop {...mockProps} />);

            fireEvent.keyDown(document, { code: KeyboardKey.ESC });

            expect(mockProps.focusElementNearCalendar).not.toHaveBeenCalled();
        });

        it('should should call focusElementNearCalendar when focused on a flatpickr-day', () => {
            render(<WhenFieldDesktop {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-focus-within-focus'));

            const calendarDay = screen.getByTestId('flatpickr-day');
            calendarDay.focus();

            fireEvent.keyDown(document, { key: KeyboardKey.ESC });

            expect(mockProps.focusElementNearCalendar).toHaveBeenCalledWith(true);
        });

        it('should not call focusElementNearCalendar when activeElement is not a flatpickr-day', () => {
            render(<WhenFieldDesktop {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-focus-within-focus'));

            fireEvent.keyDown(document, { key: KeyboardKey.ESC });

            expect(mockProps.focusElementNearCalendar).not.toHaveBeenCalled();
        });

        it('should call focusElementNearCalendar with false when Shift + Tab are pressed', () => {
            render(<WhenFieldDesktop {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-focus-within-focus'));

            fireEvent.keyDown(document, { key: KeyboardKey.Tab, shiftKey: true });

            expect(mockProps.focusElementNearCalendar).toHaveBeenCalledWith(false);
        });

        it('should prevent default and call focusElementNearCalendar with true when Tab is pressed', () => {
            render(<WhenFieldDesktop {...mockProps} />);

            fireEvent.click(screen.getByTestId('react-focus-within-focus'));

            const keyboardEvent = new KeyboardEvent('keydown', {
                key: KeyboardKey.Tab,
                bubbles: true,
            });
            const mockPreventDefault = jest.spyOn(keyboardEvent, 'preventDefault');

            fireEvent(document, keyboardEvent);

            expect(mockProps.focusElementNearCalendar).toHaveBeenCalledWith(true);
            expect(mockPreventDefault).toHaveBeenCalled();
        });
    });
});
