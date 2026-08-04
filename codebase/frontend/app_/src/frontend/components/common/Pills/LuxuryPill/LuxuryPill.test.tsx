import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import LuxuryPill from './LuxuryPill';

const mockStores = createMockStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<LuxuryPill />', () => {
    it('Should render passed props', () => {
        render(<LuxuryPill className='class' />);

        expect(screen.getByTestId('luxury-pill')).toHaveClass('class');
        expect(screen.getByText(SitecoreDictionary.LuggageLabelsIncluded)).toBeInTheDocument();
        expect(screen.getByTestId('svg-luxury-gradient')).toBeInTheDocument();
    });

    it('Should NOT render label when isLabelVisible is false', () => {
        render(<LuxuryPill isLabelVisible={false} />);

        expect(screen.queryByText(SitecoreDictionary.LuggageLabelsIncluded)).not.toBeInTheDocument();
    });
});
