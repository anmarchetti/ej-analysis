import React, { RefObject } from 'react';
import { render } from '@testing-library/react';

import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';

import Offers, { IOffersProps } from './Offers';

const mockOffersPerPage = jest.fn();
jest.mock('frontend/components/renderings/SearchResults/components/Offers/OffersPerPage', () => ({
    __esModule: true,
    default: props => {
        mockOffersPerPage(props);

        return <div data-tid='offers-per-page'>{props.children}</div>;
    },
}));

jest.mock('frontend/utils/chunkArray', () => ({
    __esModule: true,
    splitToChunksArray: () => [{}, {}],
}));

const mockUseMoreThenXSMobileViewport = jest.fn();
jest.mock('frontend/hooks/useMediaQuery', () => ({
    __esModule: true,
    useMoreThenXSMobileViewport: () => mockUseMoreThenXSMobileViewport(),
}));

const resetMocks = (): IOffersProps => ({
    offers: [
        { id: '0' },
        {
            id: '1',
            promotion: {
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
        },
        {
            id: '2',
            promotion: {
                icon: 'promo-icon.jpg',
                bannerTitle: 'Summer Sale Now On 2',
                minimumSpend1: '£100 off holidays over £800',
                minimumSpend2: '£150 off holidays over £1000',
                minimumSpend3: '£200 off holidays over £1500',
                promoCode: 'SUMMERSALE',
                date: 'Travel between 01/07/22 - 31/08/22',
                tandCs: 'T&C Apply',
                cardDescription: '<div data-tid="test-id">test</div>',
            },
        },
    ] as IOffer[],
    onSetSelectedOfferIndex: jest.fn(),
    offerCardBySelectedIndex: {} as RefObject<HTMLDivElement>,
    currentPage: 1,
    itemsOnEachPage: 10,
    minLoadedPageNumber: 1,
    fields: {} as any,
    params: {} as any,
    rendering: {} as any,
    alternativeFlightsDefaultSort: AlternativeFlightsSortBy.OutboundEarliestDeparture,
    alternativeFlightsSortOrders: [] as ISelectOption[],
});

let mocks = resetMocks();

jest.mock('react', () => ({
    ...jest.requireActual('react'),
}));

describe('<Offers />', () => {
    beforeEach(() => {
        mocks = resetMocks();
    });

    it('Should standard render once in small screen', () => {
        mockUseMoreThenXSMobileViewport.mockReturnValue(true);

        render(<Offers {...mocks} />);

        expect(mockOffersPerPage).toHaveBeenCalledTimes(1);
    });

    it('Should standard render once in small screen', () => {
        mockUseMoreThenXSMobileViewport.mockReturnValue(false);

        render(<Offers {...mocks} />);

        expect(mockOffersPerPage).toHaveBeenCalledTimes(2);
    });
});
