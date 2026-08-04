import React, { FC, Fragment, useEffect, useLayoutEffect } from 'react';
import { withPlaceholder } from '@sitecore-jss/sitecore-jss-react';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { lockBodyScroll, unLockBodyScroll } from 'frontend/utils/ui.utils';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { THolidayInspirationProps, TQuizTabData } from 'models/data/IHolidayInspiration';
import { StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import ProgressBar from 'frontend/components/renderings/InspireMeTabs/components/ProgressBar/ProgressBar';
import styles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';
import { getInitialQuestions } from 'frontend/components/renderings/InspireMeTabs/utils/utils';

export const InspireMeTabs: FC<THolidayInspirationProps> = props => {
    const {
        setTabsData,
        isEditMode,
        trackInspireMePageLoad,
        activeQuestionIndex,
        setActiveStaticTabByTitle,
        normalizeQuizTabsData,
    } = useStore((stores: IHolidaysStores) => ({
        setTabsData: stores.inspireMeStore.setTabsData,
        isEditMode: stores.layoutStore.isEditMode,
        trackInspireMePageLoad: stores.trackingStore.trackInspireMePageLoad,
        activeQuestionIndex: stores.inspireMeStore.activeQuestionIndex,
        setActiveStaticTabByTitle: stores.inspireMeStore.setActiveStaticTabByTitle,
        normalizeQuizTabsData: stores.inspireMeStore.normalizeQuizTabsData,
    }));

    const isMobile = useMobileViewport();

    useLayoutEffect(() => {
        const questionsFromStorage = getWebStorageItem<TQuizTabData[] | undefined>(
            WebStorageKeys.InspireMeQuiz,
            true,
            sessionStorage,
        );

        if (questionsFromStorage?.length) {
            setTabsData(normalizeQuizTabsData(questionsFromStorage));
        } else {
            const initialQuestions = getInitialQuestions(props.QuestionsData);
            setTabsData(initialQuestions);
        }

        setActiveStaticTabByTitle(StaticQuestionTitle.StartScreen);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => () => {
            setActiveStaticTabByTitle(StaticQuestionTitle.StartScreen);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        if (isMobile) {
            lockBodyScroll();
        } else {
            unLockBodyScroll();
        }

        return () => {
            unLockBodyScroll();
        };
    }, [isMobile]);

    useEffect(() => {
        if (!props.QuestionsData.length) {
            return;
        }

        const questionData = props.QuestionsData[activeQuestionIndex];
        const activeQuestionTitle = questionData.props.rendering.componentName;
        // Departure Airport Tab has different structure for TrackingItemName (fields.data.TrackingItemName)
        trackInspireMePageLoad(
            activeQuestionTitle,
            questionData.props.rendering.fields.TrackingItemName?.value ||
                questionData.props.rendering.fields.data.TrackingItemName?.value ||
                '',
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeQuestionIndex]);

    return (
        <div className={styles.mainScreen} data-tid='inspire-me-main-screen'>
            <div className={styles.quizScreen}>
                <ProgressBar fields={props.fields} />

                {!isEditMode &&
                    props.QuestionsData.map((item, index) => {
                        if (activeQuestionIndex === index) {
                            return <Fragment key={item.props.rendering.componentName}>{item as any}</Fragment>;
                        }

                        return null;
                    })}

                {isEditMode && <div className={styles.editModeWrapper}>{props.QuestionsData as any}</div>}
            </div>
        </div>
    );
};

const tabsComponentWithPlaceholderInjected = withPlaceholder({
    placeholder: PlaceholderNames.InspireMeTabs,
    prop: 'QuestionsData',
})(observer(InspireMeTabs));

export default tabsComponentWithPlaceholderInjected;
