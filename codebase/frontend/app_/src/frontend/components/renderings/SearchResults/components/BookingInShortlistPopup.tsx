import React, { FC, useEffect, useLayoutEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { useMoreThenTabletViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import SvgHeart from 'frontend/components/icons/Heart';

import styles from './BookingInShortlistPopup.module.scss';

const HEADER_HEIGHT = 60;

const BookingInShortlistPopup: FC = () => {
    const { getPhrase, toggleShowBookingInShortlistPopup, redirectToShortlistPage, savePageBreadcrumbs } = useStore(
        (stores: IHolidaysStores) => ({
            getPhrase: stores.layoutStore.getPhrase,
            toggleShowBookingInShortlistPopup: stores.shortlistStore.toggleShowBookingInShortlistPopup,
            redirectToShortlistPage: stores.routerStore.redirectToShortlistPage,
            savePageBreadcrumbs: stores.shortlistStore.savePageBreadcrumbs,
        }),
    );
    const [isPinnedTop, setIsPinnedTop] = useState<boolean>(false);
    const [scrollPosition, setScrollPosition] = useState<number>(0);
    const isMoreThenTabletViewport = useMoreThenTabletViewport();

    useLayoutEffect(() => {
        // need to determine the scroll position of the parent screen before the component is rendered, since after rendering a fixed component, the scroll will always be 0
        setScrollPosition(window.scrollY || document.documentElement.scrollTop);
    }, []);

    useEffect(() => {
        if (scrollPosition >= 0 && scrollPosition < HEADER_HEIGHT && isMoreThenTabletViewport) {
            setIsPinnedTop(true);
        }
    }, [isMoreThenTabletViewport, scrollPosition]);

    const closePopup = () => {
        toggleShowBookingInShortlistPopup(false);
    };

    const openShortlistPage = () => {
        savePageBreadcrumbs();
        toggleShowBookingInShortlistPopup(false);
        redirectToShortlistPage();
    };
    const renderFooter = () => (
        <>
            <Button onClick={openShortlistPage}>
                {getPhrase(SitecoreDictionary.ShortlistBookingInShortlistPopupViewMyShortlist)}
            </Button>
            <Button isTransparent onClick={closePopup} className={styles.button}>
                {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
            </Button>
        </>
    );

    return (
        <Popup
            containerClass={classNames(styles.popup, {
                [styles.pinnedTop]: isPinnedTop,
            })}
            onClose={closePopup}
            footerContent={renderFooter()}
            removeDefaultClasses
            isCentered={false}
            dialogClass={classNames(styles.dialog, {
                [styles.topDialog]: isPinnedTop,
                [styles.rightDialog]: !isPinnedTop,
            })}
            bodyClass={styles.dialogBody}
            footerClass={styles.footer}
            contentClass={styles.dialogContent}
            id='booking-in-shortlist-popup'
        >
            <i className={styles.icon}>
                <SvgHeart />
            </i>

            <h5 className={styles.title}>{getPhrase(SitecoreDictionary.ShortlistBookingInShortlistPopupTitle)}</h5>
            <p className={styles.description}>
                {getPhrase(SitecoreDictionary.ShortlistBookingInShortlistPopupDescription)}
            </p>
        </Popup>
    );
};

export default observer(BookingInShortlistPopup);
