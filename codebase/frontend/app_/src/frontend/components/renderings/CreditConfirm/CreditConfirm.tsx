import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { scrollToErrorBlock } from 'frontend/utils/ui.utils';
import { IBreadcrumb } from 'models/data/IBreadcrumb';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import SiteSettings from 'models/enum/SiteSettings';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ConfirmationCheckbox from 'frontend/components/common/ConfirmationInfo/ConfirmationCheckbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import HolidayBriefCard from './components/HolidayBriefCard';
import RefundOptions from './components/RefundOptions';
import RefundSummary from './components/RefundSummary';

export interface IRefundCardsFields {
    CreditCardDescription: ISitecoreField<string>;
    IsCreditSelected: ISitecoreField<boolean>;
    RefundCardDescription: ISitecoreField<string>;
    RefundPopupInfo: ISitecoreField<string>;
}

export interface ICreditConfirmFields extends IRefundCardsFields {
    CreditConfirmDescription: ISitecoreField<string>;
    CreditIntro: ISitecoreField<string>;
    CreditTermsConditionsText: ISitecoreField<string>;
    CreditTermsConditionsTitle: ISitecoreField<string>;
    RefundCreditConfirmDescription: ISitecoreField<string>;
    RefundCreditTermsConditionsText: ISitecoreField<string>;
    RefundCreditTermsConditionsTitle: ISitecoreField<string>;
    RefundIntro: ISitecoreField<string>;
}

export type TCreditConfirmProps = ISitecoreComponent<ICreditConfirmFields, null>;

export const CreditConfirm = ({ fields }: TCreditConfirmProps) => {
    const {
        getPhrase,
        getBreadcrumb,
        initialize,
        booking,
        isCreditBookingFailed,
        isCreditBookingLoading,
        togglePolicy,
        confirmPolicy,
        shouldConfirmPolicy,
        onForcePolicyError,
        creditBooking,
        clearBooking,
        getSetting,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        initialize: stores.holidayCreditStore.initializeCreditConfirmPage,
        booking: stores.holidayCreditStore.booking,
        isCreditBookingFailed: stores.holidayCreditStore.isCreditBookingFailed,
        isCreditBookingLoading: stores.holidayCreditStore.isCreditBookingLoading,
        togglePolicy: () => stores.holidayCreditStore.togglePolicy(!stores.holidayCreditStore.confirmPolicy),
        confirmPolicy: stores.holidayCreditStore.confirmPolicy,
        shouldConfirmPolicy: stores.holidayCreditStore.shouldConfirmPolicy,
        onForcePolicyError: stores.holidayCreditStore.onForcePolicyError,
        creditBooking: stores.holidayCreditStore.creditBooking,
        clearBooking: stores.viewBookingStore.clearBooking,
        getSetting: stores.layoutStore.getSetting,
    }));

    const isCreditPage = booking?.refund.refund.isEligible !== true;
    const [isCreditOnlyRefund, setIsCreditOnlyRefund] = useState(isCreditPage || !!fields?.IsCreditSelected?.value);
    const pageIntroField = isCreditPage ? fields?.CreditIntro : fields?.RefundIntro;
    const fallbackImage = getSetting(SiteSettings.HotelFallbackImage);

    const breadcrumbs: IBreadcrumb[] = [
        getBreadcrumb(SitePath.ViewBookings),
        getBreadcrumb(SitePath.ViewBooking),
        {
            value: SitePath.ConfirmHolidayCredit,
            key: getPhrase(
                isCreditPage
                    ? SitecoreDictionary.PathBreadcrumbsLabelsCreditMyHoliday
                    : SitecoreDictionary.PathBreadcrumbsLabelsRefundMyHoliday,
            ),
        },
    ];

    const onConfirm = (event?: React.MouseEvent | React.FormEvent) => {
        event?.preventDefault();
        onForcePolicyError(true);

        if (confirmPolicy === false) {
            scrollToErrorBlock();
        } else {
            clearBooking();
            creditBooking(isCreditOnlyRefund);
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    if (!fields || !booking) {
        return null;
    }

    const currency = booking.currency?.code;

    return (
        <form className='credit-confirm' onSubmit={onConfirm}>
            <div className='wrapper-component-container__inner'>
                <PathBreadcrumbs isOpaqueStyle breadcrumbs={breadcrumbs} hideHomeBreadcrumb />

                {pageIntroField?.value && (
                    <RichTextWithLinks className='credit-confirm__intro' field={pageIntroField} />
                )}
            </div>

            <div className='wrapper-component-container wrapper-component-container--grey'>
                <div className='wrapper-shape wrapper-shape--start wrapper-shape--end'>
                    <div className='wrapper-shape__triangle-start' />

                    <div className='wrapper-component-container__inner'>
                        <h2 className='credit-confirm__subtitle'>
                            {getPhrase(SitecoreDictionary.CreditConfirmHolidaySummaryTitle)}
                        </h2>

                        <HolidayBriefCard booking={booking} fallbackImage={fallbackImage} />

                        {!isCreditPage && (
                            <RefundOptions
                                fields={fields}
                                refund={booking.refund}
                                currency={currency}
                                isCreditOnlyRefund={isCreditOnlyRefund}
                                onChangeRefundType={setIsCreditOnlyRefund}
                            />
                        )}
                    </div>

                    <div className='wrapper-shape__triangle-end' />
                </div>
            </div>

            <div className='wrapper-component-container__inner'>
                <ConfirmationCheckbox
                    large
                    checked={confirmPolicy}
                    label={
                        isCreditOnlyRefund ? fields.CreditTermsConditionsText : fields.RefundCreditTermsConditionsText
                    }
                    title={
                        isCreditOnlyRefund
                            ? fields.CreditTermsConditionsTitle?.value
                            : fields.RefundCreditTermsConditionsTitle?.value
                    }
                    hasError={shouldConfirmPolicy}
                    errorMessage={getPhrase(SitecoreDictionary.CreditConfirmErrorsConfirmTermsMessage)}
                    errorDescription={getPhrase(SitecoreDictionary.CreditConfirmErrorsConfirmTermsDescription)}
                    onChange={togglePolicy}
                />

                {isCreditBookingFailed && (
                    <ErrorMessage
                        message={getPhrase(SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerError)}
                        description={getPhrase(
                            SitecoreDictionary.GuestDetailsErrorMessagesGenericCustomerErrorDescription,
                        )}
                        errorMessageClass='error'
                        icon={
                            <i className='error-message__icon'>
                                <SvgWarningFilled />
                            </i>
                        }
                    />
                )}

                <RefundSummary
                    refund={booking.refund}
                    currency={currency}
                    isCreditOnlyRefund={isCreditOnlyRefund}
                    description={
                        isCreditOnlyRefund ? fields.CreditConfirmDescription : fields.RefundCreditConfirmDescription
                    }
                    isDisabled={!confirmPolicy}
                    isLoading={isCreditBookingLoading}
                    onConfirmClick={onConfirm}
                />
            </div>
        </form>
    );
};

export default observer(CreditConfirm);
