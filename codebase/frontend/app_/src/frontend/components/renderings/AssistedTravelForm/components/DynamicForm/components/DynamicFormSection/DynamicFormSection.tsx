import React, { FC } from 'react';

import DynamicFormQuestion from 'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/components/DynamicFormQuestion/DynamicFormQuestion';
import SectionWrapper from 'frontend/components/renderings/AssistedTravelForm/components/SectionWrapper/SectionWrapper';
import {
    IAnswerAction,
    IFormSection,
    PopupType,
    TAnswerValue,
    TFormAnswers,
    TFormErrors,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

import styles from './DynamicFormSection.module.scss';

export interface IDynamicFormSectionProps {
    answers: TFormAnswers;
    errors: TFormErrors;
    goNext: () => void;
    goPrevious: () => void;
    isQuestionVisible: (id: string) => boolean;
    section: IFormSection;
    setAnswer: (id: string, value: TAnswerValue[], action?: IAnswerAction) => void;
    togglePopup: (popup: PopupType | null) => void;
}

const DynamicFormSection: FC<IDynamicFormSectionProps> = ({
    section,
    answers,
    errors,
    isQuestionVisible,
    setAnswer,
    goNext,
    goPrevious,
    togglePopup,
}) => (
    <SectionWrapper
        focusTrigger={section.id}
        primaryBtnText={section.buttonContent?.primaryButtonText}
        secondaryBtnText={section.buttonContent?.secondaryButtonText}
        primaryBtnScreenReaderText={section.buttonContent?.primaryButtonScreenReaderText}
        secondaryBtnScreenReaderText={section.buttonContent?.secondaryButtonScreenReaderText}
        primaryBtnAction={goNext}
        secondaryBtnAction={goPrevious}
    >
        <div className={styles.questions}>
            {section.questions.map(q => {
                if (!isQuestionVisible(q.id)) return null;

                return (
                    <DynamicFormQuestion
                        key={q.id}
                        question={q}
                        answers={answers}
                        errors={errors}
                        isQuestionVisible={isQuestionVisible}
                        setAnswer={setAnswer}
                        togglePopup={togglePopup}
                    />
                );
            })}
        </div>
    </SectionWrapper>
);

export default DynamicFormSection;
