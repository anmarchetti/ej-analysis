import * as React from 'react';
import { FunctionComponent } from 'react';
import { observer } from 'mobx-react';

import { useTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isTradeStore } from 'frontend/store/tradePortal';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import ShortlistRemovePopup from 'frontend/components/renderings/Shortlists/components/ShortlistRemovePopup';

import BookingInShortlistPopup from './BookingInShortlistPopup';

const ShortlistManaging: FunctionComponent = () => {
    const {
        getPhrase,
        isShowBookingInShortlistPopup,
        isRemovePopupShown,
        candidateToRemove,
        toggleRemovePopup,
        removeCandidateFromShortlist,
        setCandidateToRemove,
        isShortlistAdding,
        isShortlistEnabled,
        isTradePortal,
    } = useStore((stores: IHolidaysStores) => {
        if (isTradeStore(stores)) {
            return {};
        }

        return {
            getPhrase: stores.layoutStore.getPhrase,
            isShowBookingInShortlistPopup: stores.shortlistStore.isShowBookingInShortlistPopup,
            isRemovePopupShown: stores.shortlistStore.isRemovePopupShown,
            candidateToRemove: stores.shortlistStore.candidate,
            toggleRemovePopup: stores.shortlistStore.toggleRemovePopup,
            removeCandidateFromShortlist: stores.shortlistStore.removeCandidateFromShortlist,
            setCandidateToRemove: stores.shortlistStore.setCandidate,
            isShortlistAdding: stores.shortlistStore.isShortlistAdding,
            isShortlistEnabled: stores.shortlistStore.isShortlistEnabled,
            isTradePortal: stores.layoutStore.isTradePortal,
        };
    });

    const isTablet = useTabletViewport();

    if (!isShortlistEnabled || isTradePortal) {
        return null;
    }

    const onRemove = (): void => {
        removeCandidateFromShortlist();
    };

    const closeRemovingPopup = (): void => {
        setCandidateToRemove();
        toggleRemovePopup(false);
    };

    return (
        <>
            {/*we control showing BookingInShortlistPopup on tablet in Shortlist manager and on bigger screen in ShortlistLink because popup has different css parent element */}
            {isShowBookingInShortlistPopup && isTablet && <BookingInShortlistPopup />}

            {isRemovePopupShown && candidateToRemove && (
                <ShortlistRemovePopup offers={[candidateToRemove]} onClose={closeRemovingPopup} onRemove={onRemove} />
            )}

            {isShortlistAdding && (
                <OverlaySpinner header={getPhrase(SitecoreDictionary.ShortlistLabelsAddToShortlistLoading)} />
            )}
        </>
    );
};

export default observer(ShortlistManaging);
