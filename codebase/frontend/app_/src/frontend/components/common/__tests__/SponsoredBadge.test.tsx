import React from 'react';
import { render } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SponsoredBadge from 'frontend/components/common/SponsoredBadge';

const mockProps = {
    text: 'Text',
};

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('frontend/components/common/Callout/Callout', () => () => <div data-tid='callout' />);

describe('<SponsoredBadge />', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it(`Should render`, () => {
        const { getByText } = render(<SponsoredBadge {...mockProps} />);
        expect(getByText('Text')).toBeInTheDocument();
    });
});
