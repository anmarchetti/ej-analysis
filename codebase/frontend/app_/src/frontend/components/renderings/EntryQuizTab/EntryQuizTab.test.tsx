import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import EntryQuizTab, { TEntryQuizTabProps } from 'frontend/components/renderings/EntryQuizTab/EntryQuizTab';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/inspireMeQuiz.utils');
jest.mock('frontend/utils/tracking/tracking.utils');

const mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: ({ field }) => <div data-tid='background-image'>{field.value.src}</div>,
}));

const createProps = (): TEntryQuizTabProps => ({
    fields: {
        TrackingItemName: mockSitecoreField('TrackingItemName'),
        BackgroundImage: [
            {
                fields: {
                    Image: mockSitecoreField(mockSitecoreImageField('src-1')),
                },
                id: '1',
            },
            {
                fields: {
                    Image: mockSitecoreField(mockSitecoreImageField('src-2')),
                },
                id: '2',
            },
        ],
        Description: mockSitecoreField('Description'),
        StartQuizCTAText: mockSitecoreField('StartQuizCTAText'),
        StartNewQuizCTAText: mockSitecoreField('StartNewQuizCTAText'),
        EditQuizCTAText: mockSitecoreField('EditQuizCTAText'),
        Title: mockSitecoreField('Title'),
    },
    params: {},
    rendering: {
        componentName: StaticQuestionTitle.StartScreen,
    },
});

let mockProps;
let mockStores;

describe('EntryQuizTab', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                clearAnswers: jest.fn(),
                goToNextQuestion: jest.fn(),
                isQuizFinishedBefore: false,
            },
        });

        jest.mocked(getQuizEventsCoreParamsOverride).mockReturnValue({});
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should render content', () => {
        render(<EntryQuizTab {...mockProps} />);

        expect(screen.queryByText(mockProps.fields.StartNewQuizCTAText.value)).not.toBeInTheDocument();
        expect(screen.queryByText(mockProps.fields.EditQuizCTAText.value)).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.StartQuizCTAText.value)).toBeInTheDocument();
        expect(screen.getByTestId('entry-quiz-tab-content')).toBeInTheDocument();
        expect(screen.getByTestId('entry-quiz-tab-description')).toHaveTextContent(mockProps.fields.Description.value);
        expect(screen.getByTestId('entry-quiz-tab-title')).toHaveTextContent(mockProps.fields.Title.value);
        expect(screen.getAllByTestId('background-image').length).toBe(mockProps.fields.BackgroundImage.length);
        expect(screen.getByTestId('entry-quiz-tab')).toBeInTheDocument();
        expect(screen.getByTestId('entry-quiz-tab-background')).toBeInTheDocument();
    });

    it('should render StartNewQuizCTAText and EditQuizCTAText if quiz was finished before', () => {
        mockStores.inspireMeStore.isQuizFinishedBefore = true;

        render(<EntryQuizTab {...mockProps} />);

        expect(screen.queryByText(mockProps.fields.StartQuizCTAText.value)).not.toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.StartNewQuizCTAText.value)).toBeInTheDocument();
        expect(screen.getByText(mockProps.fields.EditQuizCTAText.value)).toBeInTheDocument();
    });

    it('should call go to next question and trackEventWithParams after click on StartQuizCTAText', () => {
        render(<EntryQuizTab {...mockProps} />);

        fireEvent.click(screen.getByText(mockProps.fields.StartQuizCTAText.value));

        expect(generateGenericValues).toHaveBeenCalledWith({
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: EventLabels.Start,
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
        expect(mockStores.inspireMeStore.goToNextQuestion).toHaveBeenCalledWith(true);
    });

    it('should call go to next question and trackEventWithParams after click on EditQuizCTAText', () => {
        mockStores.inspireMeStore.isQuizFinishedBefore = true;

        render(<EntryQuizTab {...mockProps} />);

        fireEvent.click(screen.getByText(mockProps.fields.EditQuizCTAText.value));

        expect(generateGenericValues).toHaveBeenCalledWith({
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: EventLabels.EditYourAnswers,
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
        expect(mockStores.inspireMeStore.goToNextQuestion).toHaveBeenCalledWith(true);
    });

    it('should call go to next question, trackEventWithParams and clear answers after click on StartNewQuizCTAText', () => {
        mockStores.inspireMeStore.isQuizFinishedBefore = true;
        render(<EntryQuizTab {...mockProps} />);

        fireEvent.click(screen.getByText(mockProps.fields.StartNewQuizCTAText.value));

        expect(generateGenericValues).toHaveBeenCalledWith({
            destinationUrl: null,
        });
        expect(getQuizEventsCoreParamsOverride).toHaveBeenCalledWith(mockProps.fields);
        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: EventLabels.StartNewQuiz,
                eventType: EventTypes.Interaction,
            },
            expect.any(Object),
            undefined,
            undefined,
            expect.any(Object),
        );
        expect(mockStores.inspireMeStore.goToNextQuestion).toHaveBeenCalledWith(true);
        expect(mockStores.inspireMeStore.clearAnswers).toHaveBeenCalled();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<EntryQuizTab {...mockProps} />);
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
