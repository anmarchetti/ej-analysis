import { render, screen } from '@testing-library/react';

import { ConditionalOperator, QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import InputSetQuestion, { IInputSetProps } from './InputSetQuestion';

const mockQuestionHeader = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader', () => ({
    __esModule: true,
    default: props => {
        mockQuestionHeader(props);

        return <div data-tid='question-header' />;
    },
}));

const mockDynamicFormQuestion = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/components/DynamicFormQuestion/DynamicFormQuestion',
    () => ({
        __esModule: true,
        default: props => {
            mockDynamicFormQuestion(props);

            return <div data-tid='dynamic-form-question' />;
        },
    }),
);

const createProps = (): IInputSetProps => ({
    question: {
        id: 'wheelchair-dimensions',
        label: 'Please fill in the wheelchair details to the best of your knowledge.',
        type: QuestionType.InputSet,
        questions: [
            {
                id: 'AT-009',
                description: 'Make (optional)',
                additionalInfo: 'Enter the wheelchair brand name or any identifying details.',
                type: QuestionType.TextInput,
            },
            {
                id: 'AT-010',
                description: 'Model (optional)',
                additionalInfo: 'Enter the wheelchair model name or any identifying details.',
                type: QuestionType.TextInput,
            },
        ],
        conditionalLogic: [{ questionId: 'AT-008', answerId: 'AT-008-01', operator: ConditionalOperator.Equals }],
    },
    isQuestionVisible: jest.fn().mockReturnValue(true),
    setAnswer: jest.fn(),
    answers: new Map(),
    errors: new Map(),
    togglePopup: jest.fn(),
});

let mockProps = createProps();

describe('<InputSetQuestion />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render the question header', () => {
        render(<InputSetQuestion {...mockProps} />);
        expect(screen.getByTestId('question-header')).toBeInTheDocument();
    });

    it('should render all sub-questions as DynamicFormQuestion', () => {
        render(<InputSetQuestion {...mockProps} />);
        expect(screen.getAllByTestId('dynamic-form-question')).toHaveLength(2);
        expect(mockDynamicFormQuestion).toHaveBeenCalledWith({
            question: mockProps.question.questions![0],
            answers: mockProps.answers,
            errors: mockProps.errors,
            isQuestionVisible: mockProps.isQuestionVisible,
            setAnswer: mockProps.setAnswer,
            togglePopup: mockProps.togglePopup,
        });
    });

    it('should render nothing if no sub-questions', () => {
        const props = createProps();
        props.question.questions = [];
        render(<InputSetQuestion {...props} />);
        expect(screen.queryByTestId('dynamic-form-question')).toBeNull();
    });
});
