import React, { FC, useMemo, useState } from 'react';
import classNames from 'classnames';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import { IQuestionAnswerFields } from 'models/data/IQuestionAnswerFields';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import TabAccordion, { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { getTabItems } from 'frontend/components/common/TabAccordion/utils/tabAccordion.utils';

import styles from './QuestionAndAnswer.module.scss';

export const QUESTION_AND_ANSWERS_ANCHOR_ID = 'question-and-answer';

interface IQuestionAnswerItem extends IQuestionAnswerFields {
    NavigationParameter: ISitecoreField<string>;
}

interface IQuestionAnswerParams {
    ZeroMargin?: TSitecoreCheckboxValue;
}

export interface IQuestionAnswerSitecoreItem extends ISitecoreComponent<IQuestionAnswerItem> {
    id: string;
}

interface IQuestionAndAnswerFields {
    items: IQuestionAnswerSitecoreItem[];
}

export type TQuestionAndAnswerProps = ISitecoreComponent<IQuestionAndAnswerFields, IQuestionAnswerParams>;

export const QuestionAndAnswer: FC<TQuestionAndAnswerProps> = ({ fields, params }) => {
    const isMoreThenTabletViewport = useMoreThenTabletViewport();
    const { redirectToQuestion, helpQuestion } = useStore(stores => ({
        redirectToQuestion: stores.routerStore.redirectToQuestion,
        helpQuestion: stores.queryParamStore.helpQuestion,
    }));

    const initSelectedCategoryId = useMemo(
        () => fields?.items.find(question => question?.fields?.NavigationParameter?.value === helpQuestion)?.id,
        [fields],
    );

    const tabItems = getTabItems(fields?.items || []);
    const [selectedTab, setSelectedTab] = useState<Nullable<ITabItem>>(
        tabItems.find(tab => tab.id === initSelectedCategoryId) || null,
    );

    if (!fields || fields?.items.length === 0) {
        return null;
    }

    const renderContent = (tab: ITabItem): JSX.Element | null =>
        tab.ContentTab ? (
            <div
                className={classNames(styles.contentContainer, {
                    [styles.open]: isMoreThenTabletViewport || tab.id === selectedTab?.id,
                })}
            >
                <RichTextWithLinks
                    field={tab.ContentTab}
                    className={styles.content}
                    dataId='question-and-answer-content'
                />
            </div>
        ) : null;

    const onTabClick = (tabItem: ITabItem): void => {
        const selectedTabCategory = fields.items.find(item => item.id === tabItem.id);

        if (!isMoreThenTabletViewport && tabItem.id === selectedTab?.id) {
            setSelectedTab(null);
            redirectToQuestion();

            return;
        }

        setSelectedTab(tabItem);
        redirectToQuestion(undefined, selectedTabCategory?.fields?.NavigationParameter.value);
    };

    return (
        <TabAccordion
            id={QUESTION_AND_ANSWERS_ANCHOR_ID}
            renderContent={renderContent}
            items={tabItems}
            tabAccordionClassName={classNames(styles.wrapper, {
                [styles.withoutMargin]: isSitecoreCheckboxSelected(params.ZeroMargin),
            })}
            scrollIntoView={!isMoreThenTabletViewport}
            tabToggleClassName={styles.toggleBtn}
            tabToggleSelectedClassName={styles.toggleBtnSelected}
            onTabClick={onTabClick}
            defaultSelectedTabId={initSelectedCategoryId}
        />
    );
};

export default QuestionAndAnswer;
