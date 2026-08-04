import * as React from 'react';

import INavLink from 'models/data/INavLink';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

interface ILinksCardFields {
    Description?: ISitecoreField<string>;
    Links?: INavLink[];
}

type TLinksCardProps = ISitecoreComponent<ILinksCardFields>;

const LinksCard = (props: TLinksCardProps) => (
    <div className='rounded-container links_card mt-3 mt-md-0'>
        {!!props.fields?.Description && (
            <RichTextWithLinks className='links_card--description' field={props.fields.Description} />
        )}
        <ul className='list'>
            {(props.fields?.Links || [])
                .filter(link => !!link.fields?.Link?.value?.text)
                .map((link, i) => (
                    <li key={link.id + i}>
                        <RouterLink link={link.fields.Link}>
                            {link.fields.Link.value.text} <IconChevronRight />
                        </RouterLink>
                    </li>
                ))}
        </ul>
    </div>
);

export default LinksCard;
