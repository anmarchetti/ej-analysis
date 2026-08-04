import React from 'react';
import { render } from '@testing-library/react';

import PromoStripe from './PromoStripe';

const mockPlaceholderComponent = jest.fn();

jest.mock('@sitecore-jss/sitecore-jss-nextjs', () => ({
    __esModule: true,
    Placeholder: props => {
        mockPlaceholderComponent(props);

        return <div data-tid='placeholder'>Placeholder</div>;
    },
}));

const resetMocks = () => ({
    index: 1,
    promo: {
        icon: 'promo-icon.jpg',
        bannerTitle: 'Summer Sale Now On',
        minimumSpend1: '£100 off holidays over £800',
        minimumSpend2: '£150 off holidays over £1000',
        minimumSpend3: '£200 off holidays over £1500',
        promoCode: 'SUMMERSALE',
        date: 'Travel between 01/07/22 - 31/08/22',
        tandCs: 'T&C Apply',
        cardDescription: '<div data-tid="test-id">test</div>',
    },
    rendering: {} as any,
});

let mocks = resetMocks();

describe('<PromoStripe />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should standard render', () => {
        render(<PromoStripe {...mocks} />);
        expect(mockPlaceholderComponent).toHaveBeenCalledWith(
            expect.objectContaining({
                name: `promo-stripe`,
            }),
        );
    });
});
