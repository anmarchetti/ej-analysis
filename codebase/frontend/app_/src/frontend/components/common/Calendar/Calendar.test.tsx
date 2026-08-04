import React from 'react';
import DatePicker from 'react-flatpickr';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import flatpickr from 'flatpickr';
import { english } from 'flatpickr/dist/l10n/default.js';

import { createMockStores } from 'frontend/__mocks__';
import { makeOverlayOnDisabledMonths } from 'frontend/components/common/Calendar/components/calendar.utils';
import { CalendarType, IDatePickerProps } from 'frontend/components/common/Calendar/IDatePickerProps';

import CalendarDesktop from './CalendarDesktop';
import CalendarMobile from './CalendarMobile';
flatpickr.localize(english);

const createLocalStore = () => ({
    isDatePickerOpen: true,
    currentDates: [],
    numberOfNights: 0,
    clearDates: jest.fn(),
    setDates: jest.fn(),
    closeDatePicker: jest.fn(),
    confirmDates: jest.fn(),
    setPastHoliday: jest.fn(),
});

let mockLocalStore = createLocalStore();

jest.mock('frontend/components/renderings/ContactUs/store/createStore', () => ({
    ...jest.requireActual('frontend/components/renderings/ContactUs/store/createStore'),
    useContactUsStore: () => mockLocalStore,
}));

let mockUseMobileViewport = false;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const createProps = (): IDatePickerProps => ({
    refFpCalendar: React.createRef<DatePicker>(),
    isDatePickerOpen: true,
    currentDates: [new Date('2022-06-01'), new Date('2022-06-07')],
    minDate: new Date('2022-01-01'),
    maxDate: new Date('2022-12-31'),
    numberOfNights: 0,
    nightsSelectedLabel: 'Label',
    clearDates: jest.fn(),
    focusCalendar: jest.fn(),
    setDates: jest.fn(),
    onCloseClick: jest.fn(),
    setPastHoliday: jest.fn(),
    confirmDates: jest.fn(),
    calendarType: CalendarType.Modal,
    focusOnMount: false,
    onDayCreate: jest.fn(),
});

let mockStores;
let mockProps = createProps();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Calendar/components/calendar.utils');

const scrollIntoViewMock = jest.fn();
Element.prototype.scrollIntoView = scrollIntoViewMock;

const mockButtonProps = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, ...props }) => {
        mockButtonProps(props);

        return (
            <button data-tid={props.dataTid} onClick={onClick}>
                {children}
            </button>
        );
    },
}));

jest.mock('frontend/components/common/SearchBarDropdownScrollableBox/SearchBarDropdownScrollableBox', () => ({
    __esModule: true,
    default: ({ children }) => <div data-tid='scrollable-box'>{children}</div>,
}));

jest.mock('./MonthPicker/MonthPicker', () => ({
    __esModule: true,
    default: () => <div data-tid='month-picker' />,
}));

describe('<Calendar />', () => {
    beforeEach(() => {
        mockStores = createMockStores({
            searchStore: {
                errorMessages: null,
            },
        });
        mockLocalStore = createLocalStore();
        mockProps = createProps();
    });

    describe('Desktop', () => {
        beforeEach(() => {
            mockStores.appStore.isScreenMedium = true;
        });

        it('Should render calendar date picker', async () => {
            render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('calendar-date-picker')).toBeInTheDocument();
            });
            expect(screen.getByTestId('scrollable-box')).toBeInTheDocument();
        });

        it('Should NOT call jumpToDate if no focusOnMount', async () => {
            render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });

            const instance = mockProps.refFpCalendar.current!.flatpickr;
            const spyJumpToDate = jest.spyOn(instance, 'jumpToDate');

            await waitFor(() => {
                expect(spyJumpToDate).not.toHaveBeenCalled();
            });
        });

        it('Should call jumpToDate once calendar mounted', async () => {
            mockProps.focusOnMount = true;
            const { rerender } = render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });

            const instance = mockProps.refFpCalendar.current!.flatpickr;
            const spyJumpToDate = jest.spyOn(instance, 'jumpToDate');

            mockProps.selectedMonth = new Date('2022-06-01');

            rerender(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(spyJumpToDate).toHaveBeenCalledWith(new Date('2022-06-01'), true);
            });
        });

        it('Should remove all tabindex attributes on mount', async () => {
            const { container } = render(<CalendarDesktop {...mockProps} />);

            const dayElemWithTabIndex = container.querySelector('.flatpickr-day[tabindex]');

            expect(dayElemWithTabIndex).toBe(null);
            await waitFor(() => {
                expect(mockProps.onDayCreate).toHaveBeenCalledWith(
                    mockProps.currentDates,
                    '',
                    expect.any(Object),
                    expect.any(HTMLSpanElement),
                );
            });
        });

        it('Should render MonthPicker in inline calendar', async () => {
            mockProps.calendarType = CalendarType.Inline;
            mockProps.monthOptions = ['June'];
            render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(screen.getByTestId('month-picker')).toBeInTheDocument();
            });
        });

        it('Should call JumpToDate to correct section on rerender', async () => {
            const { rerender } = render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });

            const instance = mockProps.refFpCalendar.current!.flatpickr;
            const spyJumpToDate = jest.spyOn(instance, 'jumpToDate');
            const spyClear = jest.spyOn(instance, 'clear');

            mockProps.currentDates = [];

            rerender(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(spyClear).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(spyJumpToDate).toHaveBeenCalled();
            });
        });

        it('Should call JumpToDate with correct section on rerender with additional parameters', async () => {
            const { rerender } = render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });

            const instance = mockProps.refFpCalendar.current!.flatpickr;
            const spyJumpToDate = jest.spyOn(instance, 'jumpToDate');

            instance.currentMonth = 5;
            instance.currentYear = 2022;
            mockProps.currentDates = [];

            rerender(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(spyJumpToDate).toHaveBeenCalledWith(new Date(2022, 5, 1, 0, 0, 0), true);
            });
        });

        it("Should not call JumpToDate if ref isn't available", async () => {
            const { rerender } = render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });

            const instance = mockProps.refFpCalendar.current!.flatpickr;
            const spyJumpToDate = jest.spyOn(instance, 'jumpToDate');

            mockProps.refFpCalendar = { current: null };

            rerender(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(spyJumpToDate).not.toHaveBeenCalled();
            });
        });

        it('Should call makeOverlayOnDisabledMonths initially', async () => {
            render(<CalendarDesktop {...mockProps} />);

            await waitFor(() => {
                expect(makeOverlayOnDisabledMonths).toHaveBeenCalled();
            });
        });

        describe('Automatic scroll behavior', () => {
            it('Should scroll month by one if arrival date is not on the calendar', async () => {
                mockProps.setDates = jest.fn().mockReturnValueOnce([new Date('2022-07-31'), new Date('2022-08-06')]);

                render(<CalendarDesktop {...mockProps} />);

                await waitFor(() => {
                    expect(mockProps.refFpCalendar.current).not.toBeNull();
                });

                const instance = mockProps.refFpCalendar.current!.flatpickr;
                const spyChangeMonth = jest.spyOn(instance, 'changeMonth');

                expect(screen.getByText('June')).toBeInTheDocument();
                expect(screen.getByText('July')).toBeInTheDocument();

                const dayButton = screen.getByLabelText('July 31, 2022');
                fireEvent.click(dayButton);

                await waitFor(() => {
                    expect(spyChangeMonth).toHaveBeenCalledWith(1);
                });
                expect(screen.getByText('July')).toBeInTheDocument();
                expect(screen.getByText('August')).toBeInTheDocument();
            });

            it('Should not scroll if arrival date is on the calendar', async () => {
                mockProps.setDates = jest.fn().mockReturnValueOnce([new Date('2022-06-30'), new Date('2022-07-06')]);

                render(<CalendarDesktop {...mockProps} />);

                await waitFor(() => {
                    expect(mockProps.refFpCalendar.current).not.toBeNull();
                });

                const instance = mockProps.refFpCalendar.current!.flatpickr;
                const spyChangeMonth = jest.spyOn(instance, 'changeMonth');

                expect(screen.getByText('June')).toBeInTheDocument();
                expect(screen.getByText('July')).toBeInTheDocument();

                const dayButton = screen.getAllByLabelText('June 30, 2022')[0];
                fireEvent.click(dayButton);

                await waitFor(() => {
                    expect(spyChangeMonth).not.toHaveBeenCalled();
                });
                expect(screen.getByText('June')).toBeInTheDocument();
                expect(screen.getByText('July')).toBeInTheDocument();
            });

            it('Should scroll month when arrival date is not on calendar and in next year', async () => {
                mockProps.currentDates = [new Date('2022-11-01'), new Date('2022-12-07')];
                mockProps.maxDate = new Date('2023-01-31');
                mockProps.setDates = jest.fn().mockReturnValueOnce([new Date('2022-12-30'), new Date('2023-01-06')]);

                render(<CalendarDesktop {...mockProps} />);

                await waitFor(() => {
                    expect(mockProps.refFpCalendar.current).not.toBeNull();
                });

                const instance = mockProps.refFpCalendar.current!.flatpickr;
                const spyChangeMonth = jest.spyOn(instance, 'changeMonth');

                expect(screen.getByText('November')).toBeInTheDocument();
                expect(screen.getByText('December')).toBeInTheDocument();

                const dayButton = screen.getByLabelText('December 30, 2022');
                fireEvent.click(dayButton);

                await waitFor(() => {
                    expect(spyChangeMonth).toHaveBeenCalledWith(1);
                });
                expect(screen.getByText('January')).toBeInTheDocument();
                expect(screen.getByText('December')).toBeInTheDocument();
            });
        });
    });

    describe('Mobile', () => {
        beforeEach(() => {
            mockUseMobileViewport = true;
        });

        it('Should render mobile view', async () => {
            mockProps.isDatePickerOpen = false;
            const { rerender } = render(<CalendarMobile {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });
            expect(screen.getByTestId('calendar-date-picker')).toBeInTheDocument();

            mockProps.isDatePickerOpen = true;

            rerender(<CalendarMobile {...mockProps} />);

            await waitFor(() => {
                expect(scrollIntoViewMock).toHaveBeenCalled();
            });
        });

        it('Should call JumpToDate on load', async () => {
            const { rerender } = render(<CalendarMobile {...mockProps} />);

            await waitFor(() => {
                expect(mockProps.refFpCalendar.current).not.toBeNull();
            });

            const instance = mockProps.refFpCalendar.current!.flatpickr;
            const spyJumpToDate = jest.spyOn(instance, 'jumpToDate');

            mockProps.currentDates = [];
            rerender(<CalendarMobile {...mockProps} />);

            await waitFor(() => {
                expect(spyJumpToDate).toHaveBeenCalled();
            });
        });

        it('Should call makeOverlayOnDisabledMonths initially', async () => {
            render(<CalendarMobile {...mockProps} />);

            await waitFor(() => {
                expect(makeOverlayOnDisabledMonths).toHaveBeenCalled();
            });
        });
    });
});
