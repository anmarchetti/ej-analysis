import React from 'react';
import { render, screen } from '@testing-library/react';

import QuestionHeader, { TQuestionHeaderProps } from './QuestionHeader';

const createProps = (): TQuestionHeaderProps => ({
    description: 'description',
    title: 'title',
});

let mockProps = createProps();

const mockTextProps = jest.fn();
jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: props => {
        mockTextProps(props);

        return <div data-tid='jss-text' />;
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

describe('<QuestionHeader />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render component', () => {
        render(<QuestionHeader {...mockProps} />);

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: { value: mockProps.title },
            tag: 'div',
            className: 'title',
        });

        expect(screen.getByTestId('rich-text-with-links')).toBeInTheDocument();
        expect(mockRichTextWithLinks).toHaveBeenCalledWith({
            field: { value: mockProps.description },
            className: 'description',
            tag: 'div',
        });
    });

    it('should render div tag by default', () => {
        render(<QuestionHeader {...mockProps} />);

        expect(screen.getByTestId('jss-text').closest('div')).toBeInTheDocument();
    });

    it('should render label tag if tag prop is set to label', () => {
        render(<QuestionHeader {...mockProps} tag='label' />);

        expect(screen.getByTestId('jss-text').closest('label')).toBeInTheDocument();
    });

    it('should NOT render if title and description are empty', () => {
        const { container } = render(<QuestionHeader {...mockProps} title='' description='' />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render description if it is empty', () => {
        render(<QuestionHeader {...mockProps} description='' />);

        expect(screen.getByTestId('jss-text')).toBeInTheDocument();
        expect(mockTextProps).toHaveBeenCalledWith({
            field: { value: mockProps.title },
            tag: 'div',
            className: 'title',
        });
        expect(screen.queryByTestId('rich-text-with-links')).not.toBeInTheDocument();
    });
});
