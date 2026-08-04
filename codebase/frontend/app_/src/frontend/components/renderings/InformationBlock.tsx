import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

interface IInformationBlockFields {
    Description?: ISitecoreField<string>;
    Image?: ISitecoreField<ISitecoreImage>;
    Title?: ISitecoreField<string>;
}

export type TInformationBlockProps = ISitecoreComponent<IInformationBlockFields>;

const InformationBlock: FC<TInformationBlockProps> = props => {
    if (!props.fields) {
        return null;
    }

    return (
        <div className='information-block'>
            <div className='information-block__wrapper'>
                {props.fields.Image && <JSSImage field={props.fields.Image} className='information-block__image' />}

                <div className='information-block__content'>
                    <div className='information-block__wrapper'>
                        <JSSImage field={props.fields.Image} className='information-block__icon' />
                        {props.fields.Title && (
                            <Text field={props.fields.Title} className='information-block__title' tag='h3' />
                        )}
                    </div>

                    {props.fields.Description && (
                        <RichTextWithLinks field={props.fields.Description} className='information-block__text' />
                    )}
                </div>
            </div>
        </div>
    );
};

export default InformationBlock;
