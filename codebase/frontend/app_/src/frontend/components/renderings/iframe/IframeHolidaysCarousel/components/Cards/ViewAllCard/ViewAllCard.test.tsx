import React from 'react';
import { render, screen } from '@testing-library/react';

import { mockReplaceToken } from 'frontend/__mocks__/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import { ViewAllCard } from './ViewAllCard';

jest.mock('frontend/utils/tokenizer', () => ({ Tokenizer: { replaceToken: mockReplaceToken } }));

const createProps = () => ({
    href: '/test-url',
});

const createStores = () => ({
    layoutStore: { getPhrase: jest.fn(p => p) },
    searchStore: { searchTo: { destinationsDisplayValue: { main: 'Spain' } } },
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<ViewAllCard />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render component', () => {
        render(<ViewAllCard {...mockProps} />);

        expect(
            screen.getByRole('heading', { name: SitecoreDictionary.IframePromotingHolidaysTitlesWhatYouLookedFor }),
        ).toBeInTheDocument();
        expect(
            screen.getByText(`${SitecoreDictionary.IframePromotingHolidaysLabelsViewAllHolidaysForDestination} Spain`),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: SitecoreDictionary.IframePromotingHolidaysButtonsViewAllHolidays }),
        ).toHaveAttribute('href', '/test-url');
    });
});
