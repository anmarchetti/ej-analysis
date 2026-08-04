import { trackingApi } from '@sitecore-jss/sitecore-jss-nextjs';
import dayjs, { Dayjs } from 'dayjs';
import { action, computed, makeObservable, observable, runInAction, toJS } from 'mobx';

import { ONE, ONE_HUNDRED, TWO } from 'code/commonNumbers';
import { DATE_FORMATS } from 'code/dates';
import { trackingApiOptions } from 'code/tracking.config';
import holidayInspirationDataService from 'frontend/services/inspireMe.service';
import OffersService from 'frontend/services/offers.service';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { formatDateL10n, formatDateToQuery, parseDateL10n } from 'frontend/utils/date.utils';
import isBackend from 'frontend/utils/isBackend';
import { purifyUrl } from 'frontend/utils/url.utils';
import { getWebStorageItem, removeWebStorageItem, setWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IAvailableDate } from 'models/data/IAvailableDate';
import {
    IAvailableAnswers,
    IDatePickerTabAnswers,
    IHolidayInspirationOffer,
    IQuizResult,
    TQuizTabData,
} from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { QueryParamName } from 'models/enum/QueryParamName';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ThemeQuestions, TThemeAnswers } from 'frontend/components/renderings/HolidayThemeTab/interfaces';

export class InspireMeStore {
    @observable activeQuestionIndex: number = 0;
    @observable private tabsData: TQuizTabData[] = [];
    @observable private quizResult: IHolidayInspirationOffer[] = []; // list of recommended directions received from BE based on quiz answers
    private availableAnswers: Nullable<IAvailableAnswers> = null;
    @observable availableDatesResponse: IAvailableDate[] = [];

    firstAvailableDate: Nullable<string> = null;
    lastAvailableDate: Nullable<string> = null;

    @observable isNextAvailableAnswersAreLoading: boolean = false;
    @observable isPrevAvailableAnswersAreLoading: boolean = false;
    @observable isAvailableDatesLoading: boolean = false;

    private goalId: string | null = null;

    constructor(public rootStore: HolidaysRootStore) {
        makeObservable(this);
    }

    @action setGoalId = (goalId: string): void => {
        this.goalId = goalId;
    };

    @action setActiveQuestionIndex = (activeQuestion: number): void => {
        this.activeQuestionIndex = activeQuestion;
    };

    @action setTabsData = (questions: TQuizTabData[]): void => {
        this.tabsData = questions;
    };

    @action clearAnswers = (): void => {
        this.tabsData.forEach(item => {
            item.answer = null;
        });
        removeWebStorageItem(WebStorageKeys.InspireMeQuiz, sessionStorage);
    };

    get isQuizFinishedBefore(): boolean {
        if (isBackend()) {
            return false;
        }

        const dataFromSessionStore = getWebStorageItem<TQuizTabData[] | undefined>(
            WebStorageKeys.InspireMeQuiz,
            true,
            sessionStorage,
        );

        return !!dataFromSessionStore?.length;
    }

    @action setActiveStaticTabByTitle = (name: StaticQuestionTitle): void => {
        const indexOfErrorTab = this.tabsData.findIndex(tab => tab.title === name);
        this.setActiveQuestionIndex(indexOfErrorTab);
    };

    loadAvailableAnswers = async (passedQuestionList?: TQuizTabData[]): Promise<void> => {
        const { departure, weather } = this.getQuizAnswers(passedQuestionList || this.tabsData);
        const response = await holidayInspirationDataService.getValidHolidayInspirationAnswers({
            departure,
            weather,
        });

        runInAction(() => {
            this.availableAnswers = response;
        });
    };

    get availableDates(): IAvailableDate[] {
        return this.availableDatesResponse;
    }

    @action clearAvailabilityData = (): void => {
        this.availableDatesResponse = [];
        this.firstAvailableDate = null;
        this.lastAvailableDate = null;
        this.tabsData.forEach(tab => {
            if (tab.title === DynamicQuestionTitle.DatePicker) {
                tab.answer = null;
            }
        });
    };

    calculateDateRange = (
        dayOfFirstMonth: Dayjs,
        dayOfSecondMonth?: Dayjs,
    ): { from: null; to: null } | { from: string; to: string } => {
        const lastDayOfFirstMonth = dayOfFirstMonth.endOf('month').format(DATE_FORMATS.query);
        const lastDayOfSecondMonth = dayOfSecondMonth?.endOf('month').format(DATE_FORMATS.query);

        const isDataForFirstMonthLoaded = Object.values(this.availableDates).some(
            item => item.date === lastDayOfFirstMonth,
        );
        const isDataForSecondMonthLoaded = lastDayOfSecondMonth
            ? Object.values(this.availableDates).some(item => item.date === lastDayOfSecondMonth)
            : true;

        // data for both months is loaded
        if (isDataForFirstMonthLoaded && isDataForSecondMonthLoaded) {
            return {
                from: null,
                to: null,
            };
        }

        // First month data is not loaded, next does not exist: return the first month period (scroll calendar by arrows)
        if (!lastDayOfSecondMonth) {
            const fromDate = dayjs(dayOfFirstMonth).startOf('month').format(DATE_FORMATS.query);

            return {
                from: fromDate,
                to: lastDayOfFirstMonth,
            };
        }

        // First month is loaded, next is not: return the second month period
        if (isDataForFirstMonthLoaded && !isDataForSecondMonthLoaded) {
            const fromDate = dayjs(dayOfSecondMonth).startOf('month').format(DATE_FORMATS.query);

            return {
                from: fromDate,
                to: lastDayOfSecondMonth,
            };
        }

        // Both months are not loaded: return the first month period
        const fromDate = dayjs(dayOfFirstMonth).startOf('month').format(DATE_FORMATS.query);

        return {
            from: fromDate,
            to: lastDayOfSecondMonth,
        };
    };

    loadAvailableDates = async (firstDate: Dayjs, secondDate?: Dayjs, startFromExactDay?: boolean): Promise<void> => {
        const { from, to } = this.calculateDateRange(firstDate, secondDate);

        if (!from && !to) {
            return;
        }

        runInAction(() => {
            this.isAvailableDatesLoading = true;
        });

        const departureFromQuizAnswer: string | undefined = this.tabsData
            .find(tab => tab.title === DynamicQuestionTitle.DepartureAirport)
            ?.answer?.join(',');
        const marketDeparture = this.rootStore.marketStore.marketSettings?.AirportDepartureCodes?.join(',');
        const departure = departureFromQuizAnswer ?? marketDeparture;

        if (!departure) {
            this.setActiveStaticTabByTitle(StaticQuestionTitle.ErrorTab);

            return;
        }

        const formatedFirstDay = firstDate.format(DATE_FORMATS.query);
        const result = await OffersService.getAvailableDates(
            departure,
            undefined,
            startFromExactDay ? formatedFirstDay : from,
            to,
        );

        runInAction(() => {
            this.availableDatesResponse.push(...result.dates);

            if (!this.firstAvailableDate) {
                this.firstAvailableDate = result.nextAvailableDate;
                this.lastAvailableDate = result.lastAvailableDate;
            }

            this.isAvailableDatesLoading = false;
        });
    };

    sendSmartseerAnalytics = (): void => {
        const lastAnsweredQuestionIndex = this.activeQuestionIndex + 1;

        const questions = this.tabsData.slice(0, lastAnsweredQuestionIndex);
        const quizAnswers = this.getQuizAnswers(questions);

        this.rootStore.trackingStore.trackSmartseerQuizResults(quizAnswers);
    };

    goToNextQuestion = async (skipValidation: boolean = true): Promise<void> => {
        runInAction(() => {
            this.isNextAvailableAnswersAreLoading = !skipValidation;
        });

        this.sendSmartseerAnalytics();

        const nextQuestionTitle = this.tabsData[this.activeQuestionIndex + 1]?.title;
        const isNextQuestionFinalScreen = nextQuestionTitle === StaticQuestionTitle.FinalScreen;
        const isNextQuestionDatePicker = nextQuestionTitle === DynamicQuestionTitle.DatePicker;

        if (!skipValidation && !isNextQuestionFinalScreen) {
            const passedQuestionList = this.tabsData.slice(0, this.activeQuestionIndex + 1);
            try {
                await this.loadAvailableAnswers(passedQuestionList);
            } catch (e) {
                this.setActiveStaticTabByTitle(StaticQuestionTitle.ErrorTab);

                return;
            }
        }

        if (isNextQuestionDatePicker) {
            try {
                // on search pod we load date from today + 2 days
                const startDate = dayjs().add(TWO, 'days');
                const endDate = dayjs().add(ONE, 'months');
                await this.loadAvailableDates(startDate, endDate, true);
            } catch (e) {
                this.setActiveStaticTabByTitle(StaticQuestionTitle.ErrorTab);

                return;
            }
        }

        this.setActiveQuestionIndex(this.activeQuestionIndex + 1);

        if (isNextQuestionFinalScreen) {
            await this.fetchQuizResult();
        }

        runInAction(() => {
            this.isNextAvailableAnswersAreLoading = false;
        });
    };

    goToPrevQuestion = async (skipValidation: boolean = true): Promise<void> => {
        runInAction(() => {
            this.isPrevAvailableAnswersAreLoading = true;
        });

        this.sendSmartseerAnalytics();

        const passedQuestionList = this.tabsData.slice(0, this.activeQuestionIndex - 1);

        if (!skipValidation) {
            try {
                await this.loadAvailableAnswers(passedQuestionList);
            } catch (e) {
                this.setActiveStaticTabByTitle(StaticQuestionTitle.ErrorTab);

                return;
            }
        }

        this.setActiveQuestionIndex(this.activeQuestionIndex - 1);

        runInAction(() => {
            this.isPrevAvailableAnswersAreLoading = false;
        });
    };

    getQuizAnswers = (answersList?: TQuizTabData[]): IQuizResult => {
        const list = answersList || this.tabsData;

        return list.reduce(
            (acc: IQuizResult, item) => {
                if (!item.answer || !item.isShownOnProgressBar) {
                    return acc;
                }

                if (item.title === DynamicQuestionTitle.DepartureAirport) {
                    const departureAnswer: string[] = item.answer;

                    return { ...acc, departure: departureAnswer.join(',') };
                }

                if (item.title === DynamicQuestionTitle.DatePicker) {
                    const datesAnswer: IDatePickerTabAnswers = item.answer;

                    const monthsRanges =
                        datesAnswer.months?.map((day: Dayjs) => {
                            const lastDayOfTheMonth = dayjs(day).endOf('month');

                            return {
                                from: formatDateToQuery(day),
                                to: formatDateToQuery(lastDayOfTheMonth),
                            };
                        }) || [];

                    return {
                        ...acc,
                        from: formatDateToQuery(datesAnswer.from),
                        to: formatDateToQuery(datesAnswer.to),
                        flexibleDays: datesAnswer.flexibleDays,
                        dates: monthsRanges,
                    };
                }

                //TO DO remove for new quiz
                if (item.title === DynamicQuestionTitle.HolidayTheme) {
                    const themeAnswer: TThemeAnswers = item.answer;
                    const prevTags = acc.tags?.split(',') || [];

                    return {
                        ...acc,
                        weather: themeAnswer[ThemeQuestions.Weather].answer,
                        tags: [
                            ...prevTags,
                            themeAnswer[ThemeQuestions.Type].answer,
                            themeAnswer[ThemeQuestions.Vibe].answer,
                        ]
                            .filter(Boolean) //TO DO remove for new quiz
                            .join(','),
                    };
                }

                const tagList = acc.tags?.split(',') || [];

                return { ...acc, tags: [...tagList, item.answer].join(',') };
            },
            {
                departure: '',
                tags: undefined,
                weather: '',
                from: '',
                to: '',
                flexibleDays: undefined,
                dates: [],
            },
        );
    };

    getAnswersForActiveTab = <T>(): T | undefined => this.tabsData[this.activeQuestionIndex]?.answer;

    @action setAnswer = <T>(answer: T): void => {
        if (this.tabsData[this.activeQuestionIndex]) {
            this.tabsData[this.activeQuestionIndex].answer = answer;
        }
    };

    @action setQuizResult = (quizResult: IHolidayInspirationOffer[]): void => {
        this.quizResult = quizResult;
    };

    get availableQuizAnswers(): Nullable<IAvailableAnswers> {
        return this.availableAnswers;
    }

    @computed get quizTabsData(): TQuizTabData[] {
        return this.tabsData;
    }

    @computed get quizResults(): IHolidayInspirationOffer[] {
        return toJS(this.quizResult);
    }

    //TO DO remove for new quiz
    areAllThemeTabQuestionsAnswered = (item: TQuizTabData): boolean =>
        !!item.answer[ThemeQuestions.Type].answer &&
        !!item.answer[ThemeQuestions.Vibe].answer &&
        !!item.answer[ThemeQuestions.Weather].answer;

    @computed get percentageOfPassedQuestions(): number {
        if (!this.tabsData.length || this.activeQuestionIndex === 0) {
            return 0;
        }

        const countOfQuestions = this.tabsData.filter(item => item.isShownOnProgressBar).length;
        const countOfAnsweredQuestions = this.tabsData.filter(
            (item, index) =>
                !!item.answer &&
                (item.title === DynamicQuestionTitle.HolidayTheme //TO DO remove for new quiz
                    ? this.areAllThemeTabQuestionsAnswered(item)
                    : true) &&
                item.isShownOnProgressBar &&
                index <= this.activeQuestionIndex,
        ).length;
        const isEverythingAnswered = countOfAnsweredQuestions === countOfQuestions;

        if (isEverythingAnswered) {
            return ONE_HUNDRED;
        }

        const percentage = (ONE_HUNDRED * countOfAnsweredQuestions) / countOfQuestions;

        return Math.round(percentage);
    }

    goToNotFoundTab = async (): Promise<void> => {
        // update sitecore layout to show personalize deal details component. If goalId is absent or there is any problems with requests we show default deal details component
        if (this.goalId) {
            await trackingApi.trackEvent([{ goalId: this.goalId }], trackingApiOptions);
            await this.rootStore.layoutStore.forceReloadComponents();
        }

        this.setActiveStaticTabByTitle(StaticQuestionTitle.NotFoundTab);
    };

    private readonly transformDatePickerAnswers = (
        tabsData: TQuizTabData[],
        dateTransformer: (date: string) => string | Date | null,
    ): TQuizTabData[] =>
        tabsData.map(tab => {
            if (tab.title === DynamicQuestionTitle.DatePicker && tab.answer) {
                const datesAnswer = tab.answer;

                return {
                    ...tab,
                    answer: {
                        ...datesAnswer,
                        from: dateTransformer(datesAnswer.from),
                        to: dateTransformer(datesAnswer.to),
                    },
                };
            }

            return tab;
        });

    normalizeQuizTabsData = (tabsData: TQuizTabData[]): TQuizTabData[] =>
        this.transformDatePickerAnswers(tabsData, (date): Date | null => parseDateL10n(date, DATE_FORMATS.query));

    fetchQuizResult = async (): Promise<void> => {
        // Format dates before saving to sessionStorage to avoid shift in date values due to timezone offset during parsing
        const tabsDataToSave = this.transformDatePickerAnswers(this.tabsData, formatDateToQuery);

        setWebStorageItem(WebStorageKeys.InspireMeQuiz, tabsDataToSave, sessionStorage);

        try {
            const quizAnswers = this.getQuizAnswers();
            const { from, to, departure, tags, weather, dates, flexibleDays } = quizAnswers;
            const datesRange = from ? [{ from, to }] : dates;
            //Bugfix for INS-1330 - the plan is to use the same duration setting for both Search by Month and Inspire
            const duration = from ? undefined : 7;

            const response = await holidayInspirationDataService.getQuizResult({
                departure,
                tags,
                weather,
                flexibleDays,
                dates: datesRange,
                duration,
            });

            this.rootStore.trackingStore.smartseetTrackResult(quizAnswers, response);

            if (response.destinations.length) {
                runInAction(() => {
                    this.setQuizResult(response.destinations);
                });

                this.rootStore.routerStore.redirectToDestinationPageWithParams(
                    purifyUrl(response.destinations[0].url),
                    {
                        [QueryParamName.To]: formatDateL10n(to),
                        [QueryParamName.From]: formatDateL10n(from),
                        [QueryParamName.Destination]: response.destinations[0].code,
                        [QueryParamName.Origin]: departure || '',
                        [QueryParamName.FlexDays]: (flexibleDays || 0).toString(),
                    },
                );
            } else {
                this.goToNotFoundTab();
            }
        } catch {
            this.setActiveStaticTabByTitle(StaticQuestionTitle.ErrorTab);
        }
    };
}

export default InspireMeStore;
