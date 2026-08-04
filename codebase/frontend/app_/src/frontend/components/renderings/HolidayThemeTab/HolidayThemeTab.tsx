import { FC, useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { HALF_A_SECOND } from 'code/commonNumbers';
import { useTabletViewport } from 'frontend/hooks/useMediaQuery';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getSitecoreImageBackgroundStyles } from 'frontend/utils/getImage';
import { scrollIntoViewHorizontal } from 'frontend/utils/scroll.utils';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { MediaSize } from 'models/data/MediaSizeParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import QuestionFooter from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter';
import RadioButton from 'frontend/components/common/RadioButton';
import SVGTick from 'frontend/components/icons-new/Tick';
import { getAvailableAnswers } from 'frontend/components/renderings/HolidayThemeTab/HolidayThemeTab.utils';
import {
    ThemeQuestions,
    THolidayThemeProps,
    TThemeAnswers,
} from 'frontend/components/renderings/HolidayThemeTab/interfaces';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import styles from './HolidayThemeTab.module.scss';

const HolidayThemeTab: FC<THolidayThemeProps> = ({ fields, rendering }) => {
    const { goToNextQuestion, goToPrevQuestion, getAnswersForActiveTab, setAnswer, trackEventWithParams, setGoalId } =
        useStore((stores: IHolidaysStores) => ({
            goToNextQuestion: stores.inspireMeStore.goToNextQuestion,
            goToPrevQuestion: stores.inspireMeStore.goToPrevQuestion,
            getAnswersForActiveTab: stores.inspireMeStore.getAnswersForActiveTab,
            setAnswer: stores.inspireMeStore.setAnswer,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
            setGoalId: stores.inspireMeStore.setGoalId,
        }));

    const availableQuestionsData = useMemo(() => getAvailableAnswers([], fields), [fields]);

    const isTablet = useTabletViewport();
    const [questionsState, setQuestionsState] = useState<TThemeAnswers>(() => {
        const answersFromStore = getAnswersForActiveTab<TThemeAnswers>();

        if (answersFromStore) {
            return Object.keys(answersFromStore).reduce((acc, key) => {
                const answerData =
                    key === ThemeQuestions.Vibe || key === ThemeQuestions.Type || key === ThemeQuestions.Weather
                        ? {
                              answer: answersFromStore[key].answer,
                              isActive: answersFromStore[key].isActive,
                              goalId: answersFromStore[key].goalId,
                          }
                        : {
                              answer: '',
                              isActive: false,
                              goalId: answersFromStore[key].goalId,
                          };

                return {
                    ...acc,
                    [key]: answerData,
                };
            }, {} as TThemeAnswers);
        }

        return availableQuestionsData.reduce(
            (acc, item, index) => ({ ...acc, [item.subType]: { answer: '', isActive: index === 0 } }),
            {} as TThemeAnswers,
        );
    });

    useMount(() => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Impressions,
                eventLabel: rendering.componentName,
                eventType: EventTypes.NonInteraction,
            },
            generateGenericValues({
                genericValue1: availableQuestionsData[0]?.answerVariants.map(item => item.fields.Code.value).join('|'),
                genericValue2: availableQuestionsData[1]?.answerVariants.map(item => item.fields.Code.value).join('|'),
                genericValue3: availableQuestionsData[2]?.answerVariants.map(item => item.fields.Code.value).join('|'),
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
    });

    const areAllQuestionsAnswered = Object.values(questionsState).every(item => !!item.answer.length);

    const handleNextQuestionClick = async (): Promise<void> => {
        await trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Continue,
                eventLabel: rendering.componentName,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                genericValue1: questionsState[ThemeQuestions.Type].answer,
                genericValue2: questionsState[ThemeQuestions.Vibe].answer,
                genericValue3: questionsState[ThemeQuestions.Weather].answer,
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );

        // Should not skip validation as next slide is Date Picker where we get available months based on the selected airports & weather.
        goToNextQuestion(false);
    };

    const handleBackQuestionClick = async (): Promise<void> => {
        await trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Back,
                eventLabel: rendering.componentName,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
        goToPrevQuestion();
    };

    const scrollToActiveQuestion = (activeElementId: ThemeQuestions): void => {
        if (!isTablet) {
            return;
        }

        const activeElement = document.getElementById(activeElementId);

        if (activeElement) {
            setTimeout(() => {
                scrollIntoViewHorizontal(activeElement);
            }, HALF_A_SECOND);
        }
    };

    const setQuestionsStateWithDelay = (state: TThemeAnswers): void => {
        if (!isTablet) {
            setQuestionsState(state);

            return;
        }

        setTimeout(() => {
            setQuestionsState(state);
        }, HALF_A_SECOND);
    };

    const onSelectHandler = (
        { target: { value, name } }: React.ChangeEvent<HTMLInputElement>,
        nextQuestionTitle: ThemeQuestions | undefined,
        goalId: string | undefined,
    ): void => {
        if (nextQuestionTitle && !questionsState[nextQuestionTitle].answer) {
            setQuestionsStateWithDelay({
                ...questionsState,
                [name]: {
                    answer: value,
                    isActive: false,
                    goalId: goalId,
                },
                [nextQuestionTitle]: {
                    answer: questionsState[nextQuestionTitle].answer,
                    isActive: true,
                    goalId: questionsState[nextQuestionTitle].goalId,
                },
            });

            scrollToActiveQuestion(nextQuestionTitle);

            return;
        }

        const notAnsweredQuestion = Object.keys(questionsState).find(key => !questionsState[key].answer);

        if (notAnsweredQuestion && notAnsweredQuestion !== name) {
            setQuestionsStateWithDelay({
                ...questionsState,
                [name]: {
                    answer: value,
                    isActive: false,
                    goalId: goalId,
                },
                [notAnsweredQuestion]: {
                    answer: questionsState[notAnsweredQuestion].answer,
                    isActive: true,
                    goalId: questionsState[notAnsweredQuestion].goalId,
                },
            });

            scrollToActiveQuestion(notAnsweredQuestion as ThemeQuestions);

            return;
        }

        setQuestionsStateWithDelay({
            ...questionsState,
            [name]: {
                answer: value,
                isActive: false,
                goalId: goalId,
            },
        });
    };

    const onQuestionClickHandler = (currentQuestionTitle: ThemeQuestions, isCurrentQuestionOpened: boolean): void => {
        const allInactiveQuestions = Object.keys(questionsState).reduce(
            (acc, key) => ({
                ...acc,
                [key]: {
                    ...questionsState[key],
                    isActive: false,
                },
            }),
            {} as TThemeAnswers,
        );

        if (isCurrentQuestionOpened) {
            setQuestionsState(allInactiveQuestions);

            return;
        }

        setQuestionsState((prevState: TThemeAnswers) => ({
            ...allInactiveQuestions,
            [currentQuestionTitle]: {
                answer: prevState[currentQuestionTitle].answer,
                isActive: true,
            },
        }));

        scrollToActiveQuestion(currentQuestionTitle);
    };

    useEffect(() => {
        //TO DO move back under the condition for the new quiz
        setAnswer<TThemeAnswers>(questionsState);

        if (areAllQuestionsAnswered) {
            // setAnswer<TThemeAnswers>(questionsState);
            setGoalId(questionsState?.typeQuestions?.goalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionsState]);

    return (
        <div className={classNames(commonStyles.questionWrapper, commonStyles.commonQuestionStructure)}>
            <div className={styles.wrapper}>
                <Text tag='h2' field={fields?.QuestionTitle} />

                <div className={styles.content}>
                    {availableQuestionsData.map((subQuestion, index) => {
                        const isQuestionOpened =
                            (isTablet && questionsState[subQuestion.subType].isActive) || !isTablet;

                        return (
                            <ExpandableItem
                                title={subQuestion.title}
                                isOpened={isQuestionOpened}
                                isDisabled={!isTablet}
                                titleClassName={styles.itemTitle}
                                expandArrowClassName={styles.itemExpandIcon}
                                className={styles.questionWrapper}
                                key={subQuestion.subType}
                                onOpen={(): void => {
                                    onQuestionClickHandler(subQuestion.subType, isQuestionOpened);
                                }}
                                id={subQuestion.subType}
                            >
                                <div className={styles.form} data-tid={`${subQuestion.subType}-options`}>
                                    {subQuestion.answerVariants.map(item => {
                                        const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>): void => {
                                            onSelectHandler(
                                                e,
                                                availableQuestionsData[index + 1]?.subType,
                                                item.fields.Goal?.id,
                                            );
                                        };

                                        return (
                                            <RadioButton
                                                dataTid={`${subQuestion.subType}-option`}
                                                key={item.fields.Code.value}
                                                value={item.fields.Code.value}
                                                name={subQuestion.subType}
                                                checked={
                                                    questionsState[subQuestion.subType].answer ===
                                                    item.fields.Code.value
                                                }
                                                onChange={onChangeHandler}
                                                className={styles.itemLabel}
                                            >
                                                <div
                                                    className={styles.itemContentWrapper}
                                                    style={getSitecoreImageBackgroundStyles(
                                                        item.fields.Icon,
                                                        MediaSize.Small,
                                                        true,
                                                        false,
                                                    )}
                                                >
                                                    <div className={styles.itemContent}>
                                                        <span className={styles.itemName}>
                                                            {item.fields.Name.value}
                                                        </span>
                                                        <span className={styles.itemDescription}>
                                                            {item.fields.Description?.value}
                                                        </span>
                                                        <SVGTick />
                                                    </div>
                                                </div>
                                            </RadioButton>
                                        );
                                    })}
                                </div>
                            </ExpandableItem>
                        );
                    })}
                </div>
            </div>

            <QuestionFooter
                onNextClick={handleNextQuestionClick}
                onBackClick={handleBackQuestionClick}
                isNextButtonDisabled={!areAllQuestionsAnswered}
            />
        </div>
    );
};

export default observer(HolidayThemeTab);
