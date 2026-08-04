import classnames from 'classnames';

import { TrailingZeroDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Callout, { ICalloutProps } from 'frontend/components/common/Callout/Callout';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import IconInfoCircle from 'frontend/components/icons/InfoCircle';

import styles from './CalloutPrice.module.scss';

export interface ICalloutPriceProps extends Omit<ICalloutProps, 'content' | 'isShownOnHover'> {
    price: number;
    className?: string;
    priceTooltipContent?: ISitecoreField<string>;
    tooltipDataTid?: string;
}

const CalloutPrice = ({
    price,
    priceTooltipContent,
    tooltipDataTid = 'price-tooltip',
    className,
    ...calloutProps
}: ICalloutPriceProps) => {
    const { formatMoney } = useStore(({ marketStore }: IHolidaysStores) => ({
        formatMoney: marketStore.formatMoney,
    }));

    const formattedPrice = formatMoney(price, {
        trailingZeroDisplay: TrailingZeroDisplay.StripIfInteger,
        maximumFractionDigits: 0,
    });

    return (
        <div data-tid='callout-price' className={classnames(styles.container, className)}>
            <span className={classnames(styles.additionalPrice, 'callout-price')}>{formattedPrice}</span>
            {!!priceTooltipContent && (
                <Callout
                    content={<RichTextWithLinks tag='div' field={priceTooltipContent} />}
                    isShownOnHover
                    className={styles.tooltip}
                    {...calloutProps}
                >
                    <div data-tid={tooltipDataTid}>
                        <IconInfoCircle />
                    </div>
                </Callout>
            )}
        </div>
    );
};

export default CalloutPrice;
