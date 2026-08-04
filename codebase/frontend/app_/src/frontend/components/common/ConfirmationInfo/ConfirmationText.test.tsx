import React from 'react';
import { render } from '@testing-library/react';

import ConfirmationInfoText from './ConfirmationInfoText';

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    routerStore: {
        redirectTo: jest.fn(),
    },
    appStore: {
        toggleOfferConditions: jest.fn(),
    },
});
const mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ConfirmationInfo />', () => {
    it('Should render info', () => {
        const { getByText } = render(<ConfirmationInfoText text='Some text' />);

        expect(getByText('Some text')).toBeInTheDocument();
    });
});
