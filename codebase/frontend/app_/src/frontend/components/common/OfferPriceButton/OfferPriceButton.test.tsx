import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import { mockedOffer } from 'frontend/__mocks__/offer';

import OfferPriceButton, { IOfferPriceButtonProps } from './OfferPriceButton';

jest.mock('frontend/components/common/ShortlistOfferButton/ShortlistOfferButton', () => () => (
    <button data-tid='shortlist-offer-button' />
));

jest.mock('frontend/components/common/OfferButton/OfferButton', () => () => <button data-tid='offer-button' />);

const createProps = (): IOfferPriceButtonProps => ({
    link: 'link',
    offer: mockedOffer,
    onClick: jest.fn(),
    isLivePrice: false,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isShortlistPage: false,
        },
    });

let mockProps;
let mockStores = createStores();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

describe('<OfferPriceButton />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render shortlist button on shortlist page', () => {
        mockStores.layoutStore.isShortlistPage = true;
        render(<OfferPriceButton {...mockProps} />);

        expect(screen.getByTestId('shortlist-offer-button')).toBeInTheDocument();
    });

    it('should render offer button on all other pages', () => {
        render(<OfferPriceButton {...mockProps} />);

        expect(screen.getByTestId('offer-button')).toBeInTheDocument();
    });
});
