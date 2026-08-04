import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';

import DatePickerSubTab, { IDatePickerSubTabProps } from './DatePickerSubTab';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockNextMonthDate = minDate => dayjs(minDate).add(1, 'month');
const mockDatePickerComponent = jest.fn();
jest.mock('frontend/components/common/DatePickerComponent/DatePickerComponent', () => props => {
    mockDatePickerComponent(props);

    return (
        <div data-tid='date-picker-component'>
            <button
                onClick={() => props.onChangeShownDates(mockNextMonthDate(props.minDate))}
                data-tid='show-next-month'
            >
                Show next month
            </button>
            <button onClick={() => props.onChange([new Date('2024-10-08'), null])}>2024-10-08</button>
            <button onClick={() => props.onChange([new Date('2024-10-08'), new Date('2024-10-09')])}>2024-10-09</button>
        </div>
    );
});

const mockFlexibilityPillsComponent = jest.fn();
jest.mock('frontend/components/common/Pills/FlexibilityPills/FlexibilityPills', () => ({
    __esModule: true,
    default: ({ onChange, ...props }) => {
        mockFlexibilityPillsComponent(props);

        return (
            <div data-tid='flexibility-pills'>
                <button onClick={() => onChange(2)}>onChange</button>
            </div>
        );
    },
}));

const createProps = (): IDatePickerSubTabProps => ({
    Subtitle: mockSitecoreField('Subtitle'),
    ChangeMonthCTA: mockSitecoreField('ChangeMonthCTA'),
    FlexibleDatesLabel: mockSitecoreField('FlexibleDatesLabel'),
    selectedDates: [undefined, undefined],
    setSelectedDates: jest.fn(),
    flexibleDays: 0,
    setFlexibleDays: jest.fn(),
    nightLabel: '1 night selected',
    IsCROVariant: undefined,
});

let mockProps;
let mockStores;

describe('DatePickerSubTab', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                availableDates: [
                    {
                        date: '2024-10-08',
                        in: true,
                        out: true,
                    },
                ],
                loadAvailableDates: jest.fn(),
                isAvailableDatesLoading: false,
                firstAvailableDate: '2024-10-08',
                lastAvailableDate: '2025-10-08',
                setAnswer: jest.fn(),
            },
        });
    });

    it('should not render component when no firstAvailableDate', () => {
        mockStores.inspireMeStore.firstAvailableDate = undefined;
        const { container } = render(<DatePickerSubTab {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should not render component when no lastAvailableDate', () => {
        mockStores.inspireMeStore.lastAvailableDate = undefined;
        const { container } = render(<DatePickerSubTab {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render standard', () => {
        render(<DatePickerSubTab {...mockProps} />);

        expect(screen.getByTestId('inspire-me-date-picker')).toHaveClass('datePickerContent');
        expect(screen.getByTestId('flexible-dates-label')).toHaveTextContent(mockProps.FlexibleDatesLabel.value);
        expect(screen.getByTestId('flexibility-pills')).toBeInTheDocument();
        expect(screen.getByTestId('inspire-me-date-picker-subtitle')).toHaveTextContent(mockProps.Subtitle.value);
        expect(screen.getByTestId('date-picker-component')).toBeInTheDocument();
        expect(screen.getByTestId('inspire-me-date-picker-nights-count')).toHaveTextContent(mockProps.nightLabel);
    });

    it('should pass accessibility', async () => {
        const { container } = render(<DatePickerSubTab {...mockProps} />);

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    describe('excludedDates prop', () => {
        beforeEach(() => {
            mockStores.inspireMeStore.availableDates = [
                {
                    date: '2024-10-08',
                    in: true,
                    out: true,
                },
                {
                    date: '2024-10-09',
                    in: false,
                    out: true,
                },
                {
                    date: '2024-10-10',
                    in: true,
                    out: false,
                },
                {
                    date: '2024-10-11',
                    in: false,
                    out: false,
                },
            ];
        });

        it('should exclude departure dates on first render when both dates are not selected', () => {
            render(<DatePickerSubTab {...mockProps} />);

            expect(mockDatePickerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    excludedDates: [new Date('2024-10-10'), new Date('2024-10-11')],
                }),
            );
        });

        it('should exclude arrival dates when fist date is picked up', () => {
            mockProps.selectedDates = [new Date('2024-10-08'), null];
            render(<DatePickerSubTab {...mockProps} />);

            expect(mockDatePickerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    excludedDates: [new Date('2024-10-09'), new Date('2024-10-11')],
                }),
            );
        });

        it('should exclude departure dates when both date is picked up', () => {
            mockProps.selectedDates = [new Date('2024-10-08'), new Date('2024-10-09')];
            render(<DatePickerSubTab {...mockProps} />);

            expect(mockDatePickerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    excludedDates: [new Date('2024-10-10'), new Date('2024-10-11')],
                }),
            );
        });

        it('should pass empty array when fist date is picked up and no dates to exclude', () => {
            mockProps.selectedDates = [new Date('2024-10-08'), null];
            mockStores.inspireMeStore.availableDates = [
                {
                    date: '2024-10-08',
                    in: true,
                    out: true,
                },
            ];
            render(<DatePickerSubTab {...mockProps} />);

            expect(mockDatePickerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    excludedDates: [],
                }),
            );
        });

        it('should pass empty array  when both date is picked up and no dates to exclude', () => {
            mockProps.selectedDates = [new Date('2024-10-08'), new Date('2024-10-09')];
            mockStores.inspireMeStore.availableDates = [
                {
                    date: '2024-10-08',
                    in: true,
                    out: true,
                },
            ];
            render(<DatePickerSubTab {...mockProps} />);

            expect(mockDatePickerComponent).toHaveBeenCalledWith(
                expect.objectContaining({
                    excludedDates: [],
                }),
            );
        });
    });

    describe('load available dates', () => {
        it('should load available dates when user change month', () => {
            render(<DatePickerSubTab {...mockProps} />);

            fireEvent.click(screen.getByTestId('show-next-month'));

            expect(mockStores.inspireMeStore.loadAvailableDates).toHaveBeenCalledWith(dayjs('2024-11-08'), undefined);
        });
    });

    describe('onChange flexibility pill', () => {
        it('should call setFlexibleDays and setAnswer when onChange triggers', () => {
            render(<DatePickerSubTab {...mockProps} />);

            fireEvent.click(within(screen.getByTestId('flexibility-pills')).getByRole('button', { name: 'onChange' }));

            expect(mockProps.setFlexibleDays).toHaveBeenCalled();
            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(null);
        });

        it('should call setAnswer with selected dates when onChange triggers and dates are selected', () => {
            mockProps.selectedDates = [new Date('2024-10-08'), new Date('2024-10-09')];
            render(<DatePickerSubTab {...mockProps} />);

            fireEvent.click(within(screen.getByTestId('flexibility-pills')).getByRole('button', { name: 'onChange' }));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith({
                from: new Date('2024-10-08'),
                to: new Date('2024-10-09'),
                flexibleDays: 2,
            });
        });
    });

    it('should pass selected answer', async () => {
        render(<DatePickerSubTab {...mockProps} />);

        await userEvent.click(screen.getByText('2024-10-09'));

        expect(mockProps.setSelectedDates).toHaveBeenCalledWith([new Date('2024-10-08'), new Date('2024-10-09')]);
        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith({
            from: new Date('2024-10-08'),
            to: new Date('2024-10-09'),
            flexibleDays: mockProps.flexibleDays,
        });
    });

    it('should call setAnswer with null when only one date is picked up', async () => {
        render(<DatePickerSubTab {...mockProps} />);

        await userEvent.click(screen.getByText('2024-10-08'));

        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(null);
    });
});
