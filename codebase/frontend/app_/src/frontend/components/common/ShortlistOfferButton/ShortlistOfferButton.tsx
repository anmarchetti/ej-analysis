import React, { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isShortlistedOfferUnavailableForBooking } from 'frontend/utils/shortlist.utils';
import { IOffer } from 'models/data/IOffer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import OfferButton from 'frontend/components/common/OfferButton/OfferButton';

export interface IShortlistOfferButtonProps {
    link: string;
    offer: IOffer;
    onClick: () => void;
    asLink?: string;
    className?: string;
    isLivePrice?: boolean;
}

const ShortlistOfferButton: FC<IShortlistOfferButtonProps> = ({
    offer,
    link,
    isLivePrice,
    onClick,
    className,
    asLink,
}) => {
    const { getPhrase, isOfferFromAnotherMarket, setNeedOpenWhenField } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        isOfferFromAnotherMarket: stores.shortlistStore.isOfferFromAnotherMarket,
        setNeedOpenWhenField: stores.searchStore.setNeedOpenWhenField,
    }));

    const isShortlistOfferUnavailable = useMemo(() => isShortlistedOfferUnavailableForBooking(offer), [offer]);

    const label = useMemo(() => {
        const phrase = isShortlistOfferUnavailable
            ? SitecoreDictionary.ShortlistButtonsCheckAvailability
            : SitecoreDictionary.ShortlistButtonsViewHoliday;

        return getPhrase(phrase);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onClickOnOfferFormAnotherMarket = (): void => {
        // does not work currently, waiting requirements INS-804
        if (isLivePrice) {
            setNeedOpenWhenField(true);
        }

        onClick();
    };

    const onOfferClick = (): void => {
        if (isShortlistOfferUnavailable) {
            setNeedOpenWhenField(true);
        }

        onClick();
    };

    // on shortlist, we have popup to change market
    if (isOfferFromAnotherMarket(offer)) {
        return (
            <Button
                onClick={onClickOnOfferFormAnotherMarket}
                isWide
                dataTid='view-holiday-button'
                className={className}
            >
                {label}
            </Button>
        );
    }

    return <OfferButton link={link} onClick={onOfferClick} label={label} className={className} asLink={asLink} />;
};
export default observer(ShortlistOfferButton);
