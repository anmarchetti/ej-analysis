import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { isBookingFlow } from 'frontend/utils/buildSitecorePath';

const RouterHandler = (props: any): JSX.Element => {
    const firstSkipped = useRef(false); // true, after first layoutId effect (below) is skipped

    const { search, layoutId, initialize, syncParams, fetchOfferOnPageLoad } = useStore(stores => ({
        search: stores.routerStore.search,
        layoutId: stores.layoutStore.layoutId,
        initialize: stores.routerStore.initialize,
        syncParams: stores.queryParamStore.parseAndSyncQuery,
        fetchOfferOnPageLoad: stores.bookingStore.fetchOfferOnPageLoad,
    }));

    useEffect(() => {
        initialize();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (firstSkipped.current) {
            syncParams(search, isBookingFlow(search));
            fetchOfferOnPageLoad(true);
        } else {
            firstSkipped.current = true;
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutId]);

    return props.children;
};

export default observer(RouterHandler);
