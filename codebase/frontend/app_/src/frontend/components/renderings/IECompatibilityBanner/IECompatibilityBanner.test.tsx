import React from 'react';
import { render } from '@testing-library/react';

import IECompatibilityBanner from './IECompatibilityBanner';

const createProps = () => ({
    fields: { value: 'name' },
});

let mockProps;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

jest.mock('frontend/components/renderings/HtmlBlock', () => () => <div data-tid='banner' />);

describe('<IECompatibilityBanner />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render', () => {
        mockProps.fields = null;
        const { container } = render(<IECompatibilityBanner {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render banner', () => {
        const { getByTestId } = render(<IECompatibilityBanner {...mockProps} />);

        expect(getByTestId('banner')).toBeInTheDocument();
    });
});
