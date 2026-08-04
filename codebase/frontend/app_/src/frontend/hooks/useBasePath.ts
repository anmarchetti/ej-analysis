import { useContext, useMemo } from 'react';
import { MobXProviderContext } from 'mobx-react';

import { buildBasePathByLang } from 'code/basePath';
import { TStores } from 'frontend/store/IStores';

/**
 * Hook for getting base path.
 * If lang is not defined or is the same as the current lang, return the current base path.
 * Otherwise, return a new base path for the given lang.
 */
export default function useBasePath(lang?: string): string {
    const stores = useContext(MobXProviderContext) as TStores;

    const basePath = useMemo(
        () =>
            !lang || lang === stores.layoutStore.lang
                ? stores.layoutStore.basePath
                : buildBasePathByLang(lang, stores.layoutStore.isTradePortal),
        [lang],
    );

    return basePath;
}
