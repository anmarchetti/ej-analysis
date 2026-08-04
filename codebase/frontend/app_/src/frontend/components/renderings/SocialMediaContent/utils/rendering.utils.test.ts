import { mockFlightsOffers, mockHotel } from 'frontend/__mocks__';
import { IHotel } from 'models/data/IHotel';
import { IOffer } from 'models/data/IOffer';
import { HolidayThemes } from 'models/enum/HolidayThemes';
import { OfferPromotionCodes } from 'models/enum/OfferPromotionCodes';
import { PackageIconTypes } from 'models/enum/PackageIconTypes';

import { getImageDataUri, getSocialText } from './rendering.utils';

const mockGetImageDataUri = jest.fn(() => 'test-result');
jest.mock('lib/generate-pdf', () => ({
    getImageDataUri: mockGetImageDataUri,
}));

describe('getImageDataUri', () => {
    it('should call getImageDataUri', async () => {
        jest.spyOn(document, 'getElementById').mockReturnValue({
            cloneNode: jest.fn(() => ({})),
        } as any);

        const result = await getImageDataUri('id');

        expect(mockGetImageDataUri).toBeCalledWith({});
        expect(result).toEqual('test-result');
    });

    it('should not call getImageDataUri when no element', async () => {
        jest.spyOn(document, 'getElementById').mockReturnValue({
            cloneNode: jest.fn(() => undefined),
        } as any);

        const result = await getImageDataUri('id');

        expect(mockGetImageDataUri).not.toBeCalled();
        expect(result).toEqual('');
    });
});

describe('getSocialText', () => {
    let hotel: IHotel;
    let offer: IOffer;

    const getMockedSocialText = () =>
        getSocialText(hotel, 'priceLabel', offer, {
            airportLabel: 'airportLabel',
            depositLabel: 'depositLabel',
            getPhrase: jest.fn(p => p),
            getFormattedNumber: jest.fn(number => `${number}`),
            fastTrackSecurityLabel: undefined,
        });

    beforeEach(() => {
        hotel = {
            ...mockHotel,
            closestFacility: { ...mockHotel.closestFacility! },
            theme: {
                code: 'T001',
                name: 'Beach Getaway',
                itemName: 'Beach Getaway EN',
                packageIcons: [
                    {
                        key: PackageIconTypes.Hotel,
                        name: 'Beach Package',
                        iconUrl: 'beach_icon_url',
                    },
                    {
                        key: PackageIconTypes.Bags,
                        name: 'Sunbed Package',
                        iconUrl: 'sunbed_icon_url',
                        luggageCode: 'LUS',
                    },
                ],
            },
        };
        offer = { ...mockFlightsOffers[0], accom: { ...mockFlightsOffers[0].accom } };
    });

    describe('distanceLabel', () => {
        const beachDistanceLabel = '✅ HolidayDistance.Labels.ShortDistanceBeach';
        const cityDistanceLabel = '✅ HolidayDistance.Labels.ShortDistanceCity';

        beforeEach(() => {
            hotel.theme.code = HolidayThemes.Beach;
        });

        it('should show defined hotel.closestFacility.distance', () => {
            expect(getMockedSocialText()).toContain(beachDistanceLabel);
        });

        it('should filter not defined hotel.closestFacility.distance', () => {
            hotel.closestFacility!.distance = undefined as any;

            expect(getMockedSocialText()).not.toContain(beachDistanceLabel);
        });

        it('should use accom.theme when hotel theme is not defined', () => {
            hotel.theme = undefined as any;
            offer.accom.theme = {
                code: HolidayThemes.City,
                name: 'name',
                packageIcons: [],
            };

            expect(getMockedSocialText()).toContain(cityDistanceLabel);
        });
    });

    describe('bagLabel, transferLabel', () => {
        beforeEach(() => {
            offer.accom.theme = {
                code: 'theme code',
                name: 'theme name',
                packageIcons: [{ key: PackageIconTypes.SharedTransfer, iconUrl: 'iconUrl', name: 'shared transfer' }],
            };
        });

        it('should render transferLabel', () => {
            expect(getMockedSocialText()).toContain(offer.accom.theme!.packageIcons[0].name);
        });

        it('should use hotel.theme.packageIcons when offer.accom.theme.packageIcons is not defined', () => {
            hotel.theme.packageIcons = [
                { key: PackageIconTypes.SharedTransfer, iconUrl: 'iconUrl', name: 'shared transfer from hotel' },
            ];
            offer.accom.theme = {
                code: HolidayThemes.City,
                name: 'name',
                packageIcons: undefined as any,
            };

            expect(getMockedSocialText()).toContain(hotel.theme.packageIcons[0].name);
        });

        it('should show bagLabel', () => {
            const bagLabel = 'bagLabel';
            offer.accom.theme!.packageIcons = [
                ...offer.accom.theme!.packageIcons,
                { key: PackageIconTypes.Bags, name: bagLabel, iconUrl: 'test1', luggageCode: 'LUS' },
            ];

            expect(getMockedSocialText()).toContain(bagLabel);
        });

        it('should show bagLabel & transfer together', () => {
            const bagLabel = 'bagLabel';
            offer.accom.theme!.packageIcons = [
                ...offer.accom.theme!.packageIcons,
                { key: PackageIconTypes.Bags, name: bagLabel, iconUrl: 'test1', luggageCode: 'LUS' },
            ];

            expect(getMockedSocialText()).toContain(`🚌 bagLabel, shared transfer\n`);
        });
    });

    describe('roomType, boardType', () => {
        const firstUnit = offer?.accom.unit[0];

        it('should show only first roomType', () => {
            const testRoomType = 'test_room';
            offer.accom.unit[1] = {
                ...firstUnit,
                roomType: { ...firstUnit?.roomType, title: { value: testRoomType } },
            };

            expect(getMockedSocialText()).not.toContain(testRoomType);
        });

        it('should show roomType, boardType together', () => {
            expect(getMockedSocialText()).toContain(`🛏 roomType_title, boardType_title\n`);
        });
    });

    it('should correctly return content', () => {
        hotel.theme.code = HolidayThemes.Beach;

        expect(getMockedSocialText()).toEqual(`🌍 Resort Example, United States, United States
🏩 Hotel Example
🎉 priceLabel
🛏 roomType_title, boardType_title
🗓 26th Aug 2023
✈️ airportLabel
🧳 Sunbed Package
------
✅ Free Wi-Fi
✅ 24-hour room service
✅ HolidayDistance.Labels.ShortDistanceBeach
🌟 depositLabel 🌟`);
    });

    it('should return content with luxury content', () => {
        offer.promoCollections = [OfferPromotionCodes.Luxury];
        hotel.theme.code = HolidayThemes.Beach;
        hotel.theme.packageIcons = [
            {
                key: PackageIconTypes.Hotel,
                name: 'Beach Package',
                iconUrl: 'beach_icon_url',
            },
            {
                key: PackageIconTypes.Bags,
                name: '23kg bag',
                iconUrl: 'sunbed_icon_url',
                luggageCode: 'LUS',
            },
            {
                key: PackageIconTypes.SharedTransfer,
                name: 'Shared Transfer',
                iconUrl: 'shared',
                luggageCode: 'TEST',
            },
        ];

        expect(
            getSocialText(hotel, 'priceLabel', offer, {
                airportLabel: 'airportLabel',
                depositLabel: 'depositLabel',
                getPhrase: jest.fn(p => p),
                getFormattedNumber: jest.fn(number => `${number}`),
                fastTrackSecurityLabel: 'fastTrackSecurityLabel',
            }),
        ).toEqual(`🌍 Resort Example, United States, United States
🏩 Hotel Example
🎉 priceLabel
🛏 roomType_title, boardType_title
🗓 26th Aug 2023
✈️ airportLabel
↠ fastTrackSecurityLabel
🚌 Luggage.Labels.26kgHoldBagPlural, Shared Transfer
------
✅ Free Wi-Fi
✅ 24-hour room service
✅ HolidayDistance.Labels.ShortDistanceBeach
🌟 depositLabel 🌟`);
    });

    it('should return content with under seat bag', () => {
        hotel.theme.code = HolidayThemes.Beach;
        hotel.theme.packageIcons = [
            {
                key: PackageIconTypes.Hotel,
                name: 'Beach Package',
                iconUrl: 'beach_icon_url',
            },
            {
                key: PackageIconTypes.UnderSeatBag,
                name: 'Under Seat Bag',
                iconUrl: 'under_seat_icon_url',
                luggageCode: 'LUS',
            },
            {
                key: PackageIconTypes.SharedTransfer,
                name: 'Shared Transfer',
                iconUrl: 'shared',
                luggageCode: 'TEST',
            },
        ];

        expect(getMockedSocialText()).toEqual(`🌍 Resort Example, United States, United States
🏩 Hotel Example
🎉 priceLabel
🛏 roomType_title, boardType_title
🗓 26th Aug 2023
✈️ airportLabel
🚌 Under Seat Bag, Shared Transfer
------
✅ Free Wi-Fi
✅ 24-hour room service
✅ HolidayDistance.Labels.ShortDistanceBeach
🌟 depositLabel 🌟`);
    });
});
