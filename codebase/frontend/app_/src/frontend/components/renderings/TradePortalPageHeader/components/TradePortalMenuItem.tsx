import React, { useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { isHelpItem, isLogOutItem } from 'frontend/utils/navigation.utils';
import { containsSubstring } from 'frontend/utils/string.utils';
import { getNavItemDestination, getNavItemPosition, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import INavLink from 'models/data/INavLink';
import { INavigationClickEventParams } from 'models/data/tracking/IEventWithParams';
import { QueryParamName } from 'models/enum/QueryParamName';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import TradeUserRoles from 'models/enum/tradePortal/TradeUserRoles';
import { ISitecoreField, ISitecoreLink, ISitecoreProperty } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgLogOut from 'frontend/components/icons-new/LogOut';

import { RoleRender } from './RoleRender/RoleRender';
import TradePortalSubMenuItem from './TradePortalSubMenuItem';

export interface IMenuItemProps {
    isUserLinkValid: (item: INavLink, isLoggedIn: boolean) => boolean;
    item: INavLink;
    onClick: (e: React.MouseEvent) => void;
    trackNavigationClick: (
        eventType: EventTypes.NavigationBarMenuClick | EventTypes.NavigationFlyoutMenuClick,
        eventParams: INavigationClickEventParams,
    ) => void;
    isActionMenu?: boolean;
}

const TradePortalMenuItem = (props: IMenuItemProps) => {
    const { isLoggedIn, onLogout } = useStore((stores: ITradePortalStores) => ({
        isLoggedIn: stores.userStore.isLoggedIn,
        onLogout: stores.userStore.onLogout,
    }));

    const [isOpened, setIsOpened] = useState(false);

    const destMenuClassName = classNames('header_trade__destination-menu', { 'is-shown': isOpened });
    const subMenuWrapperClassName = classNames('wrapper-container submenu-wrapper-container');

    if (!props.item?.fields) {
        return null;
    }

    const isImageDefined = props.item.fields.Image;
    const listItemClassName = classNames({
        navigation__link: !props.isActionMenu,
        'header_trade__navigation__link--icon': props.isActionMenu && isImageDefined,
        'logged_in-action': !props.isActionMenu && props.item.fields.ShowOn?.value,
        'has-children': !!props.item.fields.ChildrenLinks?.length,
        'is-empty': !props.isUserLinkValid(props.item, isLoggedIn),
    });

    const actionMenuItems = (props.item.fields.ChildrenLinks || []).filter(
        child => !!(child.fields.Link?.value && props.isUserLinkValid(child, isLoggedIn)),
    );

    const toggleMenu = (event: React.SyntheticEvent, isOpened: boolean): void => {
        if (!props.item.fields.ChildrenLinks || props.item.fields.ChildrenLinks.length === 0) {
            return;
        }

        event.preventDefault();
        setIsOpened(isOpened);
    };

    const onClickItem = (e: any, innerText?: string, isNavItem?: boolean) => {
        const target = e.target as HTMLAnchorElement;
        const href = target.href || e.currentTarget.href;

        props.trackNavigationClick(EventTypes.NavigationBarMenuClick, {
            location: 'Top Navigation Bar',
            position: getNavItemPosition(target),
            name: innerText || target.innerText,
            destination: getNavItemDestination(isNavItem ? null : href),
            type: getNavItemType(!isNavItem && !!href),
        });

        props.onClick(e);

        if (document.activeElement) {
            const link = document.activeElement as HTMLElement;
            link.blur();
        }
    };

    const getItemInnerText = () => {
        const { item, isActionMenu } = props;

        if (isHelpItem(item)) {
            return 'Help';
        }

        if (isActionMenu && !!item.fields.ChildrenLinks?.length) {
            return 'Account Icon';
        }

        return undefined;
    };

    const onClickAccountAction = (e, currentItemIndex: number, name?: string) => {
        setIsOpened(false);

        const target = e.currentTarget.children?.[0] || e.target;

        props.trackNavigationClick(EventTypes.NavigationFlyoutMenuClick, {
            location: 'Top Overlay Menu - Actions',
            position: getNavItemPosition(target, currentItemIndex),
            name: name || target.innerText,
            destination: getNavItemDestination(target.href),
            section: 'Account options',
            parentItem: 'Account',
            type: getNavItemType(!!target.href),
        });
    };

    const renderActionMenuContent = (href: string, text: string) => {
        if (containsSubstring(href, QueryParamName.Logout)) {
            return (
                <>
                    <i className='icon-logout'>
                        <SvgLogOut />
                    </i>
                    {text}
                </>
            );
        }

        return (
            <>
                {text}
                <i className='icon-chevron'>
                    <SvgChevronRight />
                </i>
            </>
        );
    };

    const renderActionMenuItem = (
        id: string,
        actionIndex: number,
        link: ISitecoreField<ISitecoreLink>,
        allowedRoles?: ISitecoreProperty<TradeUserRoles>[],
    ) => {
        if (!link) {
            return null;
        }

        const allowedRolesArray = Array.isArray(allowedRoles)
            ? allowedRoles?.map(role => role.fields.Value.value).filter(role => !!role)
            : [];

        const isLogOut = isLogOutItem(link.value?.querystring ?? '');

        if (isLogOut)
            return (
                <RoleRender allowedRoles={allowedRolesArray} key={id}>
                    <li>
                        <button
                            onClick={e => {
                                onClickAccountAction(e, actionIndex + 1);
                                onLogout();
                            }}
                            data-logout={true}
                        >
                            {renderActionMenuContent('', link.value.text)}
                        </button>
                    </li>
                </RoleRender>
            );

        return (
            <RoleRender allowedRoles={allowedRolesArray} key={id}>
                <li>
                    <RouterLink link={link} onClick={e => onClickAccountAction(e, actionIndex + 1)}>
                        {renderActionMenuContent(link.value.href, link.value.text)}
                    </RouterLink>
                </li>
            </RoleRender>
        );
    };

    const renderChildrenLinks = () => {
        if (props.isActionMenu) {
            return (
                <ul className={classNames({ 'is-shown': isOpened })}>
                    {actionMenuItems.map((child, i) =>
                        renderActionMenuItem(child.id, i, child.fields.Link, child.fields.AllowedRoles),
                    )}
                </ul>
            );
        }

        return (
            <div className={destMenuClassName}>
                <div className={subMenuWrapperClassName}>
                    <div className='header_trade__destination-menu__container has-full-width'>
                        <TradePortalSubMenuItem
                            childrenLinks={props.item.fields.ChildrenLinks}
                            promotionalComponent={props.item.fields.PromotionalComponent}
                            onClick={e => {
                                setIsOpened(false);
                                props.onClick(e);
                            }}
                            isUserLinkValid={props.isUserLinkValid}
                            isOpened={isOpened}
                            parentItemName={props.item.fields.Link?.value?.text}
                        />
                    </div>
                </div>
            </div>
        );
    };

    /**
     * When we are moving through items with children let them be visible for Tab
     */
    const handleBlur = (e: React.FocusEvent): void => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            toggleMenu(e, false);
        }
    };

    return (
        <li
            className={listItemClassName}
            onFocus={e => toggleMenu(e, true)}
            onBlur={e => handleBlur(e)}
            onMouseEnter={e => toggleMenu(e, true)}
            onMouseLeave={e => toggleMenu(e, false)}
            data-tid='menu-item'
        >
            {props.isUserLinkValid(props.item, isLoggedIn) && (
                <>
                    <RouterLink
                        link={props.item.fields.Link}
                        className={classNames('parent-link', isOpened && props.isActionMenu && 'is-active')}
                        onClick={e => onClickItem(e, getItemInnerText())}
                        dataId='menu-link'
                    >
                        {props.item.fields.Image ? (
                            <JSSImage field={props.item.fields.Image} />
                        ) : (
                            <span data-tid='menu-link-label'>{props.item.fields.Link?.value?.text}</span>
                        )}
                        {!!props.item.fields.ChildrenLinks?.length && <IconChevronDown />}
                    </RouterLink>

                    {!!props.item.fields.ChildrenLinks?.length && renderChildrenLinks()}
                </>
            )}
        </li>
    );
};

export default observer(TradePortalMenuItem);
