import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ConfirmationCheckbox, { IConfirmationCheckboxProps } from './ConfirmationCheckbox';

const mockCheckbox = jest.fn();
jest.mock('frontend/components/common/Checkbox', () => ({
    __esModule: true,
    default: props => {
        mockCheckbox(props);

        return <input type='checkbox' data-tid={props.dataTid} checked={props.checked} onChange={props.onChange} />;
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

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-text' />;
    },
}));

const createProps = (): IConfirmationCheckboxProps => ({
    Title: { value: 'Confirmation title' },
    Description: { value: '<p>Confirmation description</p>' },
    ErrorContent: { value: 'This field is required' },
    checked: false,
    hasError: false,
    id: 'test-checkbox',
    onChange: jest.fn(),
});

let mockProps = createProps();

describe('<ConfirmationCheckbox />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component without error', () => {
        render(<ConfirmationCheckbox {...mockProps} />);

        expect(screen.getByTestId('confirmation-checkbox')).not.toHaveClass('error');
        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: mockProps.Title,
            tag: 'div',
            className: 'title',
        });
        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({ field: mockProps.Description, className: 'description' });

        expect(mockCheckbox).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockProps.id,
                checked: mockProps.checked,
                hasError: mockProps.hasError,
                dataTid: mockProps.id,
                required: true,
                textRight: true,
                tick: true,
                className: 'checkbox',
            }),
        );

        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('should render ErrorMessage when hasError is true', () => {
        render(<ConfirmationCheckbox {...mockProps} hasError />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(mockErrorMessage).toHaveBeenCalledWith({ error: mockProps.ErrorContent.value });
    });

    it('should apply error class to container when hasError is true', () => {
        const { container } = render(<ConfirmationCheckbox {...mockProps} hasError />);

        expect(container.firstChild).toHaveClass('error');
    });

    it('should call onChange when checkbox is clicked', async () => {
        render(<ConfirmationCheckbox {...mockProps} />);

        await userEvent.click(screen.getByTestId('test-checkbox'));

        expect(mockProps.onChange).toHaveBeenCalledTimes(1);
    });
});
