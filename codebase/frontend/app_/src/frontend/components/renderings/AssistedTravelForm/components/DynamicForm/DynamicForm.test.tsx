import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IFormSection, QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import DynamicForm, { IDynamicFormProps } from './DynamicForm';

const mockDynamicFormSectionProps = jest.fn();
jest.mock('./components/DynamicFormSection/DynamicFormSection', () => ({
    __esModule: true,
    default: (props: any) => {
        mockDynamicFormSectionProps(props);

        return <div data-tid='dynamic-form-section' />;
    },
}));

const mockSection: IFormSection = {
    id: 'section-1',
    sitecoreKey: 'section-1-key',
    title: 'Section 1',
    questions: [
        {
            id: 'AT-006',
            label: 'Battery capacity (Watt-hours/Wh)',
            description: 'Wattage',
            additionalInfo: 'Add Wattage in Watt/hours',
            type: QuestionType.NumberInput,
        },
        {
            id: 'AT-007',
            label: 'Test Question 2',
            type: QuestionType.NumberInput,
        },
    ],
    buttonContent: {
        primaryButtonScreenReaderText: { value: 'Next' },
        primaryButtonText: { value: 'Next' },
        secondaryButtonScreenReaderText: { value: 'Previous' },
        secondaryButtonText: { value: 'Previous' },
    },
};

const createProps = (overrides = {}): IDynamicFormProps => ({
    formState: {
        answers: new Map(),
        errors: new Map(),
        isQuestionVisible: jest.fn(),
        setAnswer: jest.fn(),
        currentSection: mockSection,
        goNext: jest.fn(),
        goPrev: jest.fn(),
        validateCurrentSection: jest.fn(() => true),
        currentStepInProgressBar: 0,
        currentSectionName: 'title',
        resetDynamicForm: jest.fn(),
        totalProgressBarSteps: 1,
        goToFormStart: jest.fn(),
        ...overrides,
    },
    togglePopup: jest.fn(),
    ...overrides,
});

let mockProps = createProps();

describe('DynamicForm', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockDynamicFormSectionProps.mockClear();
    });

    it('should render DynamicFormSection with correct props', () => {
        render(<DynamicForm {...mockProps} />);
        expect(mockDynamicFormSectionProps).toHaveBeenCalledWith({
            section: mockSection,
            answers: mockProps.formState.answers,
            errors: mockProps.formState.errors,
            isQuestionVisible: mockProps.formState.isQuestionVisible,
            setAnswer: mockProps.formState.setAnswer,
            goNext: mockProps.formState.goNext,
            goPrevious: mockProps.formState.goPrev,
            togglePopup: mockProps.togglePopup,
        });
        expect(mockDynamicFormSectionProps).toHaveBeenCalledTimes(1);
    });

    it('should not call onSubmit if validateCurrentSection returns false', () => {
        const onSubmit = jest.fn();
        mockProps = {
            ...mockProps,
            formState: {
                ...mockProps.formState,
                validateCurrentSection: jest.fn(() => false),
            },
        };
        render(<DynamicForm {...mockProps} />);

        fireEvent.submit(screen.getByRole('form'));
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should render null if currentSection is not present', () => {
        const props = createProps({
            formState: {
                ...mockProps.formState,
                currentSection: undefined,
            },
        });
        const { container } = render(<DynamicForm {...props} />);
        expect(container).toBeEmptyDOMElement();
    });
});
