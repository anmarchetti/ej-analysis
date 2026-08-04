import { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { DATE_FORMATS } from 'code/dates';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IRoute } from 'models/data/IRoute';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import SvgDepartureFilled from 'frontend/components/icons-new/DepartureFilled';
import ItineraryFeature from 'frontend/components/renderings/ItinerarySummary/components/ItineraryFeature/ItineraryFeature';
import ItineraryItem from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItem/ItineraryItem';
import ItineraryItemSubtitle from 'frontend/components/renderings/ItinerarySummary/components/ItineraryItemSubtitle/ItineraryItemSubtitle';

import styles from './ItineraryFlight.module.scss';

export interface IItineraryFlightProps {
    ArrivesLabel: ISitecoreField<string>;
    DepartsLabel: ISitecoreField<string>;
    FlightInbound: ISitecoreField<string>;
    FlightOutbound: ISitecoreField<string>;
    SpeedyBoardingIcon: ISitecoreField<ISitecoreImage>;
    SpeedyBoardingLabel: ISitecoreField<string>;
    SpeedyBoardingText: ISitecoreField<string>;
    SpeedyBoardingTooltip: ISitecoreField<string>;
    isExpanded: boolean;
    route: IRoute | undefined;
    setExpanded: () => void;
    className?: string;
    isArrival?: boolean;
    isGreyedOut?: boolean;
    isLuxuryPackage?: boolean;
}

const ItineraryFlight: FC<IItineraryFlightProps> = ({
    DepartsLabel,
    ArrivesLabel,
    route,
    isArrival,
    isExpanded,
    className,
    setExpanded,
    SpeedyBoardingIcon,
    SpeedyBoardingLabel,
    SpeedyBoardingText,
    SpeedyBoardingTooltip,
    isLuxuryPackage,
    isGreyedOut,
    FlightInbound,
    FlightOutbound,
}) => {
    if (!route) {
        return null;
    }

    const { arrDate, arrName, arrPt, depDate, depName, depPt, extRefId, arrTerminal, depTerminal } = route;

    const depTime = formatDateL10n(depDate, DATE_FORMATS.time);
    const arrTime = formatDateL10n(arrDate, DATE_FORMATS.time);
    const itineraryFeatureProps = {
        title: SpeedyBoardingLabel,
        description: SpeedyBoardingText,
        icon: SpeedyBoardingIcon,
        isExpanded,
    };

    return (
        <ItineraryItem
            title={isArrival ? FlightOutbound : FlightInbound}
            icon={<SvgDepartureFilled className={classNames({ 'icon--reflect-x': !isArrival })} />}
            hideSeparator={!isArrival}
            className={className}
            isExpanded={isExpanded}
            setExpanded={setExpanded}
            isGreyedOut={isGreyedOut}
        >
            <div className={styles.subtitleWrapper}>
                <ItineraryItemSubtitle
                    subtitle={DepartsLabel}
                    content={`${depPt} - ${depTime}`}
                    dataTid='itinerary-flight-departs'
                />
                <ItineraryItemSubtitle
                    subtitle={ArrivesLabel}
                    content={`${arrPt} - ${arrTime}`}
                    dataTid='itinerary-flight-arrives'
                />
                {!isExpanded && isLuxuryPackage && (
                    <ItineraryFeature {...itineraryFeatureProps} dataTid='flight-collapsed' />
                )}
            </div>
            {isExpanded && (
                <div data-tid='itinerary-flight-expanded' className={styles.content}>
                    <div className={styles.flightsDetailsItem}>
                        <span>
                            <strong>{formatDateL10n(depDate, DATE_FORMATS.DayOfWeekDayMonthYearAbbr)}</strong>
                        </span>
                        <span className={styles.extNumber} data-tid='itinerary-flight-ext-number'>
                            {extRefId}
                        </span>
                    </div>
                    <div className={styles.flightsDetails}>
                        <div className={styles.flightsDetailsItem}>
                            <span data-tid='itinerary-flight-dep-time'>
                                <strong>{depTime}</strong>
                            </span>
                            <span data-tid='itinerary-flight-dep-airport-name'>{depName}</span>
                            <span data-tid='itinerary-flight-dep-airport-code'>({depPt})</span>
                            {!!depTerminal && (
                                <span data-tid='itinerary-flight-dep-terminal'>
                                    <strong>{depTerminal}</strong>
                                </span>
                            )}
                        </div>
                        <div className={styles.separator} />
                        <div className={styles.flightsDetailsItem}>
                            <span data-tid='itinerary-flight-arr-time'>
                                <strong>{arrTime}</strong>
                            </span>
                            <span data-tid='itinerary-flight-arr-airport-name'>{arrName}</span>
                            <span data-tid='itinerary-flight-arr-airport-code'>({arrPt})</span>
                            {!!arrTerminal && (
                                <span data-tid='itinerary-flight-arr-terminal'>
                                    <strong>{arrTerminal}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                    {isLuxuryPackage && (
                        <ItineraryFeature
                            {...itineraryFeatureProps}
                            tooltipText={isArrival ? null : SpeedyBoardingTooltip.value}
                            dataTid='flight-expanded'
                        />
                    )}
                </div>
            )}
        </ItineraryItem>
    );
};

export default observer(ItineraryFlight);
