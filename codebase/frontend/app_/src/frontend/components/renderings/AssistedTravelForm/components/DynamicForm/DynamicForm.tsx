import React, { FC } from 'react';

import { IDynamicFormState } from 'frontend/components/renderings/AssistedTravelForm/hooks/useDynamicForm';
import { PopupType } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import DynamicFormSection from './components/DynamicFormSection/DynamicFormSection';

export interface IDynamicFormProps {
    formState: IDynamicFormState;
    togglePopup: (popup: PopupType | null) => void;
}
const DynamicForm: FC<IDynamicFormProps> = ({ formState, togglePopup }) => {
    const { answers, errors, isQuestionVisible, setAnswer, currentSection, goNext, goPrev } = formState;

    if (!currentSection) return null;

    return (
        <form noValidate name='dynamic-form'>
            <DynamicFormSection
                section={currentSection}
                answers={answers}
                errors={errors}
                isQuestionVisible={isQuestionVisible}
                setAnswer={setAnswer}
                goNext={goNext}
                goPrevious={goPrev}
                togglePopup={togglePopup}
            />
        </form>
    );
};

export default DynamicForm;
