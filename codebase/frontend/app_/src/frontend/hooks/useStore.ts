import { useContext } from 'react';
import { MobXProviderContext } from 'mobx-react';

import { TStores } from 'frontend/store/IStores';

export default function useStore<T, Stores = TStores>(mapStateToProps?: (stores: Stores) => T): T {
    const stores = useContext(MobXProviderContext) as Stores;

    if (typeof mapStateToProps === 'function') {
        return mapStateToProps(stores);
    }

    return stores as any;
}
