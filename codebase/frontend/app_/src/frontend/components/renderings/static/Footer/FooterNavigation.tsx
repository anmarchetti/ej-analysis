import { FC } from 'react';

import INavLink from 'models/data/INavLink';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import RouterLink from 'frontend/components/common/RouterLink';

export interface IFooterNavigationFields {
    items: INavLink[];
}

export type TFooterNavigationProps = ISitecoreComponent<IFooterNavigationFields>;

const FooterNavigation: FC<TFooterNavigationProps> = props => {
    const links = (props.fields?.items || []).filter(link => !!link.fields?.Link?.value);

    if (!links.length) return null;

    return (
        <nav role='navigation' className='footer-slim-nav'>
            <ul data-tid='navigation-links'>
                {links.map(link => (
                    <li key={link.id}>
                        <RouterLink link={link.fields.Link}>{link.fields.Link.value.text}</RouterLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default FooterNavigation;
