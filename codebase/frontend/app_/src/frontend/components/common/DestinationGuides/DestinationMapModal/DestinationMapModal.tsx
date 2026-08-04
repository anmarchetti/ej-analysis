import React, { FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { setBodyOverflow } from 'frontend/utils/ui.utils';
import { ITour } from 'models/data/map/IItinerary';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import DestinationContent from 'frontend/components/common/DestinationGuides/DestinationContent/DestinationContent';
import ItineraryGuide from 'frontend/components/common/DestinationGuides/ItineraryGuide/ItineraryGuide';
import SvgChevronLeft from 'frontend/components/icons-new/ChevronLeft';
import SVGCross from 'frontend/components/icons-new/Cross';

import styles from './DestinationMapModal.module.scss';

export interface IDestinationMapModalProps {
    onClose: () => void;
    tours: ITour[];
    expandedSection?: Nullable<string>;
}

const DestinationMapModal: FC<IDestinationMapModalProps> = ({ tours, onClose, expandedSection }) => {
    const { getPhrase, trackMapEvent } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackMapEvent: stores.trackingStore.trackMapEvent,
    }));
    const [expandedSectionState, setExpandedSectionState] = useState<Nullable<string>>(expandedSection);
    const [selectedItinerary, setSelectedItinerary] = useState<Nullable<ITour>>(
        tours.find(el => el.id === expandedSection),
    );
    const [activeRoutes, setActiveRoutes] = useState<any>(null);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);

    useEffect(() => {
        setBodyOverflow('hidden');

        return () => {
            setBodyOverflow('');
        };
    }, []);

    const onItineraryClick = (selected: string): void => {
        setSelectedItinerary(tours.find(el => el.id === selected));
        setExpandedSectionState(selected);
        setSelectedRoute(null);
    };

    const onRouteClick = (selected: string): void => {
        if (selectedItinerary) {
            setSelectedRoute(selectedItinerary.children.find(({ id }) => id === selected));
        }
    };

    const onItineraryCreate = (activeRoutes: any): void => {
        setActiveRoutes(activeRoutes);
    };

    return (
        <div className={styles.destinationMapModal}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <button onClick={onClose} className={styles.back}>
                        <SvgChevronLeft /> {getPhrase(SitecoreDictionary.ItinerariesLabelsBackToTheGuide)}
                    </button>
                    <button className={styles.close} onClick={onClose}>
                        <SVGCross />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <DestinationContent
                        tours={tours}
                        expanded={expandedSectionState}
                        onItineraryClick={onItineraryClick}
                        onRouteClick={onRouteClick}
                        routes={activeRoutes}
                        getPhrase={getPhrase}
                        trackMapEvent={trackMapEvent}
                    />

                    {selectedItinerary && (
                        <ItineraryGuide
                            tour={selectedItinerary}
                            selectedStop={selectedRoute}
                            onRouteChange={onItineraryCreate}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default observer(DestinationMapModal);
