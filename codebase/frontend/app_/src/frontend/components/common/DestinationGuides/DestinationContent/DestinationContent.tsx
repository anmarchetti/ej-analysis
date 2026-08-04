import * as React from 'react';

import { BaseTrackingStore } from 'frontend/store/base/tracking/BaseTrackingStore';
import { ITour } from 'models/data/map/IItinerary';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventLabels } from 'models/enum/tracking/GenericEventParams';
import Button from 'frontend/components/common/Button';
import RouteInfoBlock from 'frontend/components/common/DestinationGuides/RouteInfoBlock';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconRunMan from 'frontend/components/icons/RunMan';
import IconTaxi from 'frontend/components/icons/Taxi';
import IconTourBus from 'frontend/components/icons/TourBus';

enum RouteType {
    Walking = 'Walking',
    Car = 'Car',
    Bus = 'Bus',
}

interface IDestinationContentProps {
    expanded: Nullable<string>;
    getPhrase: (string) => string;
    onItineraryClick: any;
    onRouteClick: any;
    routes: any;
    tours: ITour[];
    trackMapEvent: BaseTrackingStore['trackMapEvent'];
}

class DestinationContent extends React.Component<IDestinationContentProps> {
    state: { expandedSection: string | null };

    constructor(props) {
        super(props);
    }

    onToggleSection = ev => {
        const expandedSection = ev.currentTarget.dataset.tid;

        if (this.props.expanded !== expandedSection) {
            this.props.onItineraryClick(expandedSection);

            const id = ev.currentTarget.dataset.tid;
            const idx = this.props.tours.findIndex(tour => tour.id === id);

            this.props.trackMapEvent({
                action: `Tab ${idx + 1}`,
                label: EventLabels.DestinationGuideTab,
            });
        }
    };

    onRouteClick = ev => {
        const expandedSection = ev.currentTarget.dataset.id;
        this.props.onRouteClick(expandedSection);
    };

    render() {
        return (
            <div className='destination-content'>
                {(this.props.tours || []).map(
                    ({
                        id,
                        fields: {
                            Description: { value: description },
                            Duration: { value: duration },
                            TotalDistance: { value: distance },
                            Name: { value: name },
                        },
                        children: itinerary,
                    }) => {
                        const routeTypes = Array.from(new Set((itinerary || []).map(it => it.fields.RouteType.value)));

                        return (
                            <div key={id} className='destination-content--section'>
                                <Button isText onClick={this.onToggleSection} dataTid={id}>
                                    <div className='content-section--title'>
                                        <div className='content-section--title-label'>{name}</div>
                                        <div className='content-section--collapse-button'>
                                            {this.props.expanded !== id && <IconChevronDown />}
                                        </div>
                                    </div>
                                </Button>
                                {this.props.expanded === id && (
                                    <div className='content-section--collapsed-block'>
                                        <div className='content-section--description'>{description}</div>
                                        <RouteInfoBlock
                                            info={{
                                                duration,
                                                routeType: routeTypes,
                                                distance,
                                                stops: itinerary.length,
                                            }}
                                            getPhrase={this.props.getPhrase}
                                        />
                                        <div className='content-section--iternaries'>
                                            {itinerary.map(
                                                (
                                                    {
                                                        id,
                                                        fields: {
                                                            Name: { value: name },
                                                            RouteType: { value: routeType },
                                                        },
                                                    },
                                                    index,
                                                ) => {
                                                    const durationValue =
                                                        this.props.routes?.[index]?.route.duration.text;

                                                    return (
                                                        <div
                                                            key={id}
                                                            data-id={id}
                                                            className='itinerary'
                                                            onClick={this.onRouteClick}
                                                        >
                                                            <div>
                                                                <div className='itinerary-icon'>{++index}</div>
                                                                <div className='itinerary-title'>{name}</div>
                                                            </div>
                                                            <div>
                                                                <div className='itinerary-pattern-dots' />
                                                                <div className='itinerary-description'>
                                                                    {(routeType == RouteType.Bus && <IconTourBus />) ||
                                                                        (routeType == RouteType.Walking && (
                                                                            <IconRunMan />
                                                                        )) ||
                                                                        (routeType == RouteType.Car && (
                                                                            <IconTaxi />
                                                                        )) || <IconTourBus />}
                                                                    <span className='route-info_item-label'>
                                                                        {' '}
                                                                        {durationValue}{' '}
                                                                        {(routeType == RouteType.Walking &&
                                                                            this.props.getPhrase(
                                                                                SitecoreDictionary.MapTravelMethodsWalk,
                                                                            )) ||
                                                                            this.props.getPhrase(
                                                                                SitecoreDictionary.MapTravelMethodsDrive,
                                                                            )}{' '}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    },
                )}
            </div>
        );
    }
}

export default DestinationContent;
