/* eslint-disable react/function-component-definition */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import WhenFieldMobile from './WhenFieldMobile';

const createProps = () => ({
    activeViewDate: new Date(),
    minDate: new Date(),
    maxDate: new Date(),
    isAvailableDatesLoading: false,
    value: [],
    renderError: jest.fn(() => <p>Error</p>),
    showEmptyMonths: jest.fn(),
    isDateAvailable: jest.fn(),
    setFlatPikrDateValue: jest.fn(),
    setMaxDate: jest.fn(),
    oneMonthPromoPageFlow: jest.fn(),
    onChangeFlexible: jest.fn(),
});

const createStores = () => ({
    searchStore: {
        searchWhen: {
            firstAvailableDepartureDate: new Date(),
            onChangeDates: jest.fn(),
            lastAvailableDate: new Date(),
            isAvailableDatesLoading: false,
        },
    },
    layoutStore: { getPhrase: jest.fn(p => p), isPromoPage: false },
    appStore: { isScreenMedium: false },
    promoPageStore: { availableDateStart: new Date(), availableDateEnd: new Date() },
});

let mockProps;
let mockStores;

jest.mock('react-select', () => () => <div data-tid='select' />);

jest.mock('frontend/components/common/Pills/FlexibilityPills/FlexibilityPills', () => () => (
    <div data-tid='flexibility-pills' />
));

const mockWhenFieldButtonsComponent = jest.fn();
jest.mock(
    'frontend/components/common/SearchBarDropdownWhen/components/WhenFieldButtons/WhenFieldButtons',
    () => props => {
        mockWhenFieldButtonsComponent(props);

        return <div data-tid='when-field-buttons' />;
    },
);

jest.mock('frontend/components/common/Spinner', () => ({
    __esModule: true,
    Spinner: () => <div data-tid='spinner' />,
}));

jest.mock('frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox', () => {
    const { forwardRef } = jest.requireActual('react');

    return forwardRef((props: any, ref: any) => (
        <div data-tid='search-bar-dropdown-scrollable-box' ref={ref}>
            {props.children}
        </div>
    ));
});

const mockSingleDate = new Date('2025-11-11');
const mockMultipleDates = [new Date('2025-09-09'), new Date('2025-10-10')];
const mockInstance = {};
jest.mock('frontend/components/common/Calendar/components/FlatPickerDynamic', () => ({
    __esModule: true,
    DynamicFlatPicker: ({ onChange }) => (
        <div data-tid='flat-picker-dynamic'>
            <button onClick={() => onChange([mockSingleDate], undefined, mockInstance)}>onChangeSingleDate</button>
            <button onClick={() => onChange(mockMultipleDates, undefined, mockInstance)}>onChangeMultipleDates</button>
            <button onClick={() => onChange([], undefined, mockInstance)}>onChangeNoDates</button>
        </div>
    ),
}));

jest.mock('frontend/components/common/Weekdays/Weekdays', () => () => <div data-tid='weekdays' />);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<WhenFieldMobile />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2025-02-18'));
    });

    it('should render FlexibilityPills component', () => {
        const { getByTestId } = render(<WhenFieldMobile {...mockProps} />);

        expect(getByTestId('flexibility-pills')).toBeInTheDocument();
    });

    it('should render all days of the week', () => {
        const { getByTestId } = render(<WhenFieldMobile {...mockProps} />);

        expect(getByTestId('weekdays')).toBeInTheDocument();
    });

    it('should render Spinner component when isAvailableDatesLoading', () => {
        mockStores.searchStore.searchWhen.isAvailableDatesLoading = true;

        const { getByTestId } = render(<WhenFieldMobile {...mockProps} />);

        expect(getByTestId('spinner')).toBeInTheDocument();
    });

    it('should render SearchBarDropdownScrollableBox component when NOT isAvailableDatesLoading', () => {
        render(<WhenFieldMobile {...mockProps} />);

        expect(screen.getAllByTestId('search-bar-dropdown-scrollable-box').length).toBe(1);
    });

    it('should render calendarBefore and calendarAfter', () => {
        const { container } = render(<WhenFieldMobile {...mockProps} />);

        expect(container.getElementsByClassName('skip-calendar-link-box').length).toBe(2);
    });

    it('should render Flatpickr component', () => {
        const { getByTestId } = render(<WhenFieldMobile {...mockProps} />);

        expect(getByTestId('flat-picker-dynamic')).toBeInTheDocument();
    });

    it('should pass renderError to WhenFieldButtons component', () => {
        render(<WhenFieldMobile {...mockProps} />);

        expect(mockWhenFieldButtonsComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                renderError: mockProps.renderError,
            }),
        );
    });

    it('should render WhenFieldButtons component', () => {
        const { getByTestId } = render(<WhenFieldMobile {...mockProps} />);

        expect(getByTestId('when-field-buttons')).toBeInTheDocument();
    });

    describe('<WhenFieldMobile />', () => {
        describe('single date change', () => {
            it('should call setFlatPikrDateValue & showEmptyMonths when isDateAvailable returns false', () => {
                render(<WhenFieldMobile {...mockProps} />);

                fireEvent.click(screen.getByRole('button', { name: 'onChangeSingleDate' }));

                expect(mockProps.setFlatPikrDateValue).toHaveBeenCalledWith(mockProps.value);
                expect(mockStores.searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
                expect(mockProps.showEmptyMonths).toHaveBeenCalledWith(mockInstance);
            });

            it('should call onChangeDates & showEmptyMonths when isDateAvailable returns true', () => {
                mockProps.isDateAvailable.mockReturnValueOnce(true);
                render(<WhenFieldMobile {...mockProps} />);

                fireEvent.click(screen.getByRole('button', { name: 'onChangeSingleDate' }));

                expect(mockProps.setFlatPikrDateValue).not.toHaveBeenCalled();
                expect(mockStores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([mockSingleDate]);
                expect(mockProps.showEmptyMonths).toHaveBeenCalledWith(mockInstance);
            });

            it('should call oneMonthPromoPageFlow & onChangeDates when isDateAvailable returns true and isOneMonthPromoPage is true', async () => {
                mockProps.isOneMonthPromoPage = true;
                mockProps.isDateAvailable.mockReturnValueOnce(true);
                mockStores.promoPageStore.availableDateEnd = new Date('2025-10-10');

                render(<WhenFieldMobile {...mockProps} />);

                fireEvent.click(screen.getByRole('button', { name: 'onChangeSingleDate' }));

                await waitFor(() => {
                    expect(mockProps.oneMonthPromoPageFlow).toHaveBeenCalledWith(
                        [mockSingleDate],
                        mockInstance,
                        expect.anything(),
                    );
                    expect(mockStores.searchStore.searchWhen.onChangeDates).toHaveBeenCalledWith([mockSingleDate]);
                });
            });

            it('should NOT call onChangeDates when promoMaxDate is defined and months from promoMaxDate and date are equal', () => {
                mockStores.promoPageStore.availableDateEnd = mockSingleDate;
                mockProps.isOneMonthPromoPage = true;
                mockProps.isDateAvailable.mockReturnValueOnce(true);
                render(<WhenFieldMobile {...mockProps} />);

                fireEvent.click(screen.getByRole('button', { name: 'onChangeSingleDate' }));

                expect(mockStores.searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
            });
        });

        describe('multiple dates change', () => {
            it('should call setFlatPikrDateValue & showEmptyMonths when isDateAvailable returns false', () => {
                render(<WhenFieldMobile {...mockProps} />);

                fireEvent.click(screen.getByRole('button', { name: 'onChangeMultipleDates' }));

                expect(mockProps.setMaxDate).not.toHaveBeenCalled();
                expect(mockProps.setFlatPikrDateValue).toHaveBeenCalledWith(mockProps.value);
                expect(mockStores.searchStore.searchWhen.onChangeDates).not.toHaveBeenCalled();
                expect(mockProps.showEmptyMonths).toHaveBeenCalledWith(mockInstance);
            });
        });

        it('should call jumpToDate when no dates changed', () => {
            const mockJumpToDate = jest.fn();
            mockProps.refFpCalendar = { current: { flatpickr: { jumpToDate: mockJumpToDate } } };
            render(<WhenFieldMobile {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: 'onChangeNoDates' }));

            expect(mockJumpToDate).toHaveBeenCalled();
            expect(mockProps.showEmptyMonths).toHaveBeenCalledWith(mockInstance);
        });
    });
});
