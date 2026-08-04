import { useMemo } from 'react';
import { configure } from 'mobx';
import { enableStaticRendering } from 'mobx-react';

import { SiteName } from 'models/enum/SiteName';

import { createHolidaysAppStores, IHolidaysInitialState } from './holidays';
import { TInitialStoresState, TStores } from './IStores';
import { createTradePortalAppStores, ITradePortalInitialState } from './tradePortal';

// Configure mobx
configure({ enforceActions: 'observed', useProxies: 'always' });

// Use static rendering for SSR
const isServer = typeof window === 'undefined';
enableStaticRendering(isServer);

let stores: TStores;
let storesSiteName: SiteName;

const initializeStores = (initialState: TInitialStoresState, siteName: SiteName) => {
    let _stores;

    if (storesSiteName === siteName && stores) {
        _stores = stores;

        if (initialState?.layoutStore?.lang) {
            _stores.layoutStore.updateLang(initialState.layoutStore.lang);
        }
    } else {
        _stores =
            siteName === SiteName.TradePortal
                ? createTradePortalAppStores(initialState as ITradePortalInitialState)
                : createHolidaysAppStores(initialState as IHolidaysInitialState);
        storesSiteName = siteName;
    }

    // For SSG and SSR always create a new store
    if (typeof window === 'undefined') return _stores;

    // Create the store once in the client
    if (!stores) stores = _stores;

    return _stores;
};

export const useApplicationStoreBaseOnSiteName = (
    initStoreState: TInitialStoresState,
    siteName: SiteName = SiteName.Holidays,
): TStores => {
    const stores = useMemo(() => initializeStores(initStoreState, siteName), [initStoreState, siteName]);

    return stores;
};

export const getInitStoreStateFromPageProps = pageProps => {
    const { initMobxState } = pageProps;

    // If there is initMobxState in the pageProps, we want to use that to hydrate the store
    if (initMobxState) {
        return {
            ...initMobxState,
            layoutStore: { ...initMobxState.layoutStore, layout: pageProps.layout },
        };
    }

    const dev = process.env.NODE_ENV !== 'production';

    if (!dev || isServer) {
        return undefined;
    }

    const nextDataInitMobxState = window?.__NEXT_DATA__.props.pageProps.initMobxState;

    // If we're in dev mode and not on the server, we want to use the initMobxState from the __NEXT_DATA__ to hydrate the store so Hot reloading works
    return {
        ...nextDataInitMobxState,
        layoutStore: { ...nextDataInitMobxState?.layoutStore, layout: pageProps.layout },
    };
};
