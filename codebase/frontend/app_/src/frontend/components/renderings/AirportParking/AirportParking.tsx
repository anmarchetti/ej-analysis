import { FunctionComponent, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import BookExtrasBlock from 'frontend/components/common/ExternalExtras/BookExtrasBlock/BookExtrasBlock';
import HolidayExtrasPromoBanner from 'frontend/components/common/ExternalExtras/HolidayExtrasPromoBanner/HolidayExtrasPromoBanner';

import ParkingDetailsPopup from './components/ParkingDetailsPopup/ParkingDetailsPopup';
import ParkingListPopup from './components/ParkingListPopup/ParkingListPopup';
import SelectedAirportParkingCard from './components/SelectedAirportParkingCard/SelectedAirportParkingCard';
import { useAirportParkingLocalStore, withAirportParkingLocalStore } from './stores/airportParkingLocalStore';

import styles from './AirportParking.module.scss';

export interface IAirportParkingFields {
    AirportParkingButtonText: ISitecoreField<string>;
    AirportParkingDescription: ISitecoreField<string>;
    AirportParkingImage: ISitecoreField<ISitecoreImage>;
    AirportParkingTitle: ISitecoreField<string>;
    BackToExtrasButtonText: ISitecoreField<string>;
    HolidayExtrasLogo: ISitecoreField<ISitecoreImage>;
    HolidayExtrasLogoText: ISitecoreField<string>;
    ParkingCardTransfersText: ISitecoreField<string>;
    ParkingDetailsViewBackButtonText: ISitecoreField<string>;
    ParkingDetailsViewBackButtonTextMobile: ISitecoreField<string>;
    ParkingDetailsViewLogoText: ISitecoreField<string>;
    ParkingListMoreInfoButtonText: ISitecoreField<string>;
    SectionTitle: ISitecoreField<string>;
    SelectedFromDate: ISitecoreField<string>;
    SelectedToDate: ISitecoreField<string>;
}

const AirportParking: FunctionComponent<ISitecoreComponent<IAirportParkingFields>> = ({ fields }) => {
    const { tracking } = useAirportParkingLocalStore();
    const {
        isExternalExtrasEnabled,
        isAirportParkingHidden,
        selectedOffer,
        initializeAirportParkings,
        isAirportParkingsInitialized,
        selectedAirportParking,
        isParkingPopupOpened,
        toggleIsParkingPopupOpened,
        isParkingDetailsPopupOpened,
        airportParkings,
        outboundFlight,
    } = useStore((stores: IHolidaysStores) => ({
        isExternalExtrasEnabled: stores.layoutStore.isExternalExtrasEnabled,
        isAirportParkingHidden: stores.layoutStore.isAirportParkingHidden,
        selectedOffer: stores.bookingStore.selectedOffer,
        initializeAirportParkings: stores.airportParkingStore.initializeAirportParkings,
        isAirportParkingsInitialized: stores.airportParkingStore.isAirportParkingsInitialized,
        selectedAirportParking: stores.airportParkingStore.selectedAirportParking,
        toggleIsParkingPopupOpened: stores.airportParkingStore.toggleIsParkingPopupOpened,
        isParkingPopupOpened: stores.airportParkingStore.isParkingPopupOpened,
        isParkingDetailsPopupOpened: stores.airportParkingStore.isParkingDetailsPopupOpened,
        toggleIsParkingDetailsPopupOpened: stores.airportParkingStore.toggleIsParkingDetailsPopupOpened,
        airportParkings: stores.airportParkingStore.airportParkings,
        outboundFlight: stores.bookingStore.outboundFlight,
    }));
    const { ref, inView } = useInView({
        triggerOnce: true,
    });

    const formattedTitle =
        outboundFlight?.depName && fields?.AirportParkingTitle?.value
            ? Tokenizer.replaceTokens(fields?.AirportParkingTitle.value, {
                  [Tokens.Destination]: outboundFlight?.depName,
              })
            : fields?.AirportParkingTitle?.value ?? '';

    useEffect(() => {
        if (!isAirportParkingsInitialized && !airportParkings && isExternalExtrasEnabled && selectedOffer) {
            initializeAirportParkings(selectedOffer, tracking.trackParkingListError);
        }
    }, [
        isAirportParkingsInitialized,
        initializeAirportParkings,
        isExternalExtrasEnabled,
        selectedOffer,
        airportParkings,
        tracking,
    ]);

    useEffect(() => {
        if (inView) {
            tracking.trackParkingModuleInExtrasPageImpression(fields?.SectionTitle?.value ?? '', formattedTitle);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView]);

    if (!isExternalExtrasEnabled || !fields || !selectedOffer || !airportParkings?.length) {
        return null;
    }

    const handleOnClick = (): void => {
        toggleIsParkingPopupOpened();
        tracking.trackBuyNowCtaClick(fields.AirportParkingButtonText.value, formattedTitle);
    };

    return (
        <div
            data-tid='airport-parking-container'
            className={classNames(styles.container, { [styles.isHidden]: isAirportParkingHidden })}
            ref={ref}
        >
            <div className={styles.sectionHeader}>
                <Text
                    field={fields.SectionTitle}
                    tag='h2'
                    className={classNames(styles.sectionTitle, 'step__title')}
                    data-tid='section-title'
                />
                {selectedAirportParking ? (
                    <HolidayExtrasPromoBanner
                        promotionLogo={fields.HolidayExtrasLogo}
                        promotionText={fields.HolidayExtrasLogoText}
                    />
                ) : (
                    ''
                )}
            </div>

            {!selectedAirportParking ? (
                <BookExtrasBlock
                    title={formattedTitle}
                    description={fields.AirportParkingDescription}
                    bannerImage={fields.AirportParkingImage}
                    onClick={handleOnClick}
                    buttonText={fields.AirportParkingButtonText}
                    promoBanner={
                        <HolidayExtrasPromoBanner
                            promotionLogo={fields.HolidayExtrasLogo}
                            promotionText={fields.HolidayExtrasLogoText}
                        />
                    }
                />
            ) : (
                <SelectedAirportParkingCard
                    cardTitle={formattedTitle}
                    selectedFromDate={fields.SelectedFromDate?.value}
                    selectedToDate={fields.SelectedToDate?.value}
                />
            )}

            {isParkingPopupOpened && (
                <ParkingListPopup
                    title={formattedTitle}
                    BackToExtrasButtonText={fields.BackToExtrasButtonText}
                    ParkingCardTransfersText={fields.ParkingCardTransfersText}
                    ParkingListMoreInfoButtonText={fields.ParkingListMoreInfoButtonText}
                    promoBanner={
                        <HolidayExtrasPromoBanner
                            promotionLogo={fields.HolidayExtrasLogo}
                            promotionText={fields.HolidayExtrasLogoText}
                        />
                    }
                />
            )}

            {isParkingDetailsPopupOpened && (
                <ParkingDetailsPopup
                    title={formattedTitle}
                    ParkingDetailsViewBackButtonText={fields.ParkingDetailsViewBackButtonText}
                    ParkingDetailsViewBackButtonTextMobile={fields.ParkingDetailsViewBackButtonTextMobile}
                    promoBanner={
                        <HolidayExtrasPromoBanner
                            promotionLogo={fields.HolidayExtrasLogo}
                            promotionText={fields.ParkingDetailsViewLogoText}
                        />
                    }
                />
            )}
        </div>
    );
};

export default withAirportParkingLocalStore(observer(AirportParking));
