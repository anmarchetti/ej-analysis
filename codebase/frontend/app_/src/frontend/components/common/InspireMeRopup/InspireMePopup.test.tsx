import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { IDatePickerTabAnswers, ITabDataWithGenericType, TQuizTabData } from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle } from 'models/enum/InspireMeQuiz';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import { ThemeQuestions, TThemeAnswers } from 'frontend/components/renderings/HolidayThemeTab/interfaces';

import InspireMePopup, { SwipeDirection } from './InspireMePopup';

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockEventData = {
    event: {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
    },
    dir: SwipeDirection.Down,
    deltaY: -100,
    absY: 100,
};
jest.mock('react-swipeable', () => ({
    __esModule: true,
    Swipeable: ({ children, ...props }) => (
        <div
            data-tid='react-swipeable-zone'
            onMouseUp={() => props.onSwiped(mockEventData)}
            onMouseMove={() => props.onSwiping(mockEventData)}
        >
            {children}
        </div>
    ),
}));

jest.mock('frontend/components/common/Popup', () => ({
    __esModule: true,
    Popup: ({ children, footerContent }) => (
        <div data-tid='popup'>
            <div data-tid='popup-children'>{children}</div>
            <div data-tid='popup-footer-content'>{footerContent}</div>
        </div>
    ),
}));

jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: ({ children, onClick, dataTid }) => (
        <button onClick={onClick} data-tid={dataTid}>
            {children}
        </button>
    ),
}));

const mockJSSImage = jest.fn();
jest.mock('frontend/components/common/JSSImage', () => ({
    __esModule: true,
    default: props => {
        mockJSSImage(props);

        return <div data-tid='jss-image' />;
    },
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const mockedQuizAnswers: TQuizTabData[] = [
    {
        answer: ['departure'],
        isShownOnProgressBar: true,
        title: DynamicQuestionTitle.DepartureAirport,
        progressBarTitle: '',
    } as ITabDataWithGenericType<string[]>,
    {
        answer: {
            flexibleDays: undefined,
            months: [dayjs('2024-06-01'), dayjs('2024-07-01')],
            from: undefined,
            to: undefined,
        },
        isShownOnProgressBar: true,
        title: DynamicQuestionTitle.DatePicker,
        progressBarTitle: '',
    } as ITabDataWithGenericType<IDatePickerTabAnswers>,
    {
        answer: {
            [ThemeQuestions.Type]: {
                answer: 'tags',
                goalId: '',
                isActive: true,
            },
            [ThemeQuestions.Vibe]: {
                answer: 'vibe',
                goalId: '',
                isActive: true,
            },
            [ThemeQuestions.Weather]: {
                answer: 'weather',
                goalId: '',
                isActive: true,
            },
        },
        isShownOnProgressBar: true,
        title: DynamicQuestionTitle.HolidayTheme,
        progressBarTitle: '',
    } as ITabDataWithGenericType<TThemeAnswers>,
    {
        answer: 'group',
        isShownOnProgressBar: true,
        title: DynamicQuestionTitle.TravelGroup,
        progressBarTitle: '',
    } as ITabDataWithGenericType<string>,
];

const createStores = () =>
    createMockStores({
        layoutStore: { isEditMode: false },
        inspireMeStore: {
            quizResults: [
                {
                    code: 'ESBA',
                    name: 'Barcelona',
                    description: 'description',
                    imageUrl: 'imageUrl',
                    url: 'url',
                },
            ],
            quizTabsData: mockedQuizAnswers,
            setQuizResult: jest.fn(),
        },
        routerStore: {
            redirectToHolidayInspirationPage: jest.fn(),
        },
        trackingStore: {
            trackEventWithParams: jest.fn(),
        },
    });

let mockStores;

describe('<InspireMePopup />', () => {
    beforeEach(() => {
        mockStores = createStores();
    });

    it('should not render destination popup when quizResults field is empty', () => {
        mockStores.inspireMeStore.quizResults = [];
        render(<InspireMePopup />);

        expect(screen.queryByTestId('inspire-me-popup-content')).not.toBeInTheDocument();
    });

    it('should render destination popup when quizResults field is not empty', () => {
        render(<InspireMePopup />);

        const quizResult = mockStores.inspireMeStore.quizResults[0];

        expect(screen.getByTestId('inspire-me-popup-content')).toBeInTheDocument();
        expect(screen.getByTestId('jss-image')).toBeInTheDocument();
        expect(mockJSSImage).toHaveBeenCalledWith({
            dataTid: 'inspire-me-popup-image',
            field: mockSitecoreField(mockSitecoreImageField(quizResult.imageUrl)),
            className: 'image',
        });
        expect(screen.getByTestId('inspire-me-popup-inner-content')).toBeInTheDocument();
        expect(screen.getByTestId('inspire-me-popup-title')).toHaveTextContent(
            SitecoreDictionary.InspireMePopupLabelsTitle,
        );
        expect(screen.getByTestId('inspire-me-popup-description')).toHaveTextContent(quizResult.description);
    });

    it('should call trackEventWithParams when component did mount', () => {
        render(<InspireMePopup />);

        const quizResult = mockStores.inspireMeStore.quizResults[0];

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Confirmation,
                eventLabel: quizResult.name,
                eventType: EventTypes.NonInteraction,
            },
            {
                genericValue1: 'departure',
                genericValue2: `group`,
                genericValue3: `tags|vibe|weather`,
                genericValue4: 'June 2024|July 2024|null',
                destinationUrl: null,
            },
        );
    });

    it('should call redirectToHolidayInspirationPage and call trackEventWithParams when click on repeat test button', () => {
        render(<InspireMePopup />);

        fireEvent.click(screen.getByTestId('inspire-me-popup-repeat-button'));

        expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: EventLabels.RepeatQuiz,
                eventType: EventTypes.Interaction,
            },
            {
                genericValue1: 'departure',
                genericValue2: `group`,
                genericValue3: `tags|vibe|weather`,
                genericValue4: 'June 2024|July 2024|null',
                destinationUrl: null,
            },
        );
        expect(mockStores.routerStore.redirectToHolidayInspirationPage).toHaveBeenCalled();
    });

    describe('Should clear QuizResult in store and call trackEventWithParams when click on view destination button', () => {
        it('should call trackEventWithParams with Months Picker answers', () => {
            render(<InspireMePopup />);

            expect(screen.getByTestId('inspire-me-popup-content')).toBeInTheDocument();

            fireEvent.click(screen.getByText(SitecoreDictionary.InspireMePopupButtonsViewDestination));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.InspireMe,
                    eventAction: EventActions.Quiz,
                    eventLabel: EventLabels.ViewDestination,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: 'departure',
                    genericValue2: `group`,
                    genericValue3: `tags|vibe|weather`,
                    genericValue4: 'June 2024|July 2024|null',
                    destinationUrl: null,
                },
            );
            expect(mockStores.inspireMeStore.setQuizResult).toHaveBeenCalledWith([]);
        });

        it('should call trackEventWithParams with Date Picker answers', () => {
            mockStores.inspireMeStore.quizTabsData[1].answer = {
                months: [],
                from: new Date('02.10.2024'),
                to: new Date('05.10.2024'),
                flexibleDays: 0,
            };
            render(<InspireMePopup />);

            expect(screen.getByTestId('inspire-me-popup-content')).toBeInTheDocument();

            fireEvent.click(screen.getByText(SitecoreDictionary.InspireMePopupButtonsViewDestination));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.InspireMe,
                    eventAction: EventActions.Quiz,
                    eventLabel: EventLabels.ViewDestination,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: 'departure',
                    genericValue2: `group`,
                    genericValue3: `tags|vibe|weather`,
                    genericValue4: '2024-02-10|2024-05-10|+/- 0 Day',
                    destinationUrl: null,
                },
            );
            expect(mockStores.inspireMeStore.setQuizResult).toHaveBeenCalledWith([]);
        });

        it('should clear QuizResult in store when click on repeat test', () => {
            render(<InspireMePopup />);

            fireEvent.click(screen.getByTestId('inspire-me-popup-repeat-button'));

            expect(mockStores.inspireMeStore.setQuizResult).toHaveBeenCalledWith([]);
        });
    });

    it('should close the popup when swiped down on mobile', () => {
        render(<InspireMePopup />);

        const swiper = screen.getByTestId('react-swipeable-zone');

        fireEvent.mouseMove(swiper);

        expect(screen.getByTestId('inspire-me-popup-content')).toHaveStyle(`transform: translateY(100px)`);

        fireEvent.mouseUp(swiper);

        expect(mockStores.inspireMeStore.setQuizResult).toHaveBeenCalledWith([]);
    });

    it('should not close the popup when swiped up on mobile', () => {
        mockEventData.dir = SwipeDirection.Up;
        mockEventData.deltaY = 100;
        render(<InspireMePopup />);

        const swiper = screen.getByTestId('react-swipeable-zone');

        fireEvent.mouseMove(swiper);

        expect(screen.getByTestId('inspire-me-popup-content')).toHaveStyle(`transform: translateY(0px)`);

        fireEvent.mouseUp(swiper);

        expect(mockStores.inspireMeStore.setQuizResult).not.toHaveBeenCalled();
    });

    it('should not close the popup when swiped not on mobile', () => {
        mockUseMobileViewport = false;
        render(<InspireMePopup />);

        const swiper = screen.getByTestId('react-swipeable-zone');

        fireEvent.mouseMove(swiper);
        fireEvent.mouseUp(swiper);

        expect(mockStores.inspireMeStore.setQuizResult).not.toHaveBeenCalled();
    });
});
