import React, { Fragment, useEffect, useState } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isHolidayCreditItem } from 'frontend/utils/navigation.utils';
import { getNavItemDestination, getNavItemPosition, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import INavLink from 'models/data/INavLink';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import MenuPromotionalComponent from './MenuPromotionalComponent';
import SubMenuItemMobile from './SubMenuItemMobile';

export interface ISubMenuItemProps extends IComponentWithRerenderProps {
    getHolidayCreditLabel: (item: INavLink) => JSX.Element;
    isOpened: boolean;
    isUserLinkValid: (item: INavLink) => boolean;
    onClick: (e: React.MouseEvent) => void;
    parentItemName: string;
    toggleIsGoBackMenuItemVisible: (state: boolean) => void;
    childrenLinks?: INavLink[];
    promotionalComponent?: IPromoBlockFields;
}

export const SubMenuItem = ({
    isOpened,
    parentItemName,
    childrenLinks,
    promotionalComponent,
    isUserLinkValid,
    getHolidayCreditLabel,
    onClick,
    toggleIsGoBackMenuItemVisible,
    wasRerendered,
}: ISubMenuItemProps) => {
    const { isCreditBookingEnabled, isScreenLarge, trackNavigationClick } = useStore((stores: IHolidaysStores) => ({
        isCreditBookingEnabled: stores.holidayCreditStore.isCreditBookingEnabled,
        isScreenLarge: stores.appStore.isScreenLarge,
        trackNavigationClick: stores.trackingStore.trackNavigationClick,
    }));

    const [activeSectionName, setActiveSectionName] = useState<string>('');

    const getSectionClassname = item =>
        classNames(
            'destination-menu__list__item',
            item?.fields?.Link?.value?.text === activeSectionName && 'destination-menu__list__item--active',
        );

    const setActiveSection = (item?: INavLink): void => {
        setActiveSectionName(item?.fields?.Link?.value?.text || '');
    };

    const shouldShowLink = (item: INavLink) =>
        isUserLinkValid(item) && (!isHolidayCreditItem(item) || isCreditBookingEnabled);

    const shouldShowInnerLinks = (item: INavLink) =>
        shouldShowLink(item) && item?.fields?.Link?.value?.text === activeSectionName;

    const onHoverSection = (item: INavLink) => {
        setActiveSection(item);
    };

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

    const onKeyDownSection = (e: React.KeyboardEvent, item: INavLink): void => {
        if (e.key === KeyboardKey.ENTER || e.key === KeyboardKey.ArrowRight) {
            e.preventDefault();
            e.stopPropagation();
            setActiveSection(item);
        }
    };

    const getLabel = (item: INavLink) => item?.fields?.Link?.value?.text;

    const isDirectLink = item => !item?.fields?.ChildrenLinks || item?.fields?.ChildrenLinks.length === 0;

    const setInitialActiveMenuItem = () => {
        if (!!childrenLinks && childrenLinks.length > 0) {
            const defaultItem = childrenLinks.find(item => !!getLabel(item));
            setActiveSection(defaultItem);
        }
    };

    useEffect(() => {
        setInitialActiveMenuItem();
    }, [isOpened]);

    useEffect(() => {
        setInitialActiveMenuItem();
    }, []);

    if (!childrenLinks) {
        return null;
    }

    if (wasRerendered && !isScreenLarge) {
        return (
            <SubMenuItemMobile
                childrenLinks={childrenLinks}
                getHolidayCreditLabel={getHolidayCreditLabel}
                onClick={onClickItem}
                isDirectLink={isDirectLink}
                toggleIsGoBackMenuItemVisible={toggleIsGoBackMenuItemVisible}
                promotionalComponent={promotionalComponent}
                trackNavigationClick={trackNavigationClick}
                parentItemName={parentItemName}
            />
        );
    }

    return (
        <div className='destination-menu__list row'>
            <div className='col-lg-3 destination-menu__list-col'>
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
                                        isNoFollowTagEnabled={item.fields?.EnableNoFollowTag?.value}
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
                                    <button
                                        className={getSectionClassname(item)}
                                        onClick={(e: React.MouseEvent): void => onClickSection(e, i + 1)}
                                        onKeyDown={(e: React.KeyboardEvent): void => onKeyDownSection(e, item)}
                                        onMouseEnter={(): void => onHoverSection(item)}
                                        data-tid='submenu-section-button'
                                    >
                                        <div className='list__title' data-tid='submenu-section-button-label'>
                                            {getLabel(item)}
                                            <IconChevronRight />
                                        </div>
                                    </button>
                                )}
                            </Fragment>
                        ),
                )}
            </div>
            <div
                className={classNames(
                    'col-lg-6',
                    'destination-menu__list-col',
                    !promotionalComponent && 'destination-menu__list-col--no-border',
                )}
            >
                {childrenLinks.map(
                    (item, i) =>
                        !isDirectLink(item) && (
                            <ul
                                key={item.id}
                                className={classNames(
                                    !shouldShowInnerLinks(item) && 'destination-menu__list--hidden',
                                    'list__container',
                                )}
                                data-tid='submenu-inner-links'
                            >
                                {item?.fields?.ChildrenLinks?.map((child, j) => (
                                    <li key={child.id}>
                                        {child?.fields?.Link && (
                                            <RouterLink
                                                link={child.fields.Link}
                                                isNoFollowTagEnabled={child.fields?.EnableNoFollowTag?.value}
                                                onClick={e => onClickItem(e, getLabel(item), i + 1, j + 1)}
                                                dataId='submenu-inner-link'
                                            >
                                                {child?.fields?.Link?.value?.text}
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
                    className='col-lg-3 destination-menu__list-promotion-col'
                >
                    <MenuPromotionalComponent
                        promotionalComponent={promotionalComponent}
                        onClick={(e, name) => onClickItem(e, 'Sub-menu Promotion', undefined, undefined, name)}
                    />
                </div>
            )}
        </div>
    );
};

export default withRerender(SubMenuItem);
