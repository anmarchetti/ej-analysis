import React, { useEffect, useMemo, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import usePrivateTransferDurationDiff from 'frontend/hooks/usePrivateTransferDurationDiff';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getAmendmentRoundedPrice } from 'frontend/utils/amendBooking.utils';
import { IAmendTransferFields, ITransferWithAmendmentChargesExtended } from 'models/data/IAmendTransfers';
import { ITransfer, ITransferWithAmendmentCharges } from 'models/data/ITransfer';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { TransferType } from 'models/enum/transfer/TransferType';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ErrorMessage from 'frontend/components/common//ErrorMessage';
import Button from 'frontend/components/common/Button';
import Link from 'frontend/components/common/Link';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import SVGWarningFilled from 'frontend/components/icons-new/WarningFilled';
import { getAmendAlternativeTransports } from 'frontend/components/renderings/AmendFlights/components/AmendAlternativeFlights/AmendAlternativeFlights.utils';
import TransfersBasket from 'frontend/components/renderings/AmendmentBasket/components/TransfersBasket/TransfersBasket';
import TransferDurationPromo from 'frontend/components/renderings/Transfer/components/TransferDurationPromo/TransferDurationPromo';
import AmendBookingErrorPopup from 'frontend/components/renderings/ViewBooking/components/AmendBookingErrorPopup';

import AmendTransferCard from './components/AmendTransferCard/AmendTransferCard';

import styles from './AmendTransfers.module.scss';

export type TAmendTransfersProps = ISitecoreComponent<IAmendTransferFields>;

const AmendTransfers = (props: TAmendTransfersProps) => {
    const {
        transfersWithAmendmendCharges,
        initialSelectedTransfer,
        isAmendErrorPopupShown,
        selectedTransfer,
        isLoadingFromPayload,
        discountCode,
        currency,
        getSetting,
        getPhrase,
        changePrevSelectedTransfer,
        changeSelectedTransfer,
        initAmendTransfersPage,
        resetAmendTransferStore,
        submitTransfer,
        trackTransferAmendment,
        isFromChangeDate,
        toggleAmendErrorPopup,
    } = useStore((stores: IHolidaysStores) => ({
        transfersWithAmendmendCharges: stores.amendTransfersStore.transfersWithAmendmendCharges,
        initialSelectedTransfer: stores.amendTransfersStore.initialSelectedTransfer,
        isAmendErrorPopupShown: stores.viewBookingStore.isAmendErrorPopupShown,
        selectedTransfer: stores.amendTransfersStore.selectedTransfer,
        isLoadingFromPayload: stores.viewBookingStore.isLoadingBookingFromPayload,
        discountCode: stores.viewBookingStore.booking?.discountCode,
        currency: stores.amendTransfersStore.currency,
        getSetting: stores.layoutStore.getSetting,
        getPhrase: stores.layoutStore.getPhrase,
        changeSelectedTransfer: stores.amendTransfersStore.changeSelectedTransfer,
        initAmendTransfersPage: stores.amendTransfersStore.initAmendTransfersPage,
        resetAmendTransferStore: stores.amendTransfersStore.resetAmendTransferStore,
        changePrevSelectedTransfer: stores.amendTransfersStore.changePrevSelectedTransfer,
        submitTransfer: stores.amendTransfersStore.submitTransfer,
        trackTransferAmendment: stores.trackingStore.trackTransferAmendment,
        isFromChangeDate: stores.amendTransfersStore.isFromChangeDate,
        toggleAmendErrorPopup: stores.viewBookingStore.toggleAmendErrorPopup,
    }));

    const isMobile = useMobileViewport();

    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        initAmendTransfersPage();

        return resetAmendTransferStore;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { treatOption, otherOptions } = useMemo(() => {
        const otherOptions = transfersWithAmendmendCharges.filter(
            item => item.transfer.type !== TransferType.Private && item.transfer.type !== initialSelectedTransfer?.type,
        );
        const treatOption = transfersWithAmendmendCharges.filter(
            item => item.transfer.type == TransferType.Private && item.transfer.type !== initialSelectedTransfer?.type,
        );

        return {
            treatOption: getAmendAlternativeTransports(
                treatOption,
                props.fields,
            ) as ITransferWithAmendmentChargesExtended[],
            otherOptions: getAmendAlternativeTransports(
                otherOptions,
                props.fields,
            ) as ITransferWithAmendmentChargesExtended[],
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transfersWithAmendmendCharges, initialSelectedTransfer]);

    const privateDiffDuration = usePrivateTransferDurationDiff(
        [(treatOption[0] as ITransferWithAmendmentCharges)?.transfer, initialSelectedTransfer].filter(
            Boolean,
        ) as ITransfer[],
    );

    if (!initialSelectedTransfer)
        return isLoadingFromPayload ? (
            <OverlaySpinner header={getPhrase(SitecoreDictionary.GlobalsLabelsValidatingPackage)} />
        ) : null;

    const isPrivateTransferSelected = initialSelectedTransfer.type === TransferType.Private;

    const priceTooltipTextValue = (
        <>
            {props.fields?.PriceTooltipText?.value || ''}
            {!!discountCode &&
                !getSetting(SiteSettings.IsSeatsCalculationIncluded) &&
                ` ${props.fields?.PriceTooltipPromoSeatsText?.value || ''}`}
        </>
    );

    const renderTreatOptions = (item: ITransferWithAmendmentChargesExtended) => {
        const transfer = (
            <AmendTransferCard
                transfer={item.transfer}
                key={item.transfer.code}
                amendCharge={item.amendmentCharges}
                priceTooltipText={priceTooltipTextValue}
                errataMessages={item.errataMessages}
                onSelect={() => onTransferSelect(item)}
                isSelected={!!selectedTransfer && selectedTransfer.transfer.code === item.transfer.code}
                contentClassName={styles.cardContent}
                currency={currency}
            />
        );

        const minimumPromoBannerDurationDiff = props.fields?.MinimumPromoBannerDuration?.value;

        if (
            item.transfer.type === TransferType.Private &&
            props.fields?.IsPromotionalBannerEnabled.value &&
            props.fields.PromotionalBannerText.value &&
            minimumPromoBannerDurationDiff &&
            privateDiffDuration >= minimumPromoBannerDurationDiff
        ) {
            return (
                <div key={item.transfer.code} className='card-with-banner transfer'>
                    {transfer}
                    <TransferDurationPromo
                        className={styles.transferDurationPromo}
                        timeDiff={privateDiffDuration}
                        siteCoreValue={props.fields?.PromotionalBannerText.value}
                    />
                </div>
            );
        }

        return transfer;
    };

    const onContinue = () => {
        !selectedTransfer || selectedTransfer.transfer.code === initialSelectedTransfer.code
            ? setHasError(true)
            : (setHasError(false), submitTransfer());
    };

    const onTransferSelect = (item: Nullable<ITransferWithAmendmentCharges>) => {
        if (initialSelectedTransfer) {
            changeSelectedTransfer(item);

            if (item) trackTransferAmendment(EventTypes.AmendTransferSelect);
        }

        changePrevSelectedTransfer(null);
        setHasError(false);
    };

    const backLink = isFromChangeDate ? SitePath.AmendDatesSummary : SitePath.ViewBooking;

    return (
        <>
            <Placeholder name={PlaceholderNames.PriceJumpPopup} rendering={props.rendering} />
            {isAmendErrorPopupShown && <AmendBookingErrorPopup onClose={() => toggleAmendErrorPopup(false)} />}
            <div className='amend-transfers'>
                <div className='wrapper-component-container'>
                    <div className='wrapper-shape'>
                        <div className='wrapper-component-container__inner amend-transfers__container'>
                            <h2 className='amend-transfers__subtitle'>
                                {getPhrase(SitecoreDictionary.AmendTransferLabelsCurrentTransfer)}
                            </h2>
                            {initialSelectedTransfer && (
                                <AmendTransferCard
                                    transfer={initialSelectedTransfer}
                                    onSelect={() => onTransferSelect(null)}
                                    isPriceBlockHidden={!selectedTransfer}
                                    isSelected={
                                        selectedTransfer
                                            ? selectedTransfer.transfer.code === initialSelectedTransfer.code
                                            : true
                                    }
                                    revertPrice={(selectedTransfer?.amendmentCharges || -0) * -1}
                                    contentClassName={styles.cardContent}
                                    currency={currency}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {!isPrivateTransferSelected && treatOption.length > 0 && (
                    <div
                        className={classNames(
                            'wrapper-component-container wrapper-component-container--grey',
                            styles.grayPadding,
                        )}
                    >
                        <div className='wrapper-shape wrapper-shape--start wrapper-shape--end'>
                            <div className='wrapper-component-container__inner amend-transfers__container'>
                                <h2 className='amend-transfers__subtitle'>
                                    {getPhrase(SitecoreDictionary.AmendTransferLabelsTreatYourself)}
                                </h2>
                                {treatOption.map(item => renderTreatOptions(item))}
                            </div>
                        </div>
                    </div>
                )}
                {otherOptions.length > 0 && (
                    <div
                        className={classNames(
                            'wrapper-component-container',
                            (isPrivateTransferSelected || treatOption.length === 0) &&
                                'wrapper-component-container--grey ' + styles.grayPadding,
                        )}
                    >
                        <div
                            className={classNames(
                                'wrapper-shape',
                                (isPrivateTransferSelected || treatOption.length === 0) &&
                                    'wrapper-shape--start wrapper-shape--end',
                            )}
                        >
                            <div className='wrapper-component-container__inner amend-transfers__container'>
                                <h2 className='amend-transfers__subtitle'>
                                    {getPhrase(SitecoreDictionary.AmendTransferLabelsOtherOptions)}
                                </h2>
                                {otherOptions.map(item => (
                                    <AmendTransferCard
                                        priceTooltipText={priceTooltipTextValue}
                                        transfer={item.transfer}
                                        errataMessages={item.errataMessages}
                                        key={item.transfer.code}
                                        onSelect={() => onTransferSelect(item)}
                                        amendCharge={item.amendmentCharges}
                                        isSelected={
                                            !!selectedTransfer && selectedTransfer.transfer.code === item.transfer.code
                                        }
                                        contentClassName={styles.cardContent}
                                        currency={currency}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className='wrapper-component-container'>
                    <div className='wrapper-shape'>
                        {!isMobile && (
                            <div className='wrapper-component-container__inner continue-block'>
                                <Link href={backLink}>
                                    {getPhrase(SitecoreDictionary.AmendBookingButtonsGoBackNoChanges)}
                                </Link>
                                <Button
                                    className='continue-block__btn'
                                    hasDisabledStyles={
                                        !selectedTransfer ||
                                        selectedTransfer.transfer.code === initialSelectedTransfer.code
                                    }
                                    onClick={onContinue}
                                >
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                </Button>
                            </div>
                        )}
                        {hasError && (
                            <div className='amend-transfers__error'>
                                <ErrorMessage
                                    message={getPhrase(SitecoreDictionary.AmendTransferErrorsSelectTransferToContinue)}
                                    icon={<SVGWarningFilled />}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isMobile && (
                <Placeholder
                    name={PlaceholderNames.MobileBasket}
                    rendering={props.rendering}
                    price={getAmendmentRoundedPrice(selectedTransfer?.amendmentCharges ?? 0)}
                    hasOptionSelected={!!selectedTransfer}
                    handleSubmit={submitTransfer}
                    backLink={backLink}
                >
                    <TransfersBasket transfer={selectedTransfer?.transfer ?? initialSelectedTransfer} />
                </Placeholder>
            )}
            {isLoadingFromPayload && (
                <OverlaySpinner header={getPhrase(SitecoreDictionary.GlobalsLabelsValidatingPackage)} />
            )}
        </>
    );
};

export default observer(AmendTransfers);
