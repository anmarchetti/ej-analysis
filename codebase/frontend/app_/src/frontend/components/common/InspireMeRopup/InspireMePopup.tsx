import React, { useState } from 'react';
import { EventData, Swipeable } from 'react-swipeable';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS, DayjsLocale } from 'code/dates';
import { Tokens } from 'code/tokens';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getFlexibilityTrackingLabel } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { IDatePickerTabAnswers } from 'models/data/IHolidayInspiration';
import { DynamicQuestionTitle } from 'models/enum/InspireMeQuiz';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import { IThemeAnswerData, TThemeAnswers } from 'frontend/components/renderings/HolidayThemeTab/interfaces';

import styles from './InspireMePopup.module.scss';

export enum SwipeDirection {
    Down = 'Down',
    Up = 'Up',
}

const InspireMePopup = () => {
    const {
        getPhrase,
        quizResults,
        setQuizResult,
        redirectToHolidayInspirationPage,
        trackEventWithParams,
        quizTabsData,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        quizResults: stores.inspireMeStore.quizResults,
        setQuizResult: stores.inspireMeStore.setQuizResult,
        redirectToHolidayInspirationPage: stores.routerStore.redirectToHolidayInspirationPage,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        quizTabsData: stores.inspireMeStore.quizTabsData,
    }));

    const isMobile = useMobileViewport();
    const [translateY, setTranslateY] = useState(0);

    const quizResult = quizResults.length ? quizResults[0] : null;

    useMount(() => {
        if (quizResult) {
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventCategory: EventCategories.InspireMe,
                    eventAction: EventActions.Confirmation,
                    eventLabel: quizResult.name,
                    eventType: EventTypes.NonInteraction,
                },
                getCustomParams(),
            );
        }
    });

    if (!quizResult) {
        return null;
    }

    const getCustomParams = () =>
        quizTabsData.reduce(
            (acc, item) => {
                if (!item.isShownOnProgressBar) {
                    return acc;
                }

                if (item.title === DynamicQuestionTitle.DepartureAirport) {
                    const departureAirportTabAnswer: string[] = item.answer;

                    return { ...acc, genericValue1: departureAirportTabAnswer.join('|') };
                }

                if (item.title === DynamicQuestionTitle.TravelGroup) {
                    const travelGroupTabAnswer: string = item.answer;

                    return { ...acc, genericValue2: travelGroupTabAnswer };
                }

                if (item.title === DynamicQuestionTitle.HolidayTheme) {
                    const themeTabAnswers: TThemeAnswers = item.answer;
                    const answer = Object.values(themeTabAnswers)
                        .map((answerObject: IThemeAnswerData) => answerObject.answer)
                        .join('|');

                    return { ...acc, genericValue3: answer };
                }

                if (item.title === DynamicQuestionTitle.DatePicker) {
                    const datePickerTabAnswers: IDatePickerTabAnswers = item.answer;
                    const { from, to, flexibleDays, months } = datePickerTabAnswers;
                    const formattedFrom = formatDateL10n(from, DATE_FORMATS.query);
                    const formattedTo = formatDateL10n(to, DATE_FORMATS.query);
                    const flexibilityTrackingLabel = getFlexibilityTrackingLabel(flexibleDays);
                    const monthList =
                        months
                            ?.map(day => formatDateL10n(day, DATE_FORMATS.fullMonthAndYear, DayjsLocale.En))
                            .join('|') || '';

                    const dates = from ? `${formattedFrom}|${formattedTo}` : monthList;

                    return { ...acc, genericValue4: `${dates}|${flexibilityTrackingLabel}` };
                }

                return acc;
            },
            { destinationUrl: null },
        );

    const onClosePopup = () => {
        setQuizResult([]);
    };

    const onRedirectToQuiz = (): void => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: EventLabels.RepeatQuiz,
                eventType: EventTypes.Interaction,
            },
            getCustomParams(),
        );
        setQuizResult([]);
        redirectToHolidayInspirationPage();
    };

    const onViewDestinationClick = () => {
        trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: EventActions.Quiz,
                eventLabel: EventLabels.ViewDestination,
                eventType: EventTypes.Interaction,
            },
            getCustomParams(),
        );
        onClosePopup();
    };

    const onSwipedPopup = (eventData: EventData) => {
        if (!isMobile) {
            return;
        }

        if (eventData.dir === SwipeDirection.Down) {
            onClosePopup();
        }
    };

    const onSwipingPopup = (eventData: EventData) => {
        const { absY, deltaY, event } = eventData;

        event.preventDefault();
        event.stopPropagation();

        setTranslateY(deltaY < 0 ? absY : 0);
    };

    return (
        <div className={styles.wrapper}>
            <Popup onClose={onClosePopup} isCentered={!isMobile}>
                <div
                    style={{ transform: `translateY(${translateY}px)` }}
                    className={classNames(styles.content, isMobile && styles.contentMobile)}
                    data-tid='inspire-me-popup-content'
                >
                    <Swipeable
                        className={classNames(isMobile && styles.swipeZone)}
                        onSwiped={EventData => onSwipedPopup(EventData)}
                        onSwiping={EventData => {
                            onSwipingPopup(EventData);
                        }}
                        trackTouch
                    >
                        <JSSImage
                            dataTid='inspire-me-popup-image'
                            field={mockSitecoreField(mockSitecoreImageField(quizResult.imageUrl))}
                            className={classNames(styles.image)}
                        />
                    </Swipeable>
                    <div className={styles.innerContent} data-tid='inspire-me-popup-inner-content'>
                        <h2 className={styles.title} data-tid='inspire-me-popup-title'>
                            {Tokenizer.replaceToken(
                                getPhrase(SitecoreDictionary.InspireMePopupLabelsTitle),
                                Tokens.Name,
                                quizResult.name,
                            )}
                        </h2>
                        <p
                            className={classNames(styles.description, 'popup_description')}
                            data-tid='inspire-me-popup-description'
                        >
                            {quizResult.description}
                        </p>
                    </div>
                    <div className={styles.footer}>
                        <Button
                            isOutlined
                            isFullWidth={isMobile}
                            onClick={onRedirectToQuiz}
                            dataTid='inspire-me-popup-repeat-button'
                        >
                            {getPhrase(SitecoreDictionary.InspireMePopupButtonsRepeatTest)}
                        </Button>
                        <Button
                            onClick={onViewDestinationClick}
                            className={classNames(styles.cta, 'popup_cta')}
                            dataTid='cancel-button'
                            isMedium
                            isFullWidth={isMobile}
                        >
                            {getPhrase(SitecoreDictionary.InspireMePopupButtonsViewDestination)}
                        </Button>
                    </div>
                </div>
            </Popup>
        </div>
    );
};

export default observer(InspireMePopup);
