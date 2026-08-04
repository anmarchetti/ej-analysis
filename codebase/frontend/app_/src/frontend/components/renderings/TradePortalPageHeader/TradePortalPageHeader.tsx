import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { ITradePortalStores } from 'frontend/store/tradePortal';
import { getNavItemDestination, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import INavLink from 'models/data/INavLink';
import { IPageHeaderFields } from 'models/data/IPageHeaderFields';
import { INavigationClickEventParams } from 'models/data/tracking/IEventWithParams';
import { ShowOn } from 'models/enum/ShowOn';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import JSSImage from 'frontend/components/common/JSSImage';
import Link from 'frontend/components/common/Link';

import TradePortalMenuItem from './components/TradePortalMenuItem';

import styles from './TradePortalPageHeader.module.scss';

export interface IPageHeaderParameters {
    IsHeaderSlim?: TSitecoreCheckboxValue;
}

export interface IPageHeaderProps extends ISitecoreComponent<IPageHeaderFields, IPageHeaderParameters> {
    isHomePage: boolean;
    trackNavigationClick: (
        eventType: EventTypes.NavigationBarMenuClick | EventTypes.NavigationFlyoutMenuClick,
        eventParams: INavigationClickEventParams,
    ) => void;
}

const logoHeaderIndex = 1;

const TradePortalPageHeader = (props: IPageHeaderProps) => {
    const { trackNavigationClick, isLoggedIn, isHomePage } = useStore((stores: ITradePortalStores) => ({
        trackNavigationClick: stores.trackingStore.trackNavigationClick,
        isLoggedIn: stores.userStore.isLoggedIn,
        isHomePage: stores.layoutStore.isHomePage,
    }));

    const mainNavRef = useRef<HTMLUListElement | null>(null);
    const secondaryNavRef = useRef<HTMLUListElement | null>(null);

    const { params } = props;
    const [state, setState] = useState(true);

    const headerClassName = classNames(
        'header_trade',
        state && 'nav-opened',
        params?.IsHeaderSlim ? 'header_trade--slim' : 'header_trade--full',
    );

    const updateMainNavAttributes = () => {
        if (mainNavRef?.current?.children) {
            let counter = logoHeaderIndex + 1;

            for (let i = 0, len = mainNavRef.current.children.length; i < len; i++) {
                const li = mainNavRef.current.children[i];

                if (li.className && !li.classList.contains('logged_in-action')) {
                    li.setAttribute('data-position', counter.toString());
                    counter++;
                }
            }
        }
    };

    const updateSecondaryNavAttributes = () => {
        if (secondaryNavRef?.current?.children) {
            const mainNavVisibleItemsLength =
                props.fields?.MainNav?.filter(el => isUserLinkValid(el, isLoggedIn)).length || 0;
            let counter = logoHeaderIndex + mainNavVisibleItemsLength + 1;

            for (let i = 0, len = secondaryNavRef.current.children.length; i < len; i++) {
                const li = secondaryNavRef.current.children[i];

                if (li.className && !li.classList.contains('is-empty') && !li.classList.contains('has-children')) {
                    li.setAttribute('data-position', counter.toString());
                    counter++;
                }
            }
        }
    };

    useEffect(() => {
        updateMainNavAttributes();
        updateSecondaryNavAttributes();
    });

    if (!props.fields) {
        return null;
    }

    const isUserLinkValid = (item: INavLink, isLoggedIn: boolean): boolean => {
        const showCase = item.fields?.ShowOn?.value;

        return !showCase || (isLoggedIn ? showCase === ShowOn.ShowOnLogedIn : showCase === ShowOn.ShowOnLogedOut);
    };

    const toggleMenu = () => {
        setState(false);
    };

    const onClickLogo = e => {
        // do not reload page on logo click if already on home page
        if (isHomePage) {
            e.preventDefault();
        }

        toggleMenu();

        const target = e.currentTarget as HTMLElement;

        trackNavigationClick(EventTypes.NavigationBarMenuClick, {
            location: 'Top Navigation Bar',
            position: logoHeaderIndex.toString(),
            name: 'Logo',
            destination: getNavItemDestination(target.baseURI),
            type: getNavItemType(!!target.baseURI),
        });
    };

    return (
        <header className={headerClassName} id='header-main'>
            <div className={styles.innerWrapper}>
                {props.fields.LogoLink && (
                    <div className={styles.logoWrapper}>
                        <Link href={'/'} legacyBehavior>
                            <a className={styles.logoLink} onClick={e => onClickLogo(e)}>
                                <span className={styles.ejhLogo}>
                                    <JSSImage
                                        className={styles.ejhLogoImg}
                                        field={props.fields.Logo}
                                        data-tid='ejh-logo'
                                    />
                                </span>
                                {props.fields.TradeLogo && (
                                    <span className={styles.ejhTradeLogo}>
                                        <JSSImage
                                            className={styles.ejhTradeLogoImg}
                                            field={props.fields.TradeLogo}
                                            data-tid='trade-logo'
                                        />
                                    </span>
                                )}
                            </a>
                        </Link>
                    </div>
                )}
                <div className={styles.navContainer}>
                    {!!props.fields.MainNav?.length && (
                        <div className='header_trade__nav'>
                            <div className='header_trade__nav__background' />
                            <nav className='header_trade__navigation'>
                                <ul
                                    ref={el => {
                                        mainNavRef.current = el;
                                    }}
                                >
                                    {props.fields.MainNav.map((item, i) => (
                                        <TradePortalMenuItem
                                            key={item.id + i}
                                            item={item}
                                            onClick={() => toggleMenu()}
                                            isUserLinkValid={isUserLinkValid}
                                            trackNavigationClick={trackNavigationClick}
                                        />
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    )}

                    {!!props.fields.SecondaryNav?.length && (
                        <div className='header_trade__actions'>
                            <nav className='header_trade__navigation'>
                                <ul
                                    ref={el => {
                                        secondaryNavRef.current = el;
                                    }}
                                >
                                    {props.fields.SecondaryNav.map((item, i) => (
                                        <TradePortalMenuItem
                                            isActionMenu
                                            key={item.id + i}
                                            item={item}
                                            onClick={() => toggleMenu()}
                                            isUserLinkValid={isUserLinkValid}
                                            trackNavigationClick={trackNavigationClick}
                                        />
                                    ))}
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default observer(TradePortalPageHeader);
