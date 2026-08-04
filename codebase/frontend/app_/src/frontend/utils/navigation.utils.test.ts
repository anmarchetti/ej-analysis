import { IBookingInfo } from 'models/data/IBookingInfo';
import INavLink from 'models/data/INavLink';
import { ShowOn } from 'models/enum/ShowOn';
import SitePath from 'models/enum/SitePath';

import { isHolidayCreditItem, isLogOutItem, isUserLinkValid } from './navigation.utils';
import { mockSitecoreField, mockSitecoreLinkField } from './tests.utils';

describe('navigation.utils', () => {
    describe('isHolidayCreditItem', () => {
        it('should return false if empty link', () => {
            const res = isHolidayCreditItem({} as INavLink);

            expect(res).toBeFalsy();
        });

        it('should return false if link does not contains credits url', () => {
            const res = isHolidayCreditItem({ fields: { Link: { value: { href: 'test' } } } } as INavLink);

            expect(res).toBeFalsy();
        });

        it('should return true if link contains credits url', () => {
            const res = isHolidayCreditItem({
                fields: { Link: { value: { href: `test/${SitePath.HolidayCredit}` } } },
            } as INavLink);

            expect(res).toBeTruthy();
        });
    });

    describe('isLogOutItem', () => {
        it('should return true if string contains logout value', () => {
            const res = isLogOutItem('logout');

            expect(res).toBeTruthy();
        });

        it('should return false if string does NOT contain logout value', () => {
            const res = isLogOutItem('test string');

            expect(res).toBeFalsy();
        });
    });

    describe('isUserLinkValid', () => {
        const mockItem: INavLink = {
            fields: { Link: mockSitecoreField(mockSitecoreLinkField('/test')) },
            id: 'test-id',
        };

        const mockBooking = {} as IBookingInfo;
        const mockViewBooking = {} as IBookingInfo;

        describe('when showCase is ShowOnIfAvailableToCheckIn', () => {
            const itemWithCheckIn: INavLink = {
                ...mockItem,
                fields: {
                    ...mockItem.fields,
                    ShowOn: { value: ShowOn.ShowOnIfAvailableToCheckIn },
                },
            };

            it('should return result of isCheckInAvailable when on booking confirmation page with booking', () => {
                const isCheckInAvailable = jest.fn().mockReturnValue(true);

                const res = isUserLinkValid({
                    item: itemWithCheckIn,
                    isLoggedIn: true,
                    isBookingConfirmationPage: true,
                    booking: mockBooking,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable,
                });

                expect(isCheckInAvailable).toHaveBeenCalledWith(mockBooking);
                expect(res).toBe(true);
            });

            it('should return result of isCheckInAvailable when on view booking page with viewBooking', () => {
                const isCheckInAvailable = jest.fn().mockReturnValue(true);

                const res = isUserLinkValid({
                    item: itemWithCheckIn,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: mockViewBooking,
                    isViewBookingPage: true,
                    isCheckInAvailable,
                });

                expect(isCheckInAvailable).toHaveBeenCalledWith(mockViewBooking);
                expect(res).toBe(true);
            });

            it('should return true when not on confirmation or view booking page', () => {
                const isCheckInAvailable = jest.fn();

                const res = isUserLinkValid({
                    item: itemWithCheckIn,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable,
                });

                expect(isCheckInAvailable).not.toHaveBeenCalled();
                expect(res).toBe(true);
            });

            it('should return true when on confirmation page but no booking', () => {
                const isCheckInAvailable = jest.fn();

                const res = isUserLinkValid({
                    item: itemWithCheckIn,
                    isLoggedIn: true,
                    isBookingConfirmationPage: true,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable,
                });

                expect(isCheckInAvailable).not.toHaveBeenCalled();
                expect(res).toBe(true);
            });
        });

        describe('when showCase is ShowOnLogedIn', () => {
            const itemLoggedIn: INavLink = {
                ...mockItem,
                fields: {
                    ...mockItem.fields,
                    ShowOn: { value: ShowOn.ShowOnLogedIn },
                },
            };

            it('should return true when user is logged in', () => {
                const res = isUserLinkValid({
                    item: itemLoggedIn,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(true);
            });

            it('should return false when user is not logged in', () => {
                const res = isUserLinkValid({
                    item: itemLoggedIn,
                    isLoggedIn: false,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(false);
            });

            it('should return false when isLoggedIn is undefined', () => {
                const res = isUserLinkValid({
                    item: itemLoggedIn,
                    isLoggedIn: undefined,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(false);
            });
        });

        describe('when showCase is ShowOnLogedOut', () => {
            const itemLoggedOut: INavLink = {
                ...mockItem,
                fields: {
                    ...mockItem.fields,
                    ShowOn: { value: ShowOn.ShowOnLogedOut },
                },
            };

            it('should return true when user is not logged in', () => {
                const res = isUserLinkValid({
                    item: itemLoggedOut,
                    isLoggedIn: false,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(true);
            });

            it('should return false when user is logged in', () => {
                const res = isUserLinkValid({
                    item: itemLoggedOut,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(false);
            });

            it('should return true when isLoggedIn is undefined', () => {
                const res = isUserLinkValid({
                    item: itemLoggedOut,
                    isLoggedIn: undefined,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(true);
            });
        });

        describe('when showCase is ShowOnDesktop', () => {
            const itemDesktop: INavLink = {
                ...mockItem,
                fields: {
                    ...mockItem.fields,
                    ShowOn: { value: ShowOn.ShowOnDesktop },
                },
            };

            it('should return true regardless of login status', () => {
                const res = isUserLinkValid({
                    item: itemDesktop,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(true);
            });
        });

        describe('when showCase is undefined', () => {
            const itemNoShowOn: INavLink = {
                ...mockItem,
                fields: {
                    ...mockItem.fields,
                    ShowOn: undefined,
                },
            };

            it('should return true', () => {
                const res = isUserLinkValid({
                    item: itemNoShowOn,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(true);
            });
        });

        describe('when item has no fields', () => {
            const itemNoFields = {} as INavLink;

            it('should return true', () => {
                const res = isUserLinkValid({
                    item: itemNoFields,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(true);
            });
        });

        describe('when showCase is ShowOnMobile', () => {
            const itemMobile: INavLink = {
                ...mockItem,
                fields: {
                    ...mockItem.fields,
                    ShowOn: { value: ShowOn.ShowOnMobile },
                },
            };

            it('should return false (unrecognized ShowOn value defaults to false)', () => {
                const res = isUserLinkValid({
                    item: itemMobile,
                    isLoggedIn: true,
                    isBookingConfirmationPage: false,
                    booking: undefined,
                    viewBooking: undefined,
                    isViewBookingPage: false,
                    isCheckInAvailable: jest.fn(),
                });

                expect(res).toBe(false);
            });
        });
    });
});
