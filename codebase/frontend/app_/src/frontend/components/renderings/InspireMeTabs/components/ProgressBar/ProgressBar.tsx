import { FC, useEffect, useState } from 'react';
import * as React from 'react';
import CountUp from 'react-countup';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IHolidayInspirationFields } from 'models/data/IHolidayInspiration';

import styles from './ProgressBar.module.scss';

export interface IProgressBar {
    fields: IHolidayInspirationFields | undefined;
}

const DURATION_OF_COUNT_UP_ANIMATION = 1.2;

const ProgressBar: FC<IProgressBar> = ({ fields }) => {
    const { quizTabsData, percentageOfPassedQuestions, activeQuestionIndex } = useStore((stores: IHolidaysStores) => ({
        quizTabsData: stores.inspireMeStore.quizTabsData,
        percentageOfPassedQuestions: stores.inspireMeStore.percentageOfPassedQuestions,
        activeQuestionIndex: stores.inspireMeStore.activeQuestionIndex,
    }));

    const [percentage, setPercentage] = useState({ prev: 0, current: 0 });

    useEffect(() => {
        if (activeQuestionIndex === 0) {
            setPercentage({ prev: 0, current: 0 });

            return;
        }

        setPercentage(prevState => ({
            prev: prevState.current,
            current: percentageOfPassedQuestions,
        }));
    }, [percentageOfPassedQuestions]);

    const progressBarTabs = quizTabsData.reduce((acc, item, index) => {
        if (!item.isShownOnProgressBar) {
            return acc;
        }

        return [...acc, { progressBarTitle: item.progressBarTitle, isActive: index === activeQuestionIndex }];
    }, []);

    return (
        <div className={styles.wrapper} data-tid='progress-bar'>
            <Text tag='h2' field={fields?.ProgressTitle} className={styles.title} />
            <CountUp
                className={classNames(styles.percentageTitle, 'data-tid-progress-bar-percentage')}
                end={percentage.current}
                start={percentage.prev}
                duration={DURATION_OF_COUNT_UP_ANIMATION}
                suffix='%'
            />
            <div className={styles.progressBar}>
                <div className={styles.fillingBar} style={{ width: `${percentageOfPassedQuestions}%` }} />
            </div>
            <Text tag='p' field={fields?.ProgressSubtitle} className={styles.description} />
            <div className={styles.steps}>
                {progressBarTabs.map((item, index) => (
                    <div
                        key={item.progressBarTitle}
                        data-tid={item.progressBarTitle}
                        className={classNames(styles.step, { [styles.activeStep]: item.isActive })}
                    >
                        <span className={styles.number}>{index + 1}</span>
                        <span className={styles.progressBarTitle}>{item.progressBarTitle}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default observer(ProgressBar);
