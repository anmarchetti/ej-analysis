import React, { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IFAQRatingFields } from 'models/data/IFAQRatingFields';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { TrackHelpCentreClickLocation } from 'models/enum/tracking/TrackHelpCentreClickLocation';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import TabAccordion, { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { getFaqTabItems } from 'frontend/components/common/TabAccordion/utils/tabAccordion.utils';
import MobileBackButton from 'frontend/components/renderings/Help/components/MobileBackButton';
import QuestionsAnswers from 'frontend/components/renderings/Help/components/QuestionsAnswers/QuestionsAnswers';
import { IQuestionAnswerSitecoreItem } from 'frontend/components/renderings/QuestionAndAnswer/QuestionAndAnswer';

import styles from './FAQ.module.scss';

export const FAQ_ID = 'faq-tab-accordion';

export interface ICategoriesFields {
    CategoryTitle: ISitecoreField<string>;
    NavigationParameter: ISitecoreField<string>;
    Questions: IQuestionAnswerSitecoreItem[];
}

export interface ICategoriesSitecoreItem {
    fields: ICategoriesFields;
    id: string;
}

export interface IFAQFields extends IFAQRatingFields {
    Categories: ICategoriesSitecoreItem[];
}

export type TFAQProps = ISitecoreComponent<IFAQFields>;

const FAQ: FC<TFAQProps> = ({ fields }) => {
    const { redirectToQuestion, helpQuestion, helpCategory, getPhrase, trackHelpCentreClick } = useStore(stores => ({
        helpQuestion: stores.queryParamStore.helpQuestion,
        helpCategory: stores.queryParamStore.helpCategory,
        redirectToQuestion: stores.routerStore.redirectToQuestion,
        getPhrase: stores.layoutStore.getPhrase,
        trackHelpCentreClick: stores.trackingStore.trackHelpCentreClick,
    }));

    const initSelectedCategoryId = useMemo(
        () => fields?.Categories.find(category => category?.fields?.NavigationParameter?.value === helpCategory)?.id,
        [fields, helpCategory],
    );
    const faqItems = getFaqTabItems(fields?.Categories || []);

    const [isDrawerOpened, setIsDrawerOpened] = useState(false);
    const [selectedTab, setSelectedTab] = useState<Nullable<ITabItem>>(
        faqItems.find(item => item.id === initSelectedCategoryId) || null,
    );
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    useEffect(() => {
        trackHelpCentreClick(true, TrackHelpCentreClickLocation.Url, helpCategory, helpQuestion);

        return () => {
            trackHelpCentreClick(false, TrackHelpCentreClickLocation.Exit, helpCategory, helpQuestion);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isMoreThenTabletViewport) {
            setIsDrawerOpened(false);
        } else {
            setIsDrawerOpened(!!(helpCategory || helpQuestion));
        }
    }, [isMoreThenTabletViewport, helpCategory, helpQuestion]);

    if (!fields?.Categories?.length) {
        return null;
    }

    const onCategoryClick = (tabItem: ITabItem): void => {
        const selectedTabCategory = fields?.Categories.find(item => item.id === tabItem.id);
        setSelectedTab(tabItem);
        redirectToQuestion(selectedTabCategory?.fields?.NavigationParameter.value);

        !isMoreThenTabletViewport && setIsDrawerOpened(true);
    };

    const handleCloseClick = (): void => {
        setIsDrawerOpened(false);
        redirectToQuestion();
    };
    const renderContent = (tab: ITabItem): JSX.Element | null => {
        const selectedCategory = fields?.Categories.find(category => category?.id === tab.id);

        if (selectedCategory) {
            return isMoreThenTabletViewport ? (
                <QuestionsAnswers category={selectedCategory} faqRatingFields={fields} />
            ) : (
                <Drawer
                    open={isDrawerOpened}
                    className={classNames(styles.drawer, { [styles.open]: tab.id === selectedTab?.id })}
                    dataTid='faq-drawer'
                >
                    <QuestionsAnswers category={selectedCategory} faqRatingFields={fields} />
                    <div className='drawer__actions'>
                        <Button isTransparent isFullWidth onClick={handleCloseClick} dataTid='close-btn'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    </div>
                </Drawer>
            );
        }

        return null;
    };

    return (
        <>
            <TabAccordion
                renderContent={renderContent}
                items={faqItems}
                onTabClick={onCategoryClick}
                tabAccordionClassName={styles.container}
                id={FAQ_ID}
                scrollIntoView={isMoreThenTabletViewport}
                defaultSelectedTabId={initSelectedCategoryId}
                tabCollapseBtnClassName={styles.tabCollapseBtn}
            />
            <MobileBackButton />
        </>
    );
};

export default FAQ;
