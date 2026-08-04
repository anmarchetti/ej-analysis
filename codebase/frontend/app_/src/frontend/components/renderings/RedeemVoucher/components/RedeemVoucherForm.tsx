import React, { FC, useEffect, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { AxiosError } from 'axios';
import { observer } from 'mobx-react';

import { PROMOCODE_INVALID_CHARS } from 'code/validation.config';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { OnlyVoucherIsApplicable } from 'frontend/store/holidays/redeemVoucher/RedeemVoucherStore';
import { ApiError } from 'models/data/ApiError';
import { IApiErrorData } from 'models/data/ApiErrorData';
import { IValidationError } from 'models/data/validation/IValidationError';
import { ApiErrors } from 'models/enum/ApiErrors';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SitePath from 'models/enum/SitePath';
import { ValidationType } from 'models/enum/ValidationType';
import Button from 'frontend/components/common/Button';
import Callout from 'frontend/components/common/Callout/Callout';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import ValidatableField from 'frontend/components/common/ValidatableField/ValidatableField';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';
import PathBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';
import { IViewBookingsSitecoreFields } from 'frontend/components/renderings/RedeemVoucher/RedeemVoucher';

export interface IRedeemVoucherFormProps {
    fields: IViewBookingsSitecoreFields;
}

const RedeemVoucherForm: FC<IRedeemVoucherFormProps> = props => {
    const {
        getBreadcrumb,
        getPhrase,
        isGiftCardRedemptionEnabled,
        redirectToHomePage,
        validateVoucherCode,
        logoutIfNotSignedIn,
        redeemError,
        isVoucherCodeProcessing,
        cleanupRedeemStore,
        buildRedirectUrlToRedeemPage,
    } = useStore((stores: IHolidaysStores) => ({
        getBreadcrumb: stores.layoutStore.getBreadcrumb,
        getPhrase: stores.layoutStore.getPhrase,
        isGiftCardRedemptionEnabled: stores.layoutStore.isGiftCardRedemptionEnabled,
        redirectToHomePage: stores.routerStore.redirectToHomePage,
        validateVoucherCode: stores.redeemVoucherStore.validateVoucherCode,
        logoutIfNotSignedIn: stores.userStore.logoutIfNotSignedIn,
        redeemError: stores.redeemVoucherStore.error,
        isVoucherCodeProcessing: stores.redeemVoucherStore.isVoucherCodeProcessing,
        cleanupRedeemStore: stores.redeemVoucherStore.cleanupRedeemStore,
        buildRedirectUrlToRedeemPage: stores.queryParamStore.buildRedirectUrlToRedeemPage,
    }));

    useEffect(() => {
        if (!isGiftCardRedemptionEnabled) {
            redirectToHomePage();

            return;
        }

        checkIfPageAvailableForUser();
        cleanupRedeemStore();

        return () => {
            cleanupRedeemStore();
        };
    }, []);

    useEffect(() => {
        setValidationError(redeemError);
    }, [redeemError]);

    const checkIfPageAvailableForUser = async () => {
        setLoading(true);
        await logoutIfNotSignedIn(buildRedirectUrlToRedeemPage());
        setLoading(false);
    };

    const [isLoading, setLoading] = useState(false);
    const [voucherCode, setCode] = useState('');
    const [error, setError] = useState(null as Nullable<IValidationError>);
    const { fields } = props;

    const setValidationError = (e: Nullable<ApiError>) => {
        if (!e) {
            setError(null);

            return;
        }

        if (e.message === OnlyVoucherIsApplicable) {
            setError({
                errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesOnlyVoucherIsApplicableHTML,
                trigger: ValidationType.OnType,
            });

            return;
        }

        let error;
        switch (e.errorCode) {
            case ApiErrors.WrongDiscountNotFound:
                error = {
                    errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesVoucherDoesntExistHTML,
                };
                break;
            case ApiErrors.VoucherExpired:
                error = {
                    errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesVoucherExpiredHTML,
                };
                break;
            case ApiErrors.VoucherWasRedeemedBySomeoneElse:
                error = {
                    errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesRedeemedBySomeoneHTML,
                };
                break;
            case ApiErrors.VoucherWasRedeemedByYou:
                error = {
                    errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesRedeemedByYouHTML,
                };
                break;
            default:
                error = {
                    errorMessage: SitecoreDictionary.RedeemVoucherErrorMessagesDefaultErrorHTML,
                };
        }
        error.trigger = ValidationType.OnType;
        setError(error);
    };

    const onChange = (value: string) => {
        clearError();
        setCode(value);
    };
    const breadcrumbs = [getBreadcrumb(SitePath.ViewBookings), getBreadcrumb(SitePath.RedeemVoucher)];

    const onValidateVoucherCode = async (event?: React.MouseEvent | React.FormEvent) => {
        event?.preventDefault();

        // https://jira.build.easyjet.com/browse/EJH-15319
        if (PROMOCODE_INVALID_CHARS.test(voucherCode)) {
            setValidationError(
                new ApiError({
                    response: {
                        data: {
                            code: ApiErrors.WrongDiscountNotFound,
                        },
                    },
                } as AxiosError<IApiErrorData>),
            );

            return;
        }

        await validateVoucherCode(voucherCode, true);
    };

    const clearError = () => {
        setError(null);
    };

    return (
        <div className='redeem-voucher__form'>
            <PathBreadcrumbs data-tid='path-breadcrumbs' breadcrumbs={breadcrumbs} hideHomeBreadcrumb />
            {fields.Title && <Text tag={'h1'} className='redeem-voucher__title' field={fields.Title} />}
            {fields.Subtitle && <Text tag={'p'} className='redeem-voucher__subtitle' field={fields.Subtitle} />}
            <form onSubmit={onValidateVoucherCode}>
                <div className='redeem-voucher__controls'>
                    <ValidatableField
                        label={''}
                        value={voucherCode || ''}
                        onChange={onChange}
                        id='voucherCode'
                        name='voucherCode'
                        autoComplete={false}
                        isVertical
                        errors={error ? [error] : []}
                        notShowValidIcon
                        hideErrorDetails
                        watermark={fields.FieldPlaceholder?.value}
                        inputClass='redeem-voucher__input'
                        inputContainerClass='redeem-voucher__input-container'
                    >
                        {fields.Tooltip?.value && (
                            <Callout
                                content={<Text tag='div' field={fields.Tooltip} />}
                                orientation={CalloutOrientation.Top}
                                position={CalloutPosition.Center}
                                isShownOnHover
                            />
                        )}
                    </ValidatableField>
                    {!!error && (
                        <div className='redeem-voucher__errors redeem-voucher__errors--mobile'>
                            <i>
                                <SvgWarningFilled />
                            </i>

                            <p>
                                <RichTextDictionary dictionaryKey={error.errorMessage} />
                            </p>
                        </div>
                    )}
                    <Button
                        className='redeem-voucher__btn'
                        onClick={onValidateVoucherCode}
                        type='submit'
                        isLoading={isVoucherCodeProcessing}
                        disabled={!voucherCode?.length}
                    >
                        {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                    </Button>
                </div>
            </form>
            {!!error && (
                <div className='redeem-voucher__errors redeem-voucher__errors--desktop'>
                    <i>
                        <SvgWarningFilled />
                    </i>
                    <p>
                        <RichTextDictionary dictionaryKey={error.errorMessage} />
                    </p>
                </div>
            )}
            {isLoading && <OverlaySpinner header={getPhrase(SitecoreDictionary.RedeemVoucherLabelsLoading)} />}
        </div>
    );
};

export default observer(RedeemVoucherForm);
