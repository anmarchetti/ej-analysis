import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { DynamicQuestionTitle } from 'models/enum/InspireMeQuiz';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';

import DatePickerTab, { TDatePickerProps } from './DatePickerTab';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockDatePickerSubTabProps = jest.fn();
jest.mock('./components/DatePickerSubTab/DatePickerSubTab', () => props => {
    mockDatePickerSubTabProps(props);

    return (
        <div data-tid='date-picker-sub-tab'>
            <button onClick={() => props.setSelectedDates([new Date('2024-10-08'), null])}>2024-10-08</button>
            <button onClick={() => props.setSelectedDates([new Date('2024-10-08'), new Date('2024-10-09')])}>
                2024-10-09
            </button>
        </div>
    );
});

const mockSeptember = dayjs('2024-09-01');
const mockOctober = dayjs('2024-10-01');
const mockMonthPickerSubTabProps = jest.fn();
jest.mock('./components/MonthPickerSubTab/MonthPickerSubTab', () => props => {
    mockMonthPickerSubTabProps(props);

    return (
        <div data-tid='month-picker-sub-tab'>
            <button onClick={() => props.setSelectedMonths([mockSeptember, mockOctober])}>September - October</button>
        </div>
    );
});

jest.mock('frontend/utils/tracking/inspireMeQuiz.utils', () => ({
    ...jest.requireActual('frontend/utils/tracking/inspireMeQuiz.utils'),
    getQuizEventsCoreParamsOverride: jest.fn(),
}));

jest.mock('frontend/utils/tracking/tracking.utils');

const mockHeightAnimatedContainerProps = jest.fn();
jest.mock('frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer', () => ({
    __esModule: true,
    default: ({ children, ...props }) => {
        mockHeightAnimatedContainerProps(props);

        return <div data-tid='height-animated-container'>{children}</div>;
    },
}));

jest.mock('frontend/utils/date.utils', () => ({
    ...jest.requireActual('frontend/utils/date.utils'),
    getCountOfNightLabel: jest.fn(number => `${number} selected`),
}));

const createProps = (): TDatePickerProps => ({
    fields: {
        QuestionTitle: mockSitecoreField('QuestionTitle'),
        TrackingItemName: mockSitecoreField('TrackingItemName'),
        Subtitle: mockSitecoreField('Subtitle'),
        ChangeMonthCTA: mockSitecoreField('ChangeMonthCTA'),
        MonthPickerSubtitle: mockSitecoreField('MonthPickerSubtitle'),
        MonthPickerTitle: mockSitecoreField('MonthPickerTitle'),
        FlexibleDatesLabel: mockSitecoreField('FlexibleDatesLabel'),
        DatePickerTabLabel: mockSitecoreField('DatePickerTabLabel'),
        MonthPickerTabLabel: mockSitecoreField('MonthPickerTabLabel'),
    },
    params: { IsCROVariant: undefined },
    rendering: {
        componentName: DynamicQuestionTitle.DatePicker,
    },
});

let mockProps;
let mockStores;

describe('DatePickerTab', () => {
    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-06-13'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                goToNextQuestion: jest.fn(),
                goToPrevQuestion: jest.fn(),
                getAnswersForActiveTab: jest.fn(),
                availableQuizAnswers: {},
                setAnswer: jest.fn(),
            },
            trackingStore: {
                trackEventWithParams: jest.fn(),
            },
        });

        jest.mocked(getQuizEventsCoreParamsOverride).mockReturnValue({});
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should NOT render component when no fields', () => {
        mockProps.fields = undefined;
        const { container } = render(<DatePickerTab {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render content', () => {
        render(<DatePickerTab {...mockProps} />);

        expect(screen.getByTestId('inspire-me-date-picker-tab')).toBeInTheDocument();
        expect(screen.getByTestId('inspire-me-date-picker-tab-content')).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.QuestionTitle.value)).toBeInTheDocument();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<DatePickerTab {...mockProps} />);
        // aXe core does not work when timers are mocked. It's recommended in documentation renabling the timers temporarily for aXe.
        jest.useRealTimers();
        const results = await axe(container);
        jest.useFakeTimers().setSystemTime(new Date('2023-06-13'));

        expect(results).toHaveNoViolations();
    });

    describe('DatePickerSubComponent', () => {
        it('should render DatePickerSubComponent', () => {
            render(<DatePickerTab {...mockProps} />);
            fireEvent.click(screen.getByTestId('toggle-date-picker'));

            expect(mockDatePickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedDates: [undefined, undefined],
                }),
            );
        });

        it('should preselect dates and flexible option from store when they exist', () => {
            const from = new Date('2024-10-12');
            const to = new Date('2024-10-13');
            const flexibleDays = 2;
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce({
                from,
                to,
                flexibleDays,
            });
            render(<DatePickerTab {...mockProps} />);
            fireEvent.click(screen.getByTestId('toggle-date-picker'));

            expect(mockDatePickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedDates: [from, to],
                    flexibleDays,
                }),
            );
        });

        it('should call trackEventWithParams and goToNextQuestion after click on next question button when dates picked up', async () => {
            render(<DatePickerTab {...mockProps} />);

            fireEvent.click(screen.getByTestId('toggle-date-picker'));
            fireEvent.click(screen.getByText('2024-10-09'));
            fireEvent.click(screen.getByTestId('quiz-next-question'));
            await jest.runAllTimersAsync();

            expect(generateGenericValues).toHaveBeenCalledWith({
                genericValue1: '2024-10-08',
                genericValue2: '2024-10-09',
                genericValue3: '+/- 0 Day',
                destinationUrl: null,
            });
            expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.InspireMe,
                    eventAction: EventActions.Continue,
                    eventLabel: mockProps.rendering.componentName,
                    eventType: EventTypes.Interaction,
                },
                expect.any(Object),
                undefined,
                undefined,
                expect.any(Object),
            );
            expect(mockStores.inspireMeStore.goToNextQuestion).toHaveBeenCalled();
        });

        it('should NOT call trackEventWithParams and goToNextQuestion when bot dates are not picked up', () => {
            render(<DatePickerTab {...mockProps} />);

            fireEvent.click(screen.getByTestId('toggle-date-picker'));
            fireEvent.click(screen.getByText('2024-10-08'));
            fireEvent.click(screen.getByTestId('quiz-next-question'));

            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
            expect(mockStores.inspireMeStore.goToNextQuestion).not.toHaveBeenCalled();
        });
    });

    describe('MonthPickerSubComponent', () => {
        it('should render MonthPickerSubComponent', () => {
            render(<DatePickerTab {...mockProps} />);

            expect(mockMonthPickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedMonths: [],
                }),
            );
        });

        it('should preselect months from store when they exist and available', () => {
            mockStores.inspireMeStore.availableQuizAnswers.availableMonths = [9];
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValue({
                months: [mockSeptember],
            });
            render(<DatePickerTab {...mockProps} />);

            expect(mockMonthPickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedMonths: [mockSeptember],
                }),
            );
        });

        it('should NOT preselect months from store when they exist but not available', () => {
            mockStores.inspireMeStore.availableQuizAnswers.availableMonths = [8];
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValue({
                months: [mockSeptember],
            });
            render(<DatePickerTab {...mockProps} />);

            expect(mockMonthPickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    selectedMonths: [],
                }),
            );
        });

        it('should call trackEventWithParams and goToNextQuestion after click on next question button when month is picked up', async () => {
            render(<DatePickerTab {...mockProps} />);

            fireEvent.click(screen.getByText('September - October'));
            fireEvent.click(screen.getByTestId('quiz-next-question'));
            await jest.runAllTimersAsync();

            expect(generateGenericValues).toHaveBeenCalledWith({
                genericValue1: null,
                genericValue2: 'September 2024|October 2024',
                genericValue3: null,
                destinationUrl: null,
            });
            expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.InspireMe,
                    eventAction: EventActions.Continue,
                    eventLabel: mockProps.rendering.componentName,
                    eventType: EventTypes.Interaction,
                },
                expect.any(Object),
                undefined,
                undefined,
                expect.any(Object),
            );
            expect(mockStores.inspireMeStore.goToNextQuestion).toHaveBeenCalled();
        });

        it('should NOT call trackEventWithParams and goToNextQuestion when month is not picked up', () => {
            render(<DatePickerTab {...mockProps} />);

            expect(mockStores.trackingStore.trackEventWithParams).not.toHaveBeenCalled();
            expect(mockStores.inspireMeStore.goToNextQuestion).not.toHaveBeenCalled();
        });
    });

    it('should call trackEventWithParams, goToPrevQuestion after click', async () => {
        render(<DatePickerTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-prev-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: null,
            genericValue2: null,
            genericValue3: null,
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Back,
                eventLabel: mockProps.rendering.componentName,
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
        expect(mockStores.inspireMeStore.goToPrevQuestion).toHaveBeenCalledWith();
    });

    it('should switch between month and date picker', () => {
        render(<DatePickerTab {...mockProps} />);

        expect(screen.getByTestId('month-picker-sub-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('date-picker-sub-tab')).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('toggle-date-picker'));
        expect(screen.getByTestId('date-picker-sub-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('month-picker-sub-tab')).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('toggle-month-picker'));
        expect(screen.getByTestId('month-picker-sub-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('date-picker-sub-tab')).not.toBeInTheDocument();
    });

    describe('preselect picker', () => {
        it('should preselect date picker when dates were answered previously', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValue({
                from: new Date('2024-10-12'),
                to: new Date('2024-10-13'),
            });
            render(<DatePickerTab {...mockProps} />);

            expect(screen.getByTestId('date-picker-sub-tab')).toBeInTheDocument();
        });

        it('should preselect month picker when month was answered previously', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValue({
                month: [mockSeptember],
            });
            render(<DatePickerTab {...mockProps} />);

            expect(screen.getByTestId('month-picker-sub-tab')).toBeInTheDocument();
        });
    });

    it('should remove answer from store after changing subtab', () => {
        render(<DatePickerTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('toggle-date-picker'));
        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(null);
        fireEvent.click(screen.getByTestId('toggle-month-picker'));
        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(null);
    });

    describe('selected night', () => {
        it('should pass selected night label to DatePickerSubTab', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce({
                from: new Date('2024-10-12'),
                to: new Date('2024-10-13'),
                flexibleDays: 2,
            });
            render(<DatePickerTab {...mockProps} />);

            expect(mockDatePickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    nightLabel: '1 selected',
                }),
            );
        });

        it('should render selected night label', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce({
                from: new Date('2024-10-12'),
                to: new Date('2024-10-13'),
                flexibleDays: 2,
            });
            render(<DatePickerTab {...mockProps} />);

            expect(screen.getByText('1 selected')).toBeInTheDocument();
            expect(mockHeightAnimatedContainerProps).toHaveBeenCalledWith({ isOpened: true });
        });

        it('should NOT render selected night label when no dates selected', () => {
            render(<DatePickerTab {...mockProps} />);

            expect(screen.queryByText('1 night selected')).not.toBeInTheDocument();
            expect(mockHeightAnimatedContainerProps).toHaveBeenCalledWith({ isOpened: false });
        });

        it('should pre save prev selected label to show it while closing animation and update preselected value only when both dates are picked up', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce({
                from: new Date('2024-10-12'),
                to: new Date('2024-10-14'),
                flexibleDays: 2,
            });
            render(<DatePickerTab {...mockProps} />);

            expect(screen.getByText('2 selected')).toBeInTheDocument();
            expect(mockDatePickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    nightLabel: '2 selected',
                }),
            );

            fireEvent.click(screen.getByText('2024-10-08'));

            expect(mockDatePickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    nightLabel: '',
                }),
            );
            expect(screen.getByText('2 selected')).toBeInTheDocument();
            expect(mockHeightAnimatedContainerProps).toHaveBeenCalledWith({ isOpened: false });

            fireEvent.click(screen.getByText('2024-10-09'));

            expect(mockDatePickerSubTabProps).toHaveBeenCalledWith(
                expect.objectContaining({
                    nightLabel: '1 selected',
                }),
            );
            expect(screen.getByText('1 selected')).toBeInTheDocument();
            expect(mockHeightAnimatedContainerProps).toHaveBeenCalledWith({ isOpened: true });
        });
    });
});
