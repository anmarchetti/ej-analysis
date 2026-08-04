import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SvgLocationPinFilled from 'frontend/components/icons-new/LocationPinFilled';

import SearchBarInputCallout, { ISearchBarInputCalloutProps } from './SearchBarInputCallout';

const createProps = (): ISearchBarInputCalloutProps => ({
    title: 'title',
    text: 'text',
    icon: <SvgLocationPinFilled />,
    className: 'class',
    id: 'input-callout',
    onClick: jest.fn(),
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/icons-new/LocationPinFilled', () => () => <div data-tid='icon' />);
jest.mock('frontend/components/common/RichTextDictionary', () => ({ content }) => (
    <div data-tid='rich-text'>{content}</div>
));

describe('<SearchBarInputCallout />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render callout with prop className', () => {
        const { container } = render(<SearchBarInputCallout {...mockProps} />);

        expect(container.getElementsByClassName('sb-input-callout')[0]).toHaveClass('class');
    });

    it('should render icon', () => {
        render(<SearchBarInputCallout {...mockProps} />);

        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render title', () => {
        render(<SearchBarInputCallout {...mockProps} />);

        expect(screen.getByText('title')).toBeInTheDocument();
    });

    it('should render text', () => {
        render(<SearchBarInputCallout {...mockProps} />);

        expect(screen.getByTestId('rich-text')).toHaveTextContent('text');
    });

    it('should render element with id', () => {
        const { container } = render(<SearchBarInputCallout {...mockProps} />);

        expect(container.querySelector(`#${mockProps.id}`)).toBeInTheDocument();
    });

    it('should call onclick function when click on component', async () => {
        const { container } = render(<SearchBarInputCallout {...mockProps} />);

        await userEvent.click(container.getElementsByClassName('sb-input-callout')[0]);

        expect(mockProps.onClick).toHaveBeenCalled();
    });
});
