import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConditionalOperator, QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';

import MultiSelectQuestion, { IMultiSelectQuestionProps } from './MultiSelectQuestion';

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

const mockCheckbox = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: props => {
        mockCheckbox(props);

        return <input type='checkbox' data-tid={props.dataTid} onChange={props.onChange} />;
    },
}));

const createProps = (): IMultiSelectQuestionProps => ({
    question: {
        id: 'AT-006',
        label: 'Do you know how to inhibit the circuits or isolate battery?',
        type: QuestionType.MultiSelect,
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
            },
            {
                id: 'AT-006-03',
                text: 'other',
                textForSubmission: 'Other Submission',
                textForSummary: 'Other Summary',
                isOtherOption: true,
            },
        ],
        requiredValidation: {
            required: true,
            message: 'This field is required',
        },
    },
    onChange: jest.fn(),
    answers: [],
    error: 'This field is required',
});

let mockProps = createProps();

describe('<MultiSelectQuestion />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render standard multi-select question', () => {
        render(<MultiSelectQuestion {...mockProps} />);

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

        expect(screen.getAllByRole('checkbox')).toHaveLength(mockProps.question.options!.length);
        mockProps.question?.options?.forEach(option => {
            expect(mockCheckbox).toHaveBeenCalledWith({
                id: `question-${mockProps.question.id}-${option.id}`,
                label: option.text,
                checked: mockProps.answers?.some(a => a.answerId === option.id),
                onChange: expect.any(Function),
                dataTid: `checkbox-${mockProps.question.id}-${option.id}`,
                className: 'checkbox errorInput',
                tick: true,
                textRight: true,
            });
        });
    });

    it('should clear other selections when an exclusive option is selected', async () => {
        const exclusiveOption = {
            ...mockProps.question,
            options: [
                ...mockProps.question.options!,
                {
                    id: 'AT-006-04',
                    text: 'Exclusive Option',
                    textForSummary: 'Exclusive Option',
                    textForSubmission: 'Exclusive Option Submission',
                    value: 'exclusive',
                    clearOtherSelections: true,
                },
            ],
        };
        render(<MultiSelectQuestion {...mockProps} question={exclusiveOption} />);

        const exclusiveCheckbox = screen.getByTestId(`checkbox-${exclusiveOption.id}-AT-006-04`);
        expect(exclusiveCheckbox).toBeInTheDocument();
        await userEvent.click(exclusiveCheckbox);

        expect(mockProps.onChange).toHaveBeenCalledWith([
            { answerId: 'AT-006-04', value: 'Exclusive Option', valueForSubmission: 'Exclusive Option Submission' },
        ]);
    });

    it('should toggle selection of options', async () => {
        render(<MultiSelectQuestion {...mockProps} />);
        const firstOptionCheckbox = screen.getByTestId(`checkbox-${mockProps.question.id}-AT-006-01`);
        const secondOptionCheckbox = screen.getByTestId(`checkbox-${mockProps.question.id}-AT-006-02`);

        await userEvent.click(firstOptionCheckbox);
        expect(mockProps.onChange).toHaveBeenCalledWith([
            { answerId: 'AT-006-01', value: 'Yes Summary', valueForSubmission: 'Yes Submission' },
        ]);

        await userEvent.click(secondOptionCheckbox);
        expect(mockProps.onChange).toHaveBeenCalledWith([
            { answerId: 'AT-006-02', value: 'No Summary', valueForSubmission: 'No Submission' },
        ]);

        await userEvent.click(firstOptionCheckbox);
        expect(mockProps.onChange).toHaveBeenCalledWith([
            { answerId: 'AT-006-02', value: 'No Summary', valueForSubmission: 'No Submission' },
        ]);
    });

    it('should render other option input when other option is selected', async () => {
        mockProps = {
            ...mockProps,
            answers: [{ answerId: 'AT-006-03', value: '' }],
        };
        render(<MultiSelectQuestion {...mockProps} />);

        const otherOptionCheckbox = screen.getByTestId(`checkbox-${mockProps.question.id}-AT-006-03`);
        expect(otherOptionCheckbox).toBeInTheDocument();
        await userEvent.click(otherOptionCheckbox);

        const otherOptionInput = screen.getByRole('textbox');
        expect(otherOptionInput).toBeInTheDocument();
        expect(otherOptionInput).toHaveAttribute('id', `${mockProps.question.id}-other`);

        await userEvent.type(otherOptionInput, 'My');

        expect(mockProps.onChange).toHaveBeenCalledWith([{ answerId: 'AT-006-03', value: 'M' }]);

        expect(mockProps.onChange).toHaveBeenCalledWith([{ answerId: 'AT-006-03', value: 'y' }]);
    });

    describe('aria-labelledby', () => {
        it('should include labelId, additionalInfoId, and errorId when all are present', () => {
            render(<MultiSelectQuestion {...mockProps} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute(
                'aria-labelledby',
                `label-${mockProps.question.id} additional-info-${mockProps.question.id} error-${mockProps.question.id}`,
            );
        });

        it('should omit errorId when no error is provided', () => {
            render(<MultiSelectQuestion {...mockProps} error={undefined} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute(
                'aria-labelledby',
                `label-${mockProps.question.id} additional-info-${mockProps.question.id} `,
            );
        });

        it('should omit additionalInfoId when no additionalInfo is provided', () => {
            mockProps.question.additionalInfo = undefined;
            render(<MultiSelectQuestion {...mockProps} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute(
                'aria-labelledby',
                `label-${mockProps.question.id}  error-${mockProps.question.id}`,
            );
        });

        it('should omit labelId when no label is provided', () => {
            mockProps.question.label = undefined;
            render(<MultiSelectQuestion {...mockProps} />);

            const fieldset = screen.getByRole('group');
            expect(fieldset).toHaveAttribute(
                'aria-labelledby',
                ` additional-info-${mockProps.question.id} error-${mockProps.question.id}`,
            );
        });
    });
});
