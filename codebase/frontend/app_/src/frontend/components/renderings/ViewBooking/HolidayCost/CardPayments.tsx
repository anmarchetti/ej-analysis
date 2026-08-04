import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { CurrencyCode, TrailingZeroDisplay } from 'code/currency';
import { DATE_FORMATS } from 'code/dates';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { formatDateL10n } from 'frontend/utils/date.utils';
import { IPaymentHistoryItem } from 'models/data/IPaymentInfo';
import { CardType, CardTypeShort } from 'models/enum/CardType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { IComponentWithDictionary } from 'models/sitecore/generic/IComponentWithDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import AmericanExpressLogo from 'frontend/components/icons-new/AmericanExpressLogo';
import ApplePayLogo from 'frontend/components/icons-new/ApplePayLogo';
import MaestroLogo from 'frontend/components/icons-new/MaestroLogo';
import MastercardLogo from 'frontend/components/icons-new/MastercardLogo';
import VisaLogo from 'frontend/components/icons-new/VisaLogo';
import { IPaymentImage } from 'frontend/components/renderings/Payment/interfaces';

import styles from './HolidayCost.module.scss';

interface ICardPaymentsFields {
    PaymentImages: IPaymentImage[];
}

interface ICardPaymentsProps extends ISitecoreComponent<ICardPaymentsFields>, IComponentWithDictionary {
    currency: CurrencyCode | undefined;
    isLoggedInUserLead: boolean;
    paymentHistory: IPaymentHistoryItem[];
}

const CardPayments: FC<ICardPaymentsProps> = ({ currency, isLoggedInUserLead, paymentHistory }) => {
    const { getPhrase, formatMoney } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        formatMoney: stores.marketStore.formatMoney,
    }));

    if (!paymentHistory?.length) {
        return null;
    }

    const renderCardLogo = (cardTypeShort: string): React.FunctionComponent | null => {
        const logoClassNames = styles.paymentsCard;
        const cardTypes = {
            [CardType.Visa]: <VisaLogo className={logoClassNames} />,
            [CardType.Mastercard]: <MastercardLogo className={logoClassNames} />,
            [CardType.Maestro]: <MaestroLogo className={logoClassNames} />,
            [CardType.AmericanExpress]: <AmericanExpressLogo className={logoClassNames} />,
            [CardType.ApplePay]: (
                <ApplePayLogo className={logoClassNames} style={{ color: 'black', boxShadow: 'none' }} />
            ),
        };

        let cardType: string | undefined;
        switch (cardTypeShort) {
            case CardTypeShort.OFF:
            case CardTypeShort.EL:
            case CardTypeShort.VI:
            case CardTypeShort.DL:
                cardType = CardType.Visa;
                break;
            case CardTypeShort.AX:
                cardType = CardType.AmericanExpress;
                break;
            case CardTypeShort.MC:
            case CardTypeShort.DM:
                cardType = CardType.Mastercard;
                break;
            case CardTypeShort.SW:
                cardType = CardType.Maestro;
                break;
            case CardTypeShort.AV:
            case CardTypeShort.AL:
            case CardTypeShort.AM:
            case CardTypeShort.AD:
            case CardTypeShort.AA:
                cardType = CardType.ApplePay;
                break;
        }

        return cardType ? cardTypes[cardType] || null : null;
    };

    const MASKED_CARD_SEGMENTS = 3;

    const maskedCard = (cardNumber: string): string => {
        const lastDigits = cardNumber.match(/\d+$/gi);

        return new Array(MASKED_CARD_SEGMENTS).fill('****').concat(lastDigits).join(' ');
    };

    return (
        <div className={styles.payments}>
            {paymentHistory.map(item => (
                <div key={`${item.amount}-${item.paymentDate}`}>
                    {!!(item.card || item.isCredit) && isLoggedInUserLead && (
                        <div className={classNames(styles.tableRow, styles.paymentMethod)}>
                            <span>{getPhrase(SitecoreDictionary.BookingPaymentLabelsPaymentMethod)}:</span>
                            <span
                                data-tid='card-number'
                                data-cs-mask
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                {item.isCredit ? (
                                    getPhrase(SitecoreDictionary.BookingPaymentLabelsCreditOption)
                                ) : (
                                    <>
                                        {renderCardLogo(item.card.code)}
                                        {maskedCard(item.card.number)}
                                    </>
                                )}
                            </span>
                        </div>
                    )}
                    <div className={classNames(styles.tableRow)}>
                        <span data-tid='paid-label' data-cs-mask>
                            {getPhrase(SitecoreDictionary.BookingPaymentLabelsPaid)}{' '}
                            {formatDateL10n(item.paymentDate, DATE_FORMATS.L)}
                        </span>
                        <span className={styles.paidAmount} data-tid='paid-amount' data-cs-mask>
                            {formatMoney(item.amount, {
                                currency: currency,
                                trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
                            })}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default observer(CardPayments);
