import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

export interface IEcoCertifiedFields {
    data: {
        Description: ISitecoreField<string>;
        Image: ISitecoreField<ISitecoreImage>;
        Link: ISitecoreField<ISitecoreLink>;
        Title: ISitecoreField<string>;
    };
}

export type TEcoCertifiedProps = ISitecoreComponent<IEcoCertifiedFields>;

export const EcoCertified = ({ fields }: TEcoCertifiedProps) => {
    const { isEcoCertifiedEnabledInFacilitiesTabs } = useStore(stores => ({
        isEcoCertifiedEnabledInFacilitiesTabs: stores.layoutStore.isEcoCertifiedEnabledInFacilitiesTabs,
    }));

    if (!fields || !isEcoCertifiedEnabledInFacilitiesTabs) {
        return null;
    }

    const { Image, Title, Description, Link } = fields.data;

    return (
        <div className='eco-certified'>
            {Image?.value && <JSSImage className='eco-certified__img' field={Image} />}
            <div className='eco-certified__wrapper'>
                {Title?.value && <Text tag='p' className='eco-certified__title' field={Title} />}
                <div className='eco-certified__description'>
                    {Description?.value && (
                        <RichTextWithLinks tag='div' className='eco-certified__text' field={Description} />
                    )}
                    {Link?.value && (
                        <RouterLink className='eco-certified__link' link={Link} ariaLabel={Link.value.text}>
                            {Link.value.text}
                        </RouterLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EcoCertified;
