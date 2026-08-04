import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { getRouteByDirection } from 'frontend/utils/airports.utils';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import SvgAirportLounge from 'frontend/components/icons-new/AirportLounge';
import ItineraryFeature from 'frontend/components/renderings/ItinerarySummary/components/ItineraryFeature/ItineraryFeature';
import ItineraryItem from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem';
import ItineraryItemSubtitle from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItemSubtitle/ItineraryItemSubtitle';

import styles from './ItineraryAirport.module.scss';

export interface IItineraryAirportProps {
    AirportTitle: ISitecoreField<string>;
    ArriveByLabel: ISitecoreField<string>;
    ArriveByText: ISitecoreField<string>;
    FastTrackIcon: ISitecoreField<ISitecoreImage>;
    FastTrackLabel: ISitecoreField<string>;
    FastTrackText: ISitecoreField<string>;
    booking: IBookingInfo;
    isExpanded: boolean;
    setExpanded: () => void;
    className?: string;
    isGreyedOut?: boolean;
}

const ItineraryAirport: FC<IItineraryAirportProps> = ({
    AirportTitle,
    booking,
    isExpanded,
    setExpanded,
    className,
    ArriveByText,
    ArriveByLabel,
    FastTrackIcon,
    FastTrackLabel,
    FastTrackText,
    isGreyedOut,
}) => {
    const routes = booking.package?.transport?.routes || [];
    const { outbound } = getRouteByDirection(routes);

    if (!outbound) {
        return null;
    }

    const { depDate } = outbound;

    const arriveToAirportDate = new Date(depDate);
    const hoursBeforeDeparture = 3;
    arriveToAirportDate.setHours(arriveToAirportDate.getUTCHours() - hoursBeforeDeparture);
    const arriveToAirportTime = formatDateL10n(arriveToAirportDate, DATE_FORMATS.time);
    const itineraryFeatureProps = {
        title: FastTrackLabel,
        description: FastTrackText,
        icon: FastTrackIcon,
        isExpanded,
    };

    return (
        <ItineraryItem
            title={AirportTitle}
            icon={<SvgAirportLounge />}
            className={className}
            isExpanded={isExpanded}
            setExpanded={setExpanded}
            isGreyedOut={isGreyedOut}
        >
            <div className={styles.subtitleWrapper}>
                <ItineraryItemSubtitle
                    subtitle={ArriveByLabel}
                    content={arriveToAirportTime}
                    dataTid='itinerary-airport-arrive'
                />
            </div>
            {isExpanded && (
                <div data-tid='itinerary-airport-expanded' className={styles.content}>
                    <Text field={ArriveByText} />

                    <ItineraryFeature
                        {...itineraryFeatureProps}
                        dataTid='itinerary-airport-expanded'
                        className={styles.feature}
                    />
                </div>
            )}
        </ItineraryItem>
    );
};

export default observer(ItineraryAirport);
