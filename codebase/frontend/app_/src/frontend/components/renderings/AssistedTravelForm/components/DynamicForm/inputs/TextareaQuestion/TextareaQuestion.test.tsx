import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    ConditionalOperator,
    IQuestionProps,
    QuestionType,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

import TextareaQuestion from './TextareaQuestion';

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

const createProps = (): IQuestionProps => ({
    question: {
        id: 'AT-005',
        label: 'Battery capacity (Watt-hours/Wh)',
        description: 'Wattage',
        additionalInfo: 'Add Wattage in Watt/hours',
        type: QuestionType.Textarea,
        conditionalLogic: [{ questionId: 'AT-004', answerId: 'AT-004-02', operator: ConditionalOperator.Equals }],
        requiredValidation: {
            required: true,
            message: 'This field is required',
        },
        placeholderLabel: 'Enter wattage',
    },
    onChange: jest.fn(),
    value: {
        value: '',
    },
    error: 'This field is required',
});

let mockProps = createProps();

describe('<TextareaQuestion />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render standard textarea question', () => {
        render(<TextareaQuestion {...mockProps} />);

        expect(screen.getByTestId('question-header')).toBeInTheDocument();
        expect(mockQuestionHeader).toHaveBeenCalledWith({
            title: mockProps.question.label,
            description: mockProps.question.description,
            tag: 'label',
            id: `label-${mockProps.question.id}`,
        });

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessage).toHaveBeenCalledWith({ error: mockProps.error, id: `error-${mockProps.question.id}` });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: { value: mockProps.question.additionalInfo },
            className: 'additionalInfo',
            id: `additional-info-${mockProps.question.id}`,
        });

        expect(screen.getByText(mockProps.question.placeholderLabel || '')).toBeInTheDocument();

        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('name', `question-${mockProps.question.id}`);
        expect(input).toHaveAttribute('aria-describedby', `additional-info-${mockProps.question.id}`);
        expect(input).toHaveAttribute('required');
        expect(input).toHaveAttribute('aria-required', 'true');
        expect(input).toHaveAttribute('placeholder', ' ');
        expect(input).toHaveValue(mockProps.value?.value);
        expect(input).toHaveClass('input', 'textArea');
    });

    it('should NOT set aria-describedby if additionalInfo is not provided', () => {
        const props = { ...mockProps };
        props.question.additionalInfo = undefined;
        render(<TextareaQuestion {...props} />);

        const input = screen.getByRole('textbox');
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('should call onChange with the new value when input changes', async () => {
        render(<TextareaQuestion {...mockProps} />);

        const input = screen.getByRole('textbox');

        await userEvent.type(input, '80');

        expect(mockProps.onChange).toHaveBeenCalledWith([{ value: '8' }]);
        expect(mockProps.onChange).toHaveBeenCalledWith([{ value: '0' }]);
    });
});
