import {
    ISitTogetherClickedData,
    ISitTogetherImpressionData,
    TSeatTogetherCheckbox,
} from 'models/data/ISeatMapWidgetTrackingEvent';
import { SeatMapFlightDirection } from 'models/enum/SeatMapFlightDirection';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import { ISeatMapFields } from './components/ISeatMapFields';

export const getBackButtonLabel = (
    fields: ISeatMapFields,
    isAmendDatesSummaryPage: boolean,
    isPostBooking: boolean,
): ISitecoreField<string> => {
    if (isAmendDatesSummaryPage) {
        return fields.BackToSummaryLabel;
    }

    return isPostBooking ? fields.BackToViewBookingLabel : fields.BackToExtrasLabel;
};

export const getSitTogetherWebStorageKeyFromDirection = (
    trackingEvent: ISitTogetherImpressionData | ISitTogetherClickedData,
): WebStorageKeys =>
    trackingEvent.flightDirection === SeatMapFlightDirection.Outbound
        ? WebStorageKeys.SeatTogetherCheckboxDeparture
        : WebStorageKeys.SeatTogetherCheckboxReturn;

export const getSitTogetherWebStorageKeyValue = (
    trackingEvent: ISitTogetherImpressionData | ISitTogetherClickedData,
    previousValue?: TSeatTogetherCheckbox,
): TSeatTogetherCheckbox => {
    let storageValue: TSeatTogetherCheckbox;

    if (
        (trackingEvent as ISitTogetherImpressionData).isAvailable !== undefined &&
        !(trackingEvent as ISitTogetherImpressionData).isAvailable
    ) {
        storageValue = 'unavailable';
    } else {
        storageValue = previousValue ?? 'unchecked';

        if ((trackingEvent as ISitTogetherClickedData).isChecked !== undefined) {
            storageValue = (trackingEvent as ISitTogetherClickedData).isChecked ? 'checked' : 'unchecked';
        }
    }

    return storageValue;
};
