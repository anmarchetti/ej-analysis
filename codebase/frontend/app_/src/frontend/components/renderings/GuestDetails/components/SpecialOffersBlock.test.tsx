import React from 'react';
import { render, screen } from '@testing-library/react';

import { SpecialOffersBlock } from './SpecialOffersBlock';

const mockSpecialOffersPropsCall = jest.fn();
jest.mock('./SpecialOffers', () => (props: any) => {
    mockSpecialOffersPropsCall(props);

    return <div data-tid='special-offers' />;
});

describe('<SpecialOffersBlock />', () => {
    const resetMocks = () => ({
        fields: {} as any,
        forceErrors: false,
        isOffersOptedIn: undefined,
        isPartnerOffersOptedIn: undefined,
        changeOffersAndUpdates: jest.fn(),
    });

    let mocks;

    beforeEach(() => {
        mocks = resetMocks();
    });

    it('should render only one section if not selecting "Yes" (partner offers not opted-in)', () => {
        render(<SpecialOffersBlock {...mocks} />);

        expect(mockSpecialOffersPropsCall).toHaveBeenCalledTimes(1);

        expect(screen.getAllByTestId('special-offers')).toHaveLength(1);
    });

    it('should render two sections when partner offers is opted-in', () => {
        mocks.isPartnerOffersOptedIn = true;

        render(<SpecialOffersBlock {...mocks} />);

        expect(mockSpecialOffersPropsCall).toHaveBeenCalledTimes(2);
        expect(screen.getAllByTestId('special-offers')).toHaveLength(2);
    });
});
