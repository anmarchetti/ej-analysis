import React, { Fragment, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { getNavItemDestination, getNavItemPosition, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import INavLink from 'models/data/INavLink';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import TradePortalMenuPromotionalComponent from './TradePortalMenuPromotionalComponent';

export interface ISubMenuItemProps {
    isOpened: boolean;
    isUserLinkValid: (item: INavLink, isLoggedIn: boolean) => boolean;
    onClick: (e: React.MouseEvent) => void;
    parentItemName: string;
    childrenLinks?: INavLink[];
    promotionalComponent?: IPromoBlockFields;
}

const TradePortalSubMenuItem = ({
    isOpened,
    parentItemName,
    childrenLinks,
    promotionalComponent,
    isUserLinkValid,
    onClick,
}: ISubMenuItemProps) => {
    const { trackNavigationClick, isLoggedIn } = useStore(stores => ({
        trackNavigationClick: stores.trackingStore.trackNavigationClick,
        isLoggedIn: stores.userStore.isLoggedIn,
    }));

    const [activeSectionName, setActiveSectionName] = useState<string>('');

    const getSectionClassname = item =>
        classNames(
            'header_trade__destination-menu__list__item',
            item?.fields?.Link?.value?.text === activeSectionName &&
                'header_trade__destination-menu__list__item--active',
        );

    const onHoverSection = (item: INavLink) => {
        setActiveSectionName(item?.fields?.Link?.value?.text || '');
    };

    const shouldShowLink = (item: INavLink) => isUserLinkValid(item, isLoggedIn);

    const shouldShowInnerLinks = (item: INavLink) =>
        shouldShowLink(item) && item?.fields?.Link?.value?.text === activeSectionName;

    const onClickSection = (e, currentItemIndex: number) => {
        e.preventDefault();

        const target = e.target;

        trackNavigationClick(EventTypes.NavigationFlyoutMenuClick, {
            location: 'Top Overlay Menu',
            position: getNavItemPosition(target, currentItemIndex),
            name: target.innerText,
            destination: getNavItemDestination(target.href),
            section: 'Sub-menu Items',
            parentItem: parentItemName,
            type: getNavItemType(!!target.href),
        });
    };

    const onClickItem = (
        e,
        sectionName?: string,
        parentItemIndex?: number,
        currentItemIndex?: number,
        name?: string,
    ) => {
        onClick(e);

        const target = e.target;
        const targetDestination = target.href || e.currentTarget.href || e.currentTarget.parentNode.href;

        trackNavigationClick(EventTypes.NavigationFlyoutMenuClick, {
            location: 'Top Overlay Menu',
            position: getNavItemPosition(target, parentItemIndex, currentItemIndex),
            name: name || target.innerText,
            destination: getNavItemDestination(targetDestination),
            section: sectionName,
            parentItem: parentItemName,
            type: (sectionName === 'Sub-menu Promotion' ? 'promotion ' : '') + getNavItemType(!!targetDestination),
        });
    };

    const getLabel = (item: INavLink) => item?.fields?.Link?.value?.text;
    const isDirectLink = item => !item?.fields?.ChildrenLinks || item?.fields?.ChildrenLinks.length === 0;

    useEffect(() => {
        if (!!childrenLinks && childrenLinks.length > 0) {
            const defaultItem = childrenLinks.find(item => !!getLabel(item));
            defaultItem && setActiveSectionName(defaultItem?.fields?.Link?.value?.text || '');
        }
    }, [childrenLinks, isOpened]);

    if (!childrenLinks) {
        return null;
    }

    return (
        <div className='header_trade__destination-menu__list row'>
            <div className='col-lg-3 header_trade__destination-menu__list-col'>
                {childrenLinks.map(
                    (item, i) =>
                        shouldShowLink(item) &&
                        !!getLabel(item) &&
                        item?.fields?.Link && (
                            <Fragment key={item.id}>
                                {isDirectLink(item) ? (
                                    <RouterLink
                                        link={item.fields.Link}
                                        className={getSectionClassname(item)}
                                        onClick={e => onClickItem(e, 'Sub-menu Items', i + 1)}
                                        dataId='submenu-section-link'
                                    >
                                        <div
                                            className='list__title'
                                            onMouseEnter={() => onHoverSection(item)}
                                            data-tid='submenu-section-link-label'
                                        >
                                            {getLabel(item)}
                                        </div>
                                    </RouterLink>
                                ) : (
                                    <a
                                        className={getSectionClassname(item)}
                                        onClick={e => onClickSection(e, i + 1)}
                                        data-tid='submenu-section-button'
                                    >
                                        <div
                                            className='list__title'
                                            onMouseEnter={() => onHoverSection(item)}
                                            data-tid='submenu-section-button-label'
                                        >
                                            {getLabel(item)}
                                            <IconChevronRight />
                                        </div>
                                    </a>
                                )}
                            </Fragment>
                        ),
                )}
            </div>
            <div
                className={classNames(
                    'col-lg-6',
                    'header_trade__destination-menu__list-col',
                    !promotionalComponent && 'header_trade__destination-menu__list-col--no-border',
                )}
            >
                {childrenLinks.map(
                    (item, i) =>
                        !isDirectLink(item) && (
                            <ul
                                key={item.id}
                                className={classNames(
                                    !shouldShowInnerLinks(item) && 'header_trade__destination-menu__list--hidden',
                                    'list__container',
                                )}
                                data-tid='submenu-inner-links'
                            >
                                {item?.fields?.ChildrenLinks?.map((child, j) => (
                                    <li key={child.id}>
                                        {child?.fields?.Link && (
                                            <RouterLink
                                                link={child.fields.Link}
                                                onClick={e => onClickItem(e, getLabel(item), i + 1, j + 1)}
                                                dataId='submenu-inner-link'
                                            >
                                                {child.fields.Link.value?.text}
                                            </RouterLink>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ),
                )}
            </div>
            {!!promotionalComponent && (
                <div
                    data-promotion={promotionalComponent.fields.DataPromotion?.value}
                    className='col-lg-3 header_trade__destination-menu__list-promotion-col'
                >
                    <TradePortalMenuPromotionalComponent
                        promotionalComponent={promotionalComponent}
                        onClick={(e, name) => onClickItem(e, 'Sub-menu Promotion', undefined, undefined, name)}
                    />
                </div>
            )}
        </div>
    );
};

export default observer(TradePortalSubMenuItem);
