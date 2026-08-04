import React, { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import { isSitecoreCheckboxSelected } from 'frontend/utils/sitecore.utils';
import SitePath from 'models/enum/SitePath';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import { TSitecoreCheckboxValue } from 'models/sitecore/generic/SitecoreCheckboxValue';
import Link from 'frontend/components/common/Link';
import RouterLink from 'frontend/components/common/RouterLink';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgHomeLined from 'frontend/components/icons-new/HomeLined';

import styles from './BreadcrumbsStatic.module.scss';

interface IBreadcrumb {
    fields: {
        Link: ISitecoreField<ISitecoreLink>;
        Text: ISitecoreField<string>;
    };
    id: string;
}

interface IBreadcrumbsStaticFields {
    items: IBreadcrumb[];
}

interface IBreadcrumbsStaticParams {
    IsHomeIconShown: TSitecoreCheckboxValue;
    IsOpaque: TSitecoreCheckboxValue;
    IsShadowed: TSitecoreCheckboxValue;
    IsWrapped: TSitecoreCheckboxValue;
}

export type TBreadcrumbsStaticProps = ISitecoreComponent<IBreadcrumbsStaticFields, IBreadcrumbsStaticParams>;

export const BreadcrumbsStatic: FC<TBreadcrumbsStaticProps> = ({ params, fields }) => {
    const isOpaque = isSitecoreCheckboxSelected(params.IsOpaque);
    const isHomeIconShown = isSitecoreCheckboxSelected(params.IsHomeIconShown);
    const isWrapped = isSitecoreCheckboxSelected(params.IsWrapped);
    const isShadowed = isSitecoreCheckboxSelected(params.IsShadowed);
    const className = classNames(styles.breadcrumbs, {
        [styles.breadcrumbsOpaque]: isOpaque,
        [styles.shadowed]: isShadowed,
    });

    const itemsLength = fields?.items?.length;

    if (!fields || !itemsLength) {
        return null;
    }

    const { items } = fields;

    return (
        <nav
            data-tid='breadcrumbs-static'
            aria-label='Breadcrumbs'
            className={classNames({ [styles.pathBreadcrumbsWrap]: isWrapped })}
        >
            <ul className={className} data-tid='breadcrumbs-static-ul'>
                {isHomeIconShown && (
                    <li>
                        <Link href={SitePath.Home} className={styles.pathBreadcrumbsIcon}>
                            <SvgHomeLined />
                        </Link>
                    </li>
                )}
                {items.map((item, index) => (
                    <li key={item.id}>
                        {(index > 0 || isHomeIconShown) && <SvgChevronRight data-tid='chevron-right' />}

                        {itemsLength === index + 1 ? (
                            <Text data-tid='breadcrumb-current-page' tag='span' field={item.fields.Text} />
                        ) : (
                            <RouterLink link={item.fields.Link} dataId='breadcrumb-link'>
                                <Text tag='span' field={item.fields.Text} />
                            </RouterLink>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default observer(BreadcrumbsStatic);
