import React from 'react';
import { render } from '@testing-library/react';

import ConditionalWrapper from './ConditionalWrapper';

const content = <div>Content</div>;

const createProps = () => ({
    condition: false,
    wrapper: content => <div data-tid='wrapper'>{content}</div>,
    children: content,
});

let mockProps;

describe('<ConditionalWrapper />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should render content', () => {
        const { getByText } = render(<ConditionalWrapper {...mockProps} />);

        expect(getByText('Content')).toBeInTheDocument();
    });

    it('should NOT render wrapper when condition is false', () => {
        const { queryByTestId } = render(<ConditionalWrapper {...mockProps} />);

        expect(queryByTestId('wrapper')).not.toBeInTheDocument();
    });

    it('should render wrapper when condition is true', () => {
        mockProps.condition = true;
        const { getByTestId } = render(<ConditionalWrapper {...mockProps} />);

        expect(getByTestId('wrapper')).toBeInTheDocument();
    });
});
