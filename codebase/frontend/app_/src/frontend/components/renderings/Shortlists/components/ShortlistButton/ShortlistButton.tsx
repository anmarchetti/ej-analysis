import React, { ReactElement, useEffect, useState } from 'react';
import classNames from 'classnames';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import { useMoreThenDesktopViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { getOfferAccomCode } from 'frontend/utils/shortlist.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import { ShortlistType } from 'models/enum/ShortlistType';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from 'frontend/components/common/Tooltip';
import SvgHeart from 'frontend/components/icons/Heart';

import styles from './ShortlistButton.module.scss';

export interface IShortlistButtonProps {
    offer: IOffer;
}

const ShortlistButton = ({ offer }: IShortlistButtonProps): ReactElement | null => {
    const {
        getPhrase,
        recentShortlistedItem,
        resetRecentShortlistedItem,
        onAddToShortlist,
        onRemoveItemFromShortlist,
        isHotelPreview,
    } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        recentShortlistedItem: stores.shortlistStore.recentShortlistedItem,
        resetRecentShortlistedItem: stores.shortlistStore.resetRecentShortlistedItem,
        onAddToShortlist: stores.shortlistStore.onAddToShortlist,
        onRemoveItemFromShortlist: stores.shortlistStore.onRemoveItemFromShortlist,
        isHotelPreview: stores.layoutStore.isHotelDetailsBrowsePagePreview,
    }));

    const isDesktop = useMoreThenDesktopViewport();

    const [shortListId, setShortListId] = useState<string | undefined>(offer.shortlist?.id);

    const tooltipId = `${offer.hotel?.name?.replace(/[^A-Za-z0-9]/g, '')}_${offer.id ?? shortListId}`;

    const ariaLabel = Tokenizer.replaceToken(
        getPhrase(
            shortListId
                ? SitecoreDictionary.ShortlistButtonsRemoveFromShortlist
                : SitecoreDictionary.ShortlistButtonsAddToShortlist,
        ),
        Tokens.Name,
        offer.hotel?.name || getPhrase(SitecoreDictionary.GlobalsLabelsHoliday),
    );

    const onShortlistClick = () => {
        const candidate: IOffer = toJS({
            ...offer,
            shortlist: {
                id: shortListId,
                type: offer.shortlist?.type || ShortlistType.Offer,
                marketCode: offer.shortlist?.marketCode,
                language: offer.shortlist?.language,
            },
        });
        shortListId ? onRemoveItemFromShortlist(candidate) : onAddToShortlist(candidate);
    };

    useEffect(() => {
        setShortListId(offer.shortlist?.id);
    }, [offer]);

    useEffect(() => {
        // Update shortListId if current item was recently removed or added to shortlist
        if (
            recentShortlistedItem &&
            recentShortlistedItem.shortListId !== shortListId &&
            (offer.shortlist?.type === ShortlistType.Hotel
                ? recentShortlistedItem.accomCode === getOfferAccomCode(offer)
                : recentShortlistedItem.packageId === offer.accom?.packageId)
        ) {
            setShortListId(recentShortlistedItem.shortListId);
            resetRecentShortlistedItem();
        }
    }, [recentShortlistedItem, offer, shortListId]);

    if (isHotelPreview) return null;

    const btn = (
        <Button
            isText
            onClick={onShortlistClick}
            aria-label={ariaLabel}
            data-tid='shortlist-heart-button'
            id={tooltipId}
            className={styles.button}
        >
            <SvgHeart className={classNames(styles.icon, { [styles.active]: shortListId })} />
        </Button>
    );

    return (
        <div className='hotel-card-head-bookmark'>
            {isDesktop ? (
                <Tooltip>
                    <TooltipTrigger>{btn}</TooltipTrigger>

                    <TooltipContent
                        text={
                            shortListId
                                ? getPhrase(SitecoreDictionary.SearchResultsLabelsRemoveFromShortlist)
                                : getPhrase(SitecoreDictionary.SearchResultsLabelsAddToShortlist)
                        }
                        className={classNames(styles.contentWrapper, styles.priority)}
                    />
                </Tooltip>
            ) : (
                btn
            )}
        </div>
    );
};

export default observer(ShortlistButton);
