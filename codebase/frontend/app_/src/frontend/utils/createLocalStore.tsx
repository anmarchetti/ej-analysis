import { createContext, useContext, useEffect, useState } from 'react';
import { MobXProviderContext } from 'mobx-react';

import { TRootStore, TStores } from 'frontend/store/IStores';

interface ILocalStoreOptions {
    isLocalForPage: boolean;
}

const defaultOptions: ILocalStoreOptions = {
    /** true if store can be shared between different components on the same page */
    isLocalForPage: false,
};

/**
 * Create local mobx store for a component or multiple components on the same page
 * @param storeFactory function that creates a store. exposes rootStore and props
 * @param options object, set `isLocalForPage` to `true` if multiple components on the same page can use this store
 */
export function createLocalStore<T, P>(
    storeFactory: (rootStore: TRootStore, props: P) => T,
    options: ILocalStoreOptions = defaultOptions,
): [(WrappedComponent: any) => (props: P) => JSX.Element, () => T] {
    const StoreContext = createContext<T>(undefined as T); // ?
    let pageStore: T | undefined; // we save store in closure so it can be accessed by multiple components
    let usageCount = 0;

    /** HOC to create store and add the store in react context */
    const withLocalStore = WrappedComponent =>
        function LocalStoreComponent(props: P): JSX.Element {
            const { rootStore } = useContext(MobXProviderContext) as TStores;
            const isServer = globalThis.window === undefined;

            if (!isServer && options.isLocalForPage && !pageStore) {
                pageStore = storeFactory(rootStore, props);
            }

            const [store] = useState(
                !isServer && options.isLocalForPage && pageStore ? pageStore : storeFactory(rootStore, props),
            );

            useEffect(() => {
                usageCount++; // count how many components use local store

                return () => {
                    usageCount--;

                    // destroy store if all consumers unmounted
                    if (usageCount <= 0) {
                        pageStore = undefined;
                        usageCount = 0;
                    }
                };
            }, []);

            return (
                <StoreContext.Provider value={store}>
                    <WrappedComponent {...props} />
                </StoreContext.Provider>
            );
        };

    /** hook to get local store in a component */
    const useLocalStore = (): T => {
        const store = useContext(StoreContext);

        return store;
    };

    return [withLocalStore, useLocalStore];
}
