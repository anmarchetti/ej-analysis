import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { ICabinBagsInfoFields } from 'frontend/components/common/Booking/CabinBagsInfo/CabinBagsInfo';
import { ILuggageInfoFields } from 'frontend/components/common/Booking/LuggageInfo/LuggageInfo';
import { IFeesPopupFields } from 'frontend/components/renderings/FeesPopup/FeesPopup';
import { IFastTrackAndServiceLineFields } from 'frontend/components/renderings/Payment/components/BookingDetailsExpanded/components/FastTrackAndServiceLine/TransferAndBagsRow/FastTrackAndServiceLine';

export interface ITradePortalConfirmBookingDetailsFields
    extends IFeesPopupFields,
        ILuggageInfoFields,
        ICabinBagsInfoFields,
        IFastTrackAndServiceLineFields {
    Title: ISitecoreField<string>;
    ReadMoreLink?: ISitecoreField<ISitecoreLink>;
}
