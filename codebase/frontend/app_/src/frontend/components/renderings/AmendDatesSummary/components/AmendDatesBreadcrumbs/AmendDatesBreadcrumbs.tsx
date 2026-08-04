import React from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitePath, { SitePathOverload } from 'models/enum/SitePath';
import DestinationBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import styles from './AmendDatesBreadcrumbs.module.scss';

interface IAmendDatesBreadcrumbsProps {
    rootPath?: SitePath;
    rootText?: SitePathOverload;
}

const AmendDatesBreadcrumbs = ({ rootPath = SitePath.ViewBooking, rootText }: IAmendDatesBreadcrumbsProps) => {
    const { getBreadcrumb, currentPath } = useStore(({ layoutStore }: IHolidaysStores) => ({
        getBreadcrumb: layoutStore.getBreadcrumb,
        currentPath: layoutStore.currentPath,
    }));

    const breadcrumbs = [getBreadcrumb(rootPath, rootText), getBreadcrumb(currentPath as SitePath)];

    return (
        <div className={styles.amendBreadcrumbs}>
            <DestinationBreadcrumbs isOpaqueStyle breadcrumbs={breadcrumbs} hideHomeBreadcrumb />
        </div>
    );
};

export default observer(AmendDatesBreadcrumbs);
