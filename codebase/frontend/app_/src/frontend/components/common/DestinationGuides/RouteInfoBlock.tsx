import * as React from 'react';

import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import IconClock from 'frontend/components/icons/Clock';
import IconLocation from 'frontend/components/icons/LocationPicker';
import IconRunMan from 'frontend/components/icons/RunMan';
import IconTaxi from 'frontend/components/icons/Taxi';
import IconTourBus from 'frontend/components/icons/TourBus';

interface IInfoProps {
    getPhrase: (key: string) => string;
    info: {
        distance: string;
        duration: string;
        routeType: any[];
        stops: number;
    };
    containerClassName?: string;
    itemClassName?: string;
}

export const RouteInfoBlock: React.FC<IInfoProps> = ({
    info: { duration, routeType, stops, distance },
    containerClassName,
    itemClassName,
    getPhrase,
}) => {
    const itemClass = `route-info_item ${itemClassName}`;

    return (
        <div className={`route-info ${containerClassName}`}>
            <div className={itemClass}>
                <IconClock />
                <span className='route-info_item-label'>
                    {' '}
                    <span data-tid='time'>{duration}</span>{' '}
                    {getPhrase(SitecoreDictionary.GlobalsLabelsTimeHoursPluralAbbr)}
                </span>
            </div>
            <div className={itemClass}>
                <IconRunMan />
                <span className='route-info_item-label'>
                    {' '}
                    <span data-tid='route-distance'>{distance}</span> {getPhrase(SitecoreDictionary.MapKilometer)}
                </span>
            </div>
            <div className={itemClass}>
                <IconLocation />
                <span className='route-info_item-label'>
                    {' '}
                    <span data-tid='location-number'>{stops}</span> {getPhrase(SitecoreDictionary.MapLocations)}
                </span>
            </div>
            <div className={itemClass}>
                {(routeType[0] == 'Bus' && <IconTourBus />) ||
                    (routeType[0] == 'Walking' && <IconRunMan />) ||
                    (routeType[0] == 'Car' && <IconTaxi />) || <IconTourBus />}
                <span className='route-info_item-label ab-variant-label' data-tid='route-type'>
                    {' '}
                    {routeType.join(' or ')}
                </span>
            </div>
        </div>
    );
};

export default RouteInfoBlock;
