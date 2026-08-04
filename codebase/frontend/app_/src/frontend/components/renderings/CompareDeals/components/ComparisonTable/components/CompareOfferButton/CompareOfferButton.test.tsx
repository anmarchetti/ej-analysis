import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ENGLISH } from 'code/cmsLang';
import { createMockStores } from 'frontend/__mocks__/createMockStores';
import { mockedOffer } from 'frontend/__mocks__/offer';
import * as comparisonTableUtils from 'frontend/utils/tracking/comparisonTable.utils';
import { IShortlist } from 'models/data/IOffer';
import SitePath from 'models/enum/SitePath';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventCategories, EventLabels } from 'models/enum/tracking/GenericEventParams';

import CompareOfferButton, { ICompareOfferButtonProps } from './CompareOfferButton';

const mockShortlistOfferIdentifier = 'mockShortlistOfferIdentifier';
jest.mock('frontend/utils/tracking/comparisonTable.utils', () => ({
    __esModule: true,
    getShortlistOfferIdentifier: jest.fn(() => mockShortlistOfferIdentifier),
}));

let mockIsShortlistedOfferUnavailableForBooking = false;
jest.mock('frontend/utils/shortlist.utils', () => ({
    __esModule: true,
    isShortlistedOfferUnavailableForBooking: jest.fn(() => mockIsShortlistedOfferUnavailableForBooking),
}));

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockOfferPriceButtonProps = jest.fn();
jest.mock('frontend/components/common/OfferPriceButton/OfferPriceButton', () => props => {
    mockOfferPriceButtonProps(props);

    return <button data-tid='offer-price-button' onClick={props.onClick} />;
});

const mockHotelImageProps = jest.fn();
jest.mock('frontend/components/common/HotelImage/HotelImage', () => ({
    __esModule: true,
    default: props => {
        mockHotelImageProps(props);

        return <div data-tid='hotel-image' />;
    },
}));

let mockProps;
let mockStores;
const offer = {
    ...mockedOffer,
    shortlist: { language: ENGLISH } as IShortlist,
    link: '/mockOfferLink',
    onClickViewHoliday: jest.fn(),
    asLink: '/mockOfferAsLink',
};
const createProps = (): ICompareOfferButtonProps => ({
    offer,
});

describe('CompareOfferButton', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createMockStores({
            shortlistStore: {
                isOfferFromAnotherMarket: jest.fn(() => false),
            },
            layoutStore: {
                getSitePathInLang: jest.fn(lang => `https://easyjet.com/${lang}/holidays`),
            },
            trackingStore: {
                pageTitle: 'Shortlists',
                pageName: 'Shortlist|CH-FR',
            },
        });
    });

    it('should render button', () => {
        render(<CompareOfferButton {...mockProps} />);

        expect(mockOfferPriceButtonProps).toHaveBeenCalledWith(
            expect.objectContaining({
                isLivePrice: false,
                link: offer.link,
                offer: offer,
                asLink: offer.asLink,
            }),
        );
    });

    it('should call onClickViewHoliday when click on button', async () => {
        render(<CompareOfferButton {...mockProps} />);

        await userEvent.click(screen.getByTestId('offer-price-button'));

        expect(offer.onClickViewHoliday).toHaveBeenCalled();
    });

    describe('tracking', () => {
        it('should track button click', async () => {
            render(<CompareOfferButton {...mockProps} />);

            await userEvent.click(screen.getByTestId('offer-price-button'));

            expect(comparisonTableUtils.getShortlistOfferIdentifier).toHaveBeenCalledWith(offer);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                {
                    eventAction: mockStores.trackingStore.pageName,
                    eventCategory: EventCategories.Shortlist,
                    eventLabel: EventLabels.ViewHoliday,
                    eventType: EventTypes.Interaction,
                },
                {
                    genericValue1: mockShortlistOfferIdentifier,
                    genericValue2: null,
                    genericValue3: null,
                    genericValue4: null,
                    destinationUrl: `${mockStores.layoutStore.sitePath}${offer.link}`,
                },
                undefined,
                undefined,
                { pageUrl: `${mockStores.layoutStore.sitePath}/shortlists${SitePath.Compare}` },
            );
        });

        it('should pass en lang when shortlisted offer does not have lang', async () => {
            mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
            mockProps.offer.shortlist.language = undefined;
            render(<CompareOfferButton {...mockProps} />);

            await userEvent.click(screen.getByTestId('offer-price-button'));

            expect(comparisonTableUtils.getShortlistOfferIdentifier).toHaveBeenCalledWith(offer);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    destinationUrl: `https://easyjet.com/en/holidays${offer.link}`,
                }),
                undefined,
                undefined,
                expect.any(Object),
            );
        });

        it('should track button check availability button', async () => {
            mockIsShortlistedOfferUnavailableForBooking = true;
            render(<CompareOfferButton {...mockProps} />);

            await userEvent.click(screen.getByTestId('offer-price-button'));

            expect(comparisonTableUtils.getShortlistOfferIdentifier).toHaveBeenCalledWith(offer);
            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.objectContaining({
                    eventLabel: EventLabels.CheckAvailability,
                }),
                expect.any(Object),
                undefined,
                undefined,
                expect.any(Object),
            );
        });

        it('should track destinationUrl when offer is from another market', async () => {
            mockStores.shortlistStore.isOfferFromAnotherMarket.mockReturnValue(true);
            render(<CompareOfferButton {...mockProps} />);

            await userEvent.click(screen.getByTestId('offer-price-button'));

            expect(mockStores.trackingStore.trackEventWithParams).toHaveBeenCalledWith(
                EventTypes.GenericEvent,
                expect.any(Object),
                expect.objectContaining({
                    destinationUrl: `https://easyjet.com/en/holidays${offer.link}`,
                }),
                undefined,
                undefined,
                expect.any(Object),
            );
        });
    });
});
