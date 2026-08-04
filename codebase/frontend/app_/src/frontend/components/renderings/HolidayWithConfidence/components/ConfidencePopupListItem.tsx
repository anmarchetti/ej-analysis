import * as React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { IPopupListItemFields } from 'models/data/IHolidayWithConfidence';
import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreCompositeField } from 'models/sitecore/generic/ISitecoreField';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

type TConfidencePopupListItemProps = ISitecoreCompositeField<IPopupListItemFields>;

const ConfidencePopupListItem = (props: TConfidencePopupListItemProps) => (
    <div className='confidence-item' key={props.id}>
        <div className='confidence-item__icon'>
            <JSSImageNext field={props.fields.Icon} fill mediaSize={MediaSize.Small} />
        </div>
        <Text field={props.fields.Title} className='confidence-item__title' tag='p' />
        <RichTextWithLinks field={props.fields.Text} className='confidence-item__text' />
    </div>
);

export default ConfidencePopupListItem;
