import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

import { createMockStores } from 'frontend/__mocks__';
import { scrollIntoViewHorizontal } from 'frontend/utils/scroll.utils';
import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { ITagOption } from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle } from 'models/enum/InspireMeQuiz';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import HolidayThemeTab from 'frontend/components/renderings/HolidayThemeTab/HolidayThemeTab';
import * as utils from 'frontend/components/renderings/HolidayThemeTab/HolidayThemeTab.utils';

import { ThemeQuestions, THolidayThemeProps } from './interfaces';

expect.extend(toHaveNoViolations);

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/utils/tracking/inspireMeQuiz.utils');
jest.mock('frontend/utils/tracking/tracking.utils');

jest.mock('frontend/utils/scroll.utils', () => ({
    scrollIntoViewHorizontal: jest.fn(),
}));

let mockUseTabletViewport = true;
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useTabletViewport: () => mockUseTabletViewport,
}));

jest.mock('frontend/components/common/ExpandableItem/ExpandableItem', () => ({ isOpened, children, onOpen }) => (
    <div data-tid='expandable-item' className={isOpened ? 'opened' : 'closed'}>
        <button data-tid='expand-button' onClick={onOpen}>
            expand button
        </button>
        {children}
    </div>
));

jest.useFakeTimers();

const createProps = (): THolidayThemeProps => ({
    fields: {
        QuestionTitle: mockSitecoreField('QuestionTitle'),
        TrackingItemName: mockSitecoreField('TrackingItemName'),
        HolidayTypeOptions: [
            {
                fields: {
                    Name: {
                        value: 'Beach Holiday',
                    },
                    Code: {
                        value: 'TT',
                    },
                },
            },
            {
                fields: {
                    Name: {
                        value: 'City Break',
                    },
                    Code: {
                        value: 'THMCB',
                    },
                },
            },
            {
                fields: {
                    Name: {
                        value: 'Lakes',
                    },
                    Code: {
                        value: 'THML',
                    },
                },
            },
        ] as ITagOption[],
        HolidayTypeQuestions: mockSitecoreField('HolidayTypeQuestions'),
        HolidayVibeOptions: [
            {
                fields: {
                    Name: {
                        value: 'Adults',
                    },
                    Code: {
                        value: 'VT',
                    },
                },
            },
            {
                fields: {
                    Name: {
                        value: 'Family',
                    },
                    Code: {
                        value: 'VBFML',
                    },
                },
            },
            {
                fields: {
                    Name: {
                        value: 'Luxury',
                    },
                    Code: {
                        value: 'VBLUX',
                    },
                },
            },
        ] as ITagOption[],
        HolidayVibeQuestions: mockSitecoreField('HolidayVibeQuestions'),
        WeatherOptions: [],
        WeatherQuestions: mockSitecoreField('WeatherQuestions'),
    },
    params: {},
    rendering: {
        componentName: DynamicQuestionTitle.HolidayTheme,
    },
});

let mockProps;
let mockStores;

describe('HolidayThemeTab', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            inspireMeStore: {
                goToNextQuestion: jest.fn(),
                goToPrevQuestion: jest.fn(),
                getAnswersForActiveTab: jest.fn(),
                setAnswer: jest.fn(),
                availableQuizAnswers: {
                    availableTags: ['', 'TT', 'VT', 'WT'],
                },
                setGoalId: jest.fn(),
            },
            trackingStore: {
                trackInspireMePageLoad: jest.fn(),
            },
        });

        jest.mocked(getQuizEventsCoreParamsOverride).mockReturnValue({});
        jest.mocked(generateGenericValues).mockReturnValue({});
    });

    it('should render content', () => {
        render(<HolidayThemeTab {...mockProps} />);

        expect(screen.getByText(mockProps.fields.QuestionTitle.value)).toBeInTheDocument();
    });

    it('should call trackEventWithParams when component did mount', () => {
        render(<HolidayThemeTab {...mockProps} />);

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: 'TT',
            genericValue2: 'VT',
            genericValue3: 'WT',
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

    it('should call trackEventWithParams and go to next question when all questions are answered', async () => {
        const answers = {
            [ThemeQuestions.Type]: {
                answer: 'TT',
                isActive: false,
            },
            [ThemeQuestions.Vibe]: {
                answer: 'VT',
                isActive: true,
            },
            [ThemeQuestions.Weather]: {
                answer: 'WT',
                isActive: false,
            },
        };
        mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce(answers);
        render(<HolidayThemeTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
            genericValue1: 'TT',
            genericValue2: 'VT',
            genericValue3: 'WT',
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

    it('should call trackEventWithParams and go to prev question after click', async () => {
        render(<HolidayThemeTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-prev-question'));
        await jest.runAllTimersAsync();

        expect(generateGenericValues).toHaveBeenCalledWith({
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
        expect(mockStores.inspireMeStore.goToPrevQuestion).toBeCalledWith();
    });

    it('should pass accessibility', async () => {
        const { container } = render(<HolidayThemeTab {...mockProps} />);

        // aXe core does not work when timers are mocked. It's recommended in documentation renabling the timers temporarily for aXe.
        jest.useRealTimers();
        const results = await axe(container);
        jest.useFakeTimers();

        expect(results).toHaveNoViolations();
    });

    it('should NOT render Expandable Items when there is no fields', () => {
        jest.spyOn(utils, 'getAvailableAnswers').mockReturnValueOnce([]);
        render(<HolidayThemeTab {...mockProps} />);

        expect(screen.queryByTestId('expandable-item')).not.toBeInTheDocument();
    });

    it('should render all ExpandableItem as opened on desktop', () => {
        mockUseTabletViewport = false;
        render(<HolidayThemeTab {...mockProps} />);

        const expandableItems = screen.getAllByTestId('expandable-item');
        expandableItems.forEach(item => expect(item).toHaveClass('opened'));
    });

    it('should render first ExpandableItem as opened on tablet', () => {
        mockUseTabletViewport = true;
        render(<HolidayThemeTab {...mockProps} />);

        const expandableItems = screen.getAllByTestId('expandable-item');

        expect(expandableItems).toHaveLength(3);
        expect(expandableItems[0]).toHaveClass('opened');
        expect(expandableItems[1]).toHaveClass('closed');
    });

    describe('ExpandableItems behaviour on tablet', () => {
        mockUseTabletViewport = true;
        jest.spyOn(utils, 'getAvailableAnswers').mockReturnValue([
            {
                subType: ThemeQuestions.Type,
                title: '',
                answerVariants: [
                    {
                        fields: {
                            Name: {
                                value: 'TypeTest',
                            },
                            Code: {
                                value: 'TT',
                            },
                            Goal: {
                                id: 'TT',
                            },
                        },
                    } as ITagOption,
                ],
            },
            {
                subType: ThemeQuestions.Vibe,
                title: '',
                answerVariants: [
                    {
                        fields: {
                            Name: {
                                value: 'VibeTest',
                            },
                            Code: {
                                value: 'VT',
                            },
                            Goal: {
                                id: 'VT',
                            },
                        },
                    } as ITagOption,
                ],
            },
            {
                subType: ThemeQuestions.Weather,
                title: '',
                answerVariants: [
                    {
                        fields: {
                            Name: {
                                value: 'WeatherTest',
                            },
                            Code: {
                                value: 'WT',
                            },
                            Goal: {
                                id: 'WT',
                            },
                        },
                    } as ITagOption,
                ],
            },
        ]);
        jest.spyOn(document, 'getElementById').mockReturnValue({ offsetTop: 100 } as HTMLElement);

        const allUnunsweredQuestionWithFirstActiveQuestion = {
            [ThemeQuestions.Type]: {
                answer: '',
                isActive: true,
            },
            [ThemeQuestions.Vibe]: {
                answer: '',
                isActive: false,
            },
            [ThemeQuestions.Weather]: {
                answer: '',
                isActive: false,
            },
        };

        it('should open next ExpandableItem after select answer', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest
                .fn()
                .mockReturnValueOnce(allUnunsweredQuestionWithFirstActiveQuestion);
            render(<HolidayThemeTab {...mockProps} />);

            const expandableItems = screen.getAllByTestId('expandable-item');

            expect(expandableItems[0]).toHaveClass('opened');
            expect(expandableItems[1]).toHaveClass('closed');

            fireEvent.click(screen.getByText('TypeTest'));
            act(() => {
                jest.runAllTimers();
            });

            expect(expandableItems[0]).toHaveClass('closed');
            expect(expandableItems[1]).toHaveClass('opened');
            expect(scrollIntoViewHorizontal).toHaveBeenCalled();
        });

        it('should open the first unanswered question found when all questions after the current one have been answered', () => {
            const answers = {
                [ThemeQuestions.Type]: {
                    answer: 'TT',
                    isActive: false,
                },
                [ThemeQuestions.Vibe]: {
                    answer: '',
                    isActive: false,
                },
                [ThemeQuestions.Weather]: {
                    answer: '',
                    isActive: true,
                },
            };

            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce(answers);
            render(<HolidayThemeTab {...mockProps} />);

            const expandableItems = screen.getAllByTestId('expandable-item');

            expect(expandableItems[2]).toHaveClass('opened');
            expect(expandableItems[1]).toHaveClass('closed');

            fireEvent.click(screen.getByText('WeatherTest'));
            act(() => {
                jest.runAllTimers();
            });

            expect(expandableItems[2]).toHaveClass('closed');
            expect(expandableItems[1]).toHaveClass('opened');
            expect(scrollIntoViewHorizontal).toHaveBeenCalled();
        });

        it('should close all ExpandableItems when all questions are answered and call setAnswer', () => {
            const answers = {
                [ThemeQuestions.Type]: {
                    answer: 'TT',
                    isActive: false,
                    goalId: 'TT',
                },
                [ThemeQuestions.Vibe]: {
                    answer: '',
                    isActive: true,
                    goalId: 'VT',
                },
                [ThemeQuestions.Weather]: {
                    answer: 'WT',
                    isActive: false,
                    goalId: 'WT',
                },
            };

            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce(answers);
            render(<HolidayThemeTab {...mockProps} />);

            const expandableItems = screen.getAllByTestId('expandable-item');

            expect(expandableItems[1]).toHaveClass('opened');

            fireEvent.click(screen.getByText('VibeTest'));
            act(() => {
                jest.runAllTimers();
            });

            expandableItems.forEach(item => expect(item).toHaveClass('closed'));
            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledWith({
                [ThemeQuestions.Type]: {
                    answer: 'TT',
                    isActive: false,
                    goalId: 'TT',
                },
                [ThemeQuestions.Vibe]: {
                    answer: 'VT',
                    isActive: false,
                    goalId: 'VT',
                },
                [ThemeQuestions.Weather]: {
                    answer: 'WT',
                    isActive: false,
                    goalId: 'WT',
                },
            });
            expect(mockStores.inspireMeStore.setGoalId).toHaveBeenCalledWith('TT');
            expect(scrollIntoViewHorizontal).not.toHaveBeenCalled();
        });

        //TO DO add for new quiz

        // it('should NOT call setQuestion until all questions are not answered', () => {
        //     mockStores.inspireMeStore.getAnswersForActiveTab = jest
        //         .fn()
        //         .mockReturnValueOnce(allUnunsweredQuestionWithFirstActiveQuestion);
        //     render(<HolidayThemeTab {...mockProps} />);

        //     fireEvent.click(screen.getByText('TypeTest'));
        //     act(() => {
        //         jest.runAllTimers();
        //     });

        //     expect(mockStores.inspireMeStore.setAnswer).not.toHaveBeenCalled();
        // });

        //TO DO remove for new quiz
        it('should NOT call setQuestion until all questions are not answered', () => {
            render(<HolidayThemeTab {...mockProps} />);

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalled();
        });

        //TO DO remove for new quiz
        it('should call setQuestion after each answer change', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest
                .fn()
                .mockReturnValueOnce(allUnunsweredQuestionWithFirstActiveQuestion);
            render(<HolidayThemeTab {...mockProps} />);

            fireEvent.click(screen.getByText('TypeTest'));
            act(() => {
                jest.runAllTimers();
            });

            expect(mockStores.inspireMeStore.setAnswer).toHaveBeenCalledTimes(2);
        });

        it('should open question clicked by user and close the rest', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest
                .fn()
                .mockReturnValueOnce(allUnunsweredQuestionWithFirstActiveQuestion);
            render(<HolidayThemeTab {...mockProps} />);

            const expandableItems = screen.getAllByTestId('expandable-item');
            const expandableButtons = screen.getAllByTestId('expand-button');

            expect(expandableItems[0]).toHaveClass('opened');
            expect(expandableItems[1]).toHaveClass('closed');

            fireEvent.click(expandableButtons[1]);
            act(() => {
                jest.runAllTimers();
            });

            expect(expandableItems[0]).toHaveClass('closed');
            expect(expandableItems[1]).toHaveClass('opened');
            expect(scrollIntoViewHorizontal).toHaveBeenCalled();
        });

        it('should deactivate a clicked active question without activating any others', () => {
            mockStores.inspireMeStore.getAnswersForActiveTab = jest
                .fn()
                .mockReturnValueOnce(allUnunsweredQuestionWithFirstActiveQuestion);
            render(<HolidayThemeTab {...mockProps} />);

            const expandableItems = screen.getAllByTestId('expandable-item');
            const expandableButtons = screen.getAllByTestId('expand-button');

            expect(expandableItems[0]).toHaveClass('opened');

            fireEvent.click(expandableButtons[0]);
            act(() => {
                jest.runAllTimers();
            });

            expandableItems.forEach(item => expect(item).toHaveClass('closed'));
            expect(scrollIntoViewHorizontal).not.toHaveBeenCalled();
        });

        it('should NOT call scrollToElement when element is not founded', () => {
            jest.spyOn(document, 'getElementById').mockReturnValue(null);

            mockStores.inspireMeStore.getAnswersForActiveTab = jest
                .fn()
                .mockReturnValueOnce(allUnunsweredQuestionWithFirstActiveQuestion);
            render(<HolidayThemeTab {...mockProps} />);

            const expandableButtons = screen.getAllByTestId('expand-button');

            fireEvent.click(expandableButtons[0]);
            act(() => {
                jest.runAllTimers();
            });

            expect(scrollIntoViewHorizontal).not.toHaveBeenCalled();
        });
    });

    describe('ExpandableItems behaviour on desktop', () => {
        mockUseTabletViewport = false;

        it('should NOT scroll to opened element ans set timer on desktop', () => {
            const answers = {
                [ThemeQuestions.Type]: {
                    answer: 'TT',
                    isActive: false,
                },
                [ThemeQuestions.Vibe]: {
                    answer: '',
                    isActive: false,
                },
                [ThemeQuestions.Weather]: {
                    answer: '',
                    isActive: true,
                },
            };

            mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce(answers);
            render(<HolidayThemeTab {...mockProps} />);

            fireEvent.click(screen.getByText('WeatherTest'));

            expect(scrollIntoViewHorizontal).not.toHaveBeenCalled();
        });
    });

    /*it('should filter previous answers by availability, except weather when user edit answers', async () => {
        const answers = {
            [ThemeQuestions.Type]: {
                answer: 'TT',
                isActive: false,
            },
            [ThemeQuestions.Vibe]: {
                answer: 'VT',
                isActive: true,
            },
            [ThemeQuestions.Weather]: {
                answer: 'WT',
                isActive: false,
            },
        };

        mockStores.inspireMeStore.availableQuizAnswers.availableTags = ['TT'];
        mockStores.inspireMeStore.getAnswersForActiveTab = jest.fn().mockReturnValueOnce(answers);
        render(<HolidayThemeTab {...mockProps} />);

        fireEvent.click(screen.getByTestId('quiz-next-question'));
        await jest.runAllTimersAsync();

        expect(mockStores.inspireMeStore.goToNextQuestion).not.toHaveBeenCalled();
    });*/
});
