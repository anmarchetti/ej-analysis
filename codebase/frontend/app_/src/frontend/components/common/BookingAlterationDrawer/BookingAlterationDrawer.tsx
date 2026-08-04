import { FC, ReactElement, useEffect, useRef } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { isTradeStore } from 'frontend/store/tradePortal';
import { isPricePPShown, isRoomPricePPShown } from 'frontend/utils/offer.utils';
import { IBoardAndRoomAlterationKidsInfoFieldsProps } from 'models/data/IBoardAndRoomAlteration';
import { IBoardType, IRoomType } from 'models/data/IHotel';
import { IAltBoard, IUnit } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import Drawer from 'frontend/components/common/Drawer';
import InfoBlock from 'frontend/components/common/InfoBlock/InfoBlock';
import PriceLabel from 'frontend/components/common/PriceLabel/PriceLabel';
import IconChild from 'frontend/components/icons-new/Child';

import AlterationResults from './components/AlterationResults/AlterationResults';

import styles from './BookingAlterationDrawer.module.scss';

export interface IAlterationResultItem<T> {
    newItem: INewAlterationResultItem<T>;
    oldItemName: string;
    isKidsPlaceWilBeRemoved?: boolean;
    oldItemImgSrc?: string;
}

interface INewAlterationResultItem<T> {
    item: T;
    fallbackImg?: string;
    roomIdx?: number;
}

export interface IAltRoom {
    isFreeForKids: boolean;
    roomCode: string;
    roomType?: IRoomType;
}

export interface IAlterationResults {
    items: IAlterationResultItem<IUnit | IAltBoard | IBoardType | IAltRoom>[];
    isBoardAlteration?: boolean;
    subtitle?: ISitecoreField<string>;
    text?: ISitecoreField<string>;
    title?: ISitecoreField<string>;
}

export interface IBookingAlterationDrawerProps extends Partial<IBoardAndRoomAlterationKidsInfoFieldsProps> {
    alterationResults: IAlterationResults[];
    hideInfoBlock: boolean;
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    price: number;
    alterationChangingFromBoardTitle?: ISitecoreField<string>;
    alterationChangingFromRoomTitle?: ISitecoreField<string>;
    alterationChangingFromTitle?: ISitecoreField<string>;
    backButtonText?: string;
    confirmButtonText?: string;
    fallbackImage?: string;
    isInDrawer?: boolean;
    isRoomSelection?: boolean;
    isTotalPrice?: boolean;
    selectedItemElement?: JSX.Element;
    shouldTrack?: boolean;
    subtitle?: ISitecoreField<string>;
    title?: string;
}

const renderIcon = (): ReactElement => (
    <div className={styles.iconWrapper} data-tid='info-block-icon'>
        <IconChild />
    </div>
);

const BookingAlterationDrawer: FC<IBookingAlterationDrawerProps> = ({
    selectedItemElement,
    hideInfoBlock,
    fallbackImage,
    price,
    isRoomSelection,
    isOpen,
    subtitle,
    alterationChangingFromTitle,
    alterationChangingFromBoardTitle,
    alterationChangingFromRoomTitle,
    freeChildPlaceInfoTitle,
    freeChildPlaceInfoText,
    alterationResults,
    onCancel,
    onConfirm,
    shouldTrack = true,
    isInDrawer = false,
    isTotalPrice = false,
    backButtonText,
    title,
    confirmButtonText,
}) => {
    const { isPriceVisible, offer, formatMoney, getPhrase, trackBookingAlterationDrawerPageLoad } = useStore(
        (stores: TStores) => ({
            isPriceVisible: !isTradeStore(stores) || !stores.layoutStore.isPricesHidden,
            offer: stores.bookingStore.selectedOffer,
            formatMoney: stores.marketStore.formatMoney,
            getPhrase: stores.layoutStore.getPhrase,
            trackBookingAlterationDrawerPageLoad: stores.trackingStore.trackBookingAlterationDrawerPageLoad,
        }),
    );

    const drawerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isOpen && drawerRef.current) {
            drawerRef.current.scrollTo(0, 0);
        }

        shouldTrack && trackBookingAlterationDrawerPageLoad(isOpen);
    }, [isOpen, shouldTrack, trackBookingAlterationDrawerPageLoad]);

    const shouldShowPp = !isTotalPrice && (isRoomSelection ? isRoomPricePPShown(offer) : isPricePPShown(offer));
    const footerTitle = isTotalPrice
        ? getPhrase(SitecoreDictionary.PriceSummaryLabelsTotalPrice)
        : getPhrase(SitecoreDictionary.BookingAlterationsLabelsUpdateTo);

    const getChangeFromLabel = (isBoardAlteration: boolean): ISitecoreField<string> | undefined => {
        if (!alterationChangingFromBoardTitle || !alterationChangingFromRoomTitle) {
            return alterationChangingFromTitle;
        }

        if (isBoardAlteration) {
            return alterationChangingFromBoardTitle;
        }

        return alterationChangingFromRoomTitle;
    };

    const backBtnText = backButtonText ?? getPhrase(SitecoreDictionary.GlobalsButtonsCancel);
    const confirmBtnText = confirmButtonText ?? getPhrase(SitecoreDictionary.GlobalsButtonsConfirmChanges);

    return (
        <Drawer
            containerRef={drawerRef}
            isInDrawer={isInDrawer}
            open={isOpen}
            className={classNames('drawer--animation-bottom', styles.drawer)}
            dataTid='booking-alteration-drawer'
            aria-label={getPhrase(SitecoreDictionary.AccessibilityAriaLabelsReviewChanges)}
        >
            <div
                className={classNames(
                    'wrapper-component-container wrapper-component-container--grey',
                    styles.container,
                )}
            >
                <div className='wrapper-component-container__inner'>
                    <div className={styles.header} data-tid='alteration-header'>
                        <h2>{title ?? getPhrase(SitecoreDictionary.BookingAlterationsLabelsTitle)}</h2>
                        <Text field={subtitle} tag='p' />
                    </div>
                    <div className={styles.body} data-tid='alteration-body'>
                        {selectedItemElement}

                        {!hideInfoBlock && freeChildPlaceInfoText?.value && (
                            <div className={styles.infoBlock} data-tid='alteration-info-block'>
                                <InfoBlock
                                    title={freeChildPlaceInfoTitle}
                                    text={freeChildPlaceInfoText}
                                    className={styles.freeChildBlock}
                                    textClass={styles.freeChildDescription}
                                    renderIcon={renderIcon}
                                />
                            </div>
                        )}

                        {alterationResults.map((alterationResult, idx) => (
                            <AlterationResults
                                key={`drawer-alteration-result-${idx}`}
                                fallbackImage={fallbackImage || ''}
                                alterationResult={alterationResult}
                                alterationChangingFromTitle={getChangeFromLabel(!!alterationResult.isBoardAlteration)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className={classNames('wrapper-component-container', styles.footerContainer)}>
                <div className='wrapper-component-container__inner'>
                    <div className={styles.footer}>
                        <div className={styles.priceBlock}>
                            <span className={styles.footerTitle} data-tid='alteration-footer-title'>
                                {footerTitle}
                            </span>
                            {isPriceVisible && (
                                <PriceLabel
                                    tag='span'
                                    className={styles.price}
                                    dataTid='alteration-price'
                                    price={
                                        <>
                                            {formatMoney(price, {
                                                currency: offer?.currency?.code,
                                                maximumFractionDigits: 0,
                                                signDisplay: isTotalPrice ? undefined : SignDisplay.ExceptZero,
                                            })}
                                        </>
                                    }
                                    priceDictionary={
                                        shouldShowPp ? SitecoreDictionary.GlobalsPriceLabelsPerPerson : undefined
                                    }
                                />
                            )}
                        </div>
                        <div className={styles.footerButtons}>
                            <Button
                                isLarge
                                isText
                                dataTid='alteration-cancel-btn'
                                onClick={onCancel}
                                className={styles.cancelButton}
                                aria-label={backBtnText}
                            >
                                {backBtnText}
                            </Button>
                            <Button
                                isLarge
                                dataTid='alteration-confirm-btn'
                                onClick={onConfirm}
                                className={styles.applyButton}
                                aria-label={confirmBtnText}
                            >
                                {confirmBtnText}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default observer(BookingAlterationDrawer);
