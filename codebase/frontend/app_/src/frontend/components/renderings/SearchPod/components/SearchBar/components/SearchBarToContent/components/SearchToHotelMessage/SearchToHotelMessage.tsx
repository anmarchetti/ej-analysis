import React, { FC, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SearchBarInputCallout from 'frontend/components/common/SearchBarInputCallout/SearchBarInputCallout';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

interface ISearchToHotelMessageProps {
    onApplySearchToHotel: () => void;
    onClose: () => void;
}

export const SearchToHotelMessage: FC<ISearchToHotelMessageProps> = ({ onClose, onApplySearchToHotel }) => {
    const { hotel, selectHotelBookAsDestination } = useStore(stores => ({
        hotel: stores.bookingStore.hotel,
        selectHotelBookAsDestination: stores.searchStore.selectHotelBookAsDestination,
    }));

    const calloutRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent): void => {
            const target = event.target;
            const calloutEl = calloutRef?.current;

            // If click is inside the callout, then set search to current hotel book.
            if (calloutEl && target && (target === calloutEl || calloutEl.contains(target as Node))) {
                selectHotelBookAsDestination();
                onApplySearchToHotel();
            } else {
                // outside click should close the callout
                onClose();
            }
        };

        document.addEventListener('mousedown', handleDocumentClick);

        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, []);

    const { fields: { SearchToHotelMessageTitle, SearchToHotelMessageText, SearchToHotelMessageIcon } = {} } =
        useSearchPodStore();

    if (!hotel) {
        return null;
    }

    return (
        <SearchBarInputCallout
            ref={calloutRef}
            title={Tokenizer.replaceToken(getFieldValue(SearchToHotelMessageTitle), Tokens.HotelName, hotel.name || '')}
            text={getFieldValue(SearchToHotelMessageText)}
            icon={
                SearchToHotelMessageIcon?.value.src ? (
                    <span
                        className='icon--bg-image'
                        style={{ backgroundImage: `url(${cmsUrls.media(SearchToHotelMessageIcon.value.src)})` }}
                    />
                ) : undefined
            }
        />
    );
};

export default observer(SearchToHotelMessage);
