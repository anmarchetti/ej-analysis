import React, { FC } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { NINE, NINETY_NINE } from 'code/commonNumbers';
import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import Button from 'frontend/components/common/Button';
import SvgHeart from 'frontend/components/icons/Heart';
import BookingInShortlistPopup from 'frontend/components/renderings/SearchResults/components/BookingInShortlistPopup';

import styles from './ShortlistLink.module.scss';

export interface IShortlistLinkProps {
    onClick?: (e: React.MouseEvent) => void;
}

const ShortlistLink: FC<IShortlistLinkProps> = ({ onClick }) => {
    const {
        isShowBookingInShortlistPopup,
        savedOffersCount,
        isLoggedIn,
        savePageBreadcrumbs,
        setRedirectToShortlistPage,
        toggleShowLoginPopup,
        redirectToShortlistsNoResultsPage,
        redirectToShortlistsPage,
        isShortlistEnabled,
    } = useStore((stores: IHolidaysStores) => ({
        isShowBookingInShortlistPopup: stores.shortlistStore.isShowBookingInShortlistPopup,
        savedOffersCount: stores.shortlistStore.savedOffersCount,
        isLoggedIn: stores.userStore.isLoggedIn,
        savePageBreadcrumbs: stores.shortlistStore.savePageBreadcrumbs,
        setRedirectToShortlistPage: stores.shortlistStore.setRedirectToShortlistPage,
        toggleShowLoginPopup: stores.shortlistStore.toggleShowLoginPopup,
        redirectToShortlistsNoResultsPage: stores.routerStore.redirectToShortlistNoResultsPage,
        redirectToShortlistsPage: stores.routerStore.redirectToShortlistPage,
        isShortlistEnabled: stores.shortlistStore.isShortlistEnabled,
    }));

    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        e.preventDefault();

        if (isLoggedIn) {
            savedOffersCount ? redirectToShortlistsPage() : redirectToShortlistsNoResultsPage();
        } else {
            setRedirectToShortlistPage(true);
            toggleShowLoginPopup(true);
        }

        onClick?.(e);

        savePageBreadcrumbs();
    };

    const getSavedOffersLabel = (count: Nullable<number>): string | Nullable<number> => {
        const limit = isMoreThenTabletViewport ? NINETY_NINE : NINE;
        const isCountOverLimit = (count ?? 0) > limit;

        return isCountOverLimit ? `${limit}+` : count;
    };

    if (!isShortlistEnabled) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
            <Button
                className={classNames(styles.button, savedOffersCount && styles.active)}
                onClick={handleClick}
                aria-label='shortlist-link'
                dataTid='shortlist-link'
                isText
            >
                {!!savedOffersCount && (
                    <span className={styles.count} data-tid='saved-offers-count'>
                        {getSavedOffersLabel(savedOffersCount)}
                    </span>
                )}
                <SvgHeart className={classNames({ [styles.active]: savedOffersCount })} />
            </Button>

            {/*we control showing BookingInShortlistPopup on tablet in Shortlist manager and on bigger screen in ShortlistLink because popup has different css parent element */}
            {isShowBookingInShortlistPopup && isMoreThenTabletViewport && <BookingInShortlistPopup />}
        </div>
    );
};

export default observer(ShortlistLink);
