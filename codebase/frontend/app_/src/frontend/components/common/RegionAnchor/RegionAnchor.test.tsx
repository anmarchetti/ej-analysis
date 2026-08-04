import React from 'react';
import { render } from '@testing-library/react';

import RegionAnchor from './RegionAnchor';

const createProps = () => ({
    Link: { value: { text: 'see all regions in {region}', href: 'test' } },
});

const createStores = () => ({
    layoutStore: { pageName: 'Test' },
    queryParamStore: {},
    userStore: {},
});

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<RegionAnchor />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should NOT render when no text in link', () => {
        mockProps.Link.value.text = '';
        const { container } = render(<RegionAnchor {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should NOT render when no href in link', () => {
        mockProps.Link.value.href = '';
        const { container } = render(<RegionAnchor {...mockProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('should render content', () => {
        const { getByText } = render(<RegionAnchor {...mockProps} />);

        expect(getByText('see all regions in Test')).toBeInTheDocument();
    });
});
