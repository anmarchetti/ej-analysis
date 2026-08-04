import { inject } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';
import { WebStorageKeys } from 'models/enum/WebStorageKeys';

interface IStartBookingButtonProps {
    isGuestsParametersForBookingValid: boolean;
    render: (onClick: () => void) => any;
    updateRoomsAllocationFromSearchStore: () => void;
    validatePackage: () => void;
    validateSearchParameters: () => boolean;
}

export const StartBookingButton = (props: IStartBookingButtonProps): JSX.Element =>
    props.render(() => {
        sessionStorage.removeItem(WebStorageKeys.IsVoucherRedeemedBookingFlow);

        // if guest information in URL is invalid both searchStore and bookingStore will be invalid after loading
        // show search pod error to force user update invalid guests data
        if (!props.isGuestsParametersForBookingValid && props.validateSearchParameters()) {
            return;
        }

        // if searchStore guest params valid - update guests params in booking store using data from search store
        if (!props.isGuestsParametersForBookingValid && !props.validateSearchParameters()) {
            props.updateRoomsAllocationFromSearchStore();
            props.validatePackage();

            return;
        }

        // perform package validation if booking consists reliable information about guests
        if (props.isGuestsParametersForBookingValid) {
            props.validatePackage();
        }
    });

const ConnectedStartBookingButton = inject((stores: TStores) => ({
    validateSearchParameters: stores.searchStore.validateSearchParameters,
    isGuestsParametersForBookingValid: stores.bookingStore.isGuestsParametersValid,
    updateRoomsAllocationFromSearchStore: stores.bookingStore.updateRoomsAllocationFromSearchStore,
    validatePackage: (): void => {
        stores.bookingStore.changeIsClickChangeButton(false);
        stores.bookingStore.updatePreviousPriceFormOffer();
        stores.bookingStore.storeOriginalBooking();
        stores.trackingStore.clearSitTogetherSessionStorage();

        if (!stores.layoutStore.isBundlesPageEnabled || stores.layoutStore.isBundlesPage) {
            stores.routerStore.redirectToExtrasPage();
        } else {
            stores.routerStore.redirectToBundlesPage();
        }

        stores.appStore.setNavigationBooking(true);
        stores.bookingStore.validatePackage();
        stores.searchStore.retreiveSearchParameters();
    },
}))(StartBookingButton);

export default ConnectedStartBookingButton;
