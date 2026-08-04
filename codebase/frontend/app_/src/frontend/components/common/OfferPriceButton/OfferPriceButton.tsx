import React, { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IOffer } from 'models/data/IOffer';
import OfferButton from 'frontend/components/common/OfferButton/OfferButton';
import ShortlistOfferButton from 'frontend/components/common/ShortlistOfferButton/ShortlistOfferButton';

export interface IOfferPriceButtonProps {
    link: string;
    offer: IOffer;
    onClick: () => void;
    asLink?: string;
    className?: string;
    isLivePrice?: boolean;
}

const OfferPriceButton: FC<IOfferPriceButtonProps> = props => {
    const { isShortlistPage } = useStore((stores: TStores) => ({
        isShortlistPage: stores.layoutStore.isShortlistPage,
    }));

    if (isShortlistPage) {
        return <ShortlistOfferButton {...props} />;
    }

    return <OfferButton {...props} />;
};
export default observer(OfferPriceButton);
