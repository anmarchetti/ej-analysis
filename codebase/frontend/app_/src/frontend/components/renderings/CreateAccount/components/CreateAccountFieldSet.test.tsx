import React from 'react';
import { render, screen } from '@testing-library/react';

import { CreateAccountFieldSet } from './CreateAccountFieldSet';

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    Text: ({ field, tag, className }) => {
        mockTextProps({ field, tag, className });

        return (
            <div data-tid='mock-text' className={className}>
                {field.value}
            </div>
        );
    },
}));

const mockRichTextWithLinksProps = jest.fn();
jest.mock('frontend/components/common/RichTextWithLinks', () => ({
    __esModule: true,
    default: props => {
        mockRichTextWithLinksProps(props);

        return <div data-tid='mock-description'>{props.field.value}</div>;
    },
}));

describe('<CreateAccountFieldSet />', () => {
    const resetMocks = () => ({
        title: { value: 'title' },
        description: { value: 'description' },
        children: <div data-tid='test-child'>Test Child Content</div>,
    });

    let props;

    beforeEach(() => {
        props = resetMocks();
    });

    it('should render fieldset with title, description, and children by default', () => {
        render(<CreateAccountFieldSet {...props} />);

        const fieldsetElement = screen.getByRole('group');
        expect(fieldsetElement).toBeInTheDocument();
        expect(fieldsetElement).not.toBeDisabled();

        const titleElement = screen.getByTestId('mock-text');
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveTextContent(props.title.value);
        expect(mockTextProps).toHaveBeenCalledWith(expect.objectContaining({ field: props.title, tag: 'legend' }));

        const descriptionElement = screen.getByTestId('mock-description');
        expect(descriptionElement).toBeInTheDocument();
        expect(descriptionElement).toHaveTextContent(props.description.value);

        expect(screen.getByTestId('test-child')).toBeInTheDocument();
        expect(screen.getByText('Test Child Content')).toBeInTheDocument();
    });

    it('should not render title if title.value is not provided', () => {
        render(<CreateAccountFieldSet {...props} title={undefined} />);

        expect(screen.queryByTestId('mock-text')).not.toBeInTheDocument();
    });

    it('should apply --delimiter class to title if description is not present', () => {
        render(<CreateAccountFieldSet {...props} description={undefined} />);

        const titleElement = screen.getByTestId('mock-text');

        expect(titleElement).toHaveClass('create-account__fieldset-title--delimiter');
    });

    it('should NOT apply --delimiter class to title if description is present', () => {
        render(<CreateAccountFieldSet {...props} />);

        const titleElement = screen.getByTestId('mock-text');

        expect(titleElement).not.toHaveClass('create-account__fieldset-title--delimiter');
    });

    it('should not render description if description.value is not provided', () => {
        render(<CreateAccountFieldSet {...props} description={undefined} />);

        expect(screen.queryByTestId('mock-description')).not.toBeInTheDocument();
    });

    it('should disable the fieldset when disabled prop is true', () => {
        render(<CreateAccountFieldSet {...props} disabled={true} />);

        const fieldsetElement = screen.getByRole('group');

        expect(fieldsetElement).toBeDisabled();
    });

    it('should render children correctly', () => {
        const childText = 'Unique Child Element';
        render(
            <CreateAccountFieldSet {...props}>
                <span data-tid='custom-child'>{childText}</span>
            </CreateAccountFieldSet>,
        );
        expect(screen.getByTestId('custom-child')).toBeInTheDocument();
        expect(screen.getByText(childText)).toBeInTheDocument();
    });
});
