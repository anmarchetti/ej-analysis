import { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';

import settings from 'code/settings';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import isBackend from 'frontend/utils/isBackend';
import { SearchBarDropdown } from 'models/enum/SearchBarDropdown';
import { SEARCHBAR_STICKY_BOX_ID } from 'frontend/components/renderings/SearchPod/components/SearchBar/constants';

import styles from './SearchBarAnimatedDropdown.module.scss';
export interface ISearchBarAnimatedDropdownProps {
    isOpened: boolean;
    selectedDropdown: SearchBarDropdown | null;
    children?: React.ReactNode;
}

export const SEARCHPOD_BORDER_WIDTH = 1;
export const DEFAULT_INDENT_BOTTOM = 19;
const ANIMATION_DURATION = settings.Animation.DurationMs;

const SearchBarAnimatedDropdown: FC<ISearchBarAnimatedDropdownProps> = ({ isOpened, selectedDropdown, children }) => {
    const { errorMessages } = useStore((stores: TStores) => ({
        errorMessages: stores.searchStore.errorMessages,
    }));
    const isAnyOtherDropdownOpened = selectedDropdown !== null && !isOpened;

    const contentRef = useRef<HTMLDivElement>(null);
    const [maxContainerHeight, setMaxContainerHeight] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    // required for ResizeObserver as it remember isOpened value from prop that was passed when the observer was created
    const isOpenedRef = useRef<boolean>(isOpened);

    const [isVisible, setIsVisible] = useState<boolean>(isOpened);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    useEffect(() => {
        isOpenedRef.current = isOpened;
        let timeout: NodeJS.Timeout | null = null;

        if (isOpened) {
            setIsVisible(true);
        }

        if (!isOpened && isVisible) {
            setContainerHeight(0);

            timeout = setTimeout(() => {
                resizeObserverRef?.current?.disconnect();
                resizeObserverRef.current = null;
                setIsVisible(false);
            }, ANIMATION_DURATION);
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpened]);

    useLayoutEffect(() => {
        if (isVisible && isOpened && contentRef.current) {
            updateMaxHeight();

            const height = contentRef.current.offsetHeight;
            setContainerHeight(height);

            if (!resizeObserverRef.current) {
                resizeObserverRef.current = new ResizeObserver(() => {
                    if (isOpenedRef.current && contentRef.current) {
                        updateMaxHeight();
                        setContainerHeight(contentRef.current.offsetHeight);
                    }
                });

                resizeObserverRef.current.observe(contentRef.current);

                const stickyBox = document.getElementById(SEARCHBAR_STICKY_BOX_ID);

                if (stickyBox) {
                    resizeObserverRef.current.observe(stickyBox);
                }
            }
        }

        return () => {
            if (!isVisible && resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
        };
    }, [isVisible, isOpened, children, errorMessages]);

    //Recalculate max height when error messages appear/disappear in the layout
    useLayoutEffect(() => {
        if (isVisible) {
            updateMaxHeight();
        }
    }, [errorMessages]);

    useEffect(
        () => () => {
            resizeObserverRef?.current?.disconnect();
            resizeObserverRef.current = null;
            setIsVisible(false);
        },
        [],
    );

    const updateMaxHeight = (): void => {
        if (!contentRef.current) return;

        const stickyBox = document.getElementById(SEARCHBAR_STICKY_BOX_ID);
        const stickyboxPaddingBottom = stickyBox ? parseInt(window.getComputedStyle(stickyBox).paddingBottom, 10) : 0;

        const maxHeight =
            window.innerHeight -
            Math.ceil(contentRef.current.getBoundingClientRect().top) -
            stickyboxPaddingBottom -
            SEARCHPOD_BORDER_WIDTH -
            DEFAULT_INDENT_BOTTOM;
        setMaxContainerHeight(maxHeight);
    };

    if (isBackend() || !isVisible) {
        return null;
    }

    return (
        <div
            style={
                {
                    height: `${containerHeight}px`,
                    overflow: 'hidden',
                    transition: isAnyOtherDropdownOpened ? 'none' : `height ${ANIMATION_DURATION}ms ease`,
                    '--searchpod-border-width': `${SEARCHPOD_BORDER_WIDTH}px`,
                } as React.CSSProperties
            }
            data-tid='search-bar-animated-dropdown-wrapper'
        >
            <div
                ref={contentRef}
                data-tid='search-bar-animated-dropdown-content'
                className={styles.content}
                style={{ maxHeight: maxContainerHeight }}
            >
                {children}
            </div>
        </div>
    );
};

export default observer(SearchBarAnimatedDropdown);
