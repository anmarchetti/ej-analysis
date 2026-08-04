import React from 'react';
import classNames from 'classnames';

import { TrailingZeroDisplay } from 'code/currency';
import { CardType } from 'models/enum/CardType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { CardLogoComponent } from 'frontend/components/common/CreditCardLogoComponent/CardLogoComponent';
import ApplePayLogo from 'frontend/components/icons-new/ApplePayLogo';

import { IPayMethodItemProps } from './interfaces';

import styles from './ThanksBalancePayment.module.scss';

export const PayMethodItem: React.FC<IPayMethodItemProps> = ({
    details,
    showSplitAmount,
    currency,
    formatMoney,
    getPhrase,
    hasApplePayPayment,
    maskApplePayCardNumber,
}) => {
    // eslint-disable-next-line no-magic-numbers
    const lastDigits = details.cardNumber?.slice(-4) ?? '****';
    const mask =
        details.cardType === CardType.AmericanExpress ? `*** ****** *${lastDigits}` : `**** **** **** ${lastDigits}`;

    return (
        <div className={classNames(styles.listItem)}>
            <span>{getPhrase(SitecoreDictionary.BookingPaymentLabelsPaymentMethod)}</span>
            <div className={styles.paymentMethodWrapper}>
                <div className={styles.paymentMethod}>
                    {details.cardType === CardType.ApplePay ? (
                        <ApplePayLogo className={styles.logo} style={{ color: 'black', boxShadow: 'none' }} />
                    ) : (
                        <CardLogoComponent cardType={details.cardType} className={styles.logo} />
                    )}
                    <span className={styles.greyText}>{hasApplePayPayment ? maskApplePayCardNumber : mask}</span>
                </div>
                {showSplitAmount && (
                    <span className={styles.price}>
                        {formatMoney(details.amount, {
                            currency,
                            trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                        })}
                    </span>
                )}
            </div>
        </div>
    );
};
