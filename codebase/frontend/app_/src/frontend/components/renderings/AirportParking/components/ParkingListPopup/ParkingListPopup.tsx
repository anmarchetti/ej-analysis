import { FunctionComponent, ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import FullScreenPopup from 'frontend/components/common/FullScreenPopup/FullScreenPopup';
import ShowMoreButton from 'frontend/components/common/ShowMoreButton';
import ParkingCard from 'frontend/components/renderings/AirportParking/components/ParkingCard/ParkingCard';
import { useAirportParkingLocalStore } from 'frontend/components/renderings/AirportParking/stores/airportParkingLocalStore';

import styles from './ParkingListPopup.module.scss';

const DEFAULT_MAX_VISIBLE_PARKING_COUNT = 6;

interface IParkingListPopupProps {
    BackToExtrasButtonText: ISitecoreField<string>;
    ParkingCardTransfersText: ISitecoreField<string>;
    ParkingListMoreInfoButtonText: ISitecoreField<string>;
    promoBanner: ReactNode;
    title: string;
}

const ParkingListPopup: FunctionComponent<IParkingListPopupProps> = ({
    title,
    BackToExtrasButtonText,
    promoBanner,
    ParkingCardTransfersText,
    ParkingListMoreInfoButtonText,
}) => {
    const { tracking } = useAirportParkingLocalStore();

    const {
        airportParkings,
        getPhrase,
        getSetting,
        isScreenMedium,
        isAirportParkingsInitialized,
        toggleIsParkingPopupOpened,
        isParkingPopupOpened,
        isAirportParkingValidationError,
    } = useStore((stores: IHolidaysStores) => ({
        airportParkings: stores.airportParkingStore.airportParkings,
        getSetting: stores.layoutStore.getSetting,
        getPhrase: stores.layoutStore.getPhrase,
        isScreenMedium: stores.appStore.isScreenMedium,
        isAirportParkingsInitialized: stores.airportParkingStore.isAirportParkingsInitialized,
        toggleIsParkingPopupOpened: stores.airportParkingStore.toggleIsParkingPopupOpened,
        isParkingPopupOpened: stores.airportParkingStore.isParkingPopupOpened,
        isAirportParkingValidationError: stores.bookingStore.isAirportParkingValidationError,
    }));

    const [isCollapsed, setIsCollapsed] = useState(true);
    const maxVisibleParkings = Number(getSetting(SiteSettings.MaxVisibleParkings)) || DEFAULT_MAX_VISIBLE_PARKING_COUNT;
    const hasParkingsToHide = (airportParkings ?? []).length > maxVisibleParkings;
    const displayedAirportParkings = isCollapsed ? airportParkings?.slice(0, maxVisibleParkings) : airportParkings;

    useEffect(() => {
        if (!isAirportParkingsInitialized) return;

        const runTracking = async (): Promise<void> => {
            await tracking.trackParkingListPageLoad();

            if (displayedAirportParkings) {
                tracking.trackParkingListEcommerceDimensions(displayedAirportParkings);
            }
        };

        runTracking();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAirportParkingsInitialized]);

    useEffect(() => {
        if (isAirportParkingValidationError && isParkingPopupOpened) {
            toggleIsParkingPopupOpened();
        }
    }, [isAirportParkingValidationError, isParkingPopupOpened, toggleIsParkingPopupOpened]);

    if (!airportParkings || isAirportParkingValidationError) {
        return null;
    }

    const showMoreButtonText = getPhrase(
        isCollapsed ? SitecoreDictionary.GlobalsLabelsShowMore : SitecoreDictionary.GlobalsLabelsShowLess,
    );

    const handleOnClose = (): void => {
        tracking.trackParkingListCtaClick(BackToExtrasButtonText.value, title);
        toggleIsParkingPopupOpened();
    };

    const onShowMoreClick = (): void => {
        setIsCollapsed(!isCollapsed);
        tracking.trackParkingListCtaClick(showMoreButtonText, title);
    };

    return (
        <FullScreenPopup
            onClose={handleOnClose}
            fields={{
                BackToLabel: BackToExtrasButtonText,
                BtnCancel: BackToExtrasButtonText,
            }}
            isMobile={!isScreenMedium}
            isInitialized={isAirportParkingsInitialized}
        >
            <div data-tid='parking-card-popup'>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <div>{promoBanner}</div>
                </div>
                <div
                    data-tid='parking-cards-container'
                    className={classNames(styles.parkingContainer, {
                        [styles.parkingContainerFull]: !hasParkingsToHide,
                    })}
                >
                    {displayedAirportParkings?.map(airportParking => (
                        <ParkingCard
                            key={airportParking.bookingDetails.productCode}
                            airportParking={airportParking}
                            ParkingCardTransfersText={ParkingCardTransfersText}
                            ParkingListMoreInfoButtonText={ParkingListMoreInfoButtonText}
                        />
                    ))}
                </div>
                {hasParkingsToHide && (
                    <ShowMoreButton
                        className={styles.showMoreButton}
                        onClick={onShowMoreClick}
                        title={showMoreButtonText}
                        isChevronUp={!isCollapsed}
                    />
                )}
            </div>
        </FullScreenPopup>
    );
};

export default observer(ParkingListPopup);
