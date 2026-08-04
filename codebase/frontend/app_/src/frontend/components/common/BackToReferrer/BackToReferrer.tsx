import React, { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import IconChevronLeft from 'frontend/components/icons-new/ChevronLeft';

import { buildBackLinkUrl } from './BackToReferrer.utils';

export interface IBackToReferrerProps {
    returnPath: string;
}

const BackToReferrer: FC<IBackToReferrerProps> = (props: IBackToReferrerProps) => {
    const { getPhrase, referrer, trackBackToFlightsClick } = useStore((stores: IHolidaysStores) => ({
        trackBackToFlightsClick: stores.trackingStore.trackBackToFlightsClick,
        getPhrase: stores.layoutStore.getPhrase,
        referrer: stores.layoutStore.referrer,
    }));

    const backToFlightsUrl = buildBackLinkUrl(referrer, props.returnPath);

    if (!backToFlightsUrl) {
        return null;
    }

    return (
        <div className='search-nav__item--right'>
            <a
                className='btn btn--txt search-nav__link'
                data-tid='go-back-to-flights'
                href={backToFlightsUrl}
                onClick={(): Promise<void> => trackBackToFlightsClick(backToFlightsUrl)}
            >
                <IconChevronLeft />
                {getPhrase(SitecoreDictionary.GlobalsButtonsBack)}
            </a>
        </div>
    );
};

export default BackToReferrer;
