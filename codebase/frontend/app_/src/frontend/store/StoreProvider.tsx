import { useContext } from 'react';
import { MobXProviderContext } from 'mobx-react';

function StoreProvider({ children, ...newStores }) {
    const stores = useContext(MobXProviderContext);

    return <MobXProviderContext.Provider value={{ ...stores, ...newStores }}>{children}</MobXProviderContext.Provider>;
}

export default StoreProvider;
