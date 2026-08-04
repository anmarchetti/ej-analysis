import { render, screen } from '@testing-library/react';

import { IFormQuestion, QuestionType } from 'frontend/components/renderings/AssistedTravelForm/models/types';
import * as AssistedTravelFormUtils from 'frontend/components/renderings/AssistedTravelForm/utils/AssistedTravelForm.utils';

import InfoOnly from './InfoOnly';

const mockText = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: props => {
        mockText(props);

        return <div data-tid='text' />;
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

const mockOnChange = jest.fn();
const mockTogglePopup = jest.fn();
const mockOnContactUsClick = jest.fn();

const createQuestion = (overrides?: Partial<IFormQuestion>): IFormQuestion => ({
    id: 'AT-INFO-01',
    type: QuestionType.InfoOnly,
    label: 'Info only question label',
    options: [
        {
            id: 'AT-INFO-01-01',
            text: 'Option text',
            textForSummary: 'Summary text',
            textForSubmission: 'Submission text',
        },
    ],
    ...overrides,
});

const createProps = (questionOverrides?: Partial<IFormQuestion>) => ({
    question: createQuestion(questionOverrides),
    onChange: mockOnChange,
    togglePopup: mockTogglePopup,
});

describe('<InfoOnly />', () => {
    beforeEach(() => {
        jest.spyOn(AssistedTravelFormUtils, 'createOnContactUsClick').mockReturnValue(mockOnContactUsClick);
    });

    it('should render the label via Text component', () => {
        const props = createProps();
        render(<InfoOnly {...props} />);

        expect(screen.getByTestId('text')).toBeInTheDocument();
        expect(mockText).toHaveBeenCalledWith({
            field: { value: props.question.label },
            tag: 'div',
            className: 'title',
        });
    });

    it('should render RichTextWithLinks when description is provided', () => {
        const props = createProps({ description: 'Some description text' });
        render(<InfoOnly {...props} />);

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: { value: 'Some description text' },
            onLinkClick: mockOnContactUsClick,
            className: 'description',
            tag: 'div',
        });
    });

    it('should NOT render RichTextWithLinks when description is absent', () => {
        const props = createProps({ description: undefined });
        render(<InfoOnly {...props} />);

        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });

    it('should call onChange with first option values on mount', () => {
        const props = createProps();
        render(<InfoOnly {...props} />);

        expect(mockOnChange).toHaveBeenCalledWith([
            {
                answerId: 'AT-INFO-01-01',
                value: 'Summary text',
                valueForSubmission: 'Submission text',
            },
        ]);
    });

    it('should NOT call onChange when options are empty', () => {
        const props = createProps({ options: [] });
        render(<InfoOnly {...props} />);

        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should NOT call onChange when options are undefined', () => {
        const props = createProps({ options: undefined });
        render(<InfoOnly {...props} />);

        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should call createOnContactUsClick with togglePopup', () => {
        const props = createProps();
        render(<InfoOnly {...props} />);

        expect(AssistedTravelFormUtils.createOnContactUsClick).toHaveBeenCalledWith(mockTogglePopup);
    });
});
