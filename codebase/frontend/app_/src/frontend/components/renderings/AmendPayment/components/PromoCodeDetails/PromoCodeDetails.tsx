import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import { CurrencyCode } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IAmendBookingPromoBreakDown } from 'models/data/IAmendBookingFlights';
import ExpandableItem from 'frontend/components/common/ExpandableItem/ExpandableItem';
import ImageWithFilter, { SVGFilterMatrix } from 'frontend/components/common/ImageWithFilter/ImageWithFilter';
import { IPromoCodeFields } from 'frontend/components/renderings/AmendPayment/interfaces';

import {
    getPromocodeHeading,
    getPromocodeTitleFieldByStatus,
    getShouldShowPromocode,
    getTransferPromocodeSubtextByStatus,
} from './PromoCodeDetails.utils';

import styles from './PromoCodeDetails.module.scss';

export interface IAmendPaymentPromoCodeProps {
    fields: IPromoCodeFields;
    promoCodeBreakDown: IAmendBookingPromoBreakDown;
    currency?: CurrencyCode;
}

const PromoCodeDetails = ({ fields, promoCodeBreakDown, currency }: IAmendPaymentPromoCodeProps) => {
    const { formatMoney } = useStore((stores: IHolidaysStores) => ({
        formatMoney: stores.marketStore.formatMoney,
    }));

    const { promoCodeStatus, errors, promoCode } = promoCodeBreakDown;
    const { PromoCodeIcon } = fields;

    const shouldShowPromoCode = getShouldShowPromocode(promoCodeStatus);

    if (!shouldShowPromoCode) return null;

    const itemName = getPromocodeHeading(promoCodeStatus, fields);
    const itemDescription = getPromocodeTitleFieldByStatus(promoCodeStatus, fields);
    const promoMessages = getTransferPromocodeSubtextByStatus(
        promoCodeStatus!,
        fields,
        formatMoney,
        currency,
        promoCode,
        errors,
    );

    return (
        <ExpandableItem
            title={itemName?.value}
            className={styles.expander}
            titleClassName={styles.title}
            iconClassName={styles.icon}
            isOpened
            icon={
                <ImageWithFilter
                    imageSrc={PromoCodeIcon?.value?.src}
                    filterMatrix={SVGFilterMatrix.Orange}
                    dataTid='amend-promo-code-icon'
                    className={styles.titleIcon}
                />
            }
            dataTid='amend-promo-code-item'
        >
            <div className={styles.itemContent} data-tid='amend-promo-code'>
                <span className={styles.text} data-tid='amend-promo-code-status'>
                    <Text tag='strong' field={itemDescription} />
                </span>
                {promoMessages?.map(message => (
                    <span
                        className={styles.description}
                        data-tid='amend-promo-code-description'
                        key={message.code}
                        dangerouslySetInnerHTML={{
                            __html: sanitize(message.message),
                        }}
                    />
                ))}
            </div>
        </ExpandableItem>
    );
};

export default observer(PromoCodeDetails);
