import * as React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import sanitize from 'sanitize-html';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IBreadcrumb } from 'models/data/IBreadcrumb';
import SitePath from 'models/enum/SitePath';
import Button from 'frontend/components/common/Button';
import Link from 'frontend/components/common/Link';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import SvgHomeLined from 'frontend/components/icons-new/HomeLined';

interface IDestinationBreadcrumbsProps {
    breadcrumbs?: IBreadcrumb[];
    className?: string;
    hideHomeBreadcrumb?: boolean;
    isOpaqueStyle?: boolean;
    onBreadcrumbClick?: React.MouseEventHandler<HTMLButtonElement>;
    wrapperClassName?: string;
}

interface IBreadcrumbLinkItemProps {
    'aria-label'?: string;
    children?: React.ReactNode;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const DestinationBreadcrumbs: React.FC<IDestinationBreadcrumbsProps> = ({
    isOpaqueStyle,
    hideHomeBreadcrumb,
    breadcrumbs: customBreadcrumbs,
    className: additionalClass,
    wrapperClassName,
    onBreadcrumbClick,
}) => {
    const { layoutBreadcrumbs } = useStore((stores: TStores) => ({
        layoutBreadcrumbs: stores.layoutStore.pageBreadcrumbs,
    }));

    const className = classNames('path-breadcrumbs', additionalClass, isOpaqueStyle && 'path-breadcrumbs--opaque');
    const breadcrumbs: IBreadcrumb[] = customBreadcrumbs || layoutBreadcrumbs;

    if (!breadcrumbs.length) {
        return null;
    }

    const renderBreadcrumbLinkItem = ({ onClick, ...rest }: IBreadcrumbLinkItemProps): JSX.Element =>
        onClick ? <Button isText onClick={onClick} {...rest} /> : <a {...rest} />;

    return (
        <nav
            className={classNames('path-breadcrumbs-wrap no-print', wrapperClassName)}
            aria-label='Breadcrumb'
            data-tid='path-breadcrumbs-wrapper'
        >
            <ul className={className} data-tid='path-breadcrumbs-ul'>
                {!hideHomeBreadcrumb && (
                    <li>
                        <Link href={SitePath.Home} legacyBehavior>
                            {renderBreadcrumbLinkItem({
                                className: 'path-breadcrumbs__icon',
                                'aria-label': 'Home',
                                onClick: onBreadcrumbClick,
                                children: <SvgHomeLined />,
                            })}
                        </Link>
                    </li>
                )}
                {breadcrumbs.map((item, index) => (
                    <li key={item.value}>
                        {(index > 0 || !hideHomeBreadcrumb) && <SvgChevronRight />}

                        {breadcrumbs.length === index + 1 ? (
                            <span aria-current='page' dangerouslySetInnerHTML={{ __html: sanitize(item.key) }} />
                        ) : (
                            <Link href={item.value} legacyBehavior>
                                {renderBreadcrumbLinkItem({
                                    onClick: onBreadcrumbClick,
                                    children: item.key,
                                })}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default observer(DestinationBreadcrumbs);
