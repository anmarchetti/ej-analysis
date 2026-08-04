import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { ComponentRendering, Placeholder } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { PlaceholderNames } from 'models/enum/PlaceholderNames';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';

import styles from './SorterWrapper.module.scss';

export const SorterWrapper: React.FC<ISitecoreComponent> = ({ rendering }) => {
    const { contentOrder, setEngageParams } = useStore((stores: TStores) => ({
        contentOrder: stores.engageStore.contentOrder,
        setEngageParams: stores.engageStore.setEngageParams,
    }));

    useEffect(() => {
        rendering.params && setEngageParams(rendering.params);
    }, [rendering.params, setEngageParams]);

    const orderedRenderings = useMemo(() => {
        const sorterWrapperInner = rendering?.placeholders?.[PlaceholderNames.SorterWrapperInner];

        if (!sorterWrapperInner) return [];

        const orderItems = contentOrder?.placeholders?.[PlaceholderNames.SorterWrapperInner];

        if (!orderItems || orderItems.length === 0) {
            return sorterWrapperInner;
        }

        const renderingMap = new Map<string, ComponentRendering>();
        for (const renderingItem of sorterWrapperInner) {
            if ('uid' in renderingItem) {
                renderingMap.set(renderingItem.uid, renderingItem as ComponentRendering);
            }
        }

        const ordered = orderItems.map(orderItem => renderingMap.get(orderItem.uid)).filter(Boolean);

        return ordered.length > 0 ? ordered : sorterWrapperInner;
    }, [contentOrder, rendering]);

    if (!contentOrder?.placeholders?.[PlaceholderNames.SorterWrapperInner]?.length) {
        return <Placeholder name={PlaceholderNames.SorterWrapperInner} rendering={rendering} />;
    }

    return (
        <div className={styles.sorterWrapper} data-tid='sorter-wrapper'>
            {orderedRenderings.map(component => (
                <Placeholder
                    key={component.uid}
                    name={PlaceholderNames.SorterWrapperInner}
                    rendering={{
                        ...rendering,
                        placeholders: {
                            [PlaceholderNames.SorterWrapperInner]: [component],
                        },
                    }}
                />
            ))}
        </div>
    );
};

export default observer(SorterWrapper);
