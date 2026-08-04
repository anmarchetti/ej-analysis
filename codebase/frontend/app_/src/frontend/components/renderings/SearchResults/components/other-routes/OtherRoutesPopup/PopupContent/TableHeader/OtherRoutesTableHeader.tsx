import React, { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { CalloutOrientation, CalloutPosition } from 'models/enum/Callout';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Callout from 'frontend/components/common/Callout/Callout';

export interface IOtherRoutesTableHeaderProps {
    hasPricePerPerson: boolean;
    priceDisclaimer: string;
}

export const OtherRoutesTableHeader: FC<IOtherRoutesTableHeaderProps> = ({ hasPricePerPerson, priceDisclaimer }) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div className='table-row table-header'>
            <div className='table-col'>{getPhrase(SitecoreDictionary.SearchResultsLabelsDepartureAirport)}</div>
            <div className='table-col'>{getPhrase(SitecoreDictionary.SearchResultsLabelsDepartingTime)}</div>
            <div className='table-col'>{getPhrase(SitecoreDictionary.SearchResultsLabelsReturnTime)}</div>
            {hasPricePerPerson && (
                <div className='table-col price' data-tid='price-per-person'>
                    {getPhrase(SitecoreDictionary.SearchResultsLabelsPricePerPerson)}
                </div>
            )}
            <div className='table-col price' data-tid='price-total'>
                {getPhrase(SitecoreDictionary.SearchResultsLabelsPriceTotal)}{' '}
                {priceDisclaimer && (
                    <Callout
                        content={<div>{priceDisclaimer}</div>}
                        orientation={CalloutOrientation.Bottom}
                        position={CalloutPosition.Right}
                        isShownOnHover
                    />
                )}
            </div>
            <div className='table-col small icon' />
        </div>
    );
};

export default OtherRoutesTableHeader;
