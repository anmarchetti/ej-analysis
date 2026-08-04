import { FC, useState } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { buildSitecoreLinkFullUrl } from 'frontend/utils/url.utils';
import INavLink from 'models/data/INavLink';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import HeightAnimatedContainer from 'frontend/components/common/HeightAnimatedContainer/HeightAnimatedContainer';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconChevronUp from 'frontend/components/icons/ChevronUp';

export type TFooterDropdownProps = INavLink & IComponentWithRerenderProps;

export const FooterDropdown: FC<TFooterDropdownProps> = ({ wasRerendered, fields }) => {
    const [isOpened, setOpened] = useState(false);

    const title = fields?.Link?.value?.url || '';
    const links = (fields?.ChildrenLinks || []).filter(link => !!link.fields?.Link?.value);
    const { trackHomepageAction, sitePath, isScreenLarge } = useStore((stores: TStores) => ({
        trackHomepageAction: stores.trackingStore.trackHomepageAction,
        sitePath: stores.layoutStore.sitePath,
        isScreenLarge: stores.appStore.isScreenLarge,
    }));

    const handleClick = (index: number, item: INavLink): void => {
        const link = item.fields.Link;

        trackHomepageAction(EventTypes.FooterClick, {
            location: 'Footer',
            position: `${index + 1}`,
            name: link.value.text,
            destination: buildSitecoreLinkFullUrl(link, sitePath),
            section: title,
        });
    };

    const renderLinksList = (): JSX.Element => (
        <ul data-tid='navigation-links'>
            {links.map((link: INavLink, i) => (
                <li key={link.id} className='navigation__link'>
                    <RouterLink link={link.fields.Link} onClick={() => handleClick(i, link)}>
                        {link.fields.Link.value.text}
                    </RouterLink>
                </li>
            ))}
        </ul>
    );

    if (!fields) return null;

    if (!wasRerendered || isScreenLarge) {
        return (
            <div className='footer__list-item'>
                <h4 className='footer__list-title'>{title}</h4>
                {links.length > 0 && renderLinksList()}
            </div>
        );
    }

    return (
        <div className='footer__list-item'>
            <h4 className='footer__list-title'>
                <button className='btn btn--txt' aria-expanded={isOpened} onClick={() => setOpened(!isOpened)}>
                    {title}
                    {isOpened ? <IconChevronUp /> : <IconChevronDown />}
                </button>
            </h4>
            {links.length > 0 && (
                <HeightAnimatedContainer isOpened={isOpened}>{renderLinksList()}</HeightAnimatedContainer>
            )}
        </div>
    );
};

export default withRerender(FooterDropdown);
