import * as React from 'react';
import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { inject } from 'mobx-react';

import { IHolidaysStores } from 'frontend/store/holidays';
import { isUserLinkValid } from 'frontend/utils/navigation.utils';
import { getNavItemDestination, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import { HeaderEvents, IHeaderEventsPayload } from 'models/customEvents/HeaderEvents';
import { IPageHeaderFields } from 'models/data/IPageHeaderFields';
import { MediaSize } from 'models/data/MediaSizeParams';
import { INavigationClickEventParams } from 'models/data/tracking/IEventWithParams';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import HeaderNavigation from 'frontend/components/common/HeaderNavigation/HeaderNavigation';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import Link from 'frontend/components/common/Link';
import { withRerender } from 'frontend/components/hoc';

export interface IPageHeaderParameters {
    IsHeaderSlim?: TSitecoreCheckboxValue;
}

export interface IPageHeaderProps extends ISitecoreComponent<IPageHeaderFields, IPageHeaderParameters> {
    basePath: string;
    booking: any;
    clearViewBooking: () => void;
    isCheckInAvailable: (booking) => boolean;
    isConfirmationPage: boolean;
    isHomePage: boolean;
    isMobileAppHideFeatures: boolean;
    isPaymentPage: boolean;
    isScreenLarge: boolean;
    isShowLoginPopup: boolean;
    isViewBookingPage: boolean;
    toggleShowLoginPopup: (state: boolean) => void;
    trackNavigationClick: (
        eventType: EventTypes.NavigationBarMenuClick | EventTypes.NavigationFlyoutMenuClick,
        eventParams: INavigationClickEventParams,
    ) => void;
    viewBooking: any;
    isLoggedIn?: boolean;
}

interface IMenuState {
    isMounted: boolean;
    isOpen: boolean;
}

const logoHeaderIndex = 1;
const LOGO_SIZE = { width: 166, height: 45 };

export class PageHeader extends React.PureComponent<IPageHeaderProps, IMenuState> {
    private mainNavRef: HTMLUListElement | null;
    private secondaryNavRef: HTMLUListElement | null;

    state = {
        isOpen: false,
        isMounted: false,
    };

    componentDidMount() {
        this.setState({ isMounted: true });

        this.updateMainNavAttributes();
        this.updateSecondaryNavAttributes();

        document.addEventListener(HeaderEvents.ToggleMobile, this.handleHeaderEvent);
    }

    componentWillUnmount() {
        document.removeEventListener(HeaderEvents.ToggleMobile, this.handleHeaderEvent);
    }

    componentDidUpdate(prevProps: IPageHeaderProps) {
        if (prevProps.isLoggedIn !== this.props.isLoggedIn || prevProps.isScreenLarge !== this.props.isScreenLarge) {
            this.updateMainNavAttributes();
            this.updateSecondaryNavAttributes();
        }
    }

    updateMainNavAttributes = (): void => {
        if (this.mainNavRef?.children) {
            let counter = logoHeaderIndex + 1;

            for (let i = 0, len = this.mainNavRef.children.length; i < len; i++) {
                const li = this.mainNavRef.children[i];

                if (
                    li.className &&
                    (this.props.isScreenLarge
                        ? !li.classList.contains('logged_in-action')
                        : !(li.classList.contains('is-empty') && li.classList.contains('logged_in-action')))
                ) {
                    li.setAttribute('data-position', counter.toString());
                    counter++;
                }
            }
        }
    };

    updateSecondaryNavAttributes = (): void => {
        if (this.secondaryNavRef?.children) {
            const mainNavVisibleItemsLength =
                this.props.fields?.MainNav?.filter(el =>
                    this.props.isScreenLarge
                        ? el.fields.ShowOn && !el.fields.ShowOn.value
                        : isUserLinkValid({
                              item: el,
                              isLoggedIn: this.props.isLoggedIn,
                              isBookingConfirmationPage: this.props.isConfirmationPage,
                              booking: this.props.booking,
                              isCheckInAvailable: this.props.isCheckInAvailable,
                              isViewBookingPage: this.props.isViewBookingPage,
                              viewBooking: this.props.viewBooking,
                          }),
                ).length || 0;
            let counter = logoHeaderIndex + mainNavVisibleItemsLength + 1;

            for (let i = 0, len = this.secondaryNavRef.children.length; i < len; i++) {
                const li = this.secondaryNavRef.children[i];

                if (
                    li.className &&
                    (this.props.isScreenLarge
                        ? !li.classList.contains('is-empty') && !li.classList.contains('mobile-button')
                        : !li.classList.contains('is-empty') && !li.classList.contains('has-children'))
                ) {
                    li.setAttribute('data-position', counter.toString());
                    counter++;
                }
            }
        }
    };

    handleHeaderEvent = (event: CustomEvent<IHeaderEventsPayload[HeaderEvents.ToggleMobile]>) => {
        this.toggleMenu(event.detail.isOpen);
    };

    toggleMenu = (isOpen: boolean): void => {
        this.setState({ isOpen });
    };

    setMainNavRef = (el: HTMLUListElement | null): void => {
        this.mainNavRef = el;
    };

    setSecondaryNavRef = (el: HTMLUListElement | null): void => {
        this.secondaryNavRef = el;
    };

    private onClickLogo(e) {
        // do not reload page on logo click if already on home page
        if (this.props.isHomePage) {
            e.preventDefault();
        }

        this.toggleMenu(false);

        const target = e.currentTarget as HTMLElement;

        this.props.trackNavigationClick(EventTypes.NavigationBarMenuClick, {
            location: 'Top Navigation Bar',
            position: logoHeaderIndex.toString(),
            name: 'Logo',
            destination: getNavItemDestination(target.baseURI),
            type: getNavItemType(!!target.baseURI),
        });

        this.props.clearViewBooking();
    }

    render() {
        if (this.props.isMobileAppHideFeatures) {
            return null;
        }

        const { props } = this;
        const { params, fields } = props;

        const headerClassName = classNames(
            'header',
            this.state.isOpen && 'nav-opened',
            params?.IsHeaderSlim ? 'header--slim' : 'header--full',
        );

        if (!fields) {
            return null;
        }

        return (
            <>
                <header className={headerClassName} id='header-main'>
                    <div className='header__bg'>
                        <div className='header__bg--left' />
                        <div className='header__bg--center' />
                        <div className='header__bg--right' />
                    </div>
                    <div className='header__inner'>
                        {fields.LogoLink && (
                            <div className='header__logo'>
                                {props.isPaymentPage ? ( // EJH-17746: dataLayer should not be empty after returning to previous page
                                    <a href={props.basePath}>
                                        <JSSImageNext
                                            field={fields.Logo}
                                            mediaSize={MediaSize.Small}
                                            {...LOGO_SIZE}
                                            priority
                                        />
                                    </a>
                                ) : (
                                    <Link href={'/'} legacyBehavior>
                                        <a onClick={e => this.onClickLogo(e)}>
                                            <JSSImageNext
                                                field={fields.Logo}
                                                mediaSize={MediaSize.Small}
                                                {...LOGO_SIZE}
                                                priority
                                            />
                                        </a>
                                    </Link>
                                )}
                            </div>
                        )}

                        <HeaderNavigation
                            fields={fields}
                            setMainRef={this.setMainNavRef}
                            setSecondaryRef={this.setSecondaryNavRef}
                            onToggleHeaderMenu={isOpen => this.toggleMenu(isOpen)}
                            isOpen={this.state.isOpen}
                        />
                    </div>
                </header>

                <Placeholder
                    name={PlaceholderNames.LoginPopup}
                    rendering={props.rendering}
                    onClose={() => props.toggleShowLoginPopup?.(false)}
                    isShowPopup={props.isShowLoginPopup}
                />
            </>
        );
    }
}

const ConnectedPageHeader = inject((stores: IHolidaysStores) => ({
    isScreenLarge: stores.appStore.isScreenLarge,
    isHomePage: stores.layoutStore.isHomePage,
    isLoggedIn: stores.userStore.isLoggedIn,
    isShowLoginPopup: stores.shortlistStore.isShowLoginPopup,
    booking: stores.bookingStore.booking,
    isCheckInAvailable: stores.bookingStore.isCheckInAvailable,
    isConfirmationPage: stores.layoutStore.isConfirmationPage,
    isViewBookingPage: stores.layoutStore.isViewBookingPage,
    toggleShowLoginPopup: stores.shortlistStore.toggleShowLoginPopup,
    trackNavigationClick: stores.trackingStore.trackNavigationClick,
    viewBooking: stores.viewBookingStore.booking,
    isPaymentPage: stores.layoutStore.isPaymentPage,
    basePath: stores.layoutStore.basePath,
    clearViewBooking: stores.viewBookingStore.clearBooking,
    isMobileAppHideFeatures: stores.layoutStore.isMobileAppHideFeatures,
}))(PageHeader);

export default withRerender(ConnectedPageHeader);
