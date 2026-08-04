import { AmendStoreKey } from 'models/data/AmendInfo';
import { AmendmentType } from 'models/data/IBookingInfo';
import SitePath, { SitePathOverload } from 'models/enum/SitePath';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import { IPriceBreakdownItem } from 'frontend/components/common/PriceBreakdown/components/PriceBreakdownItem/PriceBreakdownItem';
import {
    IPaymentLabelsFields,
    IPaymentPageFields,
    IPaymentPriceBreakdownFields,
} from 'frontend/components/renderings/AmendPayment/interfaces';

interface IAmendPaymentConfigItem {
    iconKey: keyof IPaymentPageFields;
    labelKey: keyof IPaymentLabelsFields;
    prevPage: SitePath;
    storeKey: AmendStoreKey;
    titleKey: string;
    prevPageBreadcrumbOverload?: SitePathOverload;
}

export const amendPaymentConfig: { [key in AmendmentType]: IAmendPaymentConfigItem } = {
    [AmendmentType.Flight]: {
        prevPage: SitePath.AmendFlights,
        iconKey: 'FlightsFlowIcon',
        titleKey: 'FlightsFlowTitle',
        storeKey: AmendStoreKey.Flights,
        labelKey: 'FlightLabel',
    },
    [AmendmentType.Transfer]: {
        prevPage: SitePath.AmendTransfer,
        iconKey: 'TransfersFlowIcon',
        titleKey: 'TransfersFlowTitle',
        storeKey: AmendStoreKey.Transfers,
        labelKey: 'TransferLabel',
    },
    [AmendmentType.Seats]: {
        prevPage: SitePath.ViewBooking,
        prevPageBreadcrumbOverload: SitePathOverload.ChangeYourSeats,
        iconKey: 'SeatsFlowIcon',
        titleKey: 'SeatsFlowTitle',
        storeKey: AmendStoreKey.Seats,
        labelKey: 'SeatsLabel',
    },
    [AmendmentType.Dates]: {
        prevPage: SitePath.AmendDatesSummary,
        iconKey: 'DatesFlowIcon',
        titleKey: 'DatesFlowTitle',
        storeKey: AmendStoreKey.Dates,
        labelKey: 'DatesLabel',
    },
    [AmendmentType.RoomAndBoard]: {
        prevPage: SitePath.AmendRoomAndBoard,
        iconKey: 'RoomAndBoardFlowIcon',
        titleKey: 'RoomAndBoardFlowTitle',
        storeKey: AmendStoreKey.RoomAndBoard,
        labelKey: 'RoomAndBoardLabel',
    },
    [AmendmentType.Hotel]: {
        prevPage: SitePath.AmendHotelSummary,
        prevPageBreadcrumbOverload: SitePathOverload.ReviewYourChanges,
        iconKey: 'HotelFlowIcon',
        titleKey: 'HotelFlowTitle',
        storeKey: AmendStoreKey.Hotel,
        labelKey: 'HotelLabel',
    },
};

export const getAmendPaymentConfig = (amendmentType: Nullable<AmendmentType>): IAmendPaymentConfigItem =>
    amendmentType ? amendPaymentConfig[amendmentType] : ({} as IAmendPaymentConfigItem);

export const getMetaByAmendmentType = (
    fields: IPaymentPageFields,
    amendmentType?: Nullable<AmendmentType>,
): { icon: ISitecoreField<ISitecoreImage>; title: ISitecoreField<string> } => {
    const { iconKey, titleKey } = getAmendPaymentConfig(amendmentType);

    return {
        icon: fields[iconKey] as ISitecoreField<ISitecoreImage>,
        title: fields[titleKey],
    };
};

export const getPriceBreakdown = (
    type: Nullable<AmendmentType>,
    amendmentCharge: number,
    fields: IPaymentPriceBreakdownFields,
): IPriceBreakdownItem[] => {
    if (type) {
        return [
            {
                breakdownTitle: fields[`${type}Change`]?.value ?? '',
                amount: amendmentCharge,
                uniqueKey: 'change',
                tooltipText: fields.ChangeTooltip?.value,
            },
        ];
    }

    return [];
};
