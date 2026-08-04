import * as React from 'react';
import { FC, useEffect, useRef } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import isBackend from 'frontend/utils/isBackend';
import { getImageUrl } from 'frontend/utils/url.utils';
import { IBoardType } from 'models/data/IHotel';
import { IAltBoard } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import BoardCardSkeleton from 'frontend/components/common/BoardCardSkeleton/BoardCardSkeleton';
import DiscountedBoardPercentagePill from 'frontend/components/common/Pills/DiscountedBoardPill/DiscountedBoardPercentagePill';
import FreeBoardUpgradePill from 'frontend/components/common/Pills/FreeBoardUpgradePill/FreeBoardUpgradePill';
import FreeForKidsPill from 'frontend/components/common/Pills/FreeForKidsPill/FreeForKidsPill';
import AmendBoardSkeleton from 'frontend/components/renderings/AmendRoomAndBoardPopup/components/AmendBoardSkeleton/AmendBoardSkeleton';
import { useRoomAndBoardLocalStore } from 'frontend/components/renderings/AmendRoomAndBoardPopup/store/createRoomAndBoardLocalStore/createRoomAndBoardLocalStore';

import styles from './BoardCard.module.scss';

export interface IBoardCardProps {
    board: IAltBoard | IBoardType;
    isSelected: boolean;
    isSpoiler: boolean;
    children?: any;
    countryCode?: string;
    freeChildPlaceTooltip?: string;
    infoBlock?: JSX.Element;
    isAlteration?: boolean;
    isPostBooking?: boolean;
    itemId?: string;
    onDeleteBoard?: (id: string) => void;
    onUpdateBoard?: (id: string) => void;
}

export const BoardCard: FC<IBoardCardProps> = ({
    isSelected,
    isSpoiler,
    board,
    itemId,
    children,
    infoBlock,
    onUpdateBoard,
    onDeleteBoard,
    isPostBooking,
    countryCode,
    freeChildPlaceTooltip,
    isAlteration,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const { isEditMode, isScreenMedium, isLoadingOffer, getPhrase, selectedOffer } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        isEditMode: stores.layoutStore.isEditMode,
        isLoadingOffer: stores.bookingStore.isLoadingOffer,
        selectedOffer: stores.bookingStore.selectedOffer,
        getPhrase: stores.layoutStore.getPhrase,
    }));
    const { offersRequest } = useRoomAndBoardLocalStore() ?? {};

    const isLoading = isLoadingOffer || offersRequest?.isPending;

    useEffect(() => {
        if (!isEditMode) {
            return;
        }

        const updateBoard = (): void => {
            itemId && onUpdateBoard?.(itemId);
        };

        const deleteBoard = (): void => {
            const shouldDelete = confirm('Are you sure you want to delete this board?');

            if (!shouldDelete) {
                return;
            }

            itemId && onDeleteBoard?.(itemId);
        };

        // addEventListener so it can work in EE, but add only once
        if (cardRef.current && !isBackend()) {
            cardRef.current
                .querySelectorAll('.update-board-btn')
                .forEach(item => item.addEventListener('click', updateBoard));
            cardRef.current
                .querySelectorAll('.delete-board-btn')
                .forEach(item => item.addEventListener('click', deleteBoard));
        }

        return () => {
            if (isEditMode && cardRef.current) {
                cardRef.current
                    .querySelectorAll('.update-board-btn')
                    .forEach(item => item.removeEventListener('click', updateBoard));
                cardRef.current
                    .querySelectorAll('.delete-board-btn')
                    .forEach(item => item.removeEventListener('click', deleteBoard));
            }
        };
    }, [isEditMode]);

    if (isLoading) {
        if (isPostBooking) return <AmendBoardSkeleton />;

        if (isScreenMedium) return <BoardCardSkeleton isSelected={isSelected} isSpoiler={isSpoiler} />;
    }

    const titleClassName = classNames(styles.title, (!!board.content?.length || !isSelected) && styles.lineSeparator);
    const cardClassName = classNames(styles.card, {
        [styles.alteration]: isAlteration,
        [styles.current]: isSelected,
        [styles.spoiler]: isSpoiler,
    });
    const isRenderFreeChildPlacesPill = !!board.isFreeForKids && !!countryCode && isPostBooking;
    const boardDiscountPercent =
        board.discountPercent || selectedOffer?.accom?.unit.find(u => u.board === board.code)?.boardDiscountPercentage;

    return (
        <div
            ref={cardRef}
            className={cardClassName}
            data-tid='board-card'
            data-item-accomcode={board.code}
            {...(isSelected && { 'data-item-selection': 'selected' })}
            {...(isSpoiler && { 'data-item-spoiler': 'spoiler' })}
        >
            <div className={styles.container}>
                <div className={titleClassName} data-tid='board-card-title'>
                    <div className={styles.titleMeta} data-tid='board-card-title-meta'>
                        {board.iconUrl && (
                            <div
                                className={styles.icon}
                                style={{
                                    backgroundImage: `url(${
                                        // itemId is set only for Browse state
                                        itemId ? board.iconUrl : getImageUrl(board.iconUrl)
                                    })`,
                                }}
                            />
                        )}
                        {board.title || board.code}
                    </div>

                    <div className={styles.pillsWrapper}>
                        {!!isRenderFreeChildPlacesPill && (
                            <FreeForKidsPill tooltipMessage={freeChildPlaceTooltip} countryCode={countryCode} />
                        )}
                        <FreeBoardUpgradePill isFreeBoardUpgrade={!!board.isFreeBoardUpgrade && !isPostBooking} />
                        <DiscountedBoardPercentagePill percent={boardDiscountPercent} />
                    </div>
                </div>
                <div className={styles.contentWrapper}>
                    <div className={styles.infoContainer}>
                        {!!board.content?.length && isSelected && (
                            <div className={styles.selectedLabel} data-tid='board-card-content-subtitle'>
                                {getPhrase(SitecoreDictionary.BoardTypesLabelsIncludedInHoliday)}
                            </div>
                        )}
                        {!!board.content?.length && (
                            <div className={styles.content}>
                                <div dangerouslySetInnerHTML={{ __html: board.content }} />
                            </div>
                        )}
                    </div>
                    {!!children && <div className={styles.childrenContainer}>{children}</div>}
                    {isEditMode && (
                        <div className='d-flex justify-content-end' data-tid='board-type-item-edit-actions'>
                            <div className='mx-2'>
                                <button className='btn update-board-btn mb-3'>Update</button>
                            </div>
                            <div className='mx-2'>
                                <button className='btn delete-board-btn mb-3'>Remove</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {infoBlock}
        </div>
    );
};

export default observer(BoardCard);
