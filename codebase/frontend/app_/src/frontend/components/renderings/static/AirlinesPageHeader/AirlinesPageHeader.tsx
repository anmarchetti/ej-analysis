import { Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { getNavItemDestination, getNavItemType } from 'frontend/utils/tracking/tracking.utils';
import { IPageHeaderFields } from 'models/data/IPageHeaderFields';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import Link from 'frontend/components/common/Link';

import styles from './AirlinesPageHeader.module.scss';

export const AirlinesPageHeader: React.FC<ISitecoreComponent<IPageHeaderFields, undefined>> = ({
    fields,
    rendering,
}) => {
    const { isPaymentPage, basePath, trackNavigationClick, clearBooking } = useStore(stores => ({
        ...(isHolidayStore(stores) && {
            isPaymentPage: stores.layoutStore.isPaymentPage,
        }),

        basePath: stores.layoutStore.basePath,
        trackNavigationClick: stores.trackingStore.trackNavigationClick,
        clearBooking: stores.viewBookingStore.clearBooking,
    }));

    if (!fields) return null;

    return (
        <header className={styles.header}>
            <nav className={styles.nav}>
                <div className={styles.column}>
                    {isPaymentPage ? (
                        <a href={basePath} className={styles.link}>
                            <JSSImageNext field={fields.Logo} width={114} height={26} priority />
                        </a>
                    ) : (
                        <Link
                            href={fields.LogoLink?.value?.href ?? '/'}
                            onClick={(e: React.MouseEvent<HTMLElement>): void => {
                                const target = e.currentTarget;

                                trackNavigationClick(EventTypes.NavigationBarMenuClick, {
                                    location: 'Top Navigation Bar',
                                    position: '1',
                                    name: 'Logo',
                                    destination: getNavItemDestination(target.baseURI),
                                    type: getNavItemType(!!target.baseURI),
                                });

                                clearBooking();
                            }}
                            className={styles.link}
                        >
                            <JSSImageNext field={fields.Logo} width={114} height={26} priority />
                        </Link>
                    )}
                </div>
            </nav>

            {!!rendering?.placeholders?.[PlaceholderNames.TitleBar]?.length && (
                <div className={styles.titleBar}>
                    <div className={styles.column}>
                        <Placeholder name={PlaceholderNames.TitleBar} rendering={rendering} />
                    </div>
                </div>
            )}

            {!!rendering?.placeholders?.[PlaceholderNames.Subheader]?.length && (
                <div className={styles.subheader}>
                    <div className={styles.column}>
                        <Placeholder name={PlaceholderNames.Subheader} rendering={rendering} />
                    </div>
                </div>
            )}
        </header>
    );
};

export default observer(AirlinesPageHeader);
