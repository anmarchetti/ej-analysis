import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { IQuestionsFields } from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle, StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { getInitialQuestions } from 'frontend/components/renderings/InspireMeTabs/utils/utils';

describe('utils', () => {
    describe('getInitialQuestions', () => {
        it('should return initial questions', () => {
            const QuestionsData = [
                {
                    props: {
                        rendering: {
                            componentName: 'Entry Quiz Tab',
                            fields: {
                                Title: mockSitecoreField('Holiday inspiration'),
                                TrackingItemName: mockSitecoreField('TrackingItemName'),
                            } as IQuestionsFields,
                            params: {
                                ExcludedFromProgressBar: 1,
                            },
                            dataSource: 'dataSource',
                        },
                    },
                },
                {
                    props: {
                        rendering: {
                            componentName: 'Departure Airport',
                            fields: {
                                ProgressBarTitle: mockSitecoreField('departure'),
                            } as IQuestionsFields,
                            params: {
                                ExcludedFromProgressBar: 0,
                            },
                            dataSource: 'dataSource',
                        },
                    },
                },
                {
                    props: {
                        rendering: {
                            componentName: 'Final Step',
                            fields: {
                                ProgressBarTitle: mockSitecoreField('departure'),
                            } as IQuestionsFields,
                            params: {
                                ExcludedFromProgressBar: 0,
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];
            const result = getInitialQuestions(QuestionsData);
            expect(result).toMatchObject(
                expect.objectContaining([
                    {
                        isShownOnProgressBar: false,
                        progressBarTitle: '',
                        title: StaticQuestionTitle.StartScreen,
                        answer: null,
                    },
                    {
                        isShownOnProgressBar: true,
                        progressBarTitle: 'departure',
                        title: DynamicQuestionTitle.DepartureAirport,
                        answer: null,
                    },
                ]),
            );
        });
    });
});
