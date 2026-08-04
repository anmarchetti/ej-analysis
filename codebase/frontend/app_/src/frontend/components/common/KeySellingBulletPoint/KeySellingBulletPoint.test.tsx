import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockSitecoreField } from 'frontend/utils/tests.utils';

import KeySellingBulletPoint from './KeySellingBulletPoint';

const createProps = () => ({ ksp: 'test' });

let mockProps;

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Text: ({ field }) => <div data-tid='text'>{field.value}</div>,
}));

describe('<KeySellingBulletPoint />', () => {
    beforeEach(() => {
        mockProps = createProps();
    });

    it('should NOT render when ksp in NOT provided', () => {
        mockProps.ksp = null;

        const { container } = render(<KeySellingBulletPoint {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when ksp in NOT string and value is NOT provided', () => {
        mockProps.ksp = mockSitecoreField(null);

        const { container } = render(<KeySellingBulletPoint {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render key-selling-point-1-bullet-item with string ksp from props', () => {
        render(<KeySellingBulletPoint {...mockProps} />);

        expect(screen.getByTestId('key-selling-point-1-bullet-item')).toHaveTextContent(mockProps.ksp);
    });

    it('should render Text component when ksp is provided from sitecore', () => {
        mockProps.ksp = mockSitecoreField('ksp');

        render(<KeySellingBulletPoint {...mockProps} />);

        expect(screen.getByTestId('text')).toHaveTextContent(mockProps.ksp.value);
    });
});
