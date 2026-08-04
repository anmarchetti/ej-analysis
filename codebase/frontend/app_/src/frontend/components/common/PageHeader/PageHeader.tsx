import { FC, ReactNode } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import { IBreadcrumb } from 'models/data/IBreadcrumb';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import DestinationBreadcrumbs from 'frontend/components/renderings/DestinationBreadcrumbs';

import styles from './PageHeader.module.scss';

export type TPageHeaderProps = {
    Title: ISitecoreField<string>;
    breadcrumbs?: IBreadcrumb[];
    children?: ReactNode;
    onBreadcrumbClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const PageHeader: FC<TPageHeaderProps> = ({ Title, breadcrumbs, children, onBreadcrumbClick }) => (
    <div className={styles.container} data-tid='page-header'>
        <div className='wrapper-component-container__inner'>
            <DestinationBreadcrumbs
                breadcrumbs={breadcrumbs}
                hideHomeBreadcrumb
                isOpaqueStyle
                onBreadcrumbClick={onBreadcrumbClick}
            />
            <div className={styles.textsContainer}>
                <Text tag='h1' field={Title} className={styles.title} data-tid='page-header-title' />
                {children}
            </div>
        </div>
    </div>
);

export default PageHeader;
