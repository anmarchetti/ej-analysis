import { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { isUserLinkValid } from 'frontend/utils/navigation.utils';
import INavLink from 'models/data/INavLink';
import { IPageHeaderFields } from 'models/data/IPageHeaderFields';
import { ShowOn } from 'models/enum/ShowOn';
import LanguageSelector from 'frontend/components/renderings/LanguageSelector/LanguageSelector';
import MenuItem from 'frontend/components/renderings/static/PageHeader/components/MenuItem';
import ShortlistLink from 'frontend/components/renderings/static/PageHeader/components/ShortlistLink/ShortlistLink';

import styles from './HeaderNavigation.module.scss';

export interface IHeaderNavigationProps {
    fields: IPageHeaderFields;
    isOpen: boolean;
    burgerClassName?: string;
    onToggleHeaderMenu?: (isOpen: boolean) => void;
    setMainRef?: (el: HTMLUListElement | null) => void;
    setSecondaryRef?: (el: HTMLUListElement | null) => void;
}

const HeaderNavigation: FC<IHeaderNavigationProps> = ({
    fields,
    setMainRef,
    setSecondaryRef,
    burgerClassName,
    onToggleHeaderMenu,
    isOpen,
}) => {
    const {
        isMobileAppHideFeatures,
        toggleReCaptchaBadge,
        isLoggedIn,
        isConfirmationPage,
        isViewBookingPage,
        viewBooking,
        booking,
        isCheckInAvailable,
    } = useStore((stores: IHolidaysStores) => ({
        isMobileAppHideFeatures: stores.layoutStore.isMobileAppHideFeatures,
        toggleReCaptchaBadge: stores.reCaptchaStore.toggleReCaptchaBadge,
        isLoggedIn: stores.userStore.isLoggedIn,
        isConfirmationPage: stores.layoutStore.isConfirmationPage,
        isViewBookingPage: stores.layoutStore.isViewBookingPage,
        viewBooking: stores.viewBookingStore.booking,
        booking: stores.bookingStore.booking,
        isCheckInAvailable: stores.bookingStore.isCheckInAvailable,
    }));

    const toggleMenu = (isOpenState: boolean): void => {
        if (isOpenState) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        toggleReCaptchaBadge(!isOpenState);

        onToggleHeaderMenu?.(isOpenState);
    };

    const headerBurgerClassName = classNames('header__burger__btn', {
        ['header__burger__btn--opened']: isOpen,
    });

    const renderMobileShortlistLink = (): JSX.Element | null => {
        const shortListLink = fields?.SecondaryNav?.find(x => x.fields?.IsShortList?.value);
        const showOnValue = shortListLink?.fields?.ShowOn?.value;

        const isRenderForbidden = !shortListLink || (showOnValue && showOnValue !== ShowOn.ShowOnMobile);

        if (isRenderForbidden) {
            return null;
        }

        return (
            <div className='hide-up-lg'>
                <ShortlistLink />
            </div>
        );
    };

    const isLinkValid = (item: INavLink): boolean =>
        isUserLinkValid({
            item,
            isLoggedIn,
            isBookingConfirmationPage: isConfirmationPage,
            booking,
            viewBooking,
            isViewBookingPage,
            isCheckInAvailable,
        });

    return (
        <>
            {!!(fields.MainNav?.length || fields.SecondaryNav?.length) && (
                <div className={classNames('header__burger', burgerClassName)}>
                    <button
                        className={headerBurgerClassName}
                        onClick={(): void => toggleMenu(!isOpen)}
                        aria-label={fields.MenuAriaLabel?.value}
                        aria-expanded={isOpen}
                        aria-controls='menu'
                    >
                        <span />
                    </button>
                </div>
            )}

            {!!fields.MainNav?.length && (
                <div className={classNames('header__nav', { [styles.opened]: isOpen })} id='menu'>
                    <div className='header__nav__background' />
                    <nav className='navigation' aria-label={fields.PrimaryNavigationAriaLabel?.value}>
                        <ul ref={(el): void => setMainRef?.(el)}>
                            {fields.MainNav.map((item, i) => (
                                <MenuItem
                                    key={item.id + i}
                                    item={item}
                                    onClick={(): void => toggleMenu(false)}
                                    isUserLinkValid={isLinkValid}
                                />
                            ))}
                        </ul>
                    </nav>
                </div>
            )}

            {(!!fields.SecondaryNav?.length || !!fields.LanguageSelector?.fields) && (
                <div className={classNames('header__actions', styles.actions)}>
                    <nav className='navigation icons' aria-label={fields.ActionNavigationAriaLabel?.value}>
                        <ul ref={(el): void => setSecondaryRef?.(el)}>
                            {!!fields.SecondaryNav?.length &&
                                fields.SecondaryNav.map((item, i) => (
                                    <MenuItem
                                        isActionMenu
                                        key={item.id + i}
                                        item={item}
                                        onClick={(): void => toggleMenu(false)}
                                        isUserLinkValid={isLinkValid}
                                    />
                                ))}
                        </ul>
                    </nav>

                    {!isMobileAppHideFeatures && renderMobileShortlistLink()}

                    {!isMobileAppHideFeatures && !!fields.LanguageSelector?.fields && (
                        <LanguageSelector fields={fields.LanguageSelector.fields} />
                    )}
                </div>
            )}
        </>
    );
};

export default HeaderNavigation;
