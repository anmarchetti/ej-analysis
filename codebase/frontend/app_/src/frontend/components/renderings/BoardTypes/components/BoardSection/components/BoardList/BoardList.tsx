import { Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { getPriceDifferenceForBoard, isPricePPShown } from 'frontend/utils/offer.utils';
import {
    IBoardAndRoomAlterationInfoFieldsProps,
    IBoardAndRoomAlterationKidsInfoFieldsProps,
} from 'models/data/IBoardAndRoomAlteration';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard, IOfferWithoutAltBoards, IUnit, TAllBoards } from 'models/data/IOffer';
import { BoardTypeActionButtonType } from 'models/enum/BoardTypeActionButtonType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import AlertBanner from 'frontend/components/common/AlertBanner/AlertBanner';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import { getFormattedPriceLabel } from 'frontend/components/common/Room/RoomCard/components/RoomCardAction/RoomCardAction.utils';
import BoardCard from 'frontend/components/renderings/BoardTypes/components/BoardCard/BoardCard';
import { getNewAlternativeRooms } from 'frontend/components/renderings/BoardTypes/components/BoardSection/BoardSection.utils';
import BoardTypeActionButton from 'frontend/components/renderings/BoardTypes/components/BoardTypeActionButton/BoardTypeActionButton';
import SelectBoardTypeError from 'frontend/components/renderings/BoardTypes/components/SelectBoardTypeError/SelectBoardTypeError';

import styles from './BoardList.module.scss';

export interface IBoardListProps
    extends IBoardAndRoomAlterationKidsInfoFieldsProps,
        Pick<IBoardAndRoomAlterationInfoFieldsProps, 'alterationInfoTitle' | 'alterationInfoText'> {
    alternativeBoardsCount: number;
    isCollapsed: boolean;
    isMostExpensiveBoardSelected: boolean;
    items: TAllBoards;
    offer: Nullable<IOfferWithoutAltBoards>;
    onChangeBoard: (boardType: IAltBoard | IBoardType, priceDiff: number) => Promise<void>;
    selectedRooms: IUnit[];
    altTitleField?: ISitecoreField<string>;
    countryCode?: string;
    fallbackImage?: string;
    freeChildPlaceTooltip?: string;
    isPostBooking?: boolean;
    onDeleteBoard?: (id: string) => void;
    onUpdateBoard?: (id: string) => void;
    selectedBoardTypeCode?: string;
}

const BoardList = ({
    items,
    alterationInfoTitle,
    alterationInfoText,
    freeChildPlaceInfoTitle,
    freeChildPlaceInfoText,
    altTitleField,
    offer,
    isMostExpensiveBoardSelected,
    isCollapsed,
    selectedRooms,
    onChangeBoard,
    onUpdateBoard,
    onDeleteBoard,
    selectedBoardTypeCode,
    fallbackImage,
    alternativeBoardsCount,
    isPostBooking,
    freeChildPlaceTooltip,
    countryCode,
}: IBoardListProps) => {
    const {
        isScreenMedium,
        boardCodeError,
        allAlternativeRooms,
        isPriceVisible,
        isLoadingOffer,
        formatMoney,
        getPhrase,
        notValidatedOfferPrice,
        isExtrasPage,
    } = useStore((stores: TStores) => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        notValidatedOfferPrice: stores.bookingStore.notValidatedOfferPrice,
        boardCodeError: stores.bookingStore.boardCodeError,
        allAlternativeRooms: stores.bookingStore.allAlternativeRooms,
        isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
        isLoadingOffer: stores.bookingStore.isLoadingOffer,
        formatMoney: stores.marketStore.formatMoney,
        getPhrase: stores.layoutStore.getPhrase,
        isExtrasPage: stores.layoutStore.isExtrasPage,
    }));
    const prevPrice = (isExtrasPage ? notValidatedOfferPrice : offer?.price) ?? 0;

    return (
        <>
            {items.map((el, idx) => {
                const isSpoiler =
                    isCollapsed &&
                    // when the list of boards is collapsed and more than one alternative board is available - the last board card is displayed as a spoiler
                    // or when the most expensive board is selected - the board card following it is displayed as a spoiler
                    idx === items.length - 1 &&
                    (isMostExpensiveBoardSelected ? idx === 1 : idx > 1);

                const newAlternativeRooms = getNewAlternativeRooms(
                    el,
                    selectedRooms,
                    allAlternativeRooms,
                    fallbackImage,
                );

                const isKidsPlaceWilBeRemoved = newAlternativeRooms?.some(el => el.isKidsPlaceWilBeRemoved);

                const priceDifference = offer
                    ? getPriceDifferenceForBoard({
                          isSelected: selectedBoardTypeCode === el.code,
                          isPostBooking: !!isPostBooking,
                          offer,
                          alternativeBoard: el,
                          prevPrice: Math.ceil(prevPrice),
                      })
                    : 0;

                const formattedPrice = formatMoney(priceDifference, {
                    currency: offer?.currency?.code,
                    maximumFractionDigits: 0,
                    signDisplay: SignDisplay.ExceptZero,
                });

                return (
                    <div
                        key={idx}
                        className={classNames(isSpoiler && styles.spoilerBox)}
                        data-tid={`board-item-${idx}`}
                    >
                        {!!altTitleField?.value && idx === 1 && (
                            <h3 className={styles.boardsSubtitle} data-tid='boards-subtitle'>
                                {alternativeBoardsCount}&nbsp;
                                <Text field={altTitleField} tag='span' />
                            </h3>
                        )}
                        <BoardCard
                            board={el}
                            isSelected={!!offer && selectedBoardTypeCode === el.code}
                            // on holiday details page showing small part of second alternative board
                            isSpoiler={isSpoiler}
                            onUpdateBoard={onUpdateBoard}
                            onDeleteBoard={onDeleteBoard}
                            itemId={el.itemId}
                            isPostBooking={isPostBooking}
                            freeChildPlaceTooltip={freeChildPlaceTooltip}
                            countryCode={countryCode}
                            // display the info alert when this board needs room change
                            infoBlock={
                                !!newAlternativeRooms?.length ? (
                                    <>
                                        <div className={styles.boardCardAlert}>
                                            <AlertBanner
                                                dataTid='alteration-info-banner'
                                                title={alterationInfoTitle?.value}
                                                description={alterationInfoText?.value}
                                                collapsible={!isScreenMedium}
                                                isInline
                                            />
                                        </div>
                                        {isKidsPlaceWilBeRemoved && (
                                            <div className={styles.boardCardAlert}>
                                                <AlertBanner
                                                    dataTid='free-child-place-info-banner'
                                                    title={freeChildPlaceInfoTitle?.value}
                                                    description={freeChildPlaceInfoText?.value}
                                                    collapsible={!isScreenMedium}
                                                    isInline
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : undefined
                            }
                        >
                            {!!offer &&
                                (selectedBoardTypeCode === el.code ? (
                                    <BoardTypeActionButton buttonType={BoardTypeActionButtonType.Selected} />
                                ) : (
                                    <BoardTypeActionButton
                                        buttonType={
                                            isPostBooking
                                                ? BoardTypeActionButtonType.PricePB
                                                : BoardTypeActionButtonType.Price
                                        }
                                        onClick={() => onChangeBoard(el, priceDifference)}
                                        isLoading={isLoadingOffer}
                                        {...(isSpoiler && { tabIndex: -1 })}
                                    >
                                        {isPriceVisible ? (
                                            <PriceLabel
                                                tag='span'
                                                className='board-type__price'
                                                price={
                                                    isPostBooking ? (
                                                        <div>
                                                            <span className={styles.price}>
                                                                {getFormattedPriceLabel(
                                                                    formattedPrice,
                                                                    priceDifference,
                                                                )}
                                                            </span>
                                                            <span className={styles.priceLabel}>
                                                                {getPhrase(SitecoreDictionary.PriceSummaryLabelsTotal)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        formattedPrice
                                                    )
                                                }
                                                priceDictionary={
                                                    isPricePPShown(offer)
                                                        ? SitecoreDictionary.GlobalsPriceLabelsPerPerson
                                                        : undefined
                                                }
                                            />
                                        ) : (
                                            <>{getPhrase(SitecoreDictionary.BoardTypesLabelsSelect)}</>
                                        )}
                                    </BoardTypeActionButton>
                                ))}
                        </BoardCard>
                        {!isSpoiler && boardCodeError === el.code && (
                            <SelectBoardTypeError
                                errorMessage={getPhrase(SitecoreDictionary.BoardTypesErrorMessagesSelectBoardType)}
                            />
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default observer(BoardList);
