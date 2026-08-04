import React, { FC, Fragment, useState } from 'react';
import classNames from 'classnames';

import { isHolidayCreditItem } from 'frontend/utils/navigation.utils';
import { getNavItemDestination, getNavItemPosition, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import INavLink from 'models/data/INavLink';
import { IPromoBlockFields } from 'models/data/IPromoBlockFields';
import { INavigationClickEventParams } from 'models/data/tracking/IEventWithParams';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import RouterLink from 'frontend/components/common/RouterLink';
import IconChevronRight from 'frontend/components/icons/ChevronRight';

import MenuPromotionalComponent from './MenuPromotionalComponent';

interface ISubMenuItemMobileProps {
    childrenLinks: INavLink[];
    getHolidayCreditLabel: (item: INavLink) => JSX.Element;
    isDirectLink: (item: INavLink) => boolean;
    onClick: (
        e: React.MouseEvent,
        sectionName?: string,
        parentItemIndex?: number,
        currentItemIndex?: number,
        name?: string,
    ) => void;
    parentItemName: string;
    toggleIsGoBackMenuItemVisible: (state: boolean) => void;
    trackNavigationClick: (
        eventType: EventTypes.NavigationBarMenuClick | EventTypes.NavigationFlyoutMenuClick,
        eventParams: INavigationClickEventParams,
    ) => void;
    promotionalComponent?: IPromoBlockFields;
}

const SubMenuItemMobile: FC<ISubMenuItemMobileProps> = ({
    childrenLinks,
    parentItemName,
    promotionalComponent,
    getHolidayCreditLabel,
    onClick,
    isDirectLink,
    toggleIsGoBackMenuItemVisible,
    trackNavigationClick,
}) => {
    const [activeItem, setActiveItem] = useState<INavLink | null>(null);

    const getLabel = (item: INavLink) =>
        isHolidayCreditItem(item) ? getHolidayCreditLabel(item) : item?.fields?.Link?.value?.text;

    const onDirectLinkClick = (e, currentIndex: number, name?: string) => {
        onClick(e, 'Sub-menu Items', currentIndex, undefined, name);
        setActiveItem(null);
        toggleIsGoBackMenuItemVisible(true);
    };

    const onSideLinkClick = (e, item, currentIndex?: number) => {
        setActiveItem(item);
        toggleIsGoBackMenuItemVisible(false);

        const target = e.target;
        const targetDestination = target.href || e.currentTarget.href;

        trackNavigationClick(EventTypes.NavigationFlyoutMenuClick, {
            location: 'Top Overlay Menu',
            position: getNavItemPosition(target, currentIndex),
            name: target.innerText,
            destination: getNavItemDestination(targetDestination),
            section: 'Sub-menu Items',
            parentItem: parentItemName,
            type: getNavItemType(!!targetDestination),
        });
    };

    const onGoBackClick = (): void => {
        setActiveItem(null);
        toggleIsGoBackMenuItemVisible(true);
    };

    if (!childrenLinks) {
        return null;
    }

    return (
        <div className='destination-menu__list'>
            <div
                className={classNames(!!activeItem && 'destination-menu__list--hidden')}
                data-tid={!activeItem ? 'destination-menu__list--active' : ''}
            >
                {childrenLinks.map(
                    (item, i) =>
                        !!getLabel(item) &&
                        item?.fields?.Link && (
                            <Fragment key={item.id}>
                                {isDirectLink(item) ? (
                                    <RouterLink
                                        link={item.fields.Link}
                                        className='destination-menu__list__item'
                                        isNoFollowTagEnabled={item.fields?.EnableNoFollowTag?.value}
                                        onClick={e =>
                                            onDirectLinkClick(
                                                e,
                                                i + 1,
                                                isHolidayCreditItem(item) ? item.fields.Link?.value?.text : undefined,
                                            )
                                        }
                                    >
                                        <div className='list__title'>{getLabel(item)}</div>
                                    </RouterLink>
                                ) : (
                                    <a
                                        className='destination-menu__list__item'
                                        onClick={e => onSideLinkClick(e, item, i + 1)}
                                    >
                                        <div className='list__title'>
                                            {getLabel(item)}
                                            <IconChevronRight />
                                        </div>
                                    </a>
                                )}
                            </Fragment>
                        ),
                )}
                {!!promotionalComponent && (
                    <div
                        data-promotion={promotionalComponent.fields.DataPromotion?.value}
                        className='destination-menu__list-promotion-col'
                    >
                        <MenuPromotionalComponent
                            promotionalComponent={promotionalComponent}
                            onClick={(e, name) => onClick(e, 'Sub-menu Promotion', undefined, undefined, name)}
                        />
                    </div>
                )}
            </div>

            {childrenLinks.map((item, i) => (
                <div
                    key={item.id}
                    className={classNames({ ['destination-menu__list--hidden']: activeItem?.id !== item.id })}
                    data-tid={!!activeItem && activeItem.id === item.id ? 'destination-menu__list--active' : ''}
                >
                    <a href='#' className='go-back' onClick={onGoBackClick}>
                        <span className='go-back__background' />
                        <span className='go-back__content'>{item?.fields?.Link?.value?.text || ''}</span>
                    </a>

                    {item?.fields?.ChildrenLinks?.map((child, j) => (
                        <Fragment key={child.id}>
                            {child?.fields?.Link && (
                                <RouterLink
                                    link={child.fields.Link}
                                    isNoFollowTagEnabled={child.fields?.EnableNoFollowTag?.value}
                                    className='destination-menu__list__item'
                                >
                                    <div
                                        className='list__title'
                                        onClick={e => onClick(e, item?.fields?.Link?.value?.text, i + 1, j + 1)}
                                    >
                                        {getLabel(child)}
                                    </div>
                                </RouterLink>
                            )}
                        </Fragment>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default SubMenuItemMobile;
