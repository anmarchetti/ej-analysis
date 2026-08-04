import React, { ReactNode } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { containsLuxuryPromoCode } from 'frontend/utils/offer.utils';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import StartBookingButton from 'frontend/components/common/StartBookingButton';

import BasketFirstCell from './BasketFirstCell';
import BasketPriceCell from './BasketPriceCell';
import BasketSecondCell from './BasketSecondCell';
import BasketThirdCell from './BasketThirdCell';

interface IBasketDiagonalCellsProps {
    board: Nullable<IBoardType>;
    className: string;
    isNextButtonVisible: boolean;
    isPricePPShown: boolean;
    isPriceVisible: boolean;
    offer: IOfferWithoutAltBoards;
    room: Nullable<IRoomType>;
    totalPricePP: number;
    children?: ReactNode | null;
}

export const BasketDiagonalCells = (props: IBasketDiagonalCellsProps) => {
    const { getPhrase } = useStore((stores: TStores | ITradePortalStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className='basket-cells diagonal-cells'>
            {props.children || (
                <>
                    <BasketFirstCell {...props} />
                    <div className='diagonal-cell-separator diagonal-cell-separator--m2m' />
                    <BasketSecondCell {...props} />
                    <div className='diagonal-cell-separator diagonal-cell-separator--m2m' />
                    <BasketThirdCell {...props} />
                </>
            )}
            {props.isPriceVisible && <BasketPriceCell {...props} />}
            {props.isNextButtonVisible && (
                <div className='diagonal-cell--btn'>
                    <StartBookingButton
                        render={onClick => (
                            <Button
                                id='book-button-basket'
                                className='book-btn-basket'
                                isMd
                                onClick={onClick}
                                isBlackColor={containsLuxuryPromoCode(props.offer.promoCollections)}
                            >
                                {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                            </Button>
                        )}
                    />
                </div>
            )}
        </div>
    );
};

export default BasketDiagonalCells;
