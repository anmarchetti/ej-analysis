import * as React from 'react';

import { MediaSize } from 'models/data/MediaSizeParams';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreCompositeField, ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

type TPartnershipsAndCertificatesProps = ISitecoreComponent<IPartnershipsAndCertificatesFields>;

interface IPartnershipsAndCertificatesFields {
    Items: ISitecoreCompositeField<IPartnershipsAndCertificateItem>[];
    Title: ISitecoreField<string>;
}

interface IPartnershipsAndCertificateItem {
    Description?: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    TextableIcon?: ISitecoreField<ISitecoreImage>;
}

const PartnershipsAndCertificates = (props: TPartnershipsAndCertificatesProps) => (
    <div className='partnerships-block'>
        {props.fields?.Title?.value && <p className='partnerships-block__title'>{props.fields.Title.value}</p>}

        <div className='partnerships-block__container'>
            {props.fields?.Items &&
                props.fields.Items.length > 0 &&
                props.fields.Items.map((item, i) => (
                    <div className='partnerships-block__item' key={i}>
                        {item?.fields?.Icon && (
                            <div className='partnerships-block__item__icon'>
                                <JSSImage field={item.fields.Icon} />
                            </div>
                        )}
                        {(!!item?.fields?.Description || !!item?.fields?.TextableIcon) && (
                            <div className='partnerships-block__item__description'>
                                {!!item?.fields?.TextableIcon && (
                                    <JSSImageNext field={item.fields.TextableIcon} mediaSize={MediaSize.Small} />
                                )}
                                {!!item?.fields?.Description && <RichTextWithLinks field={item.fields.Description} />}
                            </div>
                        )}
                    </div>
                ))}
        </div>
    </div>
);

export default PartnershipsAndCertificates;
