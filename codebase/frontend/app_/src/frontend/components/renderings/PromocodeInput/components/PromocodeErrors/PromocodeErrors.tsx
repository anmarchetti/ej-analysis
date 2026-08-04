import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ApiErrors } from 'models/enum/ApiErrors';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './PromocodeErrors.module.scss';

export interface IPromocodeErrorsProps {
    errorText: string;
}

export const PromocodeErrors: FC<IPromocodeErrorsProps> = ({ errorText }) => {
    const { promocodeErrorCode, promocodeValidationErrors, getPhrase } = useStore((stores: IHolidaysStores) => ({
        promocodeErrorCode: stores.bookingStore.promoCode.promocodeErrorCode,
        promocodeValidationErrors: stores.bookingStore.promoCode.promocodeValidationErrors,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const isVoucherValidationError = (): boolean => {
        switch (promocodeErrorCode) {
            case ApiErrors.VoucherExpired:
            case ApiErrors.VoucherWasRedeemedBySomeoneElse:
            case ApiErrors.VoucherWasRedeemedByYou:
                return true;
            default:
                return false;
        }
    };
    const isVoucherError = isVoucherValidationError();
    const isPromoError = promocodeErrorCode === ApiErrors.PromocodeValidation;

    return (
        <div
            className={classNames(styles.error, 'form-control__error is-fullwidth', {
                [styles.voucherValidationError]: isVoucherError,
            })}
            data-tid='promocode-error-container'
        >
            <i
                className={classNames(styles.errorIcon, 'form-control__error__icon', {
                    ['form-control__error__icon__multiple']: isPromoError,
                })}
                data-tid='promocode-error-icon'
            >
                <SvgWarningFilled className={styles.warningIcon} />
            </i>
            {isPromoError ? (
                <div
                    className={classNames(styles.multipleError, 'form-control__error__multiple')}
                    data-tid='promocode-error-multiple'
                >
                    <p className={classNames(styles.errorText, 'text')}>
                        {getPhrase(SitecoreDictionary.HolidaysPromotionCriteriaErrorsMultipleErrors)}
                        {promocodeValidationErrors.length === 1 && (
                            <span>{promocodeValidationErrors[0].errorMessage}</span>
                        )}
                    </p>
                    {promocodeValidationErrors.length > 1 && (
                        <ul className={classNames(styles.errorsList, 'errors-list')}>
                            {promocodeValidationErrors.map((error, index) => (
                                <li key={`${error.propertyName}_${index}`}>{error.errorMessage}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : (
                <span className={classNames(styles.errorLabel, 'form-control__error__label')}>
                    {isVoucherError ? (
                        <RichTextDictionary dictionaryKey={promocodeValidationErrors[0].errorMessage} />
                    ) : (
                        errorText
                    )}
                </span>
            )}
        </div>
    );
};

export default observer(PromocodeErrors);
