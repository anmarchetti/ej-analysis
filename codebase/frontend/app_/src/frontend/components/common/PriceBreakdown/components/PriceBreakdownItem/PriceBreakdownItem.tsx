import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { CurrencyCode } from 'code/currency';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import Callout from 'frontend/components/common/Callout/Callout';
import { DATA_TID_DETAILS as DATA_TID } from 'frontend/components/common/PriceBreakdown/PriceBreakdown.utils';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './PriceBreakdownItem.module.scss';

export interface IPriceBreakdownItem {
    amount: number;
    breakdownTitle: string;
    className?: string;
    subItems?: { amount: number; title: string; className?: string }[];
    tooltipText?: string;
    uniqueKey?: string;
}

export interface IPriceBreakdownItemProps extends IPriceBreakdownItem {
    currency: CurrencyCode;
    children?: React.ReactNode;
    className?: string;
}

const PriceBreakdownItem: FunctionComponent<IPriceBreakdownItemProps> = ({
    amount,
    breakdownTitle,
    uniqueKey,
    className,
    tooltipText,
    subItems,
    children,
    currency,
}) => {
    const { formatMoney } = useStore(({ marketStore }: IHolidaysStores) => ({
        formatMoney: marketStore.formatMoney,
    }));

    const isMobile = useMobileViewport();

    return (
        <div
            key={`${DATA_TID}-${uniqueKey}`}
            data-tid={`${DATA_TID}-${uniqueKey}`}
            className={styles.priceBreakdownItem}
        >
            <div className={classNames(styles.breakdownRow, className)} data-tid={`${DATA_TID}-${uniqueKey}-row`}>
                <div className={classNames(!!tooltipText && styles.tooltipRow)}>
                    <Text field={{ value: breakdownTitle }} tag='span' data-tid={`${DATA_TID}-${uniqueKey}-title`} />
                    {!!tooltipText && (
                        <Callout
                            className={styles.callout}
                            content={<RichTextWithLinks tag='div' field={{ value: tooltipText }} />}
                            orientation={CalloutOrientation.Top}
                            position={isMobile ? CalloutPosition.IconLeft : CalloutPosition.Right}
                            isShownOnHover
                            isIconSmall
                        />
                    )}
                    {children}
                </div>
                <span className={classNames(styles.price, 'price')} data-tid={`${DATA_TID}-${uniqueKey}-amount`}>
                    {formatMoney(amount, { currency })}
                </span>
            </div>
            {subItems?.map((subItem, index) => (
                <div
                    key={`${DATA_TID}-${uniqueKey}-subitem-${index}`}
                    className={classNames(styles.breakdownRow, styles.subItemRow, subItem.className)}
                    data-tid={`${DATA_TID}-${uniqueKey}-subitem-${index}`}
                >
                    <span className={styles.subItemTitle}>{subItem.title}</span>
                    <span className={classNames(styles.subItemPrice, 'price')}>
                        {formatMoney(subItem.amount, { currency })}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default PriceBreakdownItem;
