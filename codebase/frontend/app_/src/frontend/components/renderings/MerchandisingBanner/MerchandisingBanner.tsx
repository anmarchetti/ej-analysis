import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { inject } from 'mobx-react';

import { cmsUrls } from 'code/endpoints';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

export interface IMerchandisingBannerFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Label: ISitecoreField<string>;
}

export interface IMerchandisingBannerProps extends ISitecoreComponent<IMerchandisingBannerFields> {
    isEditMode: boolean;
}

export const MerchandisingBanner = (props: IMerchandisingBannerProps) => {
    if (!props.fields || (!props.isEditMode && !props.fields.Label?.value)) {
        return null;
    }

    const { Label, Icon } = props.fields;

    return (
        <div className='merchandising-banner' data-tid='merchandising-banner'>
            <div className='wrapper-container wrapper-container--px'>
                {!!Icon?.value?.src && (
                    <span
                        className='merchandising-banner__icon icon--bg-image'
                        data-tid='merchandising-banner-icon'
                        style={{ backgroundImage: `url(${cmsUrls.media(Icon.value.src)})` }}
                    />
                )}
                {!!Label && <Text field={Label} tag='span' />}
            </div>
        </div>
    );
};

export default inject((stores: TStores) => ({
    isEditMode: stores.layoutStore.isEditMode,
}))(MerchandisingBanner);
