import React, { FC } from 'react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import ViewAltOptionsButton from 'frontend/components/renderings/SearchResults/components/ViewAltOptionsButton/ViewAltOptionsButton';

export interface IViewAltBoardsPopupCTAProps {
    offer: IOffer;
    isOfferCardsABTesting?: boolean;
}

export const ViewAltBoardsPopupCTA: FC<IViewAltBoardsPopupCTAProps> = ({ offer, isOfferCardsABTesting }) => {
    const { trackOpenBoardsPopup, getPhrase, loadOffersAlterations, setActiveOfferId } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackOpenBoardsPopup: stores.trackingStore.trackOpenBoardsPopup,
        loadOffersAlterations: stores.bookingStore.loadOffersAlterations,
        setActiveOfferId: stores.hotelsStore.setActiveOfferId,
    }));

    // show alternative boards only when we have at least one option
    if (!offer.accom.unit[0]?.boardType || !offer.altBoards.length) {
        return null;
    }

    const allBoardsLength = offer.altBoards.length + 1;
    const viewButtonCta = Tokenizer.replaceToken(
        getPhrase(SitecoreDictionary.BoardTypesLabelsSeeBoardsOptions),
        Tokens.Number,
        allBoardsLength.toString(),
    );

    const onOpen = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
        e.preventDefault?.();
        setActiveOfferId(offer.id);
        loadOffersAlterations(offer);
        trackOpenBoardsPopup(offer, viewButtonCta);
    };

    return (
        <a href='#' onClick={onOpen} className='alternative-boards-link'>
            <ViewAltOptionsButton isOfferCardsABTesting={isOfferCardsABTesting}>
                <span>{viewButtonCta}</span>
            </ViewAltOptionsButton>
        </a>
    );
};

export default ViewAltBoardsPopupCTA;
