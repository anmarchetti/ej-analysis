import React, { FunctionComponent, ReactNode, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IOfferWithoutAltBoards } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories } from 'models/enum/tracking/GenericEventParams';
import Button from 'frontend/components/common/Button';
import StartBookingButton from 'frontend/components/common/StartBookingButton';
import BasketFirstCell from 'frontend/components/renderings/Basket/components/BasketFirstCell';
import BasketPriceCell from 'frontend/components/renderings/Basket/components/BasketPriceCell';
import BasketSecondCell from 'frontend/components/renderings/Basket/components/BasketSecondCell';
import BasketThirdCell from 'frontend/components/renderings/Basket/components/BasketThirdCell';

import BasketFourthCell from './BasketFourthCell';
import BasketPopup from './BasketPopup';

import styles from './BasketDiagonalCellsAB.module.scss';

export interface IBasketDiagonalCellsProps {
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

export const BasketDiagonalCellsAB: FunctionComponent<IBasketDiagonalCellsProps> = props => {
    const { getPhrase, trackEventWithParams } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackEventWithParams: stores.trackingStore.trackEventWithParams,
    }));

    const [isOpenDetailsPopup, setIsOpenDetailsPopup] = useState<boolean>(false);

    const onClosePopup = () => {
        setIsOpenDetailsPopup(false);
        trackEventWithParams(EventTypes.GenericEvent, {
            eventCategory: EventCategories.SummaryBar,
            eventAction: EventActions.MoreDetails,
            eventLabel: 'Show less details clicked',
            eventType: EventTypes.Interaction,
            eventValue: null,
        });
    };

    const onOpenPopup = () => {
        setIsOpenDetailsPopup(true);
        trackEventWithParams(EventTypes.GenericEvent, {
            eventCategory: EventCategories.SummaryBar,
            eventAction: EventActions.CTAClicked,
            eventLabel: 'Show more details',
            eventType: EventTypes.Interaction,
            eventValue: null,
        });
    };

    return (
        <React.Fragment>
            <div className='basket-cells diagonal-cells'>
                {props.children || (
                    <div className={styles.wrapper}>
                        <BasketSecondCell {...props} isABTestingComponent />
                        <div
                            className={classNames(
                                'diagonal-cell-separator diagonal-cell-separator--m2m',
                                styles.tabletSeparator,
                                styles.separator,
                            )}
                        />
                        <BasketFirstCell {...props} isABTestingComponent />
                        <div
                            className={classNames(
                                'diagonal-cell-separator diagonal-cell-separator--m2m',
                                styles.hiddenSeparator,
                                styles.separator,
                            )}
                        />
                        <BasketThirdCell {...props} isABTestingComponent />
                        <div
                            className={classNames(
                                'diagonal-cell-separator diagonal-cell-separator--m2m',
                                styles.hiddenSeparator,
                                styles.separator,
                            )}
                        />
                        <BasketFourthCell {...props} onOpenPopup={onOpenPopup} />
                    </div>
                )}
                {props.isPriceVisible && <BasketPriceCell {...props} isABTestingComponent />}
                {props.isNextButtonVisible && (
                    <div className='diagonal-cell--btn ms-2'>
                        <StartBookingButton
                            render={onClick => (
                                <Button id='book-button-basket' isMd onClick={onClick} className='continue-button'>
                                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                                </Button>
                            )}
                        />
                    </div>
                )}
            </div>

            {isOpenDetailsPopup && (
                <BasketPopup
                    board={props.board}
                    offer={props.offer}
                    onClosePopup={onClosePopup}
                    className={props.className}
                    isNextButtonVisible={props.isNextButtonVisible}
                    isPricePPShown={props.isPricePPShown}
                />
            )}
        </React.Fragment>
    );
};

export default BasketDiagonalCellsAB;
