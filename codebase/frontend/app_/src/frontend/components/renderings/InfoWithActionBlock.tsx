import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface ISitecoreFields {
    Icon: ISitecoreField<ISitecoreImage>;
    Text: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TInfoWithActionBlockProps = ISitecoreComponent<ISitecoreFields>;

const InfoWithActionBlock: FC<TInfoWithActionBlockProps> = props => {
    if (!props.fields) {
        return null;
    }

    return (
        <div className='info-with-action__wrapper' data-tid='info-with-action-block-wrapper'>
            {props.fields?.Title && <Text tag='h2' field={props.fields.Title} />}
            <div className='info-with-action__text-wrapper'>
                {props.fields?.Icon && <JSSImage field={props.fields.Icon} />}

                {props.fields?.Text && (
                    <RichTextWithLinks tag='div' className='info-with-action__text' field={props.fields.Text} />
                )}
            </div>
        </div>
    );
};

export default InfoWithActionBlock;
