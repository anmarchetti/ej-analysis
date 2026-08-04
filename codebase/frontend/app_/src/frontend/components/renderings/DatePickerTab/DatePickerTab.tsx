import React, { FC, useMemo, useRef, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import { observer } from 'mobx-react';

import { DATE_FORMATS, DayjsLocale } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { removeNullOrUndefined } from 'frontend/utils/array.utils';
import { formatDateL10n, getCountOfNightLabel, getDaysDifference } from 'frontend/utils/date.utils';
import {
    getFlexibilityTrackingLabel,
    getQuizEventsCoreParamsOverride,
} from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import {
    IDatePickerFields,
    IDatePickerParams,
    IDatePickerTabAnswers,
    TDatePickerAnswer,
} from 'models/data/IHolidayInspiration';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import Button from 'frontend/components/common/Button';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import QuestionFooter from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import DatePickerSubTab from './components/DatePickerSubTab/DatePickerSubTab';
import MonthPickerSubTab from './components/MonthPickerSubTab/MonthPickerSubTab';

import styles from './DatePickerTab.module.scss';

const DEPARTURE_AND_RETURN_COUNT_OF_DATES = 2;
export enum CalendarType {
    Month = 'Month',
    Date = 'Date',
}

export type TDatePickerProps = ISitecoreComponent<IDatePickerFields, IDatePickerParams>;

const DatePickerTab: FC<TDatePickerProps> = ({ fields, rendering, params }) => {
    const {
        goToPrevQuestion,
        trackEventWithParams,
        getAnswersForActiveTab,
        goToNextQuestion,
        availableQuizAnswers,
        setAnswer,
        getPhrase,
    } = useStore((stores: IHolidaysStores) => ({
        goToNextQuestion: stores.inspireMeStore.goToNextQuestion,
        goToPrevQuestion: stores.inspireMeStore.goToPrevQuestion,
        getAnswersForActiveTab: stores.inspireMeStore.getAnswersForActiveTab,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
        availableQuizAnswers: stores.inspireMeStore.availableQuizAnswers,
        setAnswer: stores.inspireMeStore.setAnswer,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const answerFromStore = getAnswersForActiveTab<IDatePickerTabAnswers>();

    const [picker, setPicker] = useState<CalendarType>(() =>
        answerFromStore?.from ? CalendarType.Date : CalendarType.Month,
    );
    const isDatePickerShown = picker === CalendarType.Date;
    const isMonthPickerShown = picker === CalendarType.Month;

    const [flexibleDays, setFlexibleDays] = useState<number | undefined>(() => {
        if (answerFromStore?.flexibleDays) {
            return answerFromStore.flexibleDays;
        }

        return answerFromStore?.from ? 0 : undefined;
    });

    const [selectedDates, setSelectedDates] = useState<TDatePickerAnswer>(() => {
        if (answerFromStore?.from && answerFromStore?.to) {
            return [new Date(answerFromStore.from), new Date(answerFromStore.to)];
        }

        return [undefined, undefined];
    });

    const [selectedMonths, setSelectedMonths] = useState<Dayjs[]>(() => {
        const prevAnswer = getAnswersForActiveTab<IDatePickerTabAnswers>()?.months?.map(day => dayjs(day)) || [];

        // Months are zero indexed, so January is month 0!
        return prevAnswer.filter(date => availableQuizAnswers?.availableMonths?.includes(date.month() + 1));
    });

    const isNextButtonDisabled = useMemo(() => {
        if (isDatePickerShown) {
            return removeNullOrUndefined(selectedDates).length !== DEPARTURE_AND_RETURN_COUNT_OF_DATES;
        }

        return !selectedMonths.length;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [picker, selectedDates[1]?.getMilliseconds(), selectedMonths.length]);

    const trackButtonClick = async (
        action: EventActions,
        genericValue1?: string | null,
        genericValue2?: string,
        flexibleDays?: number,
    ): Promise<void> => {
        await trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventCategory: EventCategories.InspireMe,
                eventAction: action,
                eventLabel: rendering.componentName,
                eventType: EventTypes.Interaction,
            },
            generateGenericValues({
                genericValue1: genericValue1 ?? null,
                genericValue2: genericValue2 ?? null,
                genericValue3: getFlexibilityTrackingLabel(flexibleDays),
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
    };

    const handleNextQuestionClick = async (): Promise<void> => {
        const genericValue1 = isDatePickerShown ? formatDateL10n(selectedDates[0], DATE_FORMATS.query) : null;
        const genericValue2 = isDatePickerShown
            ? formatDateL10n(selectedDates[1], DATE_FORMATS.query)
            : selectedMonths
                  .map(dayjsMonth => formatDateL10n(dayjsMonth, DATE_FORMATS.fullMonthAndYear, DayjsLocale.En))
                  .join('|');

        await trackButtonClick(EventActions.Continue, genericValue1, genericValue2, flexibleDays);
        goToNextQuestion();
    };

    const handleBackQuestionClick = async (): Promise<void> => {
        await trackButtonClick(EventActions.Back);
        goToPrevQuestion();
    };

    const toggleMonthPicker = (): void => {
        setPicker(CalendarType.Month);
        setSelectedDates([undefined, undefined]);
        setFlexibleDays(undefined);
        setAnswer<IDatePickerTabAnswers | null>(null);
    };

    const toggleDatePicker = (): void => {
        setPicker(CalendarType.Date);
        setSelectedMonths([]);
        setFlexibleDays(0);
        setAnswer<IDatePickerTabAnswers | null>(null);
    };

    // we need to pre-save label value as it shouldn't immediately hide on mobile as we have animation that hide component with label itself
    const preSavedNightLabel = useRef<string>('');
    const nightLabel = useMemo(() => {
        if (!selectedDates[1] || !selectedDates[0]) {
            return '';
        }

        const countOfNight = getDaysDifference(selectedDates[1], selectedDates[0]);
        const label = getCountOfNightLabel(countOfNight, getPhrase);

        if (selectedDates[1]) {
            preSavedNightLabel.current = label;
        }

        return label;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDates]);

    if (!fields) {
        return null;
    }

    return (
        <div
            className={classNames(commonStyles.questionWrapper, commonStyles.commonQuestionStructure, styles.wrapper)}
            data-tid='inspire-me-date-picker-tab'
        >
            <div className={styles.content} data-tid='inspire-me-date-picker-tab-content'>
                <Text tag='h2' field={fields.QuestionTitle} />

                <div className={styles.switchWrapper}>
                    <Button
                        isText
                        className={classNames(styles.switchButton, isMonthPickerShown && styles.active)}
                        onClick={toggleMonthPicker}
                        dataTid='toggle-month-picker'
                    >
                        {fields.MonthPickerTabLabel?.value}
                    </Button>
                    <Button
                        isText
                        className={classNames(styles.switchButton, isDatePickerShown && styles.active)}
                        onClick={toggleDatePicker}
                        dataTid='toggle-date-picker'
                    >
                        {fields.DatePickerTabLabel?.value}
                    </Button>
                </div>

                {isDatePickerShown && flexibleDays !== undefined && (
                    <DatePickerSubTab
                        {...fields}
                        flexibleDays={flexibleDays}
                        setFlexibleDays={setFlexibleDays}
                        selectedDates={selectedDates}
                        setSelectedDates={setSelectedDates}
                        nightLabel={nightLabel}
                        IsCROVariant={params.IsCROVariant}
                    />
                )}

                {isMonthPickerShown && (
                    <MonthPickerSubTab
                        {...fields}
                        selectedMonths={selectedMonths}
                        setSelectedMonths={setSelectedMonths}
                    />
                )}
            </div>

            <QuestionFooter
                onNextClick={handleNextQuestionClick}
                onBackClick={handleBackQuestionClick}
                isNextButtonDisabled={isNextButtonDisabled}
            >
                <HeightAnimatedContainer isOpened={!!selectedDates[1]}>
                    <span data-tid='selected-nights-label' className={classNames(styles.selectedNights)}>
                        {preSavedNightLabel.current}
                    </span>
                </HeightAnimatedContainer>
            </QuestionFooter>
        </div>
    );
};

export default observer(DatePickerTab);
