import { mockSitecoreField } from 'frontend/utils/tests.utils';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

import { ISeatMapFields } from './components/ISeatMapFields';
import {
    getBackButtonLabel,
    getSitTogetherWebStorageKeyFromDirection,
    getSitTogetherWebStorageKeyValue,
} from './SeatMap.utils';

const mockFields = {
    BackToSummaryLabel: mockSitecoreField('BackToSummaryLabel'),
    BackToViewBookingLabel: mockSitecoreField('BackToViewBookingLabel'),
    BackToExtrasLabel: mockSitecoreField('BackToExtrasLabel'),
} as ISeatMapFields;

describe('SeatMap.utils', () => {
    describe('getBackButtonLabel', () => {
        it('Return BackToSummaryLabel if isAmendDatesSummaryPage', () => {
            const result = getBackButtonLabel(mockFields, true, false);

            expect(result).toBe(mockFields.BackToSummaryLabel);
        });

        it('Return BackToViewBookingLabel if isAmendDatesSummaryPage is false but isPostBooking is true', () => {
            const result = getBackButtonLabel(mockFields, false, true);

            expect(result).toBe(mockFields.BackToViewBookingLabel);
        });

        it('Return BackToExtrasLabel if neither isAmendDatesSummaryPage or isPostBooking are false', () => {
            const result = getBackButtonLabel(mockFields, false, false);

            expect(result).toBe(mockFields.BackToExtrasLabel);
        });
    });

    describe('getSitTogetherWebStorageKeyFromDirection', () => {
        it('should return the correct WebStorage key', () => {
            expect(
                getSitTogetherWebStorageKeyFromDirection({
                    isAvailable: false,
                    flightDirection: SeatMapFlightDirection.Outbound,
                }),
            ).toEqual(WebStorageKeys.SeatTogetherCheckboxDeparture);

            expect(
                getSitTogetherWebStorageKeyFromDirection({
                    isAvailable: false,
                    flightDirection: SeatMapFlightDirection.Inbound,
                }),
            ).toEqual(WebStorageKeys.SeatTogetherCheckboxReturn);
        });
    });

    describe('getSitTogetherWebStorageKeyValue', () => {
        it('should return unavailable when isAvailable is false and no previous value', () => {
            expect(
                getSitTogetherWebStorageKeyValue({
                    isAvailable: false,
                    flightDirection: SeatMapFlightDirection.Outbound,
                }),
            ).toEqual('unavailable');
        });

        it('should return unchecked when isAvailable is true and no previous value', () => {
            expect(
                getSitTogetherWebStorageKeyValue({
                    isAvailable: true,
                    flightDirection: SeatMapFlightDirection.Outbound,
                }),
            ).toEqual('unchecked');
        });

        it('should return previousValue when isAvailable and previousValue and no checked information', () => {
            expect(
                getSitTogetherWebStorageKeyValue(
                    {
                        isAvailable: true,
                        flightDirection: SeatMapFlightDirection.Outbound,
                    },
                    'unchecked',
                ),
            ).toEqual('unchecked');

            expect(
                getSitTogetherWebStorageKeyValue(
                    {
                        isAvailable: true,
                        flightDirection: SeatMapFlightDirection.Outbound,
                    },
                    'checked',
                ),
            ).toEqual('checked');
        });

        it('should return the correct value when isAvailable and passed a value', () => {
            expect(
                getSitTogetherWebStorageKeyValue({
                    isChecked: false,
                    flightDirection: SeatMapFlightDirection.Outbound,
                }),
            ).toEqual('unchecked');

            expect(
                getSitTogetherWebStorageKeyValue(
                    {
                        isChecked: false,
                        flightDirection: SeatMapFlightDirection.Outbound,
                    },
                    'checked',
                ),
            ).toEqual('unchecked');

            expect(
                getSitTogetherWebStorageKeyValue({
                    isChecked: true,
                    flightDirection: SeatMapFlightDirection.Outbound,
                }),
            ).toEqual('checked');

            expect(
                getSitTogetherWebStorageKeyValue(
                    {
                        isChecked: true,
                        flightDirection: SeatMapFlightDirection.Outbound,
                    },
                    'unchecked',
                ),
            ).toEqual('checked');
        });
    });
});
