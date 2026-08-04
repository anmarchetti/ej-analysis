import React, { FunctionComponent, useState } from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { convertToYesNoString } from 'frontend/utils/string.utils';
import { ISitecoreChildren } from 'models/data/ISitecoreChildren';
import { ITrackingModuleClickParams } from 'models/data/tracking/ITrackingModuleClickParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { TouristTaxGenericTooltip } from 'frontend/components/common/TouristTaxGenericTooltip/TouristTaxGenericTooltip';

import DealsPromoTile, { IDealsPromoTileFields } from './components/DealsPromoTile';

import styles from './DealsPromoTiles.module.scss';

interface IDealsPromoTilesFields {
    items: ISitecoreChildren<IDealsPromoTileFields>[];
}

type TDealsPromoTilesProps = ISitecoreComponent<IDealsPromoTilesFields, ITrackingModuleClickParams>;

export const DealsPromoTiles: FunctionComponent<TDealsPromoTilesProps> = ({ fields, rendering, params }) => {
    const { trackModuleClick, isTouristTaxEnabled, getPhrase } = useStore(stores => ({
        trackModuleClick: stores.trackingStore.trackModuleClick,
        isTouristTaxEnabled: stores.layoutStore.isTouristTaxEnabled,
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isTouristTaxDisplayed, setIsTouristTaxDisplayed] = useState(false);

    const onItemLinkClick = (index: number, url: string, title: string, hasPrice: boolean = false) => {
        if (params?.IsModuleClickTrackingEnabled === '1') {
            const moduleName = rendering.placeholders?.[PlaceholderNames.TitleBlock]?.[0]?.fields?.Title?.value;

            trackModuleClick({
                moduleId: rendering.uid,
                name: moduleName || '',
                location: params.ModuleLocation,
                selection: title,
                position: index + 1,
                destinationPath: url,
                isPriceVisible: convertToYesNoString(hasPrice),
            });
        }
    };

    if (!fields) {
        return null;
    }

    return (
        <>
            <Placeholder name={PlaceholderNames.TitleBlock} rendering={rendering} />

            <div className='tile-blocks-container' data-tid='tile-blocks'>
                {(fields.items || []).map((item, i) => (
                    <DealsPromoTile
                        key={item.id}
                        fields={item.fields}
                        onItemLinkClick={(url, priceText) =>
                            onItemLinkClick(i, url, item.fields?.Title?.value, !!priceText)
                        }
                        setIsTouristTaxDisplayed={setIsTouristTaxDisplayed}
                    />
                ))}
            </div>
            {isTouristTaxEnabled && isTouristTaxDisplayed && (
                <TouristTaxGenericTooltip triggerClassName={styles.taxInfo}>
                    <span>{getPhrase(SitecoreDictionary.TouristTaxLabelsPricesIncludeLocalTax)}</span>
                </TouristTaxGenericTooltip>
            )}
        </>
    );
};

export default DealsPromoTiles;
