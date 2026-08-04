import { FunctionComponent, useEffect, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getWebStorageItem } from 'frontend/utils/webStorage.utils';
import { IAmendHotelOffer } from 'models/data/bookingAmendment/AmendHotel';
import { IBookingInfo } from 'models/data/IBookingInfo';
import { LocalStorageType } from 'models/enum/LocalStorageType';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import HotelDetails from 'frontend/components/common/AmendHotelStickyHeader/components/HotelDetails/HotelDetails';
import RatingsDetails from 'frontend/components/common/AmendHotelStickyHeader/components/RatingsDetails/RatingsDetails';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import MobileBasket, {
    IMobileBasketProps,
} from 'frontend/components/renderings/AmendmentBasket/MobileBasket/MobileBasket';
import { AttentionPopupMobilePosition } from 'frontend/components/renderings/AttentionPopup/AttentionPopup';

import styles from './HotelDetailsMobileBasket.module.scss';

export interface IHotelDetailsMobileBasketStorage {
    backLink: SitePath;
    booking: IBookingInfo;
    hotelOffer: IAmendHotelOffer;
    isOnlyGoBack?: boolean;
}

const HotelDetailsMobileBasket: FunctionComponent<ISitecoreComponent<IMobileBasketProps>> = ({ rendering, fields }) => {
    const {
        clearSelectedHotelDetails,
        selectedHotelDetails,
        selectNewHotel,
        setIsHotelNoAvailabilityError,
        getPhrase,
        isLoadingSummaryPage,
        isHotelPreview,
        isHotelNoAvailabilityError,
        redirectTo,
        setNewlySelectedHotelOffer,
        setSelectedHotelDetailsOffer,
        baseUpdateBookingInfo,
        isTradePortal,
    } = useStore(store => ({
        isTradePortal: store.layoutStore.isTradePortal,
        ...(!isTradeStore(store) && {
            isHotelNoAvailabilityError: store.amendHotelStore.isNoAvailabilityError,
            setIsHotelNoAvailabilityError: store.amendHotelStore.setIsNoAvailabilityError,
            getPhrase: store.layoutStore.getPhrase,
            selectedHotelDetails: store.amendHotelStore.selectedHotelDetails,
            selectNewHotel: store.amendHotelStore.selectNewHotel,
            isLoadingSummaryPage: store.amendHotelStore.isLoadingSummaryPage,
            setNewlySelectedHotelOffer: store.amendHotelStore.setNewlySelectedHotelOffer,
            setSelectedHotelDetailsOffer: store.amendHotelStore.setSelectedHotelDetailsOffer,
            isHotelPreview: store.layoutStore.isHotelDetailsBrowsePagePreview,
            clearSelectedHotelDetails: store.amendHotelStore.clearSelectedHotelDetails,
            baseUpdateBookingInfo: store.viewBookingStore.baseUpdateBookingInfo,
            redirectTo: store.routerStore.redirectTo,
        }),
    }));

    const [state, setState] = useState({
        backLink: '',
        isOnlyGoBack: false,
    });

    useEffect(() => {
        const sessionData = getWebStorageItem<IHotelDetailsMobileBasketStorage>(
            LocalStorageType.HotelMobileBasket,
            true,
            sessionStorage,
        );

        setState({
            backLink: sessionData?.backLink || '',
            isOnlyGoBack: !!sessionData?.isOnlyGoBack,
        });

        if (!selectedHotelDetails && sessionData) {
            setSelectedHotelDetailsOffer?.(sessionData.hotelOffer, sessionData.hotelOffer?.hotel, sessionData.backLink);
            setNewlySelectedHotelOffer?.(sessionData.hotelOffer);
            baseUpdateBookingInfo?.(sessionData.booking);
        }

        return () => {
            clearSelectedHotelDetails?.();
        };
    }, []);

    const isMobile = useMobileViewport();

    const { hotel, amendHotelOffer } = selectedHotelDetails || {};
    const isMobileBasketVisible = !isTradePortal && hotel && amendHotelOffer && isMobile && isHotelPreview;

    if (!fields || !isMobileBasketVisible) {
        return null;
    }

    const dataTid = 'amend-hotel-details-footer';

    const onClickSelect = (e: React.MouseEvent) => {
        if (
            e.ctrlKey ||
            e.shiftKey ||
            e.metaKey || // apple
            (e.button && e.button == 1) // middle click, >IE9 + everyone else
        ) {
            return;
        }

        selectNewHotel?.(amendHotelOffer);
    };

    const onCloseHotelValidationError = () => {
        setIsHotelNoAvailabilityError?.(false);

        redirectTo?.(state.backLink);
    };

    return (
        <>
            {isLoadingSummaryPage && (
                <OverlaySpinner header={getPhrase?.(SitecoreDictionary.AmendHotelLabelsValidatingHotel)} />
            )}

            <div>
                <MobileBasket
                    handleSubmit={onClickSelect}
                    hasOptionSelected
                    fields={rendering.fields}
                    rendering={rendering}
                    showPrice={false}
                    backLink={state.backLink}
                    continueLabel={rendering.fields?.BookNow?.value}
                    params={{}}
                    isHotelDetailsIncluded
                    isOnlyBackButton={state.isOnlyGoBack}
                >
                    <div data-tid={dataTid}>
                        <HotelDetails
                            className={styles.row}
                            dataTid={`${dataTid}-hotel-details`}
                            name={hotel?.name}
                            location={{
                                city: hotel?.resort.name || '',
                                country: hotel?.country.name || '',
                                region: hotel?.location.name || '',
                            }}
                        />
                        <RatingsDetails className={styles.ratings} dataTid={`${dataTid}-ratings-details`} {...hotel} />
                    </div>
                </MobileBasket>
            </div>

            {isHotelNoAvailabilityError && (
                <Placeholder
                    name={PlaceholderNames.AttentionPopup}
                    rendering={rendering}
                    onClose={onCloseHotelValidationError}
                    mobilePosition={AttentionPopupMobilePosition.Center}
                    disableOutsideClick
                />
            )}
        </>
    );
};

export default observer(HotelDetailsMobileBasket);
