import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import settings from 'code/settings';
import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { getFieldValue } from 'frontend/utils/sitecore.utils';
import IconChevronDown from 'frontend/components/icons/ChevronDown';
import IconClose from 'frontend/components/icons-new/Cross';
import IconSearch from 'frontend/components/icons-new/Search';
import { useSearchPodStore } from 'frontend/components/renderings/SearchPod/stores/createStore';

export interface ISearchBarTitleProps {
    isCollapsedMobileVariant: boolean;
    isSearchBarExpanded: boolean;
    isSearchBarSticky: boolean;
    isStickyOnMobile: boolean;
    searchExpandableBoxRef: React.RefObject<HTMLDivElement>;
    setIsSearchBarExpanded: (value: boolean) => void;
    setSearchBarExpHeightValue: (value: number | undefined) => void;
}

const SearchBarTitle: FC<ISearchBarTitleProps> = ({
    isCollapsedMobileVariant,
    isStickyOnMobile,
    isSearchBarExpanded,
    isSearchBarSticky,
    searchExpandableBoxRef,
    setSearchBarExpHeightValue,
    setIsSearchBarExpanded,
}) => {
    const { isHomePage, isHotelDetailsBookPage } = useStore((stores: TStores) => ({
        isHomePage: stores.layoutStore.isHomePage,
        isHotelDetailsBookPage: stores.layoutStore.isHotelDetailsBookPage,
    }));

    const { fields: { PerfectHolidayTitle } = {} } = useSearchPodStore();

    const isMobile = useMobileViewport();

    const [expAnimationInProgress, setExpAnimationInProgress] = useState<boolean>(false);
    const [searchBarExpHeight, setSearchBarExpHeight] = useState<number>();

    useEffect(() => {
        if (searchExpandableBoxRef.current) {
            setSearchBarExpHeight(searchExpandableBoxRef.current.getBoundingClientRect().height);
        }

        return () => {
            cleanUpTimeoutIfExists();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cleanUpTimeoutIfExists = (): void => {
        if (expAnimationTimeout.current !== null) {
            clearTimeout(expAnimationTimeout.current);
        }
    };

    const searchPodTitleIcon = useMemo(() => {
        if (isCollapsedMobileVariant) {
            return isSearchBarExpanded ? <IconClose /> : <IconSearch />;
        }

        return <IconChevronDown />;
    }, [isCollapsedMobileVariant, isSearchBarExpanded]);

    const expAnimationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleSearchBar = (): void => {
        if (!searchExpandableBoxRef.current) {
            return;
        }

        if (isSearchBarExpanded) {
            const height = searchExpandableBoxRef.current.getBoundingClientRect().height;

            setSearchBarExpHeight(height);
            setSearchBarExpHeightValue(height);

            setTimeout(() => {
                setExpAnimationInProgress(true);
                setSearchBarExpHeightValue(0);
            }, 1);

            cleanUpTimeoutIfExists();

            expAnimationTimeout.current = setTimeout(() => {
                setExpAnimationInProgress(false);
                setSearchBarExpHeightValue(undefined);
                setIsSearchBarExpanded(false);
            }, settings.Animation.DurationMs);

            return;
        }

        setSearchBarExpHeightValue(searchBarExpHeight);
        setExpAnimationInProgress(true);

        cleanUpTimeoutIfExists();

        expAnimationTimeout.current = setTimeout(() => {
            setExpAnimationInProgress(false);
            setSearchBarExpHeightValue(undefined);
            setIsSearchBarExpanded(true);
        }, settings.Animation.DurationMs);
    };

    const onClick = (): void => {
        if (expAnimationInProgress || !isMobile) {
            return;
        }

        if (isCollapsedMobileVariant || (isStickyOnMobile && isSearchBarSticky)) {
            toggleSearchBar();
        }
    };

    if (!isSearchBarExpanded && isMobile && isHotelDetailsBookPage) {
        return null;
    }

    return (
        <button className={classNames('search-bar__title', { ['mobile-only']: isHomePage })} onClick={onClick}>
            {getFieldValue(PerfectHolidayTitle)}

            <div className='search-bar__exp-btn-box'>{searchPodTitleIcon}</div>
        </button>
    );
};

export default observer(SearchBarTitle);
