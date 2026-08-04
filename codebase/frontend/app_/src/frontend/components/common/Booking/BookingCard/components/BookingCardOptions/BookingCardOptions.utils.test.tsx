import { mockBooking } from 'frontend/__mocks__/booking';
import * as utils from 'frontend/components/common/Booking/BookingCard/BookingCard.utils';

import { usePreparedBookingOptionsData } from './BookingCardOptions.utils';

describe('usePreparedBookingOptionsData', () => {
    it('should return data from offer hotel', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            offer: {
                hotel: { closestFacility: 'closest facility test', theme: 'theme test' },
                rooms: [{ roomType: 'type 1', boardType: 'board 1' }],
            },
            isCanceled: true,
        } as any);
        const data = usePreparedBookingOptionsData(mockBooking);

        expect(data).toStrictEqual({
            isCanceled: true,
            options: {
                boardTypes: 'board 1',
                closestFacility: 'closest facility test',
                holidayTheme: 'theme test',
                roomTypes: 'type 1',
            },
        });
    });

    it('should return data from bookingHotel when offer hotel data is NOT provided', () => {
        jest.spyOn(utils, 'getCommonData').mockReturnValue({
            offer: {
                hotel: { theme: 'theme test' },
                rooms: [],
            },
            isCanceled: false,
        } as any);
        const data = usePreparedBookingOptionsData(mockBooking);

        expect(data).toStrictEqual({
            isCanceled: false,
            options: {
                boardTypes: {
                    code: 'HB',
                    content: 'Breakfast and dinner included',
                    description: 'Enjoy a delicious breakfast and dinner during your stay',
                    iconUrl: 'https://example.com/hb-icon.png',
                    name: 'Half Board',
                    price: 150,
                    pricePP: 50,
                    title: 'Half Board',
                },
                closestFacility: {
                    code: 'CF002',
                    distance: 0.3,
                    groupCode: 'CG001',
                    name: 'Nearest Coffee Shop',
                },
                holidayTheme: 'theme test',
                roomTypes: {
                    code: 'roomType_code',
                    content: 'roomType_content',
                    description: 'roomType_description',
                    itemName: 'roomType_title',
                    facilities: [
                        {
                            code: 'facilities_code',
                            disclaimerMessage: 'facilities_disclaimerMessage',
                            name: 'facilities_name',
                            number: 'facilities_number',
                        },
                    ],
                    iconUrl: 'roomType_icon',
                    images: [
                        {
                            description: 'image_Description',
                            id: 'image_id',
                            large: 'image_large',
                            medium: 'image_medium',
                            selected: false,
                            small: 'image_small',
                        },
                    ],
                    name: 'roomType_name',
                    roomFacilityFolderId: 'roomFacilityFolderId',
                    roomImagesFolderId: 'roomImagesFolderId',
                    stays: [
                        {
                            description: 'stays_Description',
                            facilities: [
                                {
                                    code: 'stays_facilities_code',
                                    name: 'stays_facilities_name',
                                    number: 'stays_facilities_number',
                                },
                            ],
                            stayType: 'stays_stayType',
                        },
                    ],
                    title: 'roomType_title',
                },
            },
        });
    });
});
