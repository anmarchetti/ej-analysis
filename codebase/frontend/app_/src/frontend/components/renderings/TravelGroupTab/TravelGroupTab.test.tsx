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
import TravelGroupTab, { TTravelGroupProps } from 'frontend/components/renderings/TravelGroupTab/TravelGroupTab';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/inspireMeQuiz.utils');
jest.mock('frontend/utils/tracking/tracking.utils');

jest.mock('frontend/components/icons-new/Tick', () => ({
    __esModule: true,
    default: () => <div data-tid='tick-icon' />,
}));

jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='jss-image' className={className} />,
}));

jest.mock('frontend/components/common/ImageWithFilter/ImageWithFilter', () => ({
    __esModule: true,
    default: ({ className }) => <div data-tid='image-with-filter' className={className} />,
    SVGFilterMatrix: {},
}));

jest.mock('frontend/components/common/RadioButton', () => ({
    __esModule: true,
    default: props => (
        <label data-tid={props.dataTid}>
            <input type='radio' onChange={props.onChange} data-tid='radio-button' />
            <div>{props.label}</div>
            <div>{props.children}</div>
        </label>
    ),
}));

jest.useFakeTimers();

const mockTravelGroupOptionNameValue = 'Name';
const createProps = (): TTravelGroupProps => ({
    fields: {
        QuestionTitle: mockSitecoreField('QuestionTitle'),
        TrackingItemName: mockSitecoreField('TrackingItemName'),
        TravelGroupQuestion: mockSitecoreField('TravelGroupQuestion'),
        TravelGroupOptions: [
            {
                id: '1',
                fields: {
                    Code: mockSitecoreField('Code'),
                    Icon: mockSitecoreField({ src: 'img' }),
                    Name: mockSitecoreField(mockTravelGroupOptionNameValue),
                    Description: mockSitecoreField(''),
                    Goal: {
                        id: '',
                    },
                },
            },
        ],
    },
    params: {},
    rendering: {
        componentName: DynamicQuestionTitle.TravelGroup,
    },
});

let mockProps;
let mockStores;

describe('TravelGroup', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                goToNextQuestion: jest.fn(),
                goToPrevQuestion: jest.fn(),
                getAnswersForActiveTab: jest.fn(() => 'TGSL'),
                setAnswer: jest.fn(),
                availableQuizAnswers: {
                    availableTags: ['Code'],
                },
            },
            trackingStore: {
                trackInspireMePageLoad: jest.fn(),
            },
        });

        jest.mocked(getQuizEventsCoreParamsOverride).mockReturnValue({});
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should render content', () => {
        render(<TravelGroupTab {...mockProps} />);

        expect(screen.getByText(mockProps.fields.QuestionTitle.value)).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.TravelGroupQuestion.value)).toBeInTheDocument();
        expect(screen.getByTestId('travel-group-item-name')).toHaveTextContent(mockTravelGroupOptionNameValue);
        expect(screen.getAllByTestId('group-card').length).toBe(mockProps.fields.TravelGroupOptions.length);
        expect(screen.getByTestId('travel-group-content')).toBeInTheDocument();
        expect(screen.getByTestId('travel-group-items-wrapper')).toBeInTheDocument();
    });

    it('should call trackEventWithParams when component did mount', () => {
        render(<TravelGroupTab {...mockProps} />);

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: mockProps.fields.TravelGroupOptions.map(item => item.fields.Code.value).join('|'),
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
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

    it('should call go to next question after click', async () => {
        mockStores.inspireMeStore.availableQuizAnswers.availableTags = ['TGSL'];
        render(<TravelGroupTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: 'TGSL',
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

    it('should filter previous answers by availability when user edit answers', () => {
        render(<TravelGroupTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));

        expect(mockStores.inspireMeStore.goToNextQuestion).not.toHaveBeenCalled();
    });

    it('should call setAnswer after select radio button', () => {
        mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn();
        render(<TravelGroupTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('radio-button'));
        expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith('Code');
    });

    it('should call trackEventWithParams and go to prev question after click', async () => {
        render(<TravelGroupTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-prev-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: null,
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

        expect(mockStores.inspireMeStore.goToPrevQuestion).toHaveBeenCalled();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<TravelGroupTab {...mockProps} />);
        // aXe core does not work when timers are mocked. It's recommended in documentation renabling the timers temporarily for aXe.
        jest.useRealTimers();
        const results = await axe(container);
        jest.useFakeTimers().setSystemTime(new Date('2023-06-13'));

        expect(results).toHaveNoViolations();
    });

    it('should add tick icon to selected radio button', () => {
        render(<TravelGroupTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('radio-button'));

        expect(screen.getByTestId('tick-icon')).toBeInTheDocument();
    });

    it('should render regular and hover icons', () => {
        render(<TravelGroupTab {...mockProps} />);

        const regularIcons = screen.getAllByTestId('image-with-filter');
        const hoverIcons = screen.getAllByTestId('jss-image');

        expect(regularIcons.length).toBe(1);
        expect(regularIcons[0]).toHaveClass('icon');

        expect(hoverIcons.length).toBe(1);
        expect(hoverIcons[0]).toHaveClass('hoverIcon');
    });

    /*it('should render only available answer options', () => {
        mockStores.inspireMeStore.availableQuizAnswers.availableTags = ['Code1'];
        render(<TravelGroupTab {...mockProps} />);

        expect(screen.queryByTestId('travel-group-item-name')).not.toBeInTheDocument();
    });*/

    it('should render all options if availableTags is empty', () => {
        mockStores.inspireMeStore.availableQuizAnswers.availableTags = [];
        render(<TravelGroupTab {...mockProps} />);

        expect(screen.getByTestId('travel-group-item-name')).toHaveTextContent(mockTravelGroupOptionNameValue);
    });
});
