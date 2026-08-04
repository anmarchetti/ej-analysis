import React from 'react';
import { render, screen } from '@testing-library/react';

import { CurrencyCode } from 'code/currency';
import { createMockStores } from 'frontend/__mocks__';
import { IAccomData, IOfferWithoutAltBoards, IUnit } from 'models/data/IOffer';

import BasketPriceCellOffers, { IBasketPriceCellOffersProps, OffersViewMode } from './BasketPriceCellOffers';

jest.mock('frontend/components/common/Pills/HotelDiscountPill/HotelDiscountPill', () => 'HotelDiscountPill');
jest.mock('frontend/components/renderings/SearchResults/components/HotelDeposit', () => 'HotelDeposit');
jest.mock('frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill', () => 'FreeForKidsPill');

jest.mock('frontend/components/common/Pills/LuxuryPill/LuxuryPill', () => ({
    __esModule: true,
    default: () => <div data-tid='luxury-pill' />,
}));

const createStores = () =>
    createMockStores({
        layoutStore: {
            isPillVisible: jest.fn(() => true),
        },
        appStore: {
            isScreenExtraSmall: false,
        },
        bookingStore: {
            currency: CurrencyCode.GBP,
        },
    });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: () => mockStores,
}));

const resetMocks = (): IBasketPriceCellOffersProps => ({
    offer: {} as IOfferWithoutAltBoards,
    viewMode: OffersViewMode.AllOffers,
    isPricePPShown: true,
});

let mocks = resetMocks();
let mockStores = createStores();

describe('<BasketPriceCellOffers />', () => {
    beforeEach(() => {
        mocks = resetMocks();
        mockStores = createStores();
    });

    it('should render discount pill if discount received', () => {
        mocks.offer.accom = {
            unit: [
                {
                    discount: 10,
                },
            ],
        } as IAccomData<IUnit>;

        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        expect(container.querySelector('HotelDiscountPill')).toBeTruthy();
    });

    it('should not render discount pill if discount not received', () => {
        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        expect(container.querySelector('HotelDiscountPill')).toBeFalsy();
    });

    it('should render deposit pill if deposit availability received', () => {
        mocks.offer.deposit = 10;
        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        expect(container.querySelector('HotelDeposit')).toBeTruthy();
    });

    it('should not render deposit pill if deposit availability not received', () => {
        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        expect(container.querySelector('HotelDeposit')).toBeFalsy();
    });

    it('should render kidsGoFree pill if kidsGoFree availability received', () => {
        mocks.offer.accom = {
            unit: [
                {
                    isFreeForKids: true,
                },
            ],
        } as IAccomData<IUnit>;
        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        expect(container.querySelector('FreeForKidsPill')).toBeTruthy();
    });

    it('should not render kidsGoFree pill if kidsGoFree availability not received', () => {
        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        expect(container.querySelector('FreeForKidsPill')).toBeFalsy();
    });

    it('should render all 3 pills  if viewMode = AllOffers', () => {
        mocks.offer = {
            ...mocks.offer,
            accom: {
                unit: [
                    {
                        isFreeForKids: true,
                        discount: 10,
                    },
                ],
            } as IAccomData<IUnit>,
            deposit: 30,
        };

        const { container } = render(<BasketPriceCellOffers {...mocks} />);

        expect(container.children.length).toEqual(3);
        expect(container.children[0].nodeName).toEqual('HOTELDISCOUNTPILL');
        expect(container.children[1].nodeName).toEqual('HOTELDEPOSIT');
        expect(container.children[2].nodeName).toEqual('FREEFORKIDSPILL');
    });

    it('should render no pills if viewMode is undefined', () => {
        mocks.viewMode = undefined;
        mocks.offer = {
            ...mocks.offer,
            accom: {
                unit: [
                    {
                        isFreeForKids: true,
                        discount: 10,
                    },
                ] as IUnit[],
            } as IAccomData<IUnit>,
            deposit: 30,
        };
        const { container } = render(<BasketPriceCellOffers {...mocks} />);

        expect(container.children.length).toEqual(0);
    });

    it('should render 2 pills if viewMode = TwoOffers (first two pills and always lux pill)', () => {
        mocks.viewMode = OffersViewMode.TwoOffers;
        mocks.offer = {
            ...mocks.offer,
            accom: {
                unit: [
                    {
                        isFreeForKids: true,
                        discount: 10,
                    },
                ] as IUnit[],
            } as IAccomData<IUnit>,
            deposit: 10,
        };
        const { container } = render(<BasketPriceCellOffers {...mocks} />);
        console.log(container.children);
        console.log(container);
        screen.debug();
        expect(container.children.length).toEqual(2);

        expect(container.children[0].nodeName).toEqual('HOTELDISCOUNTPILL');
        expect(container.children[1].nodeName).toEqual('HOTELDEPOSIT');
    });
});
