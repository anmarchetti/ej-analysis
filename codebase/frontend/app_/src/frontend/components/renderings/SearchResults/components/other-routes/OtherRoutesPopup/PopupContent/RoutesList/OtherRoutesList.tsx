import React, { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { areRoutesEqual } from 'frontend/utils/route.utils';
import SiteSettings from 'models/enum/SiteSettings';
import { IOtherRoutesPopupContentProps } from 'frontend/components/renderings/SearchResults/components/other-routes/OtherRoutesPopup/PopupContent/OtherRoutesPopupContent';

import OtherRoutesItem from './RouteItem/OtherRoutesItem';

export type TOtherRoutesListProps = Pick<
    IOtherRoutesPopupContentProps,
    'alternativeFlights' | 'offer' | 'isMobile' | 'onSelectRoute'
>;

export const OtherRoutesResultsList: FC<TOtherRoutesListProps> = ({
    offer,
    alternativeFlights,
    isMobile,
    onSelectRoute,
}) => {
    const { getSetting } = useStore(stores => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const shouldOpenLinkInNewTab = !!getSetting(SiteSettings.OpenRouteInNewTab);

    return (
        <>
            {alternativeFlights.map((altOffer, id) => {
                const isSameRoute = areRoutesEqual(offer, altOffer);

                return (
                    <OtherRoutesItem
                        key={id}
                        offer={altOffer}
                        isSelected={isSameRoute}
                        openInNewTab={shouldOpenLinkInNewTab}
                        onSelect={(): void => onSelectRoute(altOffer, isSameRoute)}
                        isMobile={isMobile}
                    />
                );
            })}
        </>
    );
};

export default OtherRoutesResultsList;
