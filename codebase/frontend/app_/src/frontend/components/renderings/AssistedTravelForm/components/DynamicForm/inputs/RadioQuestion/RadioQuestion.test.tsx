import { render, screen } from '@testing-library/react';

import {
    AnswerActionType,
    ConditionalOperator,
    IQuestionProps,
    PopupType,
    QuestionType,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

import RadioQuestion from './RadioQuestion';

const mockQuestionHeader = jest.fn();
jest.mock('frontend/components/renderings/AssistedTravelForm/components/QuestionHeader/QuestionHeader', () => ({
    __esModule: true,
    default: props => {
        mockQuestionHeader(props);

        return <div data-tid='question-header' />;
    },
}));

const mockErrorMessage = jest.fn();
jest.mock(
    'frontend/components/renderings/AssistedTravelForm/components/DynamicForm/inputs/ErrorMessage/ErrorMessage',
    () => ({
        __esModule: true,
        default: props => {
            mockErrorMessage(props);

            return <div data-tid='error-message' />;
        },
    }),
);

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const mockRadioButton = jest.fn();
jest.mock('frontend/components/common/RadioButton', () => ({
    __esModule: true,
    default: props => {
        mockRadioButton(props);

        return <input data-tid='radio-button' onChange={props.onChange()} />;
    },
}));

const mockProps: IQuestionProps = {
    question: {
        id: 'AT-006',
        label: 'Do you know how to inhibit the circuits or isolate battery?',
        labelSubmission: 'Label for submission',
        labelSummary: 'Label for summary',
        type: QuestionType.Radio,
        additionalInfo: 'Inhibiting the circuits',
        conditionalLogic: [
            { questionId: 'AT-004', answerId: 'AT-004-02', operator: ConditionalOperator.Equals },
            { questionId: 'AT-004', answerId: 'AT-004-01', operator: ConditionalOperator.Equals },
        ],
        options: [
            {
                id: 'AT-006-01',
                text: 'Yes',
                textForSubmission: 'Yes Submission',
                textForSummary: 'Yes Summary',
            },
            {
                id: 'AT-006-02',
                text: 'No',
                textForSubmission: 'No Submission',
                textForSummary: 'No Summary',
                action: {
                    type: AnswerActionType.ShowPopup,
                    popupType: PopupType.NoTravelCompanion,
                },
            },
        ],
        requiredValidation: {
            required: true,
            message: 'This field is required',
        },
    },
    onChange: jest.fn(),
    value: {
        answerId: 'AT-006-01',
        value: '',
    },
    error: 'This field is required',
};

describe('<RadioQuestion />', () => {
    it('should render standard radio question', () => {
        render(<RadioQuestion {...mockProps} />);

        expect(screen.getByTestId('question-header')).toBeInTheDocument();
        expect(mockQuestionHeader).toHaveBeenCalledWith({
            title: mockProps.question.label,
            description: mockProps.question.description,
            id: `label-${mockProps.question.id}`,
            tag: 'legend',
        });

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessage).toHaveBeenCalledWith({ error: mockProps.error, id: `error-${mockProps.question.id}` });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: { value: mockProps.question.additionalInfo },
            className: 'additionalInfo',
            id: `additional-info-${mockProps.question.id}`,
        });

        expect(screen.getAllByTestId('radio-button')).toHaveLength(mockProps.question.options!.length);
        mockProps.question?.options?.forEach(option => {
            expect(mockRadioButton).toHaveBeenCalledWith({
                id: `question-${mockProps.question.id}-${option.id}`,
                name: `question-${mockProps.question.id}`,
                label: option.text,
                value: option.id,
                checked: mockProps.value?.answerId === option.id,
                onChange: expect.any(Function),
                dataTid: `radio-${mockProps.question.id}-${option.id}`,
                className: 'radioBtn errorInput',
            });
        });
    });

    it('should call onChange with correct parameters when an option is selected', () => {
        render(<RadioQuestion {...mockProps} />);

        const optionToSelect = screen.getAllByTestId('radio-button')[1];

        optionToSelect.click();

        expect(mockProps.onChange).toHaveBeenCalledWith(
            [{ answerId: 'AT-006-02', value: 'No Summary', valueForSubmission: 'No Submission' }],
            mockProps.question.options?.[1].action,
        );
    });

    describe('aria-labelledby', () => {
        it('should include labelId and additionalInfoId when both are present', () => {
            render(<RadioQuestion {...mockProps} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute(
                'aria-labelledby',
                `label-${mockProps.question.id} additional-info-${mockProps.question.id}`,
            );
        });

        it('should omit additionalInfoId when no additionalInfo is provided', () => {
            render(<RadioQuestion {...mockProps} question={{ ...mockProps.question, additionalInfo: undefined }} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute('aria-labelledby', `label-${mockProps.question.id} `);
        });

        it('should omit labelId when no label is provided', () => {
            render(<RadioQuestion {...mockProps} question={{ ...mockProps.question, label: undefined }} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute('aria-labelledby', ` additional-info-${mockProps.question.id}`);
        });
    });
});
