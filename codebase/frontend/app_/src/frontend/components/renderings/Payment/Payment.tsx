import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getIsTouristTaxDisplayed, getTouristTaxFieldsFromOffer } from 'frontend/utils/touristTax.utils';
import { scrollToElementWithOffset, scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { IThreeDSData } from 'models/data/payment/IThreeDSData';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import BookingErrorPopup from 'frontend/components/common/BookingErrorPopup';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import Banner from 'frontend/components/common/InfoBlock/InfoBlock';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';
import {
    gaApplePayButtonClickedWithoutAcceptingTermsAndConditions,
    gaClickToPayPaymentPage,
    gaPaymentError,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';
import PriceChanged from 'frontend/components/renderings/PriceChanged/PriceChanged';

import ApplePayEnabler from './components/ApplePay/ApplePayEnabler';
import BookingDetails from './components/BookingDetails/BookingDetails';
import InfoBlock from './components/InfoBlock';
import PayBlock from './components/PayBlock/PayBlock';
import PaymentForm from './components/PaymentForm';
import PaymentJumpPopup from './components/PaymentJumpPopup/PaymentJumpPopup';
import PaymentMethods from './components/PaymentMethods';
import PaymentProtected from './components/PaymentProtected';
import ThreeDSecure from './components/ThreeDSecure/ThreeDSecure';
import { IPaymentPageFields } from './interfaces';
import { getTouristTaxBannerProps } from './Payment.utils';
import { usePaymentInitialization } from './usePaymentInitialization';

import styles from './Payment.module.scss';

export type TPaymentProps = ISitecoreComponent<IPaymentPageFields>;
export const Payment: React.FC<TPaymentProps> = props => {
    const {
        clearPaymentUI,
        isCommittingBooking,
        isHolidayDataAvailable,
        promoCode,
        commitBooking,
        canPay,
        confirmPolicy,
        shouldConfirmPolicy,
        initialize,
        togglePolicy,
        paymentAuthorization,
        requirePaymentAuthorization,
        amount,
        amountToPay,
        usedCredit,
        fatalPaymentError,
        isPaymentInformationValid,
        transferErrors,
        paymentErrors,
        isTransfersHidden,
        getPhrase,
        isTradePortal,
        hasGuestInStorage,
        isBillingInfoValid,
        isDeposit,
        canPayDeposit,
        isFlightPlusHotelFunnel,
        commitApplePayBooking,
        redirectToBookingConfirmation,
        clearIsCommittingBooking,
        onForceErrors,
        selectedOffer,
        isTouristTaxEnabled,
        currencySymbol,
    } = useStore((stores: TStores) => ({
        clearPaymentUI: stores.paymentStore.clearPaymentUI,
        isCommittingBooking: stores.bookingStore.isCommittingBooking,
        isHolidayDataAvailable: stores.bookingStore.isHolidayDataAvailable,
        promoCode: stores.bookingStore.promoCode.value,
        commitBooking: stores.bookingStore.commitBooking,
        canPay: stores.paymentStore.canPay,
        confirmPolicy: stores.paymentStore.confirmPolicy,
        shouldConfirmPolicy: stores.paymentStore.shouldConfirmPolicy,
        initialize: stores.paymentStore.initialize,
        togglePolicy: () => stores.paymentStore.togglePolicy(!stores.paymentStore.confirmPolicy),
        paymentAuthorization: stores.payStore.paymentAuthorization,
        requirePaymentAuthorization: stores.payStore.requirePaymentAuthorization,
        amount: stores.payStore.amount,
        amountToPay: stores.payStore.amountToPay,
        usedCredit: stores.payStore.usedCredit,
        fatalPaymentError: stores.payStore.fatalPaymentError,
        isPaymentInformationValid: stores.payStore.canPay,
        transferErrors: stores.payStore.transferErrors,
        paymentErrors: stores.payStore.paymentErrors,
        isTransfersHidden: stores.bookingStore.isTransfersHidden,
        getPhrase: stores.layoutStore.getPhrase,
        isTradePortal: stores.layoutStore.isTradePortal,
        isBillingInfoValid: stores.payStore.isBillingInfoValid,
        onForceErrors: stores.payStore.onForceErrors,
        isFlightPlusHotelFunnel: stores.queryParamStore.isFlightPlusHotelFunnel,
        // Inject Holidays only Stores
        ...(isHolidayStore(stores) && {
            isDeposit: stores.paymentStore.isDeposit,
            canPayDeposit: stores.paymentStore.canPayDeposit,
            commitApplePayBooking: stores.bookingStore.commitApplePayBooking,
            redirectToBookingConfirmation: stores.bookingStore.redirectToBookingConfirmation,
            clearIsCommittingBooking: stores.bookingStore.clearIsCommittingBooking,
        }),
        ...(isTradeStore(stores) && {
            hasGuestInStorage: stores.guestDetailsStore.hasGuestInStorage,
        }),
        selectedOffer: stores.bookingStore.selectedOffer,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        currencySymbol: stores.marketStore.getCurrencySymbol(),
    }));

    const { fields } = props;

    const isConfirmPolicyValid = shouldConfirmPolicy === false;

    usePaymentInitialization(() => initialize(fields?.IsUseCreditShown?.value ?? false));
    const { pushTrackingEvent } = usePaymentTracking();

    const [hasClickedOnPay, setHasClickedOnPay] = useState(false);

    useEffect(() => {
        const hasErrors = transferErrors?.length || paymentErrors?.length;

        if (!hasClickedOnPay || !hasErrors) {
            return;
        }

        const errorArray = [...transferErrors, ...paymentErrors].filter(error => !!error);

        for (const err of errorArray) {
            pushTrackingEvent(gaPaymentError(err));
            setHasClickedOnPay(false);
        }
    }, [hasClickedOnPay, transferErrors, paymentErrors, pushTrackingEvent]);

    useEffect(() => () => clearPaymentUI(), [clearPaymentUI]);

    if (!isHolidayDataAvailable || (isTradePortal && !hasGuestInStorage?.())) {
        return null;
    }

    const isPaymentAuthorizationActive = requirePaymentAuthorization && !!paymentAuthorization;

    const onPay = (threeDSData?: IThreeDSData): void => {
        pushTrackingEvent(gaClickToPayPaymentPage(canPay, isDeposit, usedCredit));

        // Scroll to confirmation info if it is last invalid field
        if (isPaymentInformationValid && isConfirmPolicyValid === false) {
            scrollToErrorBlock();
        } else {
            setHasClickedOnPay(true);
            // When threeDSData is provided it's a 3DS continuation (fingerprint/challenge
            // completed), not a fresh user click. Force the commit so the isCommittingBooking
            // guard — which stays true during the invisible Identify step — doesn't block it.
            commitBooking(threeDSData, !!threeDSData);
        }
    };

    const validateFormAndScrollToError = (): boolean => {
        if (!isBillingInfoValid) {
            onForceErrors(true);
            scrollToErrorBlock();

            return false;
        }

        if (!confirmPolicy) {
            pushTrackingEvent(gaApplePayButtonClickedWithoutAcceptingTermsAndConditions);
            onForceErrors(true);
            scrollToErrorBlock();

            return false;
        }

        return true;
    };

    const applePayPaymentAuthorization = async (
        event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ): Promise<ICommitBookingRequestBody | void> => await commitApplePayBooking?.(event.payment);

    const applePayRedirect = (bookingBody: ICommitBookingRequestBody): void => {
        redirectToBookingConfirmation?.(bookingBody);
    };

    const shouldShowPriceChanged = fields?.EnablePriceJumpInfoBox?.value;
    const showTransfersError = !!transferErrors?.length || isTransfersHidden;

    const { touristTax } = getTouristTaxFieldsFromOffer(selectedOffer);

    const touristTaxBanner =
        getIsTouristTaxDisplayed({ isTouristTaxEnabled, touristTax }) &&
        getTouristTaxBannerProps({
            offer: selectedOffer,
            fields: fields as IPaymentPageFields,
            getPhrase,
            currencySymbol,
        });

    return (
        <>
            {!isTradePortal && (
                <>
                    <div className='wrapper--solid'>
                        <div className='wrapper-container wrapper-container--px pt-0'>
                            {!isFlightPlusHotelFunnel && (
                                <h1 className={classNames('page-title', styles.title)}>
                                    {getPhrase(SitecoreDictionary.PaymentTitlesBookHoliday)}
                                </h1>
                            )}

                            <BookingDetails
                                className={classNames('mb-0', { [styles.fphDetails]: isFlightPlusHotelFunnel })}
                                promoCode={promoCode} // pass actual promoCode to show it on booking details
                                alwaysShowPriceBreakdownWithPromo
                                fields={fields}
                            />

                            {shouldShowPriceChanged && (
                                <PriceChanged
                                    priceIncreasedMessage={fields?.PriceIncreasedMessage?.value}
                                    priceDecreasedMessage={fields?.PriceDecreasedMessage?.value}
                                    className={classNames(styles.priceJumpAlert, styles.basic)}
                                />
                            )}
                        </div>
                    </div>

                    {canPayDeposit && (
                        <div className='wrapper-component-container wrapper-component-container--grey'>
                            <div className='wrapper-shape wrapper-shape--start wrapper-shape--end'>
                                <div className='wrapper-shape__triangle-start' />
                                <div className='wrapper-container wrapper-container--px py-0'>
                                    <h2 className='payment-subtitle'>
                                        {getPhrase(SitecoreDictionary.PaymentTitlesBookWithDeposit)}
                                    </h2>
                                    <PaymentMethods fields={fields} isDisabled={isPaymentAuthorizationActive} />
                                </div>
                                <div className='wrapper-shape__triangle-end' />
                            </div>
                        </div>
                    )}

                    {!!touristTaxBanner && (
                        <div className='wrapper--solid'>
                            <div
                                className={classNames('wrapper-container wrapper-container--px', styles.bannerWrapper, {
                                    [styles.flightPlusHotel]: !canPayDeposit,
                                })}
                            >
                                <Banner contentClass={styles.content} iconClass={styles.icon} {...touristTaxBanner} />
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className='wrapper--solid'>
                <div className='wrapper-container wrapper-container--px'>
                    {!isTradePortal && <ApplePayEnabler />}

                    {!isTradePortal && (
                        <PaymentForm
                            fields={fields}
                            isDisabled={isPaymentAuthorizationActive}
                            onPaymentOptionSelected={(): void => {
                                const offsetFromBottom = 350;
                                scrollToElementWithOffset('#terms-and-conditions', offsetFromBottom);
                            }}
                        />
                    )}

                    {isTradePortal && !!touristTaxBanner && (
                        <Banner contentClass={styles.content} iconClass={styles.icon} {...touristTaxBanner} />
                    )}

                    {isPaymentAuthorizationActive && (
                        <ThreeDSecure
                            paymentAuthorization={paymentAuthorization}
                            onPay={onPay}
                            onMounted={isTradePortal ? undefined : clearIsCommittingBooking}
                        />
                    )}

                    <PaymentProtected
                        protectionImage={fields?.ProtectionImage}
                        protectionTitle={fields?.ProtectionTitle}
                    />

                    <PaymentJumpPopup
                        acceptButton={fields?.PriceJumpPopupAccept}
                        declineButton={fields?.PriceJumpPopupDecline}
                        description={fields?.PriceJumpPopupDescription}
                        title={fields?.PriceJumpPopupTitle}
                    />

                    <InfoBlock
                        {...props}
                        togglePolicy={togglePolicy}
                        isConfirmPolicyChecked={confirmPolicy}
                        isConfirmPolicyValid={isConfirmPolicyValid}
                        disabled={isPaymentAuthorizationActive}
                    >
                        <>
                            {showTransfersError && (
                                <ErrorMessage
                                    message={getPhrase(SitecoreDictionary.PaymentFailureMessagesNoTransferOption)}
                                    description={
                                        <RichTextDictionary
                                            dictionaryKey={
                                                SitecoreDictionary.PaymentFailureMessagesNoTransferOptionDescriptionHTML
                                            }
                                        />
                                    }
                                    icon={<IconInfoCircle />}
                                    IsNotification
                                />
                            )}
                        </>
                    </InfoBlock>
                    {shouldShowPriceChanged && (
                        <PriceChanged
                            priceIncreasedMessage={fields?.PriceIncreasedMessage?.value}
                            priceDecreasedMessage={fields?.PriceDecreasedMessage?.value}
                            className={styles.priceJumpAlert}
                        />
                    )}

                    <PayBlock
                        usedCredit={usedCredit}
                        amountToPay={amountToPay}
                        amount={amount}
                        amountLabel={
                            isDeposit
                                ? getPhrase(SitecoreDictionary.PaymentLabelsDeposit)
                                : getPhrase(SitecoreDictionary.PaymentLabelsHolidayFullAmount)
                        }
                        canPay={canPay}
                        requirePaymentAuthorization={requirePaymentAuthorization}
                        fatalPaymentError={fatalPaymentError}
                        onPay={onPay}
                        applePayPaymentFormValidation={validateFormAndScrollToError}
                        applePayPaymentAuthorization={applePayPaymentAuthorization}
                        applePayRedirect={applePayRedirect}
                    />
                    {isTradePortal && <BookingErrorPopup />}
                    {isCommittingBooking && (
                        <OverlaySpinner
                            header={getPhrase(SitecoreDictionary.PaymentTitlesSpinnerHeader)}
                            description={getPhrase(SitecoreDictionary.PaymentTitlesSpinnerDescription)}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default observer(Payment);
