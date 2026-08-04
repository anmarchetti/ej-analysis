import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { getTouristTaxFieldsFromOffer, getTouristTaxPrice } from 'frontend/utils/touristTax.utils';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import { TouristTaxPriceLabel } from 'frontend/components/common/TouristTaxPriceLabel/TouristTaxPriceLabel';
import { TouristTaxPriceTooltip } from 'frontend/components/common/TouristTaxPriceTooltip/TouristTaxPriceTooltip';
import BasketDiagonalCellABStyles from 'frontend/components/cro/BasketAB/components/BasketDiagonalCellsAB.module.scss';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import styles from 'frontend/components/renderings/Basket/Basket.module.scss';

import VisibleBasketOffers, { OffersViewMode } from './BasketPriceCellOffers/BasketPriceCellOffers';
import BasketPriceCellPrice from './BasketPriceCellPrice/BasketPriceCellPrice';

export interface IBasketPriceCellProps extends IComponentWithRerenderProps {
    className: string;
    isNextButtonVisible: boolean;
    isPricePPShown: boolean;
    offer: IOffer | IOfferWithoutAltBoards;
    isABTestingComponent?: boolean;
}

export const BasketPriceCell = ({
    isNextButtonVisible,
    offer,
    isPricePPShown,
    className,
    isABTestingComponent,
    wasRerendered,
}: IBasketPriceCellProps) => {
    const {
        getPhrase,
        isExtrasPage,
        isGuestDetailsPage,
        isScreenExtraSmall,
        isHotelDetailsBookPage,
        totalPriceForExtras,
        totalPriceWithTouristTax,
        addExtrasToPrice,
        totalPrice,
        totalPricePPForExtras,
        totalPricePP,
        totalPricePPWithTouristTax,
    } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isGuestDetailsPage: stores.layoutStore.isGuestDetailsPage,
        isScreenExtraSmall: stores.appStore.isScreenExtraSmall,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        totalPriceForExtras: stores.bookingStore.totalPriceForExtras,
        totalPrice: stores.bookingStore.totalPrice,
        totalPriceWithTouristTax: stores.bookingStore.totalPriceWithTouristTax,
        addExtrasToPrice: stores.bookingStore.addExtrasToPrice,
        totalPricePPForExtras: stores.bookingStore.totalPricePPForExtras,
        totalPricePP: stores.bookingStore.totalPricePP,
        totalPricePPWithTouristTax: stores.bookingStore.totalPricePPWithTouristTax,
    }));

    const renderLabel = (label: string) => <span>{label}</span>;
    const getFractionalPart = (total: number) => Math.round((total % 1) * 100);
    const getWholePart = (total: number) => Math.floor(total);
    const numTotalPriceValue = isHotelDetailsBookPage ? totalPriceForExtras : totalPrice;

    const wholePartTotalValue = getWholePart(numTotalPriceValue);
    const fractionalPartTotalValue = getFractionalPart(numTotalPriceValue);

    const numTotalPricePPValue = isHotelDetailsBookPage ? totalPricePPForExtras : totalPricePP;
    const wholePartPPValue = getWholePart(numTotalPricePPValue);
    const fractionalPartPPValue = getFractionalPart(numTotalPricePPValue);

    const [numTotalPrice, setNumTotalPrice] = useState<number>(numTotalPriceValue);
    const [numTotalPricePP, setNumTotalPricePP] = useState<number>(numTotalPricePPValue);

    // actual values
    const [wholePartTotal, setWholePartTotal] = useState<number>(wholePartTotalValue);
    const [fractionalPartTotal, setFractionalPartTotal] = useState<number>(fractionalPartTotalValue);
    const [wholePartPP, setWholePartPP] = useState<number>(wholePartPPValue);
    const [fractionalPartPP, setFractionalPartPP] = useState<number>(fractionalPartPPValue);

    // prev values
    const [prevWholePartTotal, setPrevWholePartTotal] = useState<number>(wholePartTotalValue);
    const [prevFractionalPartTotal, setPrevFractionalPartTotal] = useState<number>(fractionalPartTotalValue);
    const [prevWholePartPP, setPrevWholePartPP] = useState<number>(wholePartPPValue);
    const [prevFractionalPartPP, setPrevFractionalPartPP] = useState<number>(fractionalPartPPValue);

    const prevNumTotalPrice = usePrevious(numTotalPrice);
    const prevNumTotalPricePP = usePrevious(numTotalPricePP);

    useEffect(() => {
        const newNumTotalPrice = isHotelDetailsBookPage ? totalPriceForExtras : totalPrice;

        if (prevNumTotalPrice !== newNumTotalPrice) {
            const newWholePartTotal = Math.floor(newNumTotalPrice);
            const newFractionalPartTotal = Math.round((newNumTotalPrice % 1) * 100);

            setPrevWholePartTotal(wholePartTotal);
            setPrevFractionalPartTotal(fractionalPartTotal);
            setNumTotalPrice(newNumTotalPrice);
            setWholePartTotal(newWholePartTotal);
            setFractionalPartTotal(newFractionalPartTotal);
        }
    }, [isHotelDetailsBookPage, totalPriceForExtras, totalPrice]);

    useEffect(() => {
        const newNumTotalPricePP = isHotelDetailsBookPage ? totalPricePPForExtras : totalPricePP;

        if (prevNumTotalPricePP !== newNumTotalPricePP) {
            setPrevWholePartPP(wholePartPP);
            setPrevFractionalPartPP(fractionalPartPP);

            const newWholePartPP = Math.floor(newNumTotalPricePP);
            const newFractionalPartPP = Math.round((newNumTotalPricePP % 1) * 100);

            setNumTotalPricePP(newNumTotalPricePP);
            setWholePartPP(newWholePartPP);
            setFractionalPartPP(newFractionalPartPP);
        }
    }, [isHotelDetailsBookPage, totalPricePPForExtras, totalPricePP]);

    const getTotalPriceDictionary = (): SitecoreDictionary | undefined => {
        if (isExtrasPage || isGuestDetailsPage) {
            return SitecoreDictionary.GlobalsPriceLabelsTotal;
        }

        if (isScreenExtraSmall) {
            return SitecoreDictionary.GlobalsPriceLabelsTotalFrom;
        }

        return isPricePPShown ? undefined : SitecoreDictionary.GlobalsPriceLabelsFrom;
    };

    let offersViewMode: OffersViewMode | undefined;

    if (!isNextButtonVisible) {
        offersViewMode = OffersViewMode.AllOffers;
    } else if (!!wasRerendered && !isScreenExtraSmall) {
        offersViewMode = OffersViewMode.TwoOffers;
    }

    const totalPriceDictionary = getTotalPriceDictionary();
    const ppPriceDictionary =
        isExtrasPage || isGuestDetailsPage || isScreenExtraSmall
            ? SitecoreDictionary.GlobalsPriceLabelsPerPerson
            : SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom;
    const { touristTax, touristTaxPP, taxesAndFees } = getTouristTaxFieldsFromOffer(offer);

    return (
        <div className={`${className}-cell--alt`}>
            <div
                className={classNames(
                    isABTestingComponent
                        ? BasketDiagonalCellABStyles.priceLeftSeparator
                        : 'diagonal-cell-separator diagonal-cell-separator--m2m',
                )}
            />
            <div className={`${className}-cell__inner`} data-tid='basket-price'>
                <div className={classNames(`${className}-cell__inner-price`, { ['no-flex']: isExtrasPage })}>
                    <PriceLabel
                        tag='div'
                        className='basket__price'
                        price={
                            <BasketPriceCellPrice
                                amount={numTotalPrice}
                                integerPart={wholePartTotal}
                                fractionPart={fractionalPartTotal}
                                prevIntegerPart={prevWholePartTotal}
                                prevFractionPart={prevFractionalPartTotal}
                            />
                        }
                        priceDictionary={totalPriceDictionary}
                        wrapLabelBeforePrice={renderLabel}
                        wrapLabelAfterPrice={renderLabel}
                    />
                    {isPricePPShown && (
                        <PriceLabel
                            tag='div'
                            className='basket__price-pp'
                            price={
                                <BasketPriceCellPrice
                                    amount={numTotalPricePP}
                                    integerPart={wholePartPP}
                                    fractionPart={fractionalPartPP}
                                    prevIntegerPart={prevWholePartPP}
                                    prevFractionPart={prevFractionalPartPP}
                                />
                            }
                            priceDictionary={ppPriceDictionary}
                        />
                    )}
                </div>

                <div className={styles.touristTaxWrapper}>
                    <TouristTaxPriceTooltip touristTax={touristTax} taxesAndFees={taxesAndFees}>
                        {isHotelDetailsBookPage || isExtrasPage || isGuestDetailsPage || touristTax === 0 ? (
                            <TouristTaxPriceLabel
                                touristTax={touristTax}
                                touristTaxPP={touristTaxPP}
                                isPricePP={false}
                                price={addExtrasToPrice(totalPriceWithTouristTax)}
                                pricePP={totalPricePPWithTouristTax}
                            />
                        ) : (
                            Tokenizer.replaceToken(
                                getPhrase(SitecoreDictionary.TouristTaxLabelsIncludesLocalTax),
                                Tokens.Price,
                                getTouristTaxPrice(touristTax).toString(),
                            )
                        )}
                    </TouristTaxPriceTooltip>
                </div>

                <div className='basket__price-pills' data-tid='basket-price-cell-offers'>
                    {offersViewMode && (
                        <VisibleBasketOffers offer={offer} viewMode={offersViewMode} isPricePPShown={isPricePPShown} />
                    )}
                </div>
            </div>
            <div className={classNames(isABTestingComponent && BasketDiagonalCellABStyles.priceRightSeparator)} />
        </div>
    );
};

export default withRerender(observer(BasketPriceCell));
