import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import BookingTransition from './BookingTransition';

const createProps = () => ({
    Title: { value: 'title' },
    Tiles: ['tile', 'tile', 'tile', 'tile'],
    Subtitle: undefined,
});

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

jest.mock('./BookingCard', () => () => <div data-tid='card' />);

jest.mock('frontend/components/common/LoadingAnimation/LoadingAnimation', () => ({
    __esModule: true,
    default: () => <div data-tid='loading-animation' />,
}));

describe('<BookingTransition />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores();
    });

    it('should render', () => {
        const numberOfCards = 4;

        render(<BookingTransition {...mockProps} />);

        expect(screen.getByRole('heading')).toHaveTextContent('title');
        expect(screen.getByText(SitecoreDictionary.SearchPodFiltersPromoPageLabelsLoadingTitle)).toBeInTheDocument();
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByTestId('loading-animation')).toBeInTheDocument();
        expect(screen.getAllByTestId('card').length).toBe(numberOfCards);
    });

    it('should NOT render title and cards', () => {
        mockProps.Title.value = '';
        mockProps.Tiles.length = 0;
        mockStores.layoutStore.getPhrase(() => '');

        render(<BookingTransition {...mockProps} />);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('card')).not.toBeInTheDocument();
    });

    it('should render custom Subtitle when provided', () => {
        mockProps.Subtitle = { value: 'Custom loading subtitle' };

        render(<BookingTransition {...mockProps} />);

        expect(screen.getByText('Custom loading subtitle')).toBeInTheDocument();
        expect(
            screen.queryByText(SitecoreDictionary.SearchPodFiltersPromoPageLabelsLoadingTitle),
        ).not.toBeInTheDocument();
    });
});
