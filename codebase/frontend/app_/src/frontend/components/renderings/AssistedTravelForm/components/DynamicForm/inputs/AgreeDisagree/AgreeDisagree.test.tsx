import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    AgreeDisagreeValue,
    AnswerActionType,
    IFormQuestion,
    QuestionType,
} from 'frontend/components/renderings/AssistedTravelForm/models/types';

import AgreeDisagree from './AgreeDisagree';

const mockButton = jest.fn();
jest.mock('frontend/components/common/Button', () => ({
    __esModule: true,
    default: props => {
        mockButton(props);

        return <button data-tid={props['data-tid']} onClick={props.onClick} />;
    },
}));

const mockRichTextWithLinks = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinks(props);

        return <div data-tid='rich-text-with-links' />;
    },
}));

const agreeOption = {
    id: 'AT-001-01',
    text: 'Agree',
    value: AgreeDisagreeValue.Agree,
    textForSubmission: 'Yes',
    textForSummary: 'Agree Summary',
    isAgreeOption: true,
};

const disagreeOption = {
    id: 'AT-001-02',
    text: 'Disagree',
    value: AgreeDisagreeValue.Disagree,
    textForSubmission: 'No',
    textForSummary: 'Disagree Summary',
    isAgreeOption: false,
};

const createQuestion = (overrides?: Partial<IFormQuestion>): IFormQuestion => ({
    id: 'AT-001',
    type: QuestionType.AgreeDisagree,
    label: 'Do you agree to the terms?',
    options: [agreeOption, disagreeOption],
    ...overrides,
});

const createProps = (overrides?: Partial<IFormQuestion>) => ({
    question: createQuestion(overrides),
    onChange: jest.fn(),
});

let mockProps = createProps();

describe('<AgreeDisagree />', () => {
    beforeEach(() => {
        mockButton.mockClear();
        mockRichTextWithLinks.mockClear();
        mockProps = createProps();
    });

    it('should render agree and disagree buttons with text from options', () => {
        render(<AgreeDisagree {...mockProps} />);

        expect(screen.getByTestId('agree-btn')).toBeInTheDocument();
        expect(mockButton).toHaveBeenCalledWith({
            'data-tid': 'agree-btn',
            children: agreeOption.text,
            isMedium: true,
            className: 'btn',
            onClick: expect.any(Function),
        });

        expect(screen.getByTestId('disagree-btn')).toBeInTheDocument();
        expect(mockButton).toHaveBeenCalledWith({
            'data-tid': 'disagree-btn',
            children: disagreeOption.text,
            isOutlined: true,
            className: 'btn btnSecondary',
            onClick: expect.any(Function),
        });
    });

    it('should render RichTextWithLinks with description when question.description is provided', () => {
        const description = 'Please read before agreeing';
        mockProps = createProps({ description });
        render(<AgreeDisagree {...mockProps} />);

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith(expect.objectContaining({ field: { value: description } }));
    });

    it('should NOT render RichTextWithLinks and buttons when description and options are not provided', () => {
        mockProps = createProps({ description: undefined, options: [] });
        render(<AgreeDisagree {...mockProps} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
        expect(screen.queryByTestId('agree-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('disagree-btn')).not.toBeInTheDocument();
    });

    it('should call onChange with the correct TAnswer when agree button is clicked', async () => {
        const action = { type: AnswerActionType.GoToNextSection };
        mockProps = createProps({
            options: [{ ...agreeOption, action }, disagreeOption],
        });
        render(<AgreeDisagree {...mockProps} />);

        await userEvent.click(screen.getByTestId('agree-btn'));

        expect(mockProps.onChange).toHaveBeenCalledWith(
            [
                {
                    answerId: agreeOption.id,
                    value: agreeOption.textForSummary,
                    valueForSubmission: agreeOption.textForSubmission,
                },
            ],
            action,
        );
        expect(mockProps.onChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with the correct TAnswer when disagree button is clicked', async () => {
        const action = { type: AnswerActionType.GoToNextSection };
        mockProps = createProps({
            options: [agreeOption, { ...disagreeOption, action }],
        });
        render(<AgreeDisagree {...mockProps} />);

        await userEvent.click(screen.getByTestId('disagree-btn'));

        expect(mockProps.onChange).toHaveBeenCalledWith(
            [
                {
                    answerId: disagreeOption.id,
                    value: disagreeOption.textForSummary,
                    valueForSubmission: disagreeOption.textForSubmission,
                },
            ],
            action,
        );
        expect(mockProps.onChange).toHaveBeenCalledTimes(1);
    });
});
