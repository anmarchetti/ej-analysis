import * as React from 'react';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

type TOurPoliciesProps = ISitecoreComponent<IOurPoliciesFields>;

interface IOurPoliciesFields {
    Description: ISitecoreField<string>;
    Link: ISitecoreField<ISitecoreLink>;
    Title: ISitecoreField<string>;
}

const OurPolicies = (props: TOurPoliciesProps) => (
    <div className='policies-block'>
        {props.fields?.Title?.value && <p className='policies-block__title'>{props.fields.Title.value}</p>}

        <div className='policies-block__container'>
            {props?.fields?.Description && (
                <RichTextWithLinks field={props.fields.Description} className='policies-block__description' />
            )}
            {props?.fields?.Link && (
                <RouterLink link={props.fields.Link} className='policies-block__link'>
                    {props.fields.Link.value.text}
                </RouterLink>
            )}
        </div>
    </div>
);

export default OurPolicies;
