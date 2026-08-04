import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';

import DatesBasket from './DatesBasket';

let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<DatesBasket /> ', () => {
    beforeEach(() => {
        mockStores = createMockStores();
    });

    it('Should render', () => {
        render(<DatesBasket />);

        expect(screen.getByTestId('dates-basket')).toBeInTheDocument();
        expect(screen.getByText('11 May 23 - 18 May 23')).toBeInTheDocument();
    });
});
