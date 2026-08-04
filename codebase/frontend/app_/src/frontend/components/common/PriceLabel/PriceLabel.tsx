import { Fragment, FunctionComponent } from 'react';
import classNames from 'classnames';

import usePriceLabels from 'frontend/hooks/usePriceLabels';
import useStore from 'frontend/hooks/useStore';
import { getLivePriceNumberOfNightsLabel } from 'frontend/utils/livePrice.utils';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';

import style from './PriceLabel.module.scss';
export interface IPriceLabelProps {
    price: string | JSX.Element;
    chevronIcon?: JSX.Element;
    className?: string;
    dataTid?: string;
    numberOfNights?: number;
    onClick?: () => void;
    priceDictionary?: SitecoreDictionary;
    tag?: React.ElementType;
    tooltip?: JSX.Element;

    wrapLabelAfterPrice?: (label: string) => JSX.Element;
    wrapLabelBeforePrice?: (label: string) => JSX.Element;
    wrapPrice?: (block: JSX.Element) => JSX.Element;
}

export const PriceLabel: FunctionComponent<IPriceLabelProps> = ({
    price,
    priceDictionary,
    className,
    dataTid,
    tag,
    tooltip,
    chevronIcon,
    numberOfNights,
    onClick,
    wrapLabelBeforePrice,
    wrapLabelAfterPrice,
    wrapPrice,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { labelBeforePrice, labelAfterPrice } = usePriceLabels(priceDictionary);

    const SpanTag = (dataTid || className) && 'span';
    const Tag = tag || SpanTag || Fragment;

    /** We can't provide any props to Fragment, so if we want to pass any props we need to check if tag was provided
     *  or dataTid or className exists which means we will use span as a tag */
    const props = {
        ...((tag || dataTid || className) && {
            'data-tid': dataTid,
            className: classNames(style.priceLabel, className),
        }),
    };

    const labelBeforePriceWithNights = getLivePriceNumberOfNightsLabel(getPhrase, numberOfNights, labelBeforePrice);

    const getLabelElement = (label: string, wrapLabel?: (label: string) => JSX.Element) => {
        if (!label) return null;

        return wrapLabel ? wrapLabel(label) : <span data-tid='price-label-before'>{label}</span>;
    };
    const priceBlock = (
        <>
            {typeof price === 'string' ? <span>{price}</span> : price}
            {getLabelElement(labelAfterPrice, wrapLabelAfterPrice)}
        </>
    );

    return (
        <Tag {...props} onClick={onClick}>
            {getLabelElement(labelBeforePriceWithNights, wrapLabelBeforePrice)}
            {wrapPrice ? wrapPrice(priceBlock) : priceBlock}
            {tooltip}
            {chevronIcon}
        </Tag>
    );
};

export default PriceLabel;
