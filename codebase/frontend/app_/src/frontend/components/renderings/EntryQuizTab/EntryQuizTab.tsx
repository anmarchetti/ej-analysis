import { FC } from 'react';
import classNames from 'classnames';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { IStartQuizFields } from 'models/data/IHolidayInspiration';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import styles from './EntryQuizTab.module.scss';

export type TEntryQuizTabProps = ISitecoreComponent<IStartQuizFields>;

const EntryQuizTab: FC<TEntryQuizTabProps> = ({ fields }) => {
    const { goToNextQuestion, clearAnswers, isQuizFinishedBefore, trackEventWithParams } = useStore(
        (stores: IHolidaysStores) => ({
            goToNextQuestion: stores.inspireMeStore.goToNextQuestion,
            clearAnswers: stores.inspireMeStore.clearAnswers,
            isQuizFinishedBefore: stores.inspireMeStore.isQuizFinishedBefore,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
        }),
    );

    const isMobile = useMobileViewport();

    const handleNextQuestionClick = (eventLabel: EventLabels, shouldClearAnswers?: boolean): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: eventLabel,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );

        if (shouldClearAnswers) {
            clearAnswers();
        }

        goToNextQuestion(true);
    };

    const onClickStart = (): void => {
        handleNextQuestionClick(EventLabels.Start);
    };

    const onClickEditAnswers = (): void => {
        handleNextQuestionClick(EventLabels.EditYourAnswers);
    };

    const onClickStartNew = (): void => {
        handleNextQuestionClick(EventLabels.StartNewQuiz, true);
    };

    return (
        <div className={classNames(styles.wrapper, commonStyles.questionWrapper)} data-tid='entry-quiz-tab'>
            {fields?.BackgroundImage && (
                <div className={styles.background} data-tid='entry-quiz-tab-background'>
                    {fields?.BackgroundImage.map(item => (
                        <JSSImage field={item.fields.Image} className={styles.backgroundImage} key={item.id} />
                    ))}
                </div>
            )}
            <div className={styles.content} data-tid='entry-quiz-tab-content'>
                <h3 className={styles.title} data-tid='entry-quiz-tab-title'>
                    {fields?.Title?.value}
                </h3>
                <p className={styles.description} data-tid='entry-quiz-tab-description'>
                    {fields?.Description?.value}
                </p>

                <div className={styles.controls}>
                    {!isQuizFinishedBefore && (
                        <Button
                            onClick={onClickStart}
                            isFullWidth={isMobile}
                            isMedium={isMobile}
                            dataTid='entry-quiz-tab-start-button'
                        >
                            {fields?.StartQuizCTAText?.value}
                        </Button>
                    )}
                    {isQuizFinishedBefore && (
                        <>
                            <Button
                                onClick={onClickEditAnswers}
                                isFullWidth={isMobile}
                                isMedium={isMobile}
                                dataTid='entry-quiz-tab-edit-button'
                            >
                                {fields?.EditQuizCTAText?.value}
                            </Button>

                            <Button
                                onClick={onClickStartNew}
                                isOutlined
                                isFullWidth={isMobile}
                                isMedium={isMobile}
                                dataTid='entry-quiz-tab-restart-button'
                            >
                                {fields?.StartNewQuizCTAText?.value}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntryQuizTab;
