import { useEffect, useState } from 'react';

import { ScreenBreakpoints } from 'code/screenBreakpoints';

import useStore from './useStore';

export const useMediaQuery = (query: string, defaultValue: boolean = false): boolean => {
    const [matches, setMatches] = useState(defaultValue);

    useEffect(() => {
        const mql = window.matchMedia(query);
        // Set the value on the initial render
        setMatches(mql.matches);
        const handleChange = (event: MediaQueryListEvent): void => {
            setMatches(event.matches);
        };
        // Then subscribe to additional changes
        mql.onchange = handleChange;

        return () => {
            mql.onchange = null;
        };
    }, [query]);

    return matches;
};

export const useXSMobileViewport = (): boolean => {
    const { isMobileDeviceDetectedDuringSSR } = useStore(stores => ({
        isMobileDeviceDetectedDuringSSR: stores.layoutStore.isMobileDeviceDetectedDuringSSR,
    }));

    return useMediaQuery(`(max-width: ${ScreenBreakpoints.XS}px)`, isMobileDeviceDetectedDuringSSR);
};

export const useMoreThenXSMobileViewport = (): boolean => {
    const { isMobileDeviceDetectedDuringSSR } = useStore(stores => ({
        isMobileDeviceDetectedDuringSSR: stores.layoutStore.isMobileDeviceDetectedDuringSSR,
    }));

    return useMediaQuery(`(min-width: ${ScreenBreakpoints.XS}px)`, isMobileDeviceDetectedDuringSSR);
};

export const useMobileViewport = (): boolean => {
    const { isMobileDeviceDetectedDuringSSR } = useStore(stores => ({
        isMobileDeviceDetectedDuringSSR: stores.layoutStore.isMobileDeviceDetectedDuringSSR,
    }));

    // 767.98px bug fix for safari comes from bootstrap, source: \app_\node_modules\bootstrap\scss\mixins\_breakpoints.scss
    return useMediaQuery(`(max-width: ${ScreenBreakpoints.SM - 0.02}px)`, isMobileDeviceDetectedDuringSSR);
};

export const useMoreThenMobileViewport = (): boolean => useMediaQuery(`(min-width: ${ScreenBreakpoints.SM}px)`);

export const useTabletViewport = (): boolean => useMediaQuery(`(max-width: ${ScreenBreakpoints.MD}px)`);

export const useMoreThenTabletViewport = (): boolean => {
    const { isMobileDeviceDetectedDuringSSR } = useStore(stores => ({
        isMobileDeviceDetectedDuringSSR: stores.layoutStore.isMobileDeviceDetectedDuringSSR,
    }));

    return useMediaQuery(`(min-width: ${ScreenBreakpoints.MD}px)`, !isMobileDeviceDetectedDuringSSR);
};

export const useDesktopViewport = (): boolean => useMediaQuery(`(max-width: ${ScreenBreakpoints.XL}px)`);

export const useMoreThenDesktopViewport = (): boolean => useMediaQuery(`(min-width: ${ScreenBreakpoints.XL}px)`);
