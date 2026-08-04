import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import Axios, { CancelTokenSource } from 'axios';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport, useTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import HotelConfirmationCTA from 'frontend/components/common/AmendHotelStickyHeader/components/HotelConfirmationCTA/HotelConfirmationCTA';
import StickyHeader from 'frontend/components/common/AmendHotelStickyHeader/StickyHeader';
import AmendPageHeader from 'frontend/components/common/AmendPageHeader/AmendPageHeader';
import HotelDetails from 'frontend/components/common/AmendSummary/HotelDetails/HotelDetails';
import HotelDropdown from 'frontend/components/common/AmendSummary/HotelDropdown/HotelDropdown';
import RoomAndBoardDropdown from 'frontend/components/common/AmendSummary/RoomAndBoardDropdown/RoomAndBoardDropdown';
import TransferDropdown from 'frontend/components/common/AmendSummary/TransferDropdown/TransferDropdown';
import AmendTransferPopup, { ITransferPopupFields } from 'frontend/components/common/AmendTransferPopup';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import HotelBasket from 'frontend/components/renderings/AmendmentBasket/components/HotelBasket/HotelBasket';
import {
    useRoomAndBoardLocalStore,
    withRoomAndBoardLocalStore,
} from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

import styles from './AmendHotelSummary.module.scss';

interface IAmendHotelSummaryFields extends ITransferPopupFields {
    HotelCTA: ISitecoreField<string>;
    HotelIcon: ISitecoreField<ISitecoreImage>;
    HotelTitle: ISitecoreField<string>;
    MobileBasketLabel: ISitecoreField<string>;
    PriceTooltip: ISitecoreField<string>;
    RoomAndBoardCTA: ISitecoreField<string>;
    RoomAndBoardIcon: ISitecoreField<ISitecoreImage>;
    RoomAndBoardTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
    Title: ISitecoreField<string>;
    TransferCTA: ISitecoreField<string>;
    TransferTitle: ISitecoreField<string>;
}

const AmendHotelSummary: FunctionComponent<ISitecoreComponent<IAmendHotelSummaryFields>> = ({ rendering, fields }) => {
    const {
        newlySelectedHotelOffer,
        getSetting,
        confirmChosenHotel,
        totalPrice,
        initializeSummaryPage,
        isLoadingBookingFromPayload,
        getPhrase,
        fetchAlternativeTransfers,
        areTransfersLoading,
        dropTransfersHotelStore,
        alternativeHotelTransfersOffers,
        selectedTransfer,
        alternativeTransfers,
        changeTransfer,
        setSelectedHotelDetailsOffer,
        trackClickOnTransferChange,
        trackClickOnRoomAndBoardChange,
        trackClickOnTransferConfirm,
    } = useStore((store: IHolidaysStores) => ({
        newlySelectedHotelOffer: store.amendHotelStore.newlySelectedHotelOffer,
        getSetting: store.layoutStore.getSetting,
        confirmChosenHotel: store.amendHotelStore.confirmChosenHotel,
        fetchAlternativeTransfers: store.amendHotelStore.transfer.fetchAlternativeTransfers,
        dropTransfersHotelStore: store.amendHotelStore.transfer.dropStoreState,
        alternativeHotelTransfersOffers: store.amendHotelStore.transfer.alternativeHotelOffers,
        areTransfersLoading: store.amendHotelStore.transfer.isLoading,
        totalPrice: store.amendHotelStore.totalPrice,
        initializeSummaryPage: store.amendHotelStore.initializeSummaryPage,
        selectedTransfer: store.amendHotelStore.transfer.selectedTransfer,
        alternativeTransfers: store.amendHotelStore.transfer.alternativeTransfers,
        changeTransfer: store.amendHotelStore.transfer.changeTransfer,
        setSelectedHotelDetailsOffer: store.amendHotelStore.setSelectedHotelDetailsOffer,
        isLoadingBookingFromPayload: store.viewBookingStore.isLoadingBookingFromPayload,
        trackClickOnTransferChange: store.trackingStore.changeHotel.clickOnTransferChange,
        trackClickOnRoomAndBoardChange: store.trackingStore.changeHotel.clickOnRoomAndBoardChange,
        trackClickOnTransferConfirm: store.trackingStore.changeHotel.clickOnTransferConfirm,
        getPhrase: store.layoutStore.getPhrase,
    }));

    const { showPopup } = useRoomAndBoardLocalStore() ?? {};

    const axiosCancelSource = useRef<Nullable<CancelTokenSource>>(null);

    const [isTransferPopupOpened, setIsTransferPopupOpened] = useState(false);

    const isMobile = useMobileViewport();
    const isTablet = useTabletViewport();

    const handleClickRoomAndBoardCta = (): void => {
        showPopup?.();
        trackClickOnRoomAndBoardChange();
    };

    const handleClickTransferCta = async (): Promise<void> => {
        setIsTransferPopupOpened(true);
        trackClickOnTransferChange();

        if (alternativeHotelTransfersOffers.length) return;

        axiosCancelSource.current = Axios.CancelToken.source();
        await fetchAlternativeTransfers(axiosCancelSource.current);
    };

    const handleNewTransferConfirm = (transfer: ITransferWithAmendmentCharges): void => {
        changeTransfer(transfer);
        trackClickOnTransferConfirm(transfer);
    };

    useEffect(() => {
        initializeSummaryPage();

        return () => {
            dropTransfersHotelStore();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isTransferPopupOpened) {
            axiosCancelSource.current?.cancel();
        }
    }, [isTransferPopupOpened]);

    if (!fields) {
        return null;
    }

    if (isLoadingBookingFromPayload) {
        return <OverlaySpinner header={getPhrase(SitecoreDictionary.AmendHotelLabelsValidatingHotel)} />;
    }

    if (!newlySelectedHotelOffer) {
        return null;
    }

    const handleHotelPreviewClick = (): void => {
        if (!isMobile) return;

        setSelectedHotelDetailsOffer(newlySelectedHotelOffer, newlySelectedHotelOffer.hotel);
    };

    const {
        Title,
        Subtitle,
        RoomAndBoardTitle,
        RoomAndBoardIcon,
        RoomAndBoardCTA,
        TransferTitle,
        HotelTitle,
        HotelIcon,
        HotelCTA,
        TransferCTA,
        PriceTooltip,
        MobileBasketLabel,
    } = fields;

    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);
    const icon = newlySelectedHotelOffer.transfers[0].iconUrl || '';

    return (
        <>
            {!isMobile && (
                <StickyHeader
                    dataTid='amend-hotel-summary-sticky-header'
                    amendOffer={newlySelectedHotelOffer}
                    tooltipLabel={PriceTooltip?.value || ''}
                />
            )}

            <AmendPageHeader
                title={Title}
                subtitle={Subtitle}
                rendering={rendering}
                isAttentionMessageOn
                breadcrumbRootPath={SitePath.AmendHotel}
                errataOverrides={{ accomCode: newlySelectedHotelOffer.accom.code }}
            />

            <div className={classNames('wrapper-component-container__inner', styles.content)}>
                <HotelDetails fallbackHotelImage={fallbackImage} hotel={newlySelectedHotelOffer.hotel} />

                {isTablet && <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />}

                <div className={styles.dropdowns}>
                    <HotelDropdown
                        hotel={newlySelectedHotelOffer.hotel}
                        previewClickHandler={handleHotelPreviewClick}
                        icon={HotelIcon}
                        title={HotelTitle}
                        CTALabel={HotelCTA}
                    />

                    <RoomAndBoardDropdown
                        title={RoomAndBoardTitle}
                        icon={RoomAndBoardIcon}
                        unit={newlySelectedHotelOffer.accom.unit}
                        onClickEditCTA={handleClickRoomAndBoardCta}
                        CTALabel={RoomAndBoardCTA}
                    />

                    <TransferDropdown
                        icon={{ value: { src: icon } }}
                        title={TransferTitle}
                        offerTransfer={newlySelectedHotelOffer.transfers[0]}
                        onClickEditCTA={handleClickTransferCta}
                        ctaLabel={TransferCTA?.value}
                    />

                    {!isTablet && <Placeholder name={PlaceholderNames.ChangeFeeInfo} rendering={rendering} />}

                    {!isMobile && (
                        <HotelConfirmationCTA dataTid='confirm-hotel-cta' className={styles.continueButton} />
                    )}
                </div>

                {isMobile && (
                    <Placeholder
                        name={PlaceholderNames.MobileBasket}
                        rendering={rendering}
                        hasOptionSelected
                        applyNegativeMargin
                        price={totalPrice}
                        handleSubmit={confirmChosenHotel}
                    >
                        <HotelBasket amendOffer={newlySelectedHotelOffer} unchangedLabel={MobileBasketLabel?.value} />
                    </Placeholder>
                )}

                {isTransferPopupOpened && (
                    <AmendTransferPopup
                        fields={fields}
                        initialTransfer={selectedTransfer}
                        onClose={(): void => setIsTransferPopupOpened(false)}
                        onConfirm={handleNewTransferConfirm}
                        altTransfers={alternativeTransfers}
                        isLoading={areTransfersLoading}
                    />
                )}
            </div>

            <Placeholder name={PlaceholderNames.AmendRoomAndBoardPopup} rendering={rendering} />
            <Placeholder name={PlaceholderNames.PriceJumpPopup} rendering={rendering} />
            <Placeholder name={PlaceholderNames.UnAvailableFlowPopup} rendering={rendering} />
        </>
    );
};

export default withRoomAndBoardLocalStore(observer(AmendHotelSummary));
