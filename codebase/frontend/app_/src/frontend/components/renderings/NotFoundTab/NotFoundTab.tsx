import { FC, ReactElement } from 'react';
import * as React from 'react';
import { Placeholder, RichText } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { INotFoundTabFields } from 'models/data/IHolidayInspiration';
import { StaticQuestionTitle } from 'models/enum/InspireMeQuiz';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import QuestionFooter from 'frontend/components/common/InspireMeQuestionFooter/QuestionFooter';
import { TDealsDestinationsProps } from 'frontend/components/renderings/DealsDestinations/DealsDestinations';
import commonStyles from 'frontend/components/renderings/InspireMeTabs/InspireMeTabs.module.scss';

import styles from './NotFoundTab.module.scss';

export type TNotFoundTabProps = ISitecoreComponent<INotFoundTabFields>;

const NotFoundTab: FC<TNotFoundTabProps> = ({ fields, rendering }) => {
    const { redirectTo, setActiveStaticTabByTitle } = useStore((stores: IHolidaysStores) => ({
        redirectTo: stores.routerStore.redirectTo,
        setActiveStaticTabByTitle: stores.inspireMeStore.setActiveStaticTabByTitle,
    }));

    const handleBackQuestionClick = (): void => {
        setActiveStaticTabByTitle(StaticQuestionTitle.StartScreen);
    };

    const handleNextQuestionClick = (buttonLink: string | undefined): void => {
        buttonLink && redirectTo(buttonLink);
    };

    return (
        <div className={classNames(commonStyles.questionWrapper, styles.wrapper)}>
            <div className={styles.content}>
                <RichText field={fields?.Title} className={styles.title} data-tid='not-found-tab-title' />
                <RichText field={fields?.Subtitle} className={styles.description} data-tid='not-found-tab-subtitle' />
            </div>
            <Placeholder
                rendering={rendering}
                name={PlaceholderNames.InspireMePromo}
                renderEach={(component: ReactElement<TDealsDestinationsProps>) => {
                    const dealsDestinationComponentsFields = component?.props?.fields;
                    const buttonLink = dealsDestinationComponentsFields?.CTAUrl?.value?.href;

                    return (
                        <React.Fragment>
                            <div className={styles.dealsWrapper}>{component}</div>
                            <QuestionFooter
                                onNextClick={() => handleNextQuestionClick(buttonLink)}
                                onBackClick={handleBackQuestionClick}
                                prevButtonText={fields?.EditQuizCTAText?.value}
                                nextButtonText={dealsDestinationComponentsFields?.CTAText?.value}
                                className={styles.footer}
                                backButtonClassName={styles.backButton}
                                nextButtonClassName={styles.nextButton}
                            />
                        </React.Fragment>
                    );
                }}
            />
        </div>
    );
};

export default NotFoundTab;
