import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { Field } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { useAnchorScrollTracker } from 'frontend/hooks/useAnchorScrollTracker';
import { useMediaQuery } from 'frontend/hooks/useMediaQuery';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { scrollToElement } from 'frontend/utils/ui.utils';
import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';

import styles from './NavigationTabs.module.scss';

export enum HotelPageComponents {
    HotelInfo = 'Hotel Info Booking',
    BoardTypes = 'Board Types',
    Rooms = 'Room Types',
    Flights = 'Alternative Flights',
    Reviews = 'Hotel Reviews Booking',
}

export enum NavigationTabIds {
    HotelInfo = 'hotel-info',
    BoardTypes = 'board-types',
    Rooms = 'rooms',
    Flights = 'flights',
    Reviews = 'reviews',
}

export const ComponentNameToIdMap: { [key in NavigationTabIds]: HotelPageComponents } = {
    [NavigationTabIds.HotelInfo]: HotelPageComponents.HotelInfo,
    [NavigationTabIds.BoardTypes]: HotelPageComponents.BoardTypes,
    [NavigationTabIds.Rooms]: HotelPageComponents.Rooms,
    [NavigationTabIds.Flights]: HotelPageComponents.Flights,
    [NavigationTabIds.Reviews]: HotelPageComponents.Reviews,
};

export interface INavigationTab {
    fields: {
        Icon: ISitecoreField<ISitecoreImage>;
        Id: Field<string>;
        Name: Field<string>;
    };
    id: string;
}

export interface IUseNavigationTabsPreparedData {
    active: INavigationTab | null;
    isListDisplayed: boolean;
    isMobileActiveItemDisplayed: boolean;
    isMobileCollapseItemDisplayed: boolean;
    linksClassNames: string;
    list: INavigationTab[];
    onClick: (id: string) => void;
    onClose: () => void;
    onOpen: () => void;
    wrapperClassNames: string;
    wrapperRef: RefObject<HTMLDivElement>;
}

export const OFFSET_TOP = 24;
export const DESKTOP_DEFAULT_HEIGHT = 81;
export const MOBILE_DEFAULT_HEIGHT = 48;

const MIN_MOBILE_TABS_LENGTH = 4;
const MIN_DESKTOP_TABS_LENGTH = 5;

export const useNavigationTabsList = (data?: INavigationTab[]): INavigationTab[] => {
    const { contentOrder } = useStore((stores: TStores) => ({
        contentOrder: stores.engageStore.contentOrder?.placeholders?.['sorter-wrapper-inner'],
    }));

    if (!contentOrder || !data?.length) return data ?? [];

    const [firstItem, ...rest] = data;

    const orderedList =
        (contentOrder
            ?.map(({ componentName }) =>
                rest.find(({ fields }) => ComponentNameToIdMap[fields.Id.value] === componentName),
            )
            .filter(Boolean) as INavigationTab[]) ?? [];

    return [firstItem, ...orderedList];
};

export function useNavigationTabsPreparedData({ list }): IUseNavigationTabsPreparedData {
    const { isScreenLessMedium } = useStore((stores: TStores) => ({
        isScreenLessMedium: stores.appStore.isScreenLessMedium,
    }));

    const wrapperRef = useRef<HTMLDivElement>(null);

    const isMobile = useMediaQuery(`(max-width: 676px)`);
    const isVertical = useMediaQuery(`(max-width: 1060px)`);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const tabs: INavigationTab[] = useMemo(
        () => list.filter(({ fields: { Id: id } }) => document.getElementById(id.value)),
        [list],
    );

    const anchorTrackerItems = useMemo(
        () =>
            tabs.map(tab => ({
                id: tab.fields.Id.value,
            })),
        [tabs],
    );

    const anchorsStates = useAnchorScrollTracker({
        items: anchorTrackerItems,
        rootMargin: '-20% 0% -80% 0%',
        threshold: 0,
        keepTabSelection: true,
    });

    const onClick = useCallback(
        (elementId: string): void => {
            const element = document.getElementById(elementId) as HTMLElement;
            const currentHeight = isMobile
                ? MOBILE_DEFAULT_HEIGHT
                : wrapperRef.current?.offsetHeight ?? DESKTOP_DEFAULT_HEIGHT;
            const offset = currentHeight + OFFSET_TOP;

            if (isMobile) {
                setIsExpanded(false);
            }

            if (element) {
                scrollToElement(element, offset);
            }
        },
        [isMobile],
    );

    const activeAnchorId = anchorsStates.find(item => item.isActive)?.id;

    return {
        wrapperRef: wrapperRef,
        active: tabs.find(({ fields: { Id } }) => Id.value === activeAnchorId) || tabs[0],
        list: tabs,
        onClick,
        onOpen: () => setIsExpanded(true),
        onClose: () => setIsExpanded(false),
        isMobileActiveItemDisplayed: isMobile && !isExpanded,
        isMobileCollapseItemDisplayed: isMobile && isExpanded,
        isListDisplayed: (isMobile && isExpanded) || !isMobile,
        wrapperClassNames: classNames(styles.wrapper, {
            [styles.tablet]: !isMobile && isScreenLessMedium,
            [styles.mobile]: isMobile,
        }),
        linksClassNames: classNames(styles.links, {
            [styles.vertical]: !isMobile && tabs.length > MIN_MOBILE_TABS_LENGTH && isVertical,
            [styles.start]:
                (tabs.length <= MIN_MOBILE_TABS_LENGTH && isMobile && !isScreenLessMedium) ||
                (tabs.length < MIN_DESKTOP_TABS_LENGTH && !isMobile && !isScreenLessMedium),
        }),
    };
}

export default useNavigationTabsPreparedData;
