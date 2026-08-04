import React from 'react';
import { ComponentRendering } from '@sitecore-jss/sitecore-jss/layout';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';
import { THolidayInspirationProps, TQuizTabData } from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';

import { InspireMeTabs } from './InspireMeTabs';

expect.extend(toHaveNoViolations);

jest.mock('frontend/utils/ui.utils');

let mockSessionStorage: TQuizTabData[] | undefined = [];
jest.mock('frontend/utils/webStorage.utils', () => ({
    ...jest.requireActual('frontend/utils/webStorage.utils'),
    getWebStorageItem: () => mockSessionStorage,
}));

const mockQuestions = jest.fn();
jest.mock('frontend/components/renderings/InspireMeTabs/components/ProgressBar/ProgressBar', () => ({
    __esModule: true,
    default: ({ questions }) => {
        mockQuestions(questions);

        return <div data-tid='progress-bar' />;
    },
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

let mockGetInitialQuestions = {};
jest.mock('frontend/components/renderings/InspireMeTabs/utils/utils', () => ({
    getInitialQuestions: jest.fn(() => mockGetInitialQuestions),
}));

jest.mock('frontend/components/renderings/TravelGroupTab/TravelGroupTab', () => ({
    __esModule: true,
    default: () => <div data-tid='travel-group' />,
}));

let mockUseMobileViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMobileViewport: () => mockUseMobileViewport,
}));

const createMockProps = (): THolidayInspirationProps => ({
    //mock data can be provided as jest can't render it as sitecore
    QuestionsData: [],
    fields: {
        ProgressSubtitle: mockSitecoreField('Your progress'),
        ProgressTitle: mockSitecoreField("Let's find your perfect getaway"),
    },
    name: '',
    rendering: {
        componentName: 'Inspire Me Tabs',
        placeholders: {
            [PlaceholderNames.InspireMeTabs]: [],
        },
    } as ComponentRendering,
    params: {},
});

let mockProps;
let mockStores;

describe('InspireMeTabs Component', () => {
    beforeEach(() => {
        mockProps = createMockProps();
        mockStores = createMockStores({
            inspireMeStore: {
                setTabsData: jest.fn(),
                questions: [],
                activeQuestionIndex: 0,
                setTabsSitecoreData: jest.fn(),
                setActiveStaticTabByTitle: jest.fn(),
                normalizeQuizTabsData: jest.fn(data => data),
            },
            trackingStore: {
                trackInspireMePageLoad: jest.fn(),
            },
        });
    });

    it('should use initial questions data when quiz starts from scratch', () => {
        const initialQuestions: TQuizTabData[] = [
            {
                title: StaticQuestionTitle.StartScreen,
                answer: null,
                isShownOnProgressBar: false,
            },
            {
                title: DynamicQuestionTitle.DepartureAirport,
                answer: null,
                isShownOnProgressBar: true,
            },
        ];

        mockGetInitialQuestions = initialQuestions;
        render(<InspireMeTabs {...mockProps} />);

        expect(mockStores.inspireMeStore.setTabsData).toHaveBeenCalledWith(initialQuestions);
        expect(mockStores.inspireMeStore.setActiveStaticTabByTitle).toHaveBeenCalledWith(
            StaticQuestionTitle.StartScreen,
        );
    });

    it('should reset active static tab on unmount', () => {
        const { unmount } = render(<InspireMeTabs {...mockProps} />);

        unmount();

        expect(mockStores.inspireMeStore.setActiveStaticTabByTitle).toHaveBeenCalledWith(
            StaticQuestionTitle.StartScreen,
        );
    });

    it('should set tabs data from session storage when it exist and reset active tab to start screen', () => {
        const tabsDataFromSessionStorage = [
            {
                title: StaticQuestionTitle.StartScreen,
                answer: null,
                isShownOnProgressBar: false,
            },
        ];
        mockSessionStorage = tabsDataFromSessionStorage;
        render(<InspireMeTabs {...mockProps} />);

        expect(mockStores.inspireMeStore.setTabsData).toHaveBeenCalledWith(tabsDataFromSessionStorage);
        expect(mockStores.inspireMeStore.normalizeQuizTabsData).toHaveBeenCalledWith(tabsDataFromSessionStorage);
        expect(mockStores.inspireMeStore.setActiveStaticTabByTitle).toHaveBeenCalledWith(
            StaticQuestionTitle.StartScreen,
        );
    });

    it('should pass accessibility', async () => {
        const { container } = render(<InspireMeTabs {...mockProps} />);
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    describe('scroll', () => {
        it('should block scroll on mobile', () => {
            render(<InspireMeTabs {...mockProps} />);

            expect(lockBodyScroll).toHaveBeenCalled();
        });

        it('should unblock scroll on desktop', () => {
            mockUseMobileViewport = false;
            render(<InspireMeTabs {...mockProps} />);

            expect(unLockBodyScroll).toHaveBeenCalled();
        });
    });

    it('should render data-tid', () => {
        render(<InspireMeTabs {...mockProps} />);

        expect(screen.getByTestId('inspire-me-main-screen')).toBeInTheDocument();
    });
});
