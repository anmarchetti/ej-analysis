import React from 'react';
import { render, screen } from '@testing-library/react';

import { QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import DynamicFormQuestion, { IDynamicFormQuestionProps } from './DynamicFormQuestion';

const mockInputSetQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/InputSetQuestion/InputSetQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockInputSetQuestionProps(props);

            return <div data-tid='input-set-question' />;
        },
    }),
);

const mockTextareaQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/TextareaQuestion/TextareaQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockTextareaQuestionProps(props);

            return <div data-tid='textarea-question' />;
        },
    }),
);

const mockInputQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/InputQuestion/InputQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockInputQuestionProps(props);

            return <div data-tid='input-question' />;
        },
    }),
);

const mockRadioQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/RadioQuestion/RadioQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockRadioQuestionProps(props);

            return <div data-tid='radio-question' />;
        },
    }),
);

const mockMultiSelectQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/MultiSelectQuestion/MultiSelectQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockMultiSelectQuestionProps(props);

            return <div data-tid='multi-select-question' />;
        },
    }),
);

const mockAgreeDisagreeQuestionProps = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/AgreeDisagree/AgreeDisagree',
    () => ({
        __esModule: true,
        default: props => {
            mockAgreeDisagreeQuestionProps(props);

            return <div data-tid='agree-disagree-question' />;
        },
    }),
);

const mockInfoOnlyQuestionProps = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/InfoOnly/InfoOnly', () => ({
    __esModule: true,
    default: props => {
        mockInfoOnlyQuestionProps(props);

        return <div data-tid='info-only-question' />;
    },
}));

const createProps = (): IDynamicFormQuestionProps => ({
    answers: new Map(),
    errors: new Map(),
    isQuestionVisible: () => true,
    question: { id: 'q1', type: QuestionType.InputSet },
    setAnswer: jest.fn(),
    togglePopup: jest.fn(),
});

let mockProps = createProps();

describe('DynamicFormQuestion', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render InputSetQuestion', () => {
        mockProps.question = { id: 'q1', type: QuestionType.InputSet };
        mockProps.answers.set('q1', {
            questionText: 'q1 Question',
            questionTextForSubmission: 'q1 Question',
            answers: [{ answerId: 'q1-01', value: 'test answer' }],
        });
        mockProps.errors.set('q1', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('input-set-question')).toBeInTheDocument();
        expect(mockInputSetQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            answers: mockProps.answers,
            errors: mockProps.errors,
            isQuestionVisible: mockProps.isQuestionVisible,
            setAnswer: mockProps.setAnswer,
            togglePopup: mockProps.togglePopup,
        });
    });

    it('should render TextInputQuestion', () => {
        mockProps.question = { id: 'q1', type: QuestionType.TextInput };
        mockProps.answers.set('q1', {
            questionText: 'q1 Question',
            questionTextForSubmission: 'q1 Question',
            answers: [{ answerId: 'q1-01', value: 'test answer' }],
        });
        mockProps.errors.set('q1', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('input-question')).toBeInTheDocument();
        expect(mockInputQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            value: { answerId: 'q1-01', value: 'test answer' },
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render TextareaQuestion', () => {
        mockProps.question = { id: 'q1', type: QuestionType.Textarea };
        mockProps.answers.set('q1', {
            questionText: 'q1 Question',
            questionTextForSubmission: 'q1 Question',
            answers: [{ answerId: 'q1-01', value: 'test answer' }],
        });
        mockProps.errors.set('q1', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('textarea-question')).toBeInTheDocument();
        expect(mockTextareaQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            value: { answerId: 'q1-01', value: 'test answer' },
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render NumberInputQuestion', () => {
        mockProps.question = { id: 'q1', type: QuestionType.NumberInput };
        mockProps.answers.set('q1', {
            questionText: 'q1 Question',
            questionTextForSubmission: 'q1 Question',
            answers: [{ answerId: 'q1-01', value: 123 }],
        });
        mockProps.errors.set('q1', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('input-question')).toBeInTheDocument();
        expect(mockInputQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            value: { answerId: 'q1-01', value: 123 },
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render RadioQuestion', () => {
        mockProps.question = { id: 'q5', type: QuestionType.Radio };
        mockProps.answers.set('q5', {
            questionText: 'q5 Question',
            questionTextForSubmission: 'q5 Question',
            answers: [{ answerId: 'q5-01', value: '123' }],
        });
        mockProps.errors.set('q5', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('radio-question')).toBeInTheDocument();
        expect(mockRadioQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            value: { answerId: 'q5-01', value: '123' },
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render TravelCompanionSelection as RadioQuestion', () => {
        mockProps.question = { id: 'q5', type: QuestionType.TravelCompanionSelection };
        mockProps.answers.set('q5', {
            questionText: 'q5 Question',
            questionTextForSubmission: 'q5 Question',
            answers: [{ answerId: 'q5-01', value: '123' }],
        });
        mockProps.errors.set('q5', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('radio-question')).toBeInTheDocument();
        expect(mockRadioQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            value: { answerId: 'q5-01', value: '123' },
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render MultiSelectQuestion', () => {
        mockProps.question = { id: 'q6', type: QuestionType.MultiSelect };
        mockProps.answers.set('q6', {
            questionText: 'q6 Question',
            questionTextForSubmission: 'q6 Question',
            answers: [
                { answerId: 'q6-01', value: '111' },
                { answerId: 'q6-02', value: '12345' },
            ],
        });
        mockProps.errors.set('q6', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('multi-select-question')).toBeInTheDocument();
        expect(mockMultiSelectQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            answers: [
                { answerId: 'q6-01', value: '111' },
                { answerId: 'q6-02', value: '12345' },
            ],
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render AgreeDisagreeQuestion', () => {
        mockProps.question = { id: 'q7', type: QuestionType.AgreeDisagree };
        mockProps.errors.set('q7', 'test error');
        render(<DynamicFormQuestion {...mockProps} />);
        expect(screen.getByTestId('agree-disagree-question')).toBeInTheDocument();
        expect(mockAgreeDisagreeQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            error: 'test error',
            onChange: expect.any(Function),
        });
    });

    it('should render InfoOnlyQuestion', () => {
        mockProps.question = { id: 'q8', type: QuestionType.InfoOnly };
        render(<DynamicFormQuestion {...mockProps} />);

        expect(screen.getByTestId('info-only-question')).toBeInTheDocument();
        expect(mockInfoOnlyQuestionProps).toHaveBeenCalledWith({
            question: mockProps.question,
            onChange: expect.any(Function),
            togglePopup: mockProps.togglePopup,
        });
    });

    it('should render nothing for unknown type', () => {
        mockProps.question = { id: 'q7', type: 'unknown-type' } as any;
        const { container } = render(<DynamicFormQuestion {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });
});
