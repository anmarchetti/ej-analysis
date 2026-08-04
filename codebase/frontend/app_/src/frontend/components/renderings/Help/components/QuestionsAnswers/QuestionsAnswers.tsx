import React, { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IFAQRatingFields } from 'models/data/IFAQRatingFields';
import { TrackHelpCentreClickLocation } from 'models/enum/tracking/TrackHelpCentreClickLocation';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import TabAccordionCollapse from 'frontend/components/common/TabAccordion/components/TabAccordionCollapse/TabAccordionCollapse';
import { ITabItem } from 'frontend/components/common/TabAccordion/TabAccordion';
import { getTabItems } from 'frontend/components/common/TabAccordion/utils/tabAccordion.utils';
import FaqRating from 'frontend/components/renderings/Help/components/FaqRating/FaqRating';
import { ICategoriesSitecoreItem } from 'frontend/components/renderings/Help/FAQ';
import { IQuestionAnswerSitecoreItem } from 'frontend/components/renderings/QuestionAndAnswer/QuestionAndAnswer';

import styles from './QuestionsAnswers.module.scss';

export interface IQuestionsAnswersProps {
    category: ICategoriesSitecoreItem;
    faqRatingFields?: IFAQRatingFields;
}

export const QuestionsAnswers: FC<IQuestionsAnswersProps> = ({ category, faqRatingFields }) => {
    const { helpQuestion, redirectToQuestion, trackHelpCentreClick } = useStore(
        ({ queryParamStore, routerStore, trackingStore }: TStores) => ({
            helpQuestion: queryParamStore.helpQuestion,
            redirectToQuestion: routerStore.redirectToQuestion,
            trackHelpCentreClick: trackingStore.trackHelpCentreClick,
        }),
    );

    const initSelectedQuestion = (): IQuestionAnswerSitecoreItem | undefined =>
        category.fields?.Questions.find(question => question?.fields?.NavigationParameter?.value === helpQuestion);

    const [selectedQuestion, setSelectedQuestion] = useState(initSelectedQuestion);

    if (!category.fields) {
        return null;
    }

    const { CategoryTitle, Questions, NavigationParameter: CategoryNavigationParameter } = category.fields;
    const QuestionNavigationParameter = selectedQuestion?.fields?.NavigationParameter;

    const onQuestionClick = (question: ITabItem): void => {
        const selectedTabQuestion = Questions.find(item => item.id === question.id);
        const selectedQuestionNavigationParameter = selectedTabQuestion?.fields?.NavigationParameter;

        if (question.id === selectedQuestion?.id) {
            redirectToQuestion(category.fields.NavigationParameter.value);
            setSelectedQuestion(undefined);
            trackHelpCentreClick(
                false,
                TrackHelpCentreClickLocation.Question,
                CategoryNavigationParameter.value,
                selectedQuestionNavigationParameter?.value,
            );
        } else {
            redirectToQuestion(category.fields.NavigationParameter.value, selectedQuestionNavigationParameter?.value);
            trackHelpCentreClick(
                false,
                TrackHelpCentreClickLocation.Question,
                CategoryNavigationParameter.value,
                QuestionNavigationParameter?.value,
            );
            trackHelpCentreClick(
                true,
                TrackHelpCentreClickLocation.Question,
                CategoryNavigationParameter.value,
                selectedQuestionNavigationParameter?.value,
            );
            setSelectedQuestion(selectedTabQuestion);
        }
    };

    const questionsItems = getTabItems(Questions);

    const renderContent = (questionsItem: ITabItem): JSX.Element => {
        const question = Questions.find(item => item.id === questionsItem.id);
        const isSelectedQuestion = question?.id === selectedQuestion?.id;

        return (
            <div
                className={classNames(styles.contentContainer, {
                    [styles.active]: isSelectedQuestion,
                })}
                data-tid='answer-content-container'
            >
                <RichTextWithLinks field={question?.fields?.Answer} className={styles.content} />
                {isSelectedQuestion && (
                    <FaqRating
                        fields={faqRatingFields}
                        questionId={selectedQuestion?.id || ''}
                        categoryNavParameter={CategoryNavigationParameter.value}
                        questionNavParameter={QuestionNavigationParameter?.value}
                        questionName={selectedQuestion?.fields?.Question.value}
                        categoryName={category.fields.CategoryTitle.value}
                    />
                )}
            </div>
        );
    };

    return (
        <div className={styles.container} data-tid={'questions-answers-container'}>
            <Text field={CategoryTitle} tag='div' className={styles.title} data-tid='category-title' />
            <div className={styles.questionAnswerContainer}>
                {questionsItems.map(question => (
                    <TabAccordionCollapse
                        key={question.id}
                        tab={question}
                        isOpened={selectedQuestion?.id === question.id}
                        onTabClick={onQuestionClick}
                        renderContent={renderContent}
                        scrollIntoView
                        tabCollapseBtnClassName={styles.tabCollapseButton}
                        tabCollapseBtnSelectedClassName={styles.tabCollapseButtonSelected}
                        tabCollapseClassName={styles.tabCollapse}
                    />
                ))}
            </div>
        </div>
    );
};

export default QuestionsAnswers;
