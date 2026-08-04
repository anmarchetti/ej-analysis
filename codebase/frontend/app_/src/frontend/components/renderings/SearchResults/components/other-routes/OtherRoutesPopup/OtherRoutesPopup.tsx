import React, { FC, useMemo } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { getPricePill } from 'frontend/utils/offer.utils';
import { IAlternativeOffer } from 'models/data/IAlternativeOffers';
import { IOffer } from 'models/data/IOffer';
import { ISelectOption } from 'models/data/ISelectOption';
import { AlternativeFlightsSortBy } from 'models/enum/AlternativeFlightsSortBy';
import { Popup } from 'frontend/components/common/Popup';

import OtherRoutesPopupContent from './PopupContent/OtherRoutesPopupContent';
import OtherRoutesDrawer from './OtherRoutesDrawer';

export interface IOtherRoutesPopupProps {
    alternativeFlights: IOffer[] | IAlternativeOffer[];
    isLoading: boolean;
    isOpen: boolean;
    offer: IOffer;
    onClose: () => void;
    onFlightsSort: (sortBy: AlternativeFlightsSortBy) => void;
    onSelectRoute: (offer: IOffer, isSameRoute: boolean) => void;
    selectedSortOption?: ISelectOption | undefined;
    sortBy?: AlternativeFlightsSortBy;
    sortOptions?: ISelectOption[];
}

export const OtherRoutesPopup: FC<IOtherRoutesPopupProps> = props => {
    const { isScreenMedium, tooltipSettings } = useStore(stores => ({
        isScreenMedium: stores.appStore.isScreenMedium,
        tooltipSettings: stores.layoutStore.tooltipSettings,
    }));

    const priceDisclaimer = useMemo(() => getPricePill(tooltipSettings, props.offer), [tooltipSettings, props.offer]);

    if (isScreenMedium) {
        return props.isOpen ? (
            <Popup onClose={props.onClose} showCloseButton>
                <OtherRoutesPopupContent {...props} priceDisclaimer={priceDisclaimer} />
            </Popup>
        ) : null;
    }

    return <OtherRoutesDrawer {...props} priceDisclaimer={priceDisclaimer} />;
};

export default observer(OtherRoutesPopup);
