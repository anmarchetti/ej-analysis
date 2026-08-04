import { FunctionComponent, ReactNode } from 'react';
import { observer } from 'mobx-react';

import { TrailingZeroDisplay } from 'code/currency';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import FullScreenPopup from 'frontend/components/common/FullScreenPopup/FullScreenPopup';
import { useAirportParkingLocalStore } from 'frontend/components/renderings/AirportParking/stores/airportParkingLocalStore';

import styles from './ParkingDetailsPopup.module.scss';

interface IParkingDetailsPopup {
    ParkingDetailsViewBackButtonText: ISitecoreField<string>;
    ParkingDetailsViewBackButtonTextMobile: ISitecoreField<string>;
    promoBanner: ReactNode;
    title: string;
}

const ParkingDetailsPopup: FunctionComponent<IParkingDetailsPopup> = ({
    title,
    ParkingDetailsViewBackButtonText,
    ParkingDetailsViewBackButtonTextMobile,
    promoBanner,
}) => {
    const { tracking } = useAirportParkingLocalStore();

    const {
        getPhrase,
        formatMoney,
        currency,
        isScreenMedium,
        validateParking,
        toggleIsParkingDetailsPopupOpened,
        selectedAirportParkingDetails,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
        currency: stores.marketStore.currency,
        isScreenMedium: stores.appStore.isScreenMedium,
        validateParking: stores.airportParkingStore.validateParking,
        toggleIsParkingDetailsPopupOpened: stores.airportParkingStore.toggleIsParkingDetailsPopupOpened,
        selectedAirportParkingDetails: stores.airportParkingStore.selectedAirportParkingDetails,
    }));

    if (!selectedAirportParkingDetails) {
        return null;
    }

    const {
        bookingDetails: { totalPrice },
    } = selectedAirportParkingDetails;

    const formattedPrice = formatMoney(totalPrice, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        currency,
    });

    const handleOnClose = (): void => {
        toggleIsParkingDetailsPopupOpened();
    };

    const onSuccessAction = async (): Promise<void> => {
        await tracking.trackExtrasPageLoadAfterSelectingParking();
        tracking.trackAirportParkingUpdatedInExtrasPage();
    };

    const handleBookNow = async (): Promise<void> => {
        toggleIsParkingDetailsPopupOpened();

        tracking.trackBookParkingCtaClick(selectedAirportParkingDetails);
        await validateParking(selectedAirportParkingDetails, onSuccessAction);
    };

    const parkingDetailsBookNow = (): JSX.Element => (
        <Button className={styles.button} onClick={handleBookNow} data-tid='parking-details-book-now-btn'>
            {Tokenizer.replaceToken(getPhrase(SitecoreDictionary.GlobalsButtonsBookFor), Tokens.Price, formattedPrice)}
        </Button>
    );

    return (
        <FullScreenPopup
            onClose={handleOnClose}
            fields={{
                BackToLabel: ParkingDetailsViewBackButtonText,
                BtnCancel: ParkingDetailsViewBackButtonTextMobile,
            }}
            isMobile={!isScreenMedium}
            isInitialized={true}
            navigationActionBlock={parkingDetailsBookNow()}
        >
            <div data-tid='parking-details-popup'>
                <div className={styles.parkingDetailsHeader}>
                    <h2 className={styles.parkingDetailsTitle}>{title}</h2>
                    <div>{promoBanner}</div>
                </div>
                <div className={styles.parkingDetailsContent}>Parking details</div>
            </div>
        </FullScreenPopup>
    );
};

export default observer(ParkingDetailsPopup);
