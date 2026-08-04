import useStore from 'frontend/hooks/useStore';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { ISitecoreCompositeField, ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import { ISitecoreAirport } from 'models/sitecore/IAirportsData';

export interface IUseCrisisBannerProps {
    alwaysVisible?: ISitecoreField<boolean>;
    impactedAirports?: ISitecoreCompositeField<ISitecoreAirport>[];
}

const useCrisisBanner = ({ impactedAirports, alwaysVisible }: IUseCrisisBannerProps): boolean => {
    const { booking } = useStore(stores => ({
        booking: stores.viewBookingStore.booking,
    }));

    if (alwaysVisible?.value) {
        return true;
    }

    if (!impactedAirports?.length || !booking) {
        return false;
    }

    const { outbound } = getRouteByDirection(booking.package?.transport?.routes || []);
    const impactedAirportsArr = impactedAirports.map(item => item.fields.Code.value);
    const isBookingImpacted = impactedAirportsArr.includes(outbound?.arrPt ?? '');

    return isBookingImpacted;
};

export default useCrisisBanner;
