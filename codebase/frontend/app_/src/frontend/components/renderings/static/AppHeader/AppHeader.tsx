import { FC, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import { IPageHeaderFields } from 'models/data/IPageHeaderFields';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import HeaderNavigation from 'frontend/components/common/HeaderNavigation/HeaderNavigation';
import BackButton from 'frontend/components/renderings/static/AppHeader/components/BackButton';
import { IPageHeaderParameters } from 'frontend/components/renderings/static/PageHeader/PageHeader';

import styles from './AppHeader.module.scss';

type TAppHeaderProps = ISitecoreComponent<IPageHeaderFields, IPageHeaderParameters>;

const AppHeader: FC<TAppHeaderProps> = ({ fields }) => {
    const {
        isMobileAppHideFeatures,
        isMobileAppDarkMode,
        isHomePage,
        isSearchResultsPage,
        isHotelDetailsBookPage,
        isHotelDetailsBrowsePage,
        isExtrasPage,
        isGuestDetailsPage,
        isPaymentPage,
    } = useStore((stores: IHolidaysStores) => ({
        isMobileAppHideFeatures: stores.layoutStore.isMobileAppHideFeatures,
        isMobileAppDarkMode: stores.layoutStore.isMobileAppDarkMode,
        isHomePage: stores.layoutStore.isHomePage,
        isSearchResultsPage: stores.layoutStore.isSearchResultsPage,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
        isHotelDetailsBrowsePage: stores.layoutStore.isHotelDetailsBrowsePage,
        isExtrasPage: stores.layoutStore.isExtrasPage,
        isGuestDetailsPage: stores.layoutStore.isGuestDetailsPage,
        isPaymentPage: stores.layoutStore.isPaymentPage,
    }));
    const mainNavRef = useRef<HTMLUListElement | null>(null);
    const secondaryNavRef = useRef<HTMLUListElement | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const shouldShowBurgerMenu = isHomePage;
    const shouldShowBackButton =
        isSearchResultsPage ||
        isHotelDetailsBookPage ||
        isHotelDetailsBrowsePage ||
        isExtrasPage ||
        isGuestDetailsPage ||
        isPaymentPage;

    if (!isMobileAppHideFeatures || (!shouldShowBurgerMenu && !shouldShowBackButton)) {
        return null;
    }

    const setMainNavRef = (el: HTMLUListElement | null): void => {
        mainNavRef.current = el;
    };

    const setSecondaryNavRef = (el: HTMLUListElement | null): void => {
        secondaryNavRef.current = el;
    };

    return (
        <header
            className={classNames(styles.appHeader, {
                [styles.darkMode]: isMobileAppDarkMode,
                'nav-opened': isMenuOpen,
            })}
            id='header-main'
        >
            <div className={classNames('header__inner', styles.headerInner)}>
                {shouldShowBackButton && <BackButton />}
                {shouldShowBurgerMenu && fields && (
                    <HeaderNavigation
                        fields={fields}
                        setMainRef={setMainNavRef}
                        setSecondaryRef={setSecondaryNavRef}
                        burgerClassName={styles.headerNavigation}
                        onToggleHeaderMenu={setIsMenuOpen}
                        isOpen={isMenuOpen}
                    />
                )}
            </div>
        </header>
    );
};

export default observer(AppHeader);
