import React from 'react';
import classNames from 'classnames';
import { action, makeObservable, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import settings from 'code/settings';
import { MarketStore } from 'frontend/store/base';
import { IHolidaysStores } from 'frontend/store/holidays';
import { debounce } from 'frontend/utils/debounce';
import { isHelpItem, isHolidayCreditItem, isLogOutItem, isRedeemVoucherItem } from 'frontend/utils/navigation.utils';
import { getNavItemDestination, getNavItemPosition, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import INavLink from 'models/data/INavLink';
import { MediaSize } from 'models/data/MediaSizeParams';
import { IMyCreditInfo } from 'models/data/MyCreditInfo';
import {
    ICustomParams,
    IEventParams,
    IExcursionsEventParams,
    INavigationClickEventParams,
} from 'models/data/tracking/IEventWithParams';
import { KeyboardKey } from 'models/enum/KeyboardKey';
import { ShowOn } from 'models/enum/ShowOn';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import RouterLink from 'frontend/components/common/RouterLink';
import { withRerender } from 'frontend/components/hoc';
import { IComponentWithRerenderProps } from 'frontend/components/hoc/withRerender';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';

import ShortlistLink from './ShortlistLink/ShortlistLink';
import SubMenuItem from './SubMenuItem';

interface IMenuItemProps extends IComponentWithRerenderProps {
    creditBalance: Nullable<IMyCreditInfo[]>;
    fetchMyCreditBalance: (throwError?: boolean, fromCache?: boolean) => Promise<void>;
    formatMoney: MarketStore['formatMoney'];
    hasCreditHistory: boolean;
    isCreditBookingEnabled: boolean;
    isCreditEnabledApiSettings: boolean;
    isCreditLoading: boolean;
    isGiftCardRedemptionEnabled: boolean;
    isHomePage: boolean;
    isLoggedIn: boolean;
    isScreenLarge: boolean;
    isUserLinkValid: (item: INavLink) => boolean;
    item: INavLink;
    marketCredit: Nullable<IMyCreditInfo>;
    onClick: (e: React.MouseEvent) => void;
    onLogout: () => Promise<void>;
    trackEventWithParams: (
        eventType: EventTypes,
        eventParams: IEventParams | IExcursionsEventParams,
        customParams: ICustomParams,
    ) => void;
    trackNavigationClick: (
        eventType: EventTypes.NavigationBarMenuClick | EventTypes.NavigationFlyoutMenuClick,
        eventParams: INavigationClickEventParams,
    ) => void;
    isActionMenu?: boolean;
}

const LIST_IMAGE_SIZE = 31;
const PARENT_LINK_CLASS_NAME = 'parent-link';

export class MenuItem extends React.Component<IMenuItemProps> {
    constructor(props: IMenuItemProps) {
        super(props);
        makeObservable(this);
    }

    hasPromoBeenTracked = false;

    @observable isOpened: boolean = false;
    @observable isGoBackMenuItemVisible: boolean = true;
    @observable isMounted: boolean = false;

    private readonly menuItemRef = React.createRef<HTMLLIElement>();
    private blurTimeoutId: ReturnType<typeof setTimeout> | null = null;

    componentDidMount(): void {
        this.toggleOpen(false);
        this.setIsMounted(true);
    }

    componentWillUnmount(): void {
        this.toggleOpen(false);

        if (this.blurTimeoutId) {
            clearTimeout(this.blurTimeoutId);
        }
    }

    @action setIsMounted = (state: boolean): void => {
        this.isMounted = state;
    };

    @action toggleOpen = (state: boolean): void => {
        this.isOpened = state;

        if (state) {
            this.loadCreditsIfNeeded();
        }
    };

    private loadCreditsIfNeeded(): void {
        if (
            this.props.isLoggedIn &&
            this.props.isCreditBookingEnabled &&
            this.props.creditBalance == null &&
            (this.props.item.fields.ChildrenLinks || []).some(isHolidayCreditItem)
        ) {
            this.props.fetchMyCreditBalance(false, true);
        }
    }

    @action toggleIsGoBackMenuItemVisible = (state: boolean): void => {
        this.isGoBackMenuItemVisible = state;
    };

    debouncedMenuToggle = debounce((isOpened: boolean) => {
        this.toggleOpen(isOpened);
    }, settings.HeaderMenu.HoverDelay);

    private readonly toggleMenu = (event: React.MouseEvent | React.KeyboardEvent, isOpened: boolean): void => {
        if (!this.props.item.fields.ChildrenLinks || this.props.item.fields.ChildrenLinks.length === 0) {
            return;
        }

        event.preventDefault();

        if (this.props.isScreenLarge && !this.props.isActionMenu) {
            this.debouncedMenuToggle(isOpened);
            this.trackPromoComponent();

            if (isOpened) {
                return;
            }
        }

        this.toggleOpen(isOpened);
    };

    private readonly onKeyDown = (event: React.KeyboardEvent): void => {
        if (!this.props.item.fields.ChildrenLinks?.length) {
            return;
        }

        if (event.key === KeyboardKey.ArrowDown) {
            event.preventDefault();
            this.toggleMenu(event, true);
        }

        if (event.key === KeyboardKey.ArrowUp || event.key === KeyboardKey.ESCAPE) {
            event.preventDefault();
            this.toggleMenu(event, false);

            if (this.menuItemRef.current) {
                const parentLinkElement: HTMLElement | null = this.menuItemRef.current.querySelector(
                    `.${PARENT_LINK_CLASS_NAME}`,
                );
                parentLinkElement?.focus();
            }
        }
    };

    private readonly onFocus = (): void => {
        if (this.props.isActionMenu) {
            this.toggleOpen(true);
        }
    };

    private readonly onBlur = (): void => {
        if (!this.props.isScreenLarge) {
            return;
        }

        if (this.blurTimeoutId) {
            clearTimeout(this.blurTimeoutId);
        }

        // SetTimeout is used to allow focus to move to children before checking
        this.blurTimeoutId = setTimeout(() => {
            const activeElement = document.activeElement as HTMLElement;
            const menuContainer = this.menuItemRef.current;

            if (menuContainer && !menuContainer.contains(activeElement)) {
                this.toggleOpen(false);
            }

            this.blurTimeoutId = null;
        }, 0);
    };

    trackPromoComponent = (): void => {
        const { fields } = this.props.item;

        if (!this.props.isHomePage || this.hasPromoBeenTracked) {
            return;
        }

        const linkEl = this.menuItemRef.current?.querySelector('.destination-menu__list-promotional-link');
        const promoLinkText =
            linkEl?.cloneNode(true).textContent?.trim() || fields.PromotionalComponent?.fields?.Title?.value;

        this.props.trackEventWithParams(
            EventTypes.GenericEvent,
            {
                eventAction: EventActions.NavigationBanner,
                eventCategory: EventCategories.Homepage,
                eventLabel: promoLinkText,
                eventType: EventTypes.NonInteraction,
                eventValue: 'null',
            },
            GENERIC_CUSTOM_PARAMS_EMPTY,
        );
        this.hasPromoBeenTracked = true;
    };

    private readonly onClickItem = (e: any, innerText?: string, isNavItem?: boolean): void => {
        const target = e.target as HTMLAnchorElement;
        const href = target.href || e.currentTarget.href;

        this.props.trackNavigationClick(EventTypes.NavigationBarMenuClick, {
            location: 'Top Navigation Bar',
            position: getNavItemPosition(target),
            name: innerText || target.innerText,
            destination: getNavItemDestination(isNavItem ? null : href),
            type: getNavItemType(!isNavItem && !!href),
        });

        if (this.props.item.fields?.ChildrenLinks?.length && !this.props.isScreenLarge) {
            // handle click on Desktop even if children found
            this.toggleMenu(e, true);
        } else {
            this.props.onClick(e);
        }

        if (document.activeElement) {
            const link = document.activeElement as HTMLElement;
            link.blur();
        }
    };

    private readonly getItemInnerText = (): string | undefined => {
        const { item, isActionMenu } = this.props;

        if (isHelpItem(item)) {
            return 'Help';
        }

        if (isActionMenu && !!item.fields.ChildrenLinks?.length) {
            return 'Account Icon';
        }

        return undefined;
    };

    private readonly onClickAccountAction = (e: any, currentItemIndex: number, name?: string): void => {
        this.toggleOpen(false);

        const target = e.currentTarget.children?.[0] || e.target;

        this.props.trackNavigationClick(EventTypes.NavigationFlyoutMenuClick, {
            location: 'Top Overlay Menu - Actions',
            position: getNavItemPosition(target, currentItemIndex),
            name: name || target.innerText,
            destination: getNavItemDestination(target.href),
            section: 'Account options',
            parentItem: 'Account',
            type: getNavItemType(!!target.href),
        });
    };

    private get actionMenuItems(): INavLink[] {
        return (this.props.item.fields.ChildrenLinks || []).filter(
            child => !!(child.fields.Link?.value && this.props.isUserLinkValid(child)),
        );
    }

    private readonly getHolidayCreditLabel = (item: INavLink): JSX.Element => (
        <>
            {item.fields.Link.value.text}
            {this.props.isCreditLoading ? (
                <span
                    className='placeholder-shimmer'
                    style={{
                        display: 'inline-block',
                        width: '3.5em',
                        height: '0.85em',
                        marginLeft: '0.4em',
                        borderRadius: '0.5em',
                        verticalAlign: 'middle',
                    }}
                    data-tid='credit-balance-loading'
                />
            ) : (
                this.props.creditBalance?.length === 1 &&
                this.props.marketCredit?.hasCreditHistory && (
                    <>
                        {': '}
                        <span data-cs-mask>
                            {this.props.formatMoney(this.props.marketCredit.balance || 0, {
                                currency: this.props.marketCredit.currency,
                            })}
                        </span>
                    </>
                )
            )}
        </>
    );

    private readonly renderHolidayCreditActionItem = (item: INavLink, currentItemIndex: number): JSX.Element | null => {
        if (
            !this.props.isCreditBookingEnabled ||
            (!this.props.isCreditEnabledApiSettings && !this.props.isCreditLoading)
        ) {
            return null;
        }

        return (
            <li
                key={item.id}
                onClick={(e: React.MouseEvent<HTMLLIElement, MouseEvent>): void =>
                    this.onClickAccountAction(e, currentItemIndex, item.fields?.Link?.value?.text)
                }
            >
                <RouterLink
                    link={item.fields?.Link}
                    isNoFollowTagEnabled={item.fields?.EnableNoFollowTag?.value}
                    className='block-link'
                >
                    {this.getHolidayCreditLabel(item)}
                    <i className='icon-chevron'>
                        <SvgChevronRight />
                    </i>
                </RouterLink>
            </li>
        );
    };

    private readonly renderRedeemVoucherActionItem = (item: INavLink, currentItemIndex: number): JSX.Element | null => {
        if (!this.props.isGiftCardRedemptionEnabled) {
            return null;
        }

        return (
            <li
                key={item.id}
                onClick={(e: React.MouseEvent<HTMLLIElement, MouseEvent>): void =>
                    this.onClickAccountAction(e, currentItemIndex)
                }
            >
                {item.fields?.Link && (
                    <RouterLink
                        link={item.fields?.Link}
                        isNoFollowTagEnabled={item.fields?.EnableNoFollowTag?.value}
                        className='block-link'
                    >
                        {this.renderActionMenuContent(item.fields.Link.value.text)}
                    </RouterLink>
                )}
            </li>
        );
    };

    private readonly renderLogOutActionItem = (item: INavLink, currentItemIndex: number): JSX.Element => (
        <li key={item.id}>
            {item.fields?.Link && (
                <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
                        this.onClickAccountAction(e, currentItemIndex);
                        this.props.onLogout();
                    }}
                    data-logout={true}
                >
                    {this.renderActionMenuContent(item.fields.Link.value.text)}
                </button>
            )}
        </li>
    );

    private readonly renderActionMenuContent = (text: string): JSX.Element => (
        <>
            <span>{text}</span>
            <i className='icon-chevron'>
                <SvgChevronRight />
            </i>
        </>
    );

    // FIX: Getter to ensure isScreenLarge matches server until mounted
    get isScreenLargeSafe(): boolean {
        return this.props.isScreenLarge && this.isMounted;
    }

    private readonly renderDesktopShortlistLink = (listItemClassName: string): JSX.Element | null => {
        const showOnValue = this.props.item.fields.ShowOn?.value;
        const isRenderForbidden = showOnValue && showOnValue !== ShowOn.ShowOnDesktop;

        if (isRenderForbidden) {
            return null;
        }

        return (
            <li className={classNames(listItemClassName, 'hide-down-lg')}>
                <ShortlistLink
                    onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void =>
                        this.onClickItem(e, 'Shortlist', true)
                    }
                />
            </li>
        );
    };

    private readonly renderChildrenLinks = (): JSX.Element | null => {
        if (this.props.isActionMenu) {
            const popoverListClassName = classNames({ 'is-shown': this.isOpened });

            return (
                <ul className={popoverListClassName}>
                    {this.actionMenuItems.map((child, i) => {
                        if (isHolidayCreditItem(child)) {
                            return this.renderHolidayCreditActionItem(child, i + 1);
                        }

                        if (isRedeemVoucherItem(child)) {
                            return this.renderRedeemVoucherActionItem(child, i + 1);
                        }

                        if (child.fields.Link?.value?.querystring && isLogOutItem(child.fields.Link.value.querystring))
                            return this.renderLogOutActionItem(child, i + 1);

                        return (
                            <li
                                key={child.id}
                                onClick={(e: React.MouseEvent<HTMLLIElement, MouseEvent>): void =>
                                    this.onClickAccountAction(e, i + 1)
                                }
                            >
                                {child.fields?.Link && (
                                    <RouterLink
                                        link={child.fields.Link}
                                        isNoFollowTagEnabled={child.fields?.EnableNoFollowTag?.value}
                                    >
                                        {this.renderActionMenuContent(child.fields.Link.value.text)}
                                    </RouterLink>
                                )}
                            </li>
                        );
                    })}
                </ul>
            );
        }

        const destMenuClassName = classNames('destination-menu', { 'is-shown': this.isOpened });
        const subMenuWrapperClassName = classNames('wrapper-container submenu-wrapper-container', {
            'mx-3 mx-xl-auto': this.props.wasRerendered && this.isScreenLargeSafe,
        });

        return (
            <div className={destMenuClassName}>
                {this.isGoBackMenuItemVisible && (
                    <a
                        href='#'
                        className='go-back'
                        onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void =>
                            this.toggleMenu(e, false)
                        }
                    >
                        <span className='go-back__background' />
                        <span className='go-back__content'>{this.props.item?.fields?.Link?.value?.text || ''}</span>
                    </a>
                )}

                <div className={subMenuWrapperClassName}>
                    <div className='destination-menu__container has-full-width'>
                        <SubMenuItem
                            childrenLinks={this.props.item.fields.ChildrenLinks}
                            promotionalComponent={this.props.item.fields.PromotionalComponent}
                            onClick={(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>): void => {
                                this.toggleOpen(false);
                                this.props.onClick(e);
                            }}
                            isUserLinkValid={this.props.isUserLinkValid}
                            getHolidayCreditLabel={this.getHolidayCreditLabel}
                            isOpened={this.isOpened}
                            toggleIsGoBackMenuItemVisible={this.toggleIsGoBackMenuItemVisible}
                            parentItemName={this.props.item.fields.Link.value.text}
                        />
                    </div>
                </div>
            </div>
        );
    };

    render() {
        const { props } = this;

        if (!this.props.item.fields) {
            return null;
        }

        const isImageLink = props.item.fields.Image || props.item.fields.IsShortList?.value;
        const listItemClassName = classNames({
            navigation__link: !props.isActionMenu,
            'navigation__link--icon': props.isActionMenu && isImageLink,
            navigation__button: props.isActionMenu && !isImageLink,
            'mobile-button':
                props.isActionMenu &&
                props.item.fields.ShowOn &&
                (props.item.fields.ShowOn.value === ShowOn.ShowOnLogedIn ||
                    props.item.fields.ShowOn.value === ShowOn.ShowOnLogedOut) &&
                !props.item.fields.Image,
            'logged_in-action': !props.isActionMenu && props.item.fields.ShowOn?.value,
            'has-children': !!this.props.item.fields.ChildrenLinks?.length,
            'is-empty': !this.props.isUserLinkValid(this.props.item),
        });

        if (props.item.fields.IsShortList?.value) {
            return this.renderDesktopShortlistLink(listItemClassName);
        }

        if (props.item.fields.Link?.value?.querystring && isLogOutItem(props.item.fields.Link.value.querystring))
            return (
                <li className={listItemClassName}>
                    <button
                        onClick={e => {
                            this.onClickItem(e, this.getItemInnerText());
                            this.props.onLogout();
                        }}
                        onMouseEnter={e => this.props.isScreenLarge && this.toggleMenu(e, true)}
                        onMouseLeave={e => this.props.isScreenLarge && this.toggleMenu(e, false)}
                        className={PARENT_LINK_CLASS_NAME}
                        data-logout={true}
                        data-tid='menu-logout-button'
                    >
                        <span className='link-label'>{props.item?.fields?.Link?.value?.text}</span>
                    </button>
                </li>
            );

        return !isRedeemVoucherItem(this.props.item) ||
            (isRedeemVoucherItem(this.props.item) && this.props.isGiftCardRedemptionEnabled) ? (
            /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
            <li
                ref={this.menuItemRef}
                className={listItemClassName}
                onMouseEnter={e => this.props.isScreenLarge && this.toggleMenu(e, true)}
                onMouseLeave={e => this.props.isScreenLarge && this.toggleMenu(e, false)}
                onKeyDown={this.onKeyDown}
                onBlur={this.onBlur}
                onFocus={this.onFocus}
                data-tid='menu-item'
            >
                {this.props.isUserLinkValid(this.props.item) && (
                    <>
                        <RouterLink
                            link={props.item.fields.Link}
                            className={PARENT_LINK_CLASS_NAME}
                            isNoFollowTagEnabled={props.item.fields?.EnableNoFollowTag?.value}
                            onClick={e => this.onClickItem(e, this.getItemInnerText())}
                            ariaLabel={props.item.fields.Link.value.text || props.item.fields.Image?.value.alt}
                            dataId='menu-link'
                        >
                            {props.item.fields.Image ? (
                                <JSSImageNext
                                    field={props.item.fields.Image}
                                    width={LIST_IMAGE_SIZE}
                                    height={LIST_IMAGE_SIZE}
                                    mediaSize={MediaSize.Small}
                                />
                            ) : (
                                <span className='link-label' data-tid='menu-link-label'>
                                    {props.item?.fields?.Link?.value?.text}
                                </span>
                            )}
                            {!!this.props.item.fields.ChildrenLinks?.length && <IconChevronDown />}
                        </RouterLink>

                        {!!this.props.item.fields.ChildrenLinks?.length && this.renderChildrenLinks()}
                    </>
                )}
            </li>
        ) : null;
    }
}

export default inject((stores: IHolidaysStores) => ({
    hasCreditHistory: stores.holidayCreditStore.hasCreditHistory,
    creditBalance: stores.holidayCreditStore.creditBalance,
    fetchMyCreditBalance: stores.holidayCreditStore.fetchMyCreditBalance,
    isCreditLoading: stores.holidayCreditStore.isCreditLoading,
    marketCredit: stores.holidayCreditStore.marketCredit,
    isCreditBookingEnabled: stores.holidayCreditStore.isCreditBookingEnabled,
    isCreditEnabledApiSettings: stores.holidayCreditStore.isCreditEnabledApiSettings,
    isScreenLarge: stores.appStore.isScreenLarge,
    trackNavigationClick: stores.trackingStore.trackNavigationClick,
    isGiftCardRedemptionEnabled: stores.layoutStore.isGiftCardRedemptionEnabled,
    trackEventWithParams: stores.trackingStore.trackEventWithParams,
    isHomePage: stores.layoutStore.isHomePage,
    formatMoney: stores.marketStore.formatMoney,
    onLogout: stores.userStore.onLogout,
    isLoggedIn: stores.userStore.isLoggedIn,
}))(withRerender(observer(MenuItem)));
