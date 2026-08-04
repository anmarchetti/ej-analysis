import { IBookingInfo, IBookingPackage } from 'models/data/IBookingInfo';

import { getChatbotViewBookingEventParams } from './viewBooking.utils';

const mockBookingInfo = {
    bookingReference: 'ABC123',
    guests: [
        { isLead: false, lastName: 'Doe' },
        { isLead: true, lastName: 'Smith' },
    ],
    package: {
        transport: {
            routes: [{ depDate: '2024-12-25' }],
        },
    },
} as IBookingInfo;

describe('getChatbotViewBookingEventParams', () => {
    it('should return the correct payload when lead guest is present', () => {
        const expectedOutput = {
            bookingGuestLastName: 'Smith',
            bookingDepDate: '2024-12-25',
            bookingReference: 'ABC123',
        };

        const res = getChatbotViewBookingEventParams(mockBookingInfo);

        expect(res).toMatchObject(expectedOutput);
    });

    it('should return the first guest when no lead guest is present', () => {
        const mockBookingInfoWithoutLeadGuest = {
            ...mockBookingInfo,
            guests: [{ isLead: false, lastName: 'Doe' }],
        } as IBookingInfo;

        const expectedOutput = {
            bookingGuestLastName: 'Doe',
            bookingDepDate: '2024-12-25',
            bookingReference: 'ABC123',
        };

        const res = getChatbotViewBookingEventParams(mockBookingInfoWithoutLeadGuest);

        expect(res).toMatchObject(expectedOutput);
    });

    it('should handle missing guest last name', () => {
        const mockBookingInfoWithoutLastName = {
            ...mockBookingInfo,
            guests: [{ isLead: true }],
        } as IBookingInfo;

        const expectedOutput = {
            bookingGuestLastName: '',
            bookingDepDate: '2024-12-25',
            bookingReference: 'ABC123',
        };

        const res = getChatbotViewBookingEventParams(mockBookingInfoWithoutLastName);

        expect(res).toMatchObject(expectedOutput);
    });

    it('should handle missing depDate', () => {
        const mockBookingInfoWithoutDepDate = {
            ...mockBookingInfo,
            package: { transport: { routes: [] } },
        } as IBookingInfo & {
            package: IBookingPackage & { transport: { routes: [] } };
        };

        const expectedOutput = {
            bookingGuestLastName: 'Smith',
            bookingDepDate: '',
            bookingReference: 'ABC123',
        };

        const res = getChatbotViewBookingEventParams(mockBookingInfoWithoutDepDate);

        expect(res).toMatchObject(expectedOutput);
    });

    it('should handle missing guests array', () => {
        const mockBookingInfoWithoutGuests = {
            ...mockBookingInfo,
            guests: undefined,
        } as IBookingInfo & { guests: undefined };

        const expectedOutput = {
            bookingGuestLastName: '',
            bookingDepDate: '2024-12-25',
            bookingReference: 'ABC123',
        };

        const res = getChatbotViewBookingEventParams(mockBookingInfoWithoutGuests);

        expect(res).toMatchObject(expectedOutput);
    });
});
