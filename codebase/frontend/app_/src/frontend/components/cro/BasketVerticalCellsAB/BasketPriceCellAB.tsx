import React, { FC, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import usePrevious from 'frontend/hooks/usePrevious';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IOffer, IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import BasketPriceCellPrice from 'frontend/components/renderings/Basket/components/BasketPriceCellPrice/BasketPriceCellPrice';

import styles from './BasketVerticalCellsAB.module.scss';
export interface IBasketPriceCellProps {
    className: string;
    isNextButtonVisible: boolean;
    isPricePPShown: boolean;
    offer: IOffer | IOfferWithoutAltBoards;
    isABTestingComponent?: boolean;
}

export const BasketPriceCell: FC<IBasketPriceCellProps> = ({ isNextButtonVisible, isPricePPShown, className }) => {
    const { isHotelDetailsBookPage, totalPriceForExtras, totalPrice, totalPricePPForExtras, totalPricePP } = useStore(
        (stores: TStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
            totalPriceForExtras: stores.bookingStore.totalPriceForExtras,
            totalPrice: stores.bookingStore.totalPrice,
            totalPricePPForExtras: stores.bookingStore.totalPricePPForExtras,
            totalPricePP: stores.bookingStore.totalPricePP,
        }),
    );

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

    const ppPriceDictionary = isNextButtonVisible
        ? SitecoreDictionary.GlobalsPriceLabelsPerPersonFrom
        : SitecoreDictionary.GlobalsPriceLabelsPerPersonSubtextAB;

    return (
        <div className={`${className}-cell--alt`}>
            <div
                className={classNames(
                    `${className}-cell__inner`,
                    isNextButtonVisible ? styles.innerBlock : styles.innerInline,
                )}
                data-tid='basket-price-wrapper'
            >
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
                    dataTid={'basket-price'}
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
                        dataTid={'basket-pp-price'}
                    />
                )}
            </div>
            <div className={classNames(`${className}-cell-separator`, `${className}-cell-separator--m2a`)} />
        </div>
    );
};

export default observer(BasketPriceCell);
