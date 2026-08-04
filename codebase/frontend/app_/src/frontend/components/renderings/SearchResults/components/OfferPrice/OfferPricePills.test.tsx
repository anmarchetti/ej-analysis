import React from 'react';
import { render, screen } from '@testing-library/react';

import { createMockStores } from 'frontend/__mocks__';
import * as freeNightsUtils from 'frontend/utils/freeNights.utils';
import * as utils from 'frontend/utils/offer.utils';
import { IOffer } from 'models/data/IOffer';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import OfferPricePills, { IOfferPricePillsProps } from './OfferPricePills';

const createProps = (): IOfferPricePillsProps => ({
    offer: {
        accom: { id: '12345' },
        hotel: {
            isGreatDeal: false,
            ecoFacility: {
                name: 'tooltip-name',
                tooltip: 'tooltip-content',
            },
        },
        shortlist: {
            type: ShortlistType.Hotel,
        },
        currency: { code: 'GBP' },
        price: 2000,
        pricePP: 1000,
    } as IOffer,
    isEcoCertifiedPill: true,
});

const createStores = () =>
    createMockStores({
        layoutStore: {
            isPromoPage: false,
            shouldDisplayStrikethroughPrices: jest.fn(() => false),
            isPillVisible: jest.fn(() => false),
            isFreeNightsEnabled: false,
        },
    });

let mockProps;
let mockStores;

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const mockPillComponent = jest.fn();
jest.mock('frontend/components/common/Pills/Pill/Pill', () => props => {
    mockPillComponent(props);

    return <div data-tid='pill' />;
});

const mockEcoCertifiedPill = jest.fn();
jest.mock('frontend/components/common/EcoCertifiedPill', () => ({
    __esModule: true,
    default: props => {
        mockEcoCertifiedPill(props);

        return <div data-tid='eco-certified-pill' />;
    },
}));

const mockFreeBoardUpgradePill = jest.fn();
jest.mock('frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill', () => ({
    __esModule: true,
    default: props => {
        mockFreeBoardUpgradePill(props);

        return <div data-tid='free-board-upgrade-pill' />;
    },
}));

const mockDiscountPercentagePill = jest.fn();
jest.mock('frontend/components/common/Pills/DiscountPercentagePill/DiscountPercentagePill', () => ({
    __esModule: true,
    default: props => {
        mockDiscountPercentagePill(props);

        return <div data-tid='discount-percentage-pill' />;
    },
}));

jest.mock('frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPill', () => ({
    __esModule: true,
    default: () => <div data-tid='discounted-board-pill' />,
}));

const mockGetTotalDiscount = jest.spyOn(utils, 'getTotalDiscount');
const mockIsFreeForKids = jest.spyOn(utils, 'isFreeForKids');
const mockGetIsShowGreatDealPill = jest.spyOn(utils, 'getIsShowGreatDealPill');
const mockGetFreeNightsIncludedInOffer = jest.spyOn(freeNightsUtils, 'getFreeNightsIncludedInOffer');

describe('<OfferPricePills />', () => {
    beforeEach(() => {
        mockProps = createProps();
        mockStores = createStores();
    });

    it('should render hotel-price container', () => {
        const { container } = render(<OfferPricePills {...mockProps} />);

        expect(container.getElementsByClassName('hotel-price__pills').length).toBe(1);
    });

    it('should NOT render hotel-price__pills--promo container when is NOT promo page', () => {
        const { container } = render(<OfferPricePills {...mockProps} />);

        expect(container.getElementsByClassName('hotel-price__pills--promo').length).toBe(0);
    });

    it('should render hotel-price__pills--promo container when is promo page', () => {
        mockStores.layoutStore.isPromoPage = true;
        const { container } = render(<OfferPricePills {...mockProps} />);

        expect(container.getElementsByClassName('hotel-price__pills--promo').length).toBe(1);
    });

    it('should NOT render pills', () => {
        render(<OfferPricePills {...mockProps} />);

        expect(screen.queryByTestId('pill')).not.toBeInTheDocument();
    });

    it('should render FreeForKidsPill when is free for kids', () => {
        mockIsFreeForKids.mockReturnValueOnce(true);
        mockStores.layoutStore.isPillVisible.mockReturnValueOnce(true);

        render(<OfferPricePills {...mockProps} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'freeKidsPill',
            ellipsis: true,
            icon: expect.any(Object),
            text: SitecoreDictionary.HolidayCardPromotionPillTooltipsFreeForKids,
            title: SitecoreDictionary.BasketLabelFreeForKids,
            dataTid: 'free-for-kids-pill',
        });
    });

    it('should render HotelDiscountPill when discount is provided and > 0', () => {
        mockGetTotalDiscount.mockReturnValue(10);
        mockStores.layoutStore.isPillVisible.mockReturnValueOnce(true);

        render(<OfferPricePills {...mockProps} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'discountPill priority',
            ellipsis: true,
            icon: expect.any(Object),
            text: SitecoreDictionary.HolidayCardPromotionPillTooltipsDiscount,
            title: SitecoreDictionary.BasketLabelDiscount,
            dataTid: 'discount-pill',
        });
    });

    it('should NOT render HotelDiscountPill when shouldDisplayStrikethroughPrices returns true', () => {
        mockStores.layoutStore.shouldDisplayStrikethroughPrices = jest.fn(() => true);
        mockGetTotalDiscount.mockReturnValue(10);
        mockStores.layoutStore.isPillVisible.mockReturnValueOnce(true);

        render(<OfferPricePills {...mockProps} />);

        expect(screen.queryByTestId('pill')).not.toBeInTheDocument();
    });

    it('should render FreeNightsIncludedPill', () => {
        mockStores.layoutStore.isFreeNightsEnabled = true;
        mockGetFreeNightsIncludedInOffer.mockReturnValueOnce(2);

        render(<OfferPricePills {...mockProps} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'freeNightsPill',
            ellipsis: true,
            icon: expect.any(Object),
            text: SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedTooltip,
            title: SitecoreDictionary.FreeUpgradesLabelsFreeNightsIncludedPlural,
            dataTid: 'free-nights-pill',
        });
    });

    it('should render GreatDealPill when isGreatDealPill is true', () => {
        mockGetIsShowGreatDealPill.mockReturnValue(true);

        render(<OfferPricePills {...mockProps} />);

        expect(screen.getByTestId('pill')).toBeInTheDocument();
        expect(mockPillComponent).toHaveBeenCalledWith({
            contentClass: 'greatDealPill priority',
            ellipsis: true,
            icon: expect.any(Object),
            text: SitecoreDictionary.HolidayCardLabelsGreatDealPillTooltip,
            title: SitecoreDictionary.HolidayCardLabelsGreatDealPill,
            dataTid: 'great-deal-pill',
        });
    });

    describe('FreeBoardUpgradePill', () => {
        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to true when hasFreeBoardUpdate is true', () => {
            mockProps.offer.hasFreeBoardUpdate = true;

            render(<OfferPricePills {...mockProps} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: true,
            });
        });

        it('should render FreeBoardUpgradePill with isFreeBoardUpgrade set to false when hasFreeBoardUpdate is false', async () => {
            render(<OfferPricePills {...mockProps} />);

            expect(screen.getByTestId('free-board-upgrade-pill')).toBeInTheDocument();
            expect(mockFreeBoardUpgradePill).toHaveBeenCalledWith({
                isFreeBoardUpgrade: false,
            });
        });
    });

    describe('DiscountPercentagePill', () => {
        it('should render DiscountPercentagePill with correct discount percentage', () => {
            mockProps.offer.discountPercentage = 10;

            render(<OfferPricePills {...mockProps} />);

            expect(screen.getByTestId('discount-percentage-pill')).toBeInTheDocument();
            expect(mockDiscountPercentagePill).toHaveBeenCalledWith({
                discountPercentage: 10,
                icon: expect.any(Object),
            });
        });

        it('should render DiscountPercentagePill without discount percentage when discountPercentage is NOT provided', async () => {
            render(<OfferPricePills {...mockProps} />);

            expect(screen.getByTestId('discount-percentage-pill')).toBeInTheDocument();
            expect(mockDiscountPercentagePill).toHaveBeenCalledWith({
                discountPercentage: undefined,
                icon: expect.any(Object),
            });
        });
    });

    describe('EcoCertifiedPill', () => {
        it('should render when isEcoCertifiedPill is true', () => {
            render(<OfferPricePills {...mockProps} />);

            expect(mockEcoCertifiedPill).toHaveBeenCalledWith({
                isNewPill: true,
                title: 'tooltip-name',
                tooltip: 'tooltip-content',
            });
            expect(screen.getByTestId('eco-certified-pill')).toBeInTheDocument();
        });

        it('should NOT render when isEcoCertifiedPill is false', () => {
            mockProps.isEcoCertifiedPill = false;

            render(<OfferPricePills {...mockProps} />);

            expect(screen.queryByTestId('eco-certified-pill')).not.toBeInTheDocument();
        });
    });

    describe('<DiscountedBoardPill />', () => {
        it('should render DiscountedBoardPill when hasDiscountedBoardUpgrade is true and hasFreeBoardUpdate is false', () => {
            mockProps.offer.hasDiscountedBoardUpgrade = true;
            mockProps.offer.hasFreeBoardUpdate = false;

            render(<OfferPricePills {...mockProps} />);

            expect(screen.getByTestId('discounted-board-pill')).toBeInTheDocument();
        });

        it('should NOT render DiscountedBoardPill when both hasDiscountedBoardUpgrade/hasFreeBoardUpdate is true', () => {
            mockProps.offer.hasDiscountedBoardUpgrade = true;
            mockProps.offer.hasFreeBoardUpdate = true;

            render(<OfferPricePills {...mockProps} />);

            expect(screen.queryByTestId('discounted-board-pill')).toBeNull();
        });
    });
});
