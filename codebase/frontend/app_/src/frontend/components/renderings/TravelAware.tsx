import React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface ITravelAwareFields {
    Image: ISitecoreField<ISitecoreImage>;
    Text: ISitecoreField<string>;
}

export type TTravelAwareProps = ISitecoreComponent<ITravelAwareFields>;

export const TravelAware: React.FC<TTravelAwareProps> = props => (
    <div className='travel-aware'>
        {props.fields?.Image && <JSSImage field={props.fields.Image} />}

        {props.fields?.Text && <RichTextWithLinks tag='p' className='travel-aware__text' field={props.fields.Text} />}
    </div>
);

export default TravelAware;
