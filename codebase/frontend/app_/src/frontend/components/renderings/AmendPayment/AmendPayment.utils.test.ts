import { mockSitecoreField, mockSitecoreImageField } from 'frontend/utils/tests.utils';
import { AmendStoreKey } from 'models/data/AmendInfo';
import { AmendmentType } from 'models/data/IBookingInfo';
import SitePath, { SitePathOverload } from 'models/enum/SitePath';

import { mockPaymentPriceBreakdownFields } from './__mocks__/amendPayment';
import { getAmendPaymentConfig, getMetaByAmendmentType, getPriceBreakdown } from './AmendPayment.utils';

describe('AmendPayment.utils', () => {
    describe('getAmendPaymentConfig', () => {
        it('should return Flight config when amendmentType is Flight', () => {
            const result = getAmendPaymentConfig(AmendmentType.Flight);
            expect(result).toEqual({
                prevPage: SitePath.AmendFlights,
                iconKey: 'FlightsFlowIcon',
                titleKey: 'FlightsFlowTitle',
                storeKey: AmendStoreKey.Flights,
                labelKey: 'FlightLabel',
            });
        });

        it('should return Transfer config when amendmentType is Transfer', () => {
            const result = getAmendPaymentConfig(AmendmentType.Transfer);
            expect(result).toEqual({
                prevPage: SitePath.AmendTransfer,
                iconKey: 'TransfersFlowIcon',
                titleKey: 'TransfersFlowTitle',
                storeKey: AmendStoreKey.Transfers,
                labelKey: 'TransferLabel',
            });
        });

        it('should return Seats config when amendmentType is Seats', () => {
            const result = getAmendPaymentConfig(AmendmentType.Seats);
            expect(result).toEqual({
                prevPage: SitePath.ViewBooking,
                prevPageBreadcrumbOverload: SitePathOverload.ChangeYourSeats,
                iconKey: 'SeatsFlowIcon',
                titleKey: 'SeatsFlowTitle',
                storeKey: AmendStoreKey.Seats,
                labelKey: 'SeatsLabel',
            });
        });

        it('should return Dates config when amendmentType is Dates', () => {
            const result = getAmendPaymentConfig(AmendmentType.Dates);
            expect(result).toEqual({
                prevPage: SitePath.AmendDatesSummary,
                iconKey: 'DatesFlowIcon',
                titleKey: 'DatesFlowTitle',
                storeKey: AmendStoreKey.Dates,
                labelKey: 'DatesLabel',
            });
        });

        it('should return RoomAndBoard config when amendmentType is RoomAndBoard', () => {
            const result = getAmendPaymentConfig(AmendmentType.RoomAndBoard);
            expect(result).toEqual({
                prevPage: SitePath.AmendRoomAndBoard,
                iconKey: 'RoomAndBoardFlowIcon',
                titleKey: 'RoomAndBoardFlowTitle',
                storeKey: AmendStoreKey.RoomAndBoard,
                labelKey: 'RoomAndBoardLabel',
            });
        });

        it('should return Hotel config when amendmentType is Hotel', () => {
            const result = getAmendPaymentConfig(AmendmentType.Hotel);
            expect(result).toEqual({
                prevPage: SitePath.AmendHotelSummary,
                prevPageBreadcrumbOverload: SitePathOverload.ReviewYourChanges,
                iconKey: 'HotelFlowIcon',
                titleKey: 'HotelFlowTitle',
                storeKey: AmendStoreKey.Hotel,
                labelKey: 'HotelLabel',
            });
        });

        it('should return an empty object when amendment type has not been provided', () => {
            const result = getAmendPaymentConfig(undefined);

            expect(result).toEqual({});
        });
    });

    const mockFields = {
        FlightsFlowIcon: mockSitecoreField(mockSitecoreImageField('FlightsFlowIcon')),
        FlightsFlowTitle: mockSitecoreField('FlightsFlowTitle'),
        TransfersFlowIcon: mockSitecoreField(mockSitecoreImageField('TransfersFlowIcon')),
        TransfersFlowTitle: mockSitecoreField('TransfersFlowTitle'),
        SeatsFlowIcon: mockSitecoreField(mockSitecoreImageField('SeatsFlowIcon')),
        SeatsFlowTitle: mockSitecoreField('SeatsFlowTitle'),
        DatesFlowIcon: mockSitecoreField(mockSitecoreImageField('DatesFlowIcon')),
        DatesFlowTitle: mockSitecoreField('DatesFlowTitle'),
        RoomAndBoardFlowIcon: mockSitecoreField(mockSitecoreImageField('RoomAndBoardFlowIcon')),
        RoomAndBoardFlowTitle: mockSitecoreField('RoomAndBoardFlowTitle'),
        HotelFlowIcon: mockSitecoreField(mockSitecoreImageField('HotelFlowIcon')),
        HotelFlowTitle: mockSitecoreField('HotelFlowTitle'),
    } as any;

    describe('getMetaByAmendmentType', () => {
        it('should return correct meta for Seats amendment', () => {
            const result = getMetaByAmendmentType(mockFields, AmendmentType.Seats);

            expect(result).toEqual({
                icon: mockFields.SeatsFlowIcon,
                title: mockFields.SeatsFlowTitle,
            });
        });

        it('should return correct meta for Flights amendment', () => {
            const result = getMetaByAmendmentType(mockFields, AmendmentType.Flight);

            expect(result).toEqual({
                icon: mockFields.FlightsFlowIcon,
                title: mockFields.FlightsFlowTitle,
            });
        });

        it('should return correct meta for Transfers amendment', () => {
            const result = getMetaByAmendmentType(mockFields, AmendmentType.Transfer);

            expect(result).toEqual({
                icon: mockFields.TransfersFlowIcon,
                title: mockFields.TransfersFlowTitle,
            });
        });

        it('should return correct meta for Dates amendment', () => {
            const result = getMetaByAmendmentType(mockFields, AmendmentType.Dates);

            expect(result).toEqual({
                icon: mockFields.DatesFlowIcon,
                title: mockFields.DatesFlowTitle,
            });
        });

        it('should return correct meta for RoomAndBoard amendment', () => {
            const result = getMetaByAmendmentType(mockFields, AmendmentType.RoomAndBoard);

            expect(result).toEqual({
                icon: mockFields.RoomAndBoardFlowIcon,
                title: mockFields.RoomAndBoardFlowTitle,
            });
        });

        it('should return correct meta for Hotel amendment', () => {
            const result = getMetaByAmendmentType(mockFields, AmendmentType.Hotel);

            expect(result).toEqual({
                icon: mockFields.HotelFlowIcon,
                title: mockFields.HotelFlowTitle,
            });
        });
    });

    describe('getPriceBreakdown', () => {
        it('should return price breakdown items based on product: Flight', () => {
            const result = getPriceBreakdown(AmendmentType.Flight, 100, mockPaymentPriceBreakdownFields);

            expect(result).toEqual([
                {
                    breakdownTitle: mockPaymentPriceBreakdownFields[`${AmendmentType.Flight}Change`]!.value,
                    amount: 100,
                    uniqueKey: 'change',
                    tooltipText: mockPaymentPriceBreakdownFields.ChangeTooltip?.value,
                },
            ]);
        });

        it('should return price breakdown items based on product: Seats', () => {
            const result = getPriceBreakdown(AmendmentType.Seats, 100, mockPaymentPriceBreakdownFields);

            expect(result).toEqual([
                {
                    breakdownTitle: mockPaymentPriceBreakdownFields[`${AmendmentType.Seats}Change`]!.value,
                    amount: 100,
                    uniqueKey: 'change',
                    tooltipText: mockPaymentPriceBreakdownFields.ChangeTooltip?.value,
                },
            ]);
        });

        it('should return am empty title when field is not defined for product', () => {
            const mockFields = {
                ...mockPaymentPriceBreakdownFields,
                SeatsChange: undefined,
            };
            const result = getPriceBreakdown(AmendmentType.Seats, 100, mockFields);

            expect(result).toEqual([
                {
                    breakdownTitle: '',
                    amount: 100,
                    uniqueKey: 'change',
                    tooltipText: mockPaymentPriceBreakdownFields.ChangeTooltip?.value,
                },
            ]);
        });

        it('should return an empty array when product is not provided', () => {
            const result = getPriceBreakdown(undefined, 100, mockPaymentPriceBreakdownFields);

            expect(result).toEqual([]);
        });
    });
});
