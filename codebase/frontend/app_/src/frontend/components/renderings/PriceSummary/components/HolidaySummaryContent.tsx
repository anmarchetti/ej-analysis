import React, { FC, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { ICurrencyFormatOptions } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IExtraPriceBreakdown, IPriceBreakdownItem } from 'models/data/IValidPackageInfo';
import { PriceBreakdownCode } from 'models/enum/PriceBreakdownCode';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import ReadMoreButton from 'frontend/components/common/ReadMoreButton';
import SvgCross from 'frontend/components/icons-new/Cross';

import styles from './HolidaySummaryContent.module.scss';

export interface IHolidaySummaryContentProps {
    breakdownItem: IExtraPriceBreakdown;
    idx: number;
    isLastItem: boolean;
    isSubcategory: boolean;
    isHolidayPackageCostHighlighted?: boolean;
}

const SURCHARGE_CODE = 'SurCharge Price';

const HolidaySummaryContent: FC<IHolidaySummaryContentProps> = ({
    breakdownItem,
    idx,
    isLastItem,
    isSubcategory,
    isHolidayPackageCostHighlighted,
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const { clearActivePromocode, getPhrase, promocode, isRemovingPromocode, formatMoney, packageInfo } = useStore(
        (stores: TStores) => ({
            clearActivePromocode: stores.bookingStore.clearActivePromocode,
            getPhrase: stores.layoutStore.getPhrase,
            promocode: stores.bookingStore.promoCode.value,
            isRemovingPromocode: stores.bookingStore.isRemovingPromocode,
            formatMoney: stores.marketStore.formatMoney,
            packageInfo: stores.bookingStore.packageInfo,
        }),
    );

    const onReadMoreButtonClick = () => {
        setIsExpanded(!isExpanded);
    };

    const currencyOptions: ICurrencyFormatOptions = {
        currency: packageInfo?.paymentInfo?.currency,
        maximumFractionDigits: 0,
    };

    const getPriceItemContent = (price: IPriceBreakdownItem) => {
        const formattedPrice = formatMoney(Math.ceil(price.amount), currencyOptions);

        return price.quantity > 1 && price.code !== SURCHARGE_CODE
            ? `${price.quantity} × ${formattedPrice}`
            : formattedPrice;
    };

    return (
        <>
            <div
                key={idx || 'kidsGoFree'}
                className={classNames({
                    [styles.category]: !isSubcategory,
                    [styles.subcategory]: isSubcategory,
                    [styles.subcategoryLast]: isLastItem && isSubcategory,
                    [styles.subcategoryFirst]: idx === 0 && isSubcategory,
                    [styles.packageCostHighlightedWrapper]: isHolidayPackageCostHighlighted && idx !== 0,
                })}
                data-tid='breakdown-item'
            >
                {/* If price breakdown contains promocode, then add button to remove it */}
                {breakdownItem.code === PriceBreakdownCode.Promotions && !!promocode ? (
                    <div className='d-flex align-items-start align-items-md-center flex-column flex-md-row'>
                        <span className='description' data-tid='breakdown-description'>
                            {breakdownItem.name}: {promocode}
                        </span>
                        <Button
                            className='holiday-summary__button-remove ms-md-3 mt-1 mt-md-0 no-print'
                            isText
                            isLoading={isRemovingPromocode}
                            onClick={clearActivePromocode}
                        >
                            <SvgCross /> <span>{getPhrase(SitecoreDictionary.GlobalsButtonsRemove)}</span>
                        </Button>
                    </div>
                ) : (
                    <div className={classNames('description', styles.readMoreWrapper)} data-tid='breakdown-description'>
                        {breakdownItem.name}
                        {!!breakdownItem.subcategories && (
                            <div className='d-md-none d-block'>
                                <ReadMoreButton
                                    isReadLess={isExpanded}
                                    onClick={onReadMoreButtonClick}
                                    dataTid='read-more-mobile'
                                    readLessText={getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                                    readMoreText={getPhrase(SitecoreDictionary.GlobalsButtonsViewBreakdown)}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className={styles.readMoreWrapper}>
                    {!!breakdownItem.subcategories && (
                        <div className='d-md-flex justify-content-center align-items-center d-none'>
                            <ReadMoreButton
                                isReadLess={isExpanded}
                                onClick={onReadMoreButtonClick}
                                dataTid='read-more-desktop'
                                readLessText={getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                                readMoreText={getPhrase(SitecoreDictionary.GlobalsButtonsViewBreakdown)}
                            />
                        </div>
                    )}

                    <span
                        className={classNames(styles.price, breakdownItem.amount < 0 && styles.discount)}
                        data-tid='breakdown-price'
                        data-cs-mask
                    >
                        {breakdownItem.code === PriceBreakdownCode.Kids
                            ? getPhrase(SitecoreDictionary.BoardTypesButtonsIncluded)
                            : getPriceItemContent(breakdownItem)}
                    </span>
                </div>
            </div>
            {isExpanded &&
                breakdownItem?.subcategories
                    ?.slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((subcategory, idx) => (
                        <HolidaySummaryContent
                            key={subcategory.code}
                            breakdownItem={subcategory}
                            idx={idx}
                            isSubcategory={true}
                            isLastItem={idx === Number(breakdownItem.subcategories?.length) - 1}
                        />
                    ))}
        </>
    );
};

export default observer(HolidaySummaryContent);
