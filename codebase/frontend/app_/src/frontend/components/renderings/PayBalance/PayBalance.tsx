import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { scrollToElementWithOffset } from 'frontend/utils/ui.utils';
import { ICommitBookingRequestBody } from 'models/data/ICommitBookingRequestBody';
import { PaymentType } from 'models/enum/PaymentType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmountForPay from 'frontend/components/common/AmountForPay';
import BackToPage from 'frontend/components/common/BackToPage';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import ApplePayEnabler from 'frontend/components/renderings/Payment/components/ApplePay/ApplePayEnabler';
import BookingDetails from 'frontend/components/renderings/Payment/components/BookingDetails/BookingDetails';
import PayBlock from 'frontend/components/renderings/Payment/components/PayBlock/PayBlock';
import PaymentForm from 'frontend/components/renderings/Payment/components/PaymentForm';
import ThreeDSecure from 'frontend/components/renderings/Payment/components/ThreeDSecure/ThreeDSecure';
import {
    gaBalancePaymentSuccess,
    gaClickPayBalancePage,
} from 'frontend/components/renderings/Payment/GAPaymentEventHandlers';
import { IPayBalancePageFields } from 'frontend/components/renderings/Payment/interfaces';
import { usePaymentTracking } from 'frontend/components/renderings/Payment/trackingHooks/usePaymentTracking';
import useTrackPaymentErrors from 'frontend/components/renderings/Payment/trackingHooks/useTrackPaymentErrors';
import { usePaymentInitialization } from 'frontend/components/renderings/Payment/usePaymentInitialization';

import ThanksBalancePayment from './components/ThanksBalancePayment/ThanksBalancePayment';

import styles from './PayBalance.module.scss';

type TPayBalanceProps = ISitecoreComponent<IPayBalancePageFields>;

export const PayBalance: FC<TPayBalanceProps> = ({ fields, rendering }) => {
    const {
        initialize,
        reinitializeAfterLogin,
        paymentAuthorization,
        requirePaymentAuthorization,
        amountToPay,
        amount,
        currency,
        usedCredit,
        canPay,
        fatalPaymentError,
        transferErrors,
        paymentErrors,
        getPhrase,
        booking,
        payRemainingBalance,
        remainingAmount,
        setAmount,
        isPaying,
        isPaySuccess,
        goBackToViewBooking,
        paidDetails,
        isFromCheckAndConfirm,
        isBillingInfoValid,
        payRemainingBalanceWithApplePay,
        selectedPaymentType,
    } = useStore((stores: IHolidaysStores) => ({
        initialize: stores.payBalanceStore.initialize,
        reinitializeAfterLogin: stores.payBalanceStore.reinitializeAfterLogin,
        paymentAuthorization: stores.payStore.paymentAuthorization,
        requirePaymentAuthorization: stores.payStore.requirePaymentAuthorization,
        amountToPay: stores.payStore.amountToPay,
        amount: stores.payStore.amount,
        currency: stores.payStore.currency,
        usedCredit: stores.payStore.usedCredit,
        canPay: stores.payBalanceStore.canPay,
        fatalPaymentError: stores.payStore.fatalPaymentError,
        transferErrors: stores.payStore.transferErrors,
        paymentErrors: stores.payStore.paymentErrors,
        getPhrase: stores.layoutStore.getPhrase,
        booking: stores.payBalanceStore.booking,
        payRemainingBalance: stores.payBalanceStore.payRemainingBalance,
        remainingAmount: stores.payBalanceStore.remainingAmount,
        setAmount: stores.payStore.setAmount,
        isPaying: stores.payBalanceStore.isPaying,
        isPaySuccess: stores.payBalanceStore.isPaySuccess,
        goBackToViewBooking: stores.payBalanceStore.goBackToViewBooking,
        paidDetails: stores.payBalanceStore.paidDetails,
        isFromCheckAndConfirm: stores.payBalanceStore.isFromCheckAndConfirm,
        getSettingAsBoolean: stores?.layoutStore?.getSettingAsBoolean,
        isBillingInfoValid: stores.payStore.isBillingInfoValid,
        payRemainingBalanceWithApplePay: stores.payBalanceStore.payRemainingBalanceWithApplePay,
        selectedPaymentType: stores.payStore.selectedPaymentType,
    }));
    const isUseCreditShown = fields?.IsUseCreditShown?.value ?? false;

    usePaymentInitialization(() => initialize(isUseCreditShown));
    const { pushTrackingEvent } = usePaymentTracking();
    const [isPayClicked, setIsPayClicked] = useState(false);

    useTrackPaymentErrors(transferErrors, paymentErrors, isPayClicked);

    useEffect(() => {
        if (isPaySuccess) {
            const currencyOfSuccessfulPayment = currency || booking?.paymentInfo?.currency;
            pushTrackingEvent(
                gaBalancePaymentSuccess(
                    paidDetails,
                    currencyOfSuccessfulPayment,
                    booking?.bookingReference,
                    selectedPaymentType === PaymentType.ApplePay,
                ),
            );
        }
    }, [
        isPaySuccess,
        pushTrackingEvent,
        paidDetails,
        currency,
        booking?.paymentInfo?.currency,
        booking?.bookingReference,
        selectedPaymentType,
    ]);

    const isPaymentAuthorizationActive: boolean = requirePaymentAuthorization && !!paymentAuthorization;

    const handleOnPay = () => {
        setIsPayClicked(true);
        pushTrackingEvent(gaClickPayBalancePage(canPay, remainingAmount, amountToPay, usedCredit));
        payRemainingBalance();
    };

    const applePayPaymentFormValidation = (): boolean => isBillingInfoValid;

    const applePayPaymentAuthorization = async (
        event: ApplePayJS.ApplePayPaymentAuthorizedEvent,
    ): Promise<ICommitBookingRequestBody | void> => await payRemainingBalanceWithApplePay(event);

    return (
        <>
            {!!booking && !isPaySuccess && (
                <>
                    <div className='wrapper--solid'>
                        <div className='wrapper-container wrapper-container--px'>
                            <BackToPage
                                text={getPhrase(SitecoreDictionary.PaymentButtonsBackToBooking)}
                                onClick={goBackToViewBooking}
                            />
                            <h1 className={classNames('page-title', styles.title, 'mt-3')}>
                                {Tokenizer.replaceToken(
                                    getPhrase(SitecoreDictionary.PaymentTitlesPayYourBalance),
                                    Tokens.Resort,
                                    booking.hotel?.resort?.name ??
                                        booking.package?.accom?.hotel?.resort?.name ??
                                        booking.hotel?.country?.name ??
                                        'holiday',
                                )}
                            </h1>

                            <BookingDetails
                                booking={booking}
                                className={'mb-0'}
                                isPayRemaining
                                fields={fields}
                                disableTouristTax
                            />
                        </div>
                    </div>
                    <div className='wrapper--solid'>
                        <div className='wrapper-container wrapper-container--px mx-xl-auto'>
                            {!!fields?.ShowInstalments?.value && !isFromCheckAndConfirm && (
                                <AmountForPay
                                    fullAmount={remainingAmount}
                                    residualBalance={fields.ResidualBalance?.value ?? 0}
                                    onAmountChange={a => setAmount(a)}
                                    title={getPhrase(SitecoreDictionary.PaymentTitlesHowMuchToPay)}
                                    currency={currency}
                                    isDisabled={isPaymentAuthorizationActive}
                                />
                            )}

                            <ApplePayEnabler />

                            <PaymentForm
                                fields={fields}
                                isDisabled={isPaymentAuthorizationActive}
                                isBillingOpen={!!booking}
                                onSuccessLogin={() => reinitializeAfterLogin(isUseCreditShown)}
                                onPaymentOptionSelected={(): void => {
                                    const offsetFromBottom = 200;
                                    scrollToElementWithOffset('#total-price-description', offsetFromBottom);
                                }}
                                rendering={rendering}
                            />
                            {isPaymentAuthorizationActive && (
                                <ThreeDSecure
                                    paymentAuthorization={paymentAuthorization!}
                                    onPay={payRemainingBalance}
                                />
                            )}

                            <div className='mt-5 pb-3' />

                            <PayBlock
                                amountToPay={amountToPay ? amountToPay : usedCredit ? 0 : undefined}
                                usedCredit={usedCredit}
                                amount={amount}
                                amountLabel={getPhrase(SitecoreDictionary.PaymentLabelsHolidayRemainingAmount)}
                                canPay={canPay}
                                requirePaymentAuthorization={requirePaymentAuthorization}
                                fatalPaymentError={fatalPaymentError}
                                onPay={handleOnPay}
                                applePayPaymentFormValidation={applePayPaymentFormValidation}
                                applePayPaymentAuthorization={applePayPaymentAuthorization}
                            />

                            {isPaying && (
                                <OverlaySpinner
                                    header={getPhrase(SitecoreDictionary.PaymentTitlesSpinnerHeader)}
                                    description={getPhrase(SitecoreDictionary.PaymentTitlesSpinnerDescription)}
                                />
                            )}
                        </div>
                    </div>
                </>
            )}
            {isPaySuccess && (
                <ThanksBalancePayment
                    fields={fields}
                    booking={booking}
                    paidDetails={paidDetails}
                    onBack={goBackToViewBooking}
                />
            )}
        </>
    );
};

export default observer(PayBalance);
