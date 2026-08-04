import { FC, useState } from 'react';
import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMount } from 'frontend/hooks/useMount';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getQuizEventsCoreParamsOverride } from 'frontend/utils/tracking/inspireMeQuiz.utils';
import { generateGenericValues } from 'frontend/utils/tracking/tracking.utils';
import { ITravelGroupFields } from 'models/data/IHolidayInspiration';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import QuestionFooter from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter';
import JSSImage from 'frontend/components/common/JSSImage';
import RadioButton from 'frontend/components/common/RadioButton';
import SvgTick from 'frontend/components/icons-new/Tick';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import styles from './TravelGroupTab.module.scss';

export type TTravelGroupProps = ISitecoreComponent<ITravelGroupFields>;

const TravelGroupTab: FC<TTravelGroupProps> = ({ fields, rendering }) => {
    const { goToNextQuestion, goToPrevQuestion, setAnswer, getAnswersForActiveTab, trackEventWithParams } = useStore(
        (stores: IHolidaysStores) => ({
            goToNextQuestion: stores.inspireMeStore.goToNextQuestion,
            goToPrevQuestion: stores.inspireMeStore.goToPrevQuestion,
            setAnswer: stores.inspireMeStore.setAnswer,
            getAnswersForActiveTab: stores.inspireMeStore.getAnswersForActiveTab,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
        }),
    );

    const travelGroupOptions = fields?.TravelGroupOptions;
    const availableGroups = travelGroupOptions;

    const [selectedGroup, setSelectedGroup] = useState<string>(() => {
        const answersFromStore = getAnswersForActiveTab<string>();

        if (answersFromStore) {
            return answersFromStore;
        }

        return '';
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
                genericValue1: availableGroups?.map(item => item.fields.Code.value).join('|'),
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
    });

    if (!fields) {
        return null;
    }

    const trackButtonClick = async (action: EventActions, genericValue1?: string): Promise<void> => {
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
                destinationUrl: null,
            }),
            undefined,
            undefined,
            getQuizEventsCoreParamsOverride(fields),
        );
    };

    const handleNextQuestionClick = async (): Promise<void> => {
        await trackButtonClick(EventActions.Continue, selectedGroup);
        goToNextQuestion();
    };

    const handleBackQuestionClick = async (): Promise<void> => {
        await trackButtonClick(EventActions.Back);
        goToPrevQuestion();
    };

    const onChangeHandler = (code: string): void => {
        setSelectedGroup(code);
        setAnswer<string>(code);
    };

    const isGroupSelected = (code: string): boolean => !!selectedGroup && code === selectedGroup;

    return (
        <div className={classNames(commonStyles.questionWrapper, commonStyles.commonQuestionStructure)}>
            <div className={styles.wrapper}>
                <Text tag='h2' field={fields?.QuestionTitle} />
                <div className={styles.content} data-tid='travel-group-content'>
                    <Text
                        tag='p'
                        field={fields?.TravelGroupQuestion}
                        className={styles.description}
                        data-tid='travel-group-description'
                    />
                    <div className={styles.groupWrapper} data-tid='travel-group-items-wrapper'>
                        {availableGroups?.map((item, i) => {
                            const { Name, Code, Icon } = item.fields;
                            const isItemSelected = isGroupSelected(Code.value);

                            return (
                                <RadioButton
                                    key={i}
                                    className={classNames(styles.groupCard, { [styles.selected]: isItemSelected })}
                                    onChange={(): void => onChangeHandler(Code.value)}
                                    dataTid='group-card'
                                    label={isItemSelected ? <SvgTick className={styles.selectedIcon} /> : ''}
                                    name='group'
                                    value={Code.value}
                                >
                                    {Icon?.value && (
                                        <>
                                            <ImageWithFilter
                                                imageSrc={Icon?.value.src}
                                                filterMatrix={SVGFilterMatrix.Orange}
                                                className={styles.icon}
                                            />
                                            <JSSImage field={Icon} className={styles.hoverIcon} />
                                        </>
                                    )}
                                    {Name?.value && <Text tag='div' field={Name} data-tid='travel-group-item-name' />}
                                </RadioButton>
                            );
                        })}
                    </div>
                </div>
            </div>
            <QuestionFooter
                onNextClick={handleNextQuestionClick}
                onBackClick={handleBackQuestionClick}
                isNextButtonDisabled={!selectedGroup.length}
            />
        </div>
    );
};

export default observer(TravelGroupTab);
