import { FC } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import BookingAlterationDrawer from 'frontend/components/common/BookingAlterationDrawer/BookingAlterationDrawer';
import Drawer from 'frontend/components/common/Drawer';
import Popup from 'frontend/components/common/Popup/PopupNew';
import Tabs from 'frontend/components/common/Tabs/Tabs';
import ComparePriceFooter, {
    IComparePriceFooterProps,
} from 'frontend/components/renderings/ComparePriceModule/components/ComparePriceFooter/ComparePriceFooter';

import useComparePriceContent, {
    IComparePriceContentProps,
    IPopupProps,
    ITabsProps,
} from './ComparePriceContent.utils';

import styles from './ComparePriceContent.module.scss';

export const ComparePriceContent: FC<IComparePriceContentProps> = props => {
    const {
        isMobileView,
        popupProps,
        tabsProps,
        footerProps,
        isReviewPopupOpened,
        onReviewPopupApply,
        onReviewPopupClose,
        freeChildPlaceInfoTitle,
        freeChildPlaceInfoText,
        hideFreeChildPlaceInfoBox,
        newTotalPrice,
        fallback,
        alterationResults,
        backButtonText,
    } = useComparePriceContent(props);

    if (!props.selectedDate || !tabsProps) return null;

    const content = (
        <div className={styles.containerWrapper} data-tid='compare-price-content-wrapper'>
            <Tabs
                dataTid='popup-tabs'
                containerClass={classNames(styles.container, {
                    [styles.mobile]: isMobileView,
                    [styles.hidden]: !isMobileView && isReviewPopupOpened,
                })}
                tabsWrapperClass={styles.tabsWrapper}
                tabPanelClass={styles.tabContentWrapper}
                {...(tabsProps as ITabsProps)}
            />

            {onReviewPopupClose && onReviewPopupApply && isReviewPopupOpened && (
                <BookingAlterationDrawer
                    isOpen={isReviewPopupOpened}
                    onCancel={onReviewPopupClose}
                    onConfirm={onReviewPopupApply}
                    alterationResults={alterationResults ?? []}
                    hideInfoBlock={hideFreeChildPlaceInfoBox}
                    price={newTotalPrice}
                    selectedItemElement={undefined}
                    alterationChangingFromBoardTitle={props.fields?.ChangingFromBoardLabel}
                    alterationChangingFromRoomTitle={props.fields?.ChangingFromRoomLabel}
                    fallbackImage={fallback}
                    freeChildPlaceInfoText={freeChildPlaceInfoText}
                    freeChildPlaceInfoTitle={freeChildPlaceInfoTitle}
                    isRoomSelection={false}
                    subtitle={props.fields?.ReviewChangesSubTitle}
                    title={props.fields?.ReviewChangesTitle.value}
                    shouldTrack={false}
                    isInDrawer
                    isTotalPrice
                    backButtonText={backButtonText}
                    confirmButtonText={props.fields?.ApplyWithChangesButtonText.value}
                />
            )}

            <ComparePriceFooter {...(footerProps as IComparePriceFooterProps)} />
        </div>
    );

    if (isMobileView) {
        return createPortal(
            <Drawer open>{content}</Drawer>,
            document.getElementById('modal-portal-root') as HTMLDivElement,
        );
    }

    return <Popup {...(popupProps as IPopupProps)}>{() => content}</Popup>;
};

export default observer(ComparePriceContent);
