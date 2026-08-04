import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { DynamicQuestionTitle } from 'models/enum/InspireMeQuiz';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import DepartureAirport, {
    TDepartureAirportProps,
} from 'frontend/components/renderings/DepartureAirport/DepartureAirport';
import * as departureMocks from 'frontend/components/renderings/DepartureAirport/DepartureAirport.utils';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/inspireMeQuiz.utils');
jest.mock('frontend/utils/tracking/tracking.utils');

jest.mock('./components/DepartureAirportPill/DepartureAirportPill', () => ({
    __esModule: true,
    default: ({ name, onClick }) => <div data-tid={name} onClick={() => onClick(name)} />,
}));

const mockAirportCheckboxColumnsProps = jest.fn();
jest.mock('frontend/components/common/AirportCheckboxColumns/AirportCheckboxColumns', () => props => {
    mockAirportCheckboxColumnsProps(props);

    return (
        <div>
            <div
                data-tid='group-of-airports'
                onClick={() => {
                    const groupCodes = ['LLL', 'TTT'];
                    const isAllFromGroupAreChecked = groupCodes.every(code => props.origins.includes(code));
                    const restCodes = props.origins.filter(code => !groupCodes.includes(code));

                    props.setOrigins(isAllFromGroupAreChecked ? restCodes : groupCodes);
                }}
            />
            <div data-tid='checked-airport' onClick={() => props.onRemoveOrigin('LLL')} />
            <div data-tid='unchecked-airport' onClick={() => props.onAddOrigin('TTT')} />
        </div>
    );
});

jest.mock('frontend/components/common/ValidatableField/ValidatableField', () => ({
    __esModule: true,
    default: ({ onChange, id, label }) => (
        <label>
            {label}
            <input data-tid={id} onChange={e => onChange(e.target.value)} type='text' />
        </label>
    ),
}));

jest.mock('frontend/utils/airports.utils', () => ({
    getAirportByCode: jest.fn(code => ({ name: `${code}` })),
}));

const filteredAirports = [
    {
        airports: [
            {
                airports: [
                    {
                        code: 'LTN',
                        name: 'London Luton test',
                    },
                ],
                code: '',
                name: 'London',
            },
            {
                code: '',
                name: 'Belfast test',
            },
        ],
    },
];
jest.spyOn(departureMocks, 'filterAirports').mockImplementation(jest.fn().mockReturnValue(filteredAirports));

jest.useFakeTimers();

const createProps = (): TDepartureAirportProps => ({
    fields: {
        airportsGroups: [],
        data: {
            QuestionTitle: mockSitecoreField('QuestionTitle'),
            TrackingItemName: mockSitecoreField('TrackingItemName'),
            PickYourAirportLabel: mockSitecoreField('PickYouAirportLabel'),
        },
    },
    params: {},
    rendering: {
        componentName: DynamicQuestionTitle.DepartureAirport,
    },
});

let mockProps;
let mockStores;

describe('DepartureAirport', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                goToNextQuestion: jest.fn(),
                goToPrevQuestion: jest.fn(),
                getAnswersForActiveTab: jest.fn(() => ['WWW']),
                setAnswer: jest.fn(),
                firstAvailableDate: '2024-01-01',
                clearAvailabilityData: jest.fn(),
            },
            trackingStore: {
                trackInspireMePageLoad: jest.fn(),
            },
        });

        jest.mocked(getQuizEventsCoreParamsOverride).mockReturnValue({});
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should render content', () => {
        render(<DepartureAirport {...mockProps} />);

        expect(screen.getByText(mockProps.fields.data.QuestionTitle.value)).toBeInTheDocument();
        expect(mockAirportCheckboxColumnsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                countries: mockProps.fields.airportsGroups,
            }),
        );
    });

    it('should call trackEventWithParams when component did mount', () => {
        render(<DepartureAirport {...mockProps} />);

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: '',
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields.data);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Impressions,
                eventLabel: mockProps.rendering.componentName,
                eventType: EventTypes.NonInteraction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
    });

    it('should call AirportCheckboxColumns with empty array when there is no questions data in props', () => {
        mockProps.fields.airportsGroups = undefined;
        render(<DepartureAirport {...mockProps} />);

        expect(mockAirportCheckboxColumnsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                countries: [],
            }),
        );
    });

    it('should call trackEventWithParams and go to next question to store after click', async () => {
        render(<DepartureAirport {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: 'WWW',
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields.data);
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
        expect(mockStores.inspireMeStore.goToNextQuestion).toBeCalledWith();
    });

    it('should call trackEventWithParams and go to prev question after click', async () => {
        render(<DepartureAirport {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-prev-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: null,
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields.data);
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
        expect(mockStores.inspireMeStore.goToPrevQuestion).toBeCalledWith();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<DepartureAirport {...mockProps} />);
        // aXe core does not work when timers are mocked. It's recommended in documentation renabling the timers temporarily for aXe.
        jest.useRealTimers();
        const results = await axe(container);
        jest.useFakeTimers().setSystemTime(new Date('2023-06-13'));

        expect(results).toHaveNoViolations();
    });

    describe('adding and removing answer', () => {
        it('should add to answer group of checked airports with prev answer', () => {
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('group-of-airports'));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(['WWW', 'LLL', 'TTT']);
        });

        it('should add to answer group of checked airports WITHOUT prev answer', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn(() => undefined);
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('group-of-airports'));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(['LLL', 'TTT']);
        });

        it('should remove from answer group of checked again airports ', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn(() => ['LLL', 'TTT', 'WWW']);
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('group-of-airports'));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(['WWW']);
        });

        it('should add all airports from group when at least one of the airports from the group is already checked', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn(() => ['LLL', 'WWW']);
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('group-of-airports'));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(['LLL', 'WWW', 'TTT']);
        });

        it('should add to answer checked airport with prev answer', () => {
            render(<DepartureAirport {...mockProps} />);

            // pill
            expect(screen.queryByTestId('TTT')).not.toBeInTheDocument();

            fireEvent.click(screen.getByTestId('unchecked-airport'));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(['WWW', 'TTT']);

            expect(screen.getByTestId('TTT')).toBeInTheDocument();
        });

        it('should remove from answer unchecked airport', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn(() => ['LLL', 'WWW']);
            render(<DepartureAirport {...mockProps} />);

            // pill
            expect(screen.getByTestId('LLL')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('checked-airport'));

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(['WWW']);

            expect(screen.queryByTestId('LLL')).not.toBeInTheDocument();
        });

        it('should call setAnswer with null when there is no selected airports', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn(() => ['LLL']);
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('checked-airport'));
            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith(null);
        });

        it('should remove airport by click on pill', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn(() => ['LLL', 'WWW']);
            render(<DepartureAirport {...mockProps} />);

            expect(screen.getByTestId('LLL')).toBeInTheDocument();

            // pill
            fireEvent.click(screen.getByTestId('LLL'));

            expect(screen.queryByTestId('LLL')).not.toBeInTheDocument();
        });

        it('should call clearAvailabilityData when user change answer and firstAvailableDate exist', () => {
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('group-of-airports'));

            expect(mockStores.inspireMeStore.clearAvailabilityData).toHaveBeenCalled();
        });

        it('should not call clearAvailabilityData when user change answer and firstAvailableDate does not exist', () => {
            mockStores.inspireMeStore.firstAvailableDate = null;
            render(<DepartureAirport {...mockProps} />);

            fireEvent.click(screen.getByTestId('group-of-airports'));

            expect(mockStores.inspireMeStore.clearAvailabilityData).not.toHaveBeenCalled();
        });
    });

    it('should call filterAirports when user input more then 3 letters in from field', () => {
        render(<DepartureAirport {...mockProps} />);

        fireEvent.input(screen.getByTestId('inspire-me-departure-airport'), { target: { value: 'London' } });

        expect(departureMocks.filterAirports).toHaveBeenCalled();
        expect(mockAirportCheckboxColumnsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                countries: filteredAirports,
            }),
        );
    });

    it('should NOT call filterAirports when user input less then 3 letters in from field and use initially questions', () => {
        render(<DepartureAirport {...mockProps} />);

        fireEvent.input(screen.getByTestId('inspire-me-departure-airport'), { target: { value: 'Lo' } });

        expect(departureMocks.filterAirports).not.toHaveBeenCalled();
        expect(mockAirportCheckboxColumnsProps).toHaveBeenCalledWith(
            expect.objectContaining({
                countries: mockProps.fields.airportsGroups,
            }),
        );
    });
});
