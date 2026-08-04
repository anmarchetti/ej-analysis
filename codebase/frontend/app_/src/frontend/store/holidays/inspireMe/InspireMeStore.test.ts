import { trackingApi } from '@sitecore-jss/sitecore-jss-nextjs';
import dayjs from 'dayjs';

import { trackingApiOptions } from 'code/tracking.config';
import {
    destinationOffers,
    inspireRecommendationResponse,
    mockDefaultGetQuizResultParams,
    mockGetQuizResultParams,
} from 'frontend/__mocks__/inspireMeQuiz';
import holidayInspirationDataService from 'frontend/services/inspireMe.service';
import offersService from 'frontend/services/offers.service';
import InspireMeStore from 'frontend/store/holidays/inspireMe/InspireMeStore';
import * as isBackend from 'frontend/utils/isBackend';
import { removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IDatePickerTabAnswers, ITabDataWithGenericType, TQuizTabData } from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { QueryParamName } from 'models/enum/QueryParamName';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ThemeQuestions } from 'frontend/components/renderings/HolidayThemeTab/interfaces';

let mockGetWebStorageItem: TQuizTabData[] = [
    {
        title: StaticQuestionTitle.StartScreen,
        isShownOnProgressBar: false,
        progressBarTitle: '',
        answer: null,
    },
];
jest.mock('frontend/utils/webStorage.utils', () => ({
    setWebStorageItem: jest.fn(),
    removeWebStorageItem: jest.fn(),
    getWebStorageItem: () => mockGetWebStorageItem,
}));

jest.useFakeTimers().setSystemTime(new Date('2024-10-08'));

const createRootStore = () => ({
    routerStore: {
        redirectToDestinationPageWithParams: jest.fn(),
    },
    layoutStore: {
        forceReloadComponents: jest.fn(),
    },
    marketStore: {
        marketSettings: {
            AirportDepartureCodes: ['TTT'],
        },
    },
    trackingStore: {
        trackSmartseerQuizResults: jest.fn(),
        smartseetTrackResult: jest.fn(),
    },
});
let rootStore;

const questionShowedInProgressBar: TQuizTabData[] = [
    {
        isShownOnProgressBar: true,
        progressBarTitle: 'departure',
        title: DynamicQuestionTitle.DepartureAirport,
        answer: [],
    },
    {
        isShownOnProgressBar: true,
        progressBarTitle: 'theme',
        title: DynamicQuestionTitle.HolidayTheme,
        answer: {
            [ThemeQuestions.Type]: {},
            [ThemeQuestions.Vibe]: {},
            [ThemeQuestions.Weather]: {},
        },
    },
    {
        isShownOnProgressBar: true,
        progressBarTitle: 'travel group',
        title: DynamicQuestionTitle.TravelGroup,
        answer: [],
    },
];

const questions: TQuizTabData[] = [
    {
        isShownOnProgressBar: false,
        progressBarTitle: undefined,
        title: StaticQuestionTitle.StartScreen,
        answer: [],
    },
    ...questionShowedInProgressBar,
    {
        isShownOnProgressBar: false,
        progressBarTitle: undefined,
        title: StaticQuestionTitle.FinalScreen,
        answer: [],
    },
];

const questionsWithAnswers: TQuizTabData[] = [
    {
        title: StaticQuestionTitle.StartScreen,
        isShownOnProgressBar: false,
        progressBarTitle: '',
        answer: null,
    },
    {
        title: DynamicQuestionTitle.DepartureAirport,
        isShownOnProgressBar: true,
        progressBarTitle: 'Departure',
        answer: ['LGW', 'LTN', 'SEN', 'STN'],
    } as ITabDataWithGenericType<string[]>,
    {
        title: DynamicQuestionTitle.TravelGroup,
        isShownOnProgressBar: true,
        progressBarTitle: 'Travel Group',
        answer: ['TGPRTNR'],
    },
    {
        title: DynamicQuestionTitle.HolidayTheme,
        isShownOnProgressBar: true,
        progressBarTitle: 'Theme',
        answer: {
            typeQuestions: {
                answer: 'THMBH',
                isActive: false,
            },
            VibeQuestions: {
                answer: 'VBFML',
                isActive: false,
            },
            WeatherQuestions: {
                answer: 'WWS',
                isActive: false,
            },
        },
    },
    {
        title: DynamicQuestionTitle.DatePicker,
        isShownOnProgressBar: true,
        progressBarTitle: 'Dates',
        answer: {
            from: new Date('2024-09-09'),
            to: new Date('2024-09-13'),
            flexibleDays: 2,
            months: [dayjs('2024-06-01')],
        },
    } as ITabDataWithGenericType<IDatePickerTabAnswers>,
    {
        title: StaticQuestionTitle.FinalScreen,
        isShownOnProgressBar: false,
        progressBarTitle: '',
        answer: null,
    },
];

let store;

describe('InspireMeStore', () => {
    beforeEach(() => {
        rootStore = createRootStore();
        store = new InspireMeStore(rootStore);
    });

    it('should set questions', () => {
        store.setTabsData(questions);

        expect(store.quizTabsData).toMatchObject(questions);
    });

    it('should set result', () => {
        store.setQuizResult(destinationOffers);

        expect(store.quizResults).toMatchObject(destinationOffers);
    });

    describe('percentageOfPassedQuestions', () => {
        it('should return 0 when no questions', () => {
            store.setTabsData([]);
            expect(store.percentageOfPassedQuestions).toBe(0);
        });

        it('should count answered questions that is shown in progress bar and are considered passed', () => {
            //TO DO remove for new quiz
            store.areAllThemeTabQuestionsAnswered = jest.fn().mockReturnValueOnce(true);
            store.activeQuestionIndex = 1;

            store.setTabsData([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: [],
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: ['LGW', 'LTN', 'SEN', 'STN'],
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: ['answer'],
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: null,
                },
            ]);
            expect(store.percentageOfPassedQuestions).toBe(33);
        });

        it('should return 100 when all questions are passed', () => {
            //TO DO remove for new quiz
            store.areAllThemeTabQuestionsAnswered = jest.fn().mockReturnValueOnce(true);
            store.activeQuestionIndex = 2;

            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: [],
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: [],
                },
            ]);
            expect(store.percentageOfPassedQuestions).toBe(100);
        });

        it('should return 0 when all questions are passed but active question index is 0', () => {
            store.activeQuestionIndex = 0;

            store.setTabsData([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: StaticQuestionTitle.StartScreen,
                    answer: [],
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: [],
                },
            ]);
            expect(store.percentageOfPassedQuestions).toBe(0);
        });
    });

    describe('loadAvailableAnswers', () => {
        const quizAnswers = {
            departure: 'LGW',
            weather: 'WWS',
        };

        it('should call validate-answer with passed answers', async () => {
            const availableAnswers = {
                availableMonths: [1, 10],
            };
            holidayInspirationDataService.getValidHolidayInspirationAnswers = jest
                .fn()
                .mockReturnValueOnce(availableAnswers);

            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: ['LLL'],
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: { dates: [new Date('2024-06-13'), new Date('2024-06-15')] },
                },
            ]);
            store.getQuizAnswers = jest.fn().mockReturnValueOnce(quizAnswers);

            await store.loadAvailableAnswers();

            expect(store.getQuizAnswers).toHaveBeenCalled();
            expect(holidayInspirationDataService.getValidHolidayInspirationAnswers).toBeCalledWith(quizAnswers);
            expect(store.availableQuizAnswers).toMatchObject(expect.objectContaining(availableAnswers));
        });

        it('should call getQuizAnswers with provided data', async () => {
            holidayInspirationDataService.getValidHolidayInspirationAnswers = jest.fn().mockReturnValueOnce({});

            store.getQuizAnswers = jest.fn().mockReturnValue(quizAnswers);

            const passedQuestionsList = [
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: ['LLL'],
                },
            ];
            await store.loadAvailableAnswers(passedQuestionsList);

            expect(store.getQuizAnswers).toBeCalledWith(passedQuestionsList);
        });
    });

    describe('goToNextQuestion', () => {
        beforeEach(() => {
            store.sendSmartseerAnalytics = jest.fn();
        });

        it('should set next question and send smartseer analytics', () => {
            store.setTabsData(questions);
            store.activeQuestionIndex = 0;

            store.goToNextQuestion(true);
            expect(store.activeQuestionIndex).toBe(1);
            expect(store.sendSmartseerAnalytics).toHaveBeenCalled();
        });

        it('should request available answers only with passed questions', async () => {
            const passedQuestionsList = [
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: {},
                },
            ];
            store.setTabsData([
                ...passedQuestionsList,
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: [],
                },
            ]);
            store.activeQuestionIndex = 0;
            store.loadAvailableAnswers = jest.fn();
            await store.goToNextQuestion(false);

            expect(store.loadAvailableAnswers).toHaveBeenCalledWith(passedQuestionsList);
        });

        it('should fetch results when last question is answered', () => {
            store.fetchQuizResult = jest.fn();
            store.activeQuestionIndex = 0;
            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: 'theme',
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: {},
                },
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: '',
                    title: StaticQuestionTitle.FinalScreen,
                    answer: null,
                },
            ]);

            store.goToNextQuestion(true);
            expect(store.fetchQuizResult).toHaveBeenCalled();
        });

        it('should set error tab when get error from loadAvailableAnswers', async () => {
            store.loadAvailableAnswers = jest.fn().mockRejectedValueOnce({});
            store.setActiveStaticTabByTitle = jest.fn();
            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: [],
                },
            ]);

            await store.goToNextQuestion(false);

            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.ErrorTab);
        });

        it('should call loadAvailableDates with today and last day of next month when next question is DatePicker', async () => {
            const store = new InspireMeStore(rootStore);
            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: {},
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: [],
                },
            ]);
            store.loadAvailableDates = jest.fn();
            store.sendSmartseerAnalytics = jest.fn();
            store.loadAvailableAnswers = jest.fn();

            await store.goToNextQuestion(false);

            expect(store.loadAvailableDates).toHaveBeenCalledWith(dayjs('2024-10-10'), dayjs('2024-11-08'), true);
        });

        it('should set error tab when get error from loadAvailableDates', async () => {
            const store = new InspireMeStore(rootStore);
            store.loadAvailableDates = jest.fn().mockRejectedValueOnce({});
            store.setActiveStaticTabByTitle = jest.fn();
            store.sendSmartseerAnalytics = jest.fn();
            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: {},
                },
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: [],
                },
            ]);

            await store.goToNextQuestion(false);

            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.ErrorTab);
        });
    });

    describe('sendSmartseerAnalytics', () => {
        it('should call trackSmartseerQuizResults with expected params by default', () => {
            store.sendSmartseerAnalytics();

            expect(rootStore.trackingStore.trackSmartseerQuizResults).toHaveBeenCalledWith(
                mockDefaultGetQuizResultParams,
            );
        });

        it('should call trackSmartseerQuizResults with expected params during the quiz', () => {
            store.setTabsData(questionsWithAnswers);
            store.activeQuestionIndex = 3;

            store.sendSmartseerAnalytics();

            expect(rootStore.trackingStore.trackSmartseerQuizResults).toHaveBeenCalledWith({
                ...mockDefaultGetQuizResultParams,
                departure: mockGetQuizResultParams.departure,
                tags: mockGetQuizResultParams.tags,
                weather: mockGetQuizResultParams.weather,
            });
        });

        it('should call trackSmartseerQuizResults with expected params at the end of the quiz', () => {
            store.setTabsData(questionsWithAnswers);
            store.activeQuestionIndex = questionsWithAnswers.length - 1;

            store.sendSmartseerAnalytics();

            expect(rootStore.trackingStore.trackSmartseerQuizResults).toHaveBeenCalledWith(mockGetQuizResultParams);
        });
    });

    //TO DO remove for new quiz
    describe('areAllThemeTabQuestionsAnswered', () => {
        const itemWithAnswers = questionsWithAnswers.find(item => item.title === DynamicQuestionTitle.HolidayTheme);

        it('should return true when all properties of themeQuestionItem have an answer', () => {
            const result = store.areAllThemeTabQuestionsAnswered(itemWithAnswers);

            expect(result).toBe(true);
        });

        it('should return false when typeQuestions field from themeQuestionItem is an empty string', () => {
            const item = { ...itemWithAnswers, answer: { ...itemWithAnswers!.answer, typeQuestions: { answer: '' } } };
            const result = store.areAllThemeTabQuestionsAnswered(item);

            expect(result).toBe(false);
        });

        it('should return false when VibeQuestions field from themeQuestionItem is an empty string', () => {
            const item = { ...itemWithAnswers, answer: { ...itemWithAnswers!.answer, VibeQuestions: { answer: '' } } };
            const result = store.areAllThemeTabQuestionsAnswered(item);

            expect(result).toBe(false);
        });

        it('should return false when WeatherQuestions field from themeQuestionItem is an empty string', () => {
            const item = {
                ...itemWithAnswers,
                answer: { ...itemWithAnswers!.answer, WeatherQuestions: { answer: '' } },
            };
            const result = store.areAllThemeTabQuestionsAnswered(item);

            expect(result).toBe(false);
        });
    });

    describe('goToNotFoundTab', () => {
        const mockTrackEvent = jest.spyOn(trackingApi, 'trackEvent').mockResolvedValueOnce();

        it('should update sitecore layout and redirect to no match found screen', async () => {
            store.setGoalId('goalId');
            store.setActiveStaticTabByTitle = jest.fn();
            await store.goToNotFoundTab();

            expect(mockTrackEvent).toHaveBeenCalledWith([{ goalId: 'goalId' }], trackingApiOptions);
            expect(rootStore.layoutStore.forceReloadComponents).toHaveBeenCalled();
            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.NotFoundTab);
        });

        it('should set NotFoundTab when goalId is absent', async () => {
            store.setActiveStaticTabByTitle = jest.fn();
            await store.goToNotFoundTab();

            expect(mockTrackEvent).not.toHaveBeenCalled();
            expect(rootStore.layoutStore.forceReloadComponents).not.toHaveBeenCalled();
            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.NotFoundTab);
        });
    });

    describe('fetchQuizResult', () => {
        it('should redirect to destination page when fetchQuizResult is resolved', async () => {
            jest.spyOn(holidayInspirationDataService, 'getQuizResult').mockResolvedValueOnce(
                inspireRecommendationResponse,
            );
            const quizAnswers = {
                to: '15-06-2024',
                from: '13-06-2024',
                departure: 'LDT',
                flexibleDays: 3,
            };

            store.getQuizAnswers = jest.fn().mockReturnValue(quizAnswers);

            await store.fetchQuizResult();

            expect(setWebStorageItem).toHaveBeenCalled();
            expect(store.rootStore.routerStore.redirectToDestinationPageWithParams).toHaveBeenCalledWith(
                destinationOffers[0].url,
                {
                    [QueryParamName.Destination]: destinationOffers[0].code,
                    [QueryParamName.To]: '15-06-2024',
                    [QueryParamName.From]: '13-06-2024',
                    [QueryParamName.Origin]: 'LDT',
                    [QueryParamName.FlexDays]: '3',
                },
            );
            expect(store.isNextAvailableAnswersAreLoading).toBe(false);
            expect(store.isPrevAvailableAnswersAreLoading).toBe(false);
            expect(store.rootStore.trackingStore.smartseetTrackResult).toHaveBeenCalledWith(
                quizAnswers,
                inspireRecommendationResponse,
            );
        });

        it('should call getQuizResult with data from date picker when it answered', async () => {
            jest.spyOn(holidayInspirationDataService, 'getQuizResult').mockResolvedValueOnce(
                inspireRecommendationResponse,
            );
            store.getQuizAnswers = jest.fn().mockReturnValue({
                to: '15-06-2024',
                from: '13-06-2024',
                dates: undefined,
            });

            await store.fetchQuizResult();

            expect(holidayInspirationDataService.getQuizResult).toHaveBeenCalledWith({
                dates: [{ from: '13-06-2024', to: '15-06-2024' }],
            });
        });

        it('should call getQuizResult with data from month picker and duration when it answered', async () => {
            jest.spyOn(holidayInspirationDataService, 'getQuizResult').mockResolvedValueOnce(
                inspireRecommendationResponse,
            );
            store.getQuizAnswers = jest.fn().mockReturnValue({
                to: null,
                from: null,
                dates: [{ from: '13-09-2024', to: '15-10-2024' }],
            });

            await store.fetchQuizResult();

            expect(holidayInspirationDataService.getQuizResult).toHaveBeenCalledWith({
                dates: [{ from: '13-09-2024', to: '15-10-2024' }],
                duration: 7,
            });
        });

        it('should call goToNotFoundTab when fetchQuizResult returns 0 destinations', async () => {
            jest.spyOn(holidayInspirationDataService, 'getQuizResult').mockResolvedValueOnce({
                destinations: [],
                trackingInfo: inspireRecommendationResponse.trackingInfo,
            });
            store.getQuizAnswers = jest.fn().mockReturnValue(mockGetQuizResultParams);

            store.goToNotFoundTab = jest.fn();
            await store.fetchQuizResult();

            expect(store.goToNotFoundTab).toHaveBeenCalled();
            expect(store.rootStore.trackingStore.smartseetTrackResult).toHaveBeenCalledWith(mockGetQuizResultParams, {
                destinations: [],
                trackingInfo: inspireRecommendationResponse.trackingInfo,
            });
        });

        it('should navigate to the Error tab when fetchQuizResult fails', async () => {
            jest.spyOn(holidayInspirationDataService, 'getQuizResult').mockRejectedValueOnce('code');

            store.goToNotFoundTab = jest.fn();
            store.setActiveStaticTabByTitle = jest.fn();

            await store.fetchQuizResult();

            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.ErrorTab);
            expect(store.goToNotFoundTab).not.toHaveBeenCalled();
        });
    });

    describe('goToPrevQuestion', () => {
        beforeEach(() => {
            store.sendSmartseerAnalytics = jest.fn();
        });

        it('should set prev question, send smartseer analytics and request available answers without active question', async () => {
            store.activeQuestionIndex = 1;
            store.loadAvailableAnswers = jest.fn();

            const passedQuestionsList = [
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.HolidayTheme,
                    answer: {},
                },
            ];
            store.setTabsData([
                ...passedQuestionsList,
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: [],
                },
            ]);

            await store.goToPrevQuestion(false);

            expect(store.sendSmartseerAnalytics).toHaveBeenCalled();
            expect(store.loadAvailableAnswers).toHaveBeenCalledWith([]);
            expect(store.activeQuestionIndex).toBe(0);
        });

        it('should set error tab when get error from loadAvailableAnswers', async () => {
            store.loadAvailableAnswers = jest.fn().mockRejectedValueOnce({});
            store.setActiveStaticTabByTitle = jest.fn();
            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: [],
                },
            ]);

            await store.goToPrevQuestion(false);

            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.ErrorTab);
        });

        it('should skip loadAvailableAnswers when skip validation is TRUE', async () => {
            store.loadAvailableAnswers = jest.fn();
            store.setActiveStaticTabByTitle = jest.fn();
            store.setTabsData([
                {
                    isShownOnProgressBar: true,
                    progressBarTitle: '',
                    title: DynamicQuestionTitle.DatePicker,
                    answer: [],
                },
            ]);

            await store.goToPrevQuestion(true);

            expect(store.loadAvailableAnswers).not.toHaveBeenCalled();
        });
    });

    it('should clear all answers', () => {
        store.setTabsData(questionShowedInProgressBar);

        store.clearAnswers();

        expect(store.percentageOfPassedQuestions).toBe(0);
        expect(removeWebStorageItem).toHaveBeenCalled();
    });

    describe('setAnswer', () => {
        it('should set answer to active question', () => {
            store.activeQuestionIndex = 1;
            store.setTabsData([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: StaticQuestionTitle.StartScreen,
                    answer: null,
                },
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: null,
                },
            ]);
            store.setAnswer(['LTH']);

            expect(store.quizTabsData).toMatchObject([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: StaticQuestionTitle.StartScreen,
                    answer: null,
                },
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: ['LTH'],
                },
            ]);
        });

        it('should NOT set answer when tabsData object does not exist at expected index', () => {
            store.activeQuestionIndex = 2;
            store.setTabsData([questionsWithAnswers[0]]);
            store.setAnswer(['LTH']);

            expect(store.quizTabsData).toMatchObject([questionsWithAnswers[0]]);
        });
    });

    describe('getAnswer', () => {
        it('should return answers for active question', () => {
            store.activeQuestionIndex = 1;
            store.setTabsData([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: StaticQuestionTitle.StartScreen,
                    answer: null,
                },
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: ['LTH'],
                },
            ]);

            expect(store.getAnswersForActiveTab()).toMatchObject(['LTH']);
        });

        it('should return undefined when answer is not found', () => {
            store.activeQuestionIndex = 1;
            store.setTabsData([]);

            expect(store.getAnswersForActiveTab()).toBe(undefined);
        });
    });

    describe('quizAnswers', () => {
        it('should return quizAnswers for all questions in store', () => {
            store.setTabsData(questionsWithAnswers);

            expect(store.getQuizAnswers()).toStrictEqual(mockGetQuizResultParams);
        });

        it('should return quizAnswers without month when they are not selected', () => {
            store.setTabsData([
                {
                    title: DynamicQuestionTitle.DatePicker,
                    isShownOnProgressBar: true,
                    progressBarTitle: 'Dates',
                    answer: {
                        from: new Date('2024-09-09'),
                        to: new Date('2024-09-13'),
                        months: undefined,
                    },
                },
            ]);

            expect(store.getQuizAnswers()).toMatchObject({
                departure: '',
                tags: undefined,
                weather: '',
                from: '2024-09-09',
                to: '2024-09-13',
            });
        });

        //TO DO remove for new quiz
        it('should return quizAnswers without extra comma in tags field value when one of tag answers is an empty string', () => {
            const holidayThemeQuestionIndex = questionsWithAnswers.findIndex(
                item => item.title === DynamicQuestionTitle.HolidayTheme,
            );

            store.setTabsData([
                ...questionsWithAnswers.slice(0, holidayThemeQuestionIndex),
                {
                    title: DynamicQuestionTitle.HolidayTheme,
                    isShownOnProgressBar: true,
                    progressBarTitle: 'Theme',
                    answer: {
                        typeQuestions: {
                            answer: 'THMBH',
                            isActive: false,
                        },
                        VibeQuestions: {
                            answer: '',
                            isActive: false,
                        },
                        WeatherQuestions: {
                            answer: 'WWS',
                            isActive: false,
                        },
                    },
                },
                ...questionsWithAnswers.slice(holidayThemeQuestionIndex + 1),
            ]);

            expect(store.getQuizAnswers()).toStrictEqual({ ...mockGetQuizResultParams, tags: 'TGPRTNR,THMBH' });
        });

        it('should return quizAnswers for answersList', () => {
            const answersList: TQuizTabData[] = [
                {
                    title: DynamicQuestionTitle.DepartureAirport,
                    isShownOnProgressBar: true,
                    progressBarTitle: 'Departure',
                    answer: ['LGW', 'LTN', 'SEN', 'STN'],
                },
                {
                    title: DynamicQuestionTitle.TravelGroup,
                    isShownOnProgressBar: true,
                    progressBarTitle: 'Travel Group',
                    answer: ['TGPRTNR'],
                },
            ];

            expect(store.getQuizAnswers(answersList)).toStrictEqual({
                ...mockDefaultGetQuizResultParams,
                departure: 'LGW,LTN,SEN,STN',
                tags: 'TGPRTNR',
            });
        });
    });

    describe('isQuizHasBeenFinished', () => {
        it('should return true when that is relevant data in session storage', () => {
            expect(store.isQuizFinishedBefore).toBe(true);
        });

        it('should return false when that is no relevant data in session storage', () => {
            mockGetWebStorageItem = [];

            expect(store.isQuizFinishedBefore).toBe(false);
        });

        it('should return false on backend', () => {
            jest.spyOn(isBackend, 'default').mockReturnValue(true);

            expect(store.isQuizFinishedBefore).toBe(false);
        });
    });

    describe('loadAvailableDates', () => {
        it('should load available dates with departure from tab answer', async () => {
            offersService.getAvailableDates = jest.fn().mockResolvedValue({
                dates: [],
                firstAvailableDate: '',
                lastAvailableDate: '',
            });
            const store = new InspireMeStore(rootStore);
            store.setTabsData([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DepartureAirport,
                    answer: ['LTH'],
                },
            ]);

            await store.loadAvailableDates(dayjs('2024-10-08'), dayjs('2024-11-30'));

            expect(offersService.getAvailableDates).toHaveBeenCalledWith('LTH', undefined, '2024-10-01', '2024-11-30');
        });

        it('should load available dates with market departure when no answer for DepartureTab (for CH markets Departure tas is not shown)', async () => {
            offersService.getAvailableDates = jest.fn().mockResolvedValue({
                dates: [],
                firstAvailableDate: '',
                lastAvailableDate: '',
            });
            const store = new InspireMeStore(rootStore);

            await store.loadAvailableDates(dayjs('2024-10-08'), dayjs('2024-11-30'));

            expect(offersService.getAvailableDates).toHaveBeenCalledWith('TTT', undefined, '2024-10-01', '2024-11-30');
        });

        it('should set ErrorTab when no data to run getAvailableDates request', async () => {
            offersService.getAvailableDates = jest.fn();
            rootStore.marketStore.marketSettings.AirportDepartureCodes = [];
            const store = new InspireMeStore(rootStore);
            store.setActiveStaticTabByTitle = jest.fn();

            await store.loadAvailableDates(dayjs('2024-10-08'), dayjs('2024-11-30'));

            expect(offersService.getAvailableDates).not.toHaveBeenCalled();
            expect(store.setActiveStaticTabByTitle).toHaveBeenCalledWith(StaticQuestionTitle.ErrorTab);
        });

        it('should collect available dates and set first/last available dates only for first load', async () => {
            offersService.getAvailableDates = jest.fn().mockResolvedValueOnce({
                dates: [{ date: '2020-07-01', out: true, in: true }],
                nextAvailableDate: '2024-10-13',
                lastAvailableDate: '2025-10-13',
            });
            const store = new InspireMeStore(rootStore);

            await store.loadAvailableDates(dayjs('2024-10-08'), dayjs('2024-11-30'));

            expect(store.availableDates).toMatchObject([{ date: '2020-07-01', out: true, in: true }]);
            expect(store.firstAvailableDate).toBe('2024-10-13');
            expect(store.lastAvailableDate).toBe('2025-10-13');

            offersService.getAvailableDates = jest.fn().mockResolvedValueOnce({
                dates: [{ date: '2023-08-01', out: true, in: true }],
                nextAvailableDate: '2024-12-13',
                lastAvailableDate: '2025-08-13',
            });
            await store.loadAvailableDates(dayjs('2024-12-08'), dayjs('2024-01-30'));

            expect(store.availableDates).toMatchObject([
                { date: '2020-07-01', out: true, in: true },
                { date: '2023-08-01', out: true, in: true },
            ]);
            expect(store.firstAvailableDate).toBe('2024-10-13');
            expect(store.lastAvailableDate).toBe('2025-10-13');
        });

        it('should not load data if it already loaded', async () => {
            offersService.getAvailableDates = jest.fn();
            const store = new InspireMeStore(rootStore);
            store.calculateDateRange = jest.fn().mockReturnValueOnce({ from: null, to: null });
            await store.loadAvailableDates(dayjs('2024-12-08'), dayjs('2024-01-30'));

            expect(offersService.getAvailableDates).not.toHaveBeenCalled();
        });

        it('should load dates start with exact date when flag startFromExactDay is true', async () => {
            offersService.getAvailableDates = jest.fn().mockResolvedValue({
                dates: [],
                firstAvailableDate: '',
                lastAvailableDate: '',
            });
            const store = new InspireMeStore(rootStore);

            await store.loadAvailableDates(dayjs('2024-10-08'), dayjs('2024-11-30'), true);

            expect(offersService.getAvailableDates).toHaveBeenCalledWith('TTT', undefined, '2024-10-08', '2024-11-30');
        });
    });

    describe('clearAvailabilityData', () => {
        it('should clear data (we need to clear data when user change departure airports to make new response)', () => {
            const store = new InspireMeStore(rootStore);
            store.setTabsData([
                {
                    isShownOnProgressBar: false,
                    progressBarTitle: undefined,
                    title: DynamicQuestionTitle.DatePicker,
                    answer: { from: '2024-10-08', to: '2024-10-17' },
                },
            ]);
            store.activeQuestionIndex = 0;
            store.availableDatesResponse = [{ date: '2020-07-01', out: true, in: true }];
            store.firstAvailableDate = '2024-10-13';
            store.lastAvailableDate = '2025-10-13';
            store.clearAvailabilityData();

            expect(store.availableDates).toMatchObject([]);
            expect(store.firstAvailableDate).toBe(null);
            expect(store.lastAvailableDate).toBe(null);
            expect(store.getAnswersForActiveTab()).toBe(null);
        });
    });

    describe('calculateDateRange', () => {
        const dayOfFirstMonth = dayjs('2024-10-07');
        const dayOfSecondMonth = dayjs('2024-11-01');
        const store = new InspireMeStore(rootStore);

        it('should return nulls when last day of both dates exist in availableDates', () => {
            store.availableDatesResponse = [
                { date: '2024-10-31', out: true, in: true },
                { date: '2024-11-30', out: true, in: true },
            ];
            const result = store.calculateDateRange(dayOfFirstMonth, dayOfSecondMonth);

            expect(result).toMatchObject({ from: null, to: null });
        });

        it('should return nulls when last day of first date exist in availableDates', () => {
            store.availableDatesResponse = [{ date: '2024-10-31', out: true, in: true }];
            const result = store.calculateDateRange(dayOfFirstMonth);

            expect(result).toMatchObject({ from: null, to: null });
        });

        it('should return first and last day of first month when second is undefined and data for provided month are not loaded', () => {
            store.availableDatesResponse = [];
            const result = store.calculateDateRange(dayOfFirstMonth);

            expect(result).toMatchObject({ from: '2024-10-01', to: '2024-10-31' });
        });

        it('should return first and last day of second month when data loaded only for first month', () => {
            store.availableDatesResponse = [{ date: '2024-10-31', out: true, in: true }];
            const result = store.calculateDateRange(dayOfFirstMonth, dayOfSecondMonth);

            expect(result).toMatchObject({ from: '2024-11-01', to: '2024-11-30' });
        });

        it('should period of two months when data for both months are not loaded', () => {
            store.availableDatesResponse = [];
            const result = store.calculateDateRange(dayOfFirstMonth, dayOfSecondMonth);

            expect(result).toMatchObject({ from: '2024-10-01', to: '2024-11-30' });
        });
    });

    describe('transformDatePickerAnswers and normalizeQuizTabsData', () => {
        describe('normalizeQuizTabsData', () => {
            it('should parse Date objects to localized formatted dates for date picker questions', () => {
                const tabsData: TQuizTabData[] = [
                    {
                        title: DynamicQuestionTitle.DatePicker,
                        isShownOnProgressBar: true,
                        progressBarTitle: 'Dates',
                        answer: {
                            from: '2024-09-09',
                            to: '2024-09-13',
                            flexibleDays: 2,
                        },
                    },
                ];

                const result = store.normalizeQuizTabsData(tabsData);

                expect(result[0].title).toBe(DynamicQuestionTitle.DatePicker);
                expect(result[0].answer).toMatchObject({
                    from: new Date('2024-09-09'),
                    to: new Date('2024-09-13'),
                    flexibleDays: 2,
                });
                // Verify date parsing occurred
                expect(result[0].answer.from instanceof Date).toBe(true);
                expect(result[0].answer.to instanceof Date).toBe(true);
            });

            it('should not modify non-datepicker questions', () => {
                const tabsData: TQuizTabData[] = [
                    {
                        title: DynamicQuestionTitle.DepartureAirport,
                        isShownOnProgressBar: true,
                        progressBarTitle: 'Departure',
                        answer: ['LGW', 'LTN'],
                    } as ITabDataWithGenericType<string[]>,
                    {
                        title: DynamicQuestionTitle.TravelGroup,
                        isShownOnProgressBar: true,
                        progressBarTitle: 'Travel Group',
                        answer: ['TGPRTNR'],
                    },
                ];

                const result = store.normalizeQuizTabsData(tabsData);

                expect(result).toEqual(tabsData);
            });

            it('should handle empty tabs data', () => {
                const tabsData: TQuizTabData[] = [];

                const result = store.normalizeQuizTabsData(tabsData);

                expect(result).toEqual([]);
            });

            it('should handle date picker with null answer', () => {
                const tabsData: TQuizTabData[] = [
                    {
                        title: DynamicQuestionTitle.DatePicker,
                        isShownOnProgressBar: true,
                        progressBarTitle: 'Dates',
                        answer: null,
                    },
                ];

                const result = store.normalizeQuizTabsData(tabsData);

                expect(result[0].answer).toBe(null);
            });
        });

        describe('date transformation in fetchQuizResult', () => {
            it('should save normalized dates to session storage before fetching results', async () => {
                jest.spyOn(holidayInspirationDataService, 'getQuizResult').mockResolvedValueOnce({
                    destinations: [],
                    trackingInfo: inspireRecommendationResponse.trackingInfo,
                });

                store.setTabsData([
                    {
                        title: DynamicQuestionTitle.DatePicker,
                        isShownOnProgressBar: true,
                        progressBarTitle: 'Dates',
                        answer: {
                            from: new Date('2024-09-09'),
                            to: new Date('2024-09-13'),
                            flexibleDays: 2,
                        },
                    } as ITabDataWithGenericType<IDatePickerTabAnswers>,
                ]);

                store.getQuizAnswers = jest.fn().mockReturnValue({
                    from: null,
                    to: null,
                    dates: [],
                    departure: '',
                });

                await store.fetchQuizResult();

                expect(setWebStorageItem).toHaveBeenCalledWith(
                    WebStorageKeys.InspireMeQuiz,
                    expect.arrayContaining([
                        expect.objectContaining({
                            title: DynamicQuestionTitle.DatePicker,
                            answer: expect.objectContaining({
                                from: '2024-09-09',
                                to: '2024-09-13',
                            }),
                        }),
                    ]),
                    sessionStorage,
                );
            });
        });
    });
});
