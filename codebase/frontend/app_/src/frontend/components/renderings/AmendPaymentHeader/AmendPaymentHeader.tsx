import { FunctionComponent } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { useGoBack } from 'frontend/hooks/useGoBack';
import useStore from 'frontend/hooks/useStore';
import { isHolidayStore } from 'frontend/store/holidays';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import OverlaySpinner from 'frontend/components/common/OverlaySpinner';
import SvgChevronRight from 'frontend/components/icons-new/ChevronRight';
import { getAmendPaymentConfig } from 'frontend/components/renderings/AmendPayment/AmendPayment.utils';

import styles from './AmendPaymentHeader.module.scss';

export type TAmendPaymentHeaderProps = ISitecoreComponent<IAmendPaymentHeaderFields>;

export interface IAmendPaymentHeaderFields {
    PayTitle: ISitecoreField<string>;
    RefundTitle: ISitecoreField<string>;
    SpinnerDescription: ISitecoreField<string>;
    SpinnerTitle: ISitecoreField<string>;
    Subtitle: ISitecoreField<string>;
}

const AmendPaymentHeader: FunctionComponent<TAmendPaymentHeaderProps> = ({ fields }) => {
    const { PayTitle, RefundTitle, SpinnerTitle, SpinnerDescription, Subtitle } = fields || {};

    const {
        currentPath,
        amendmentType,
        isRefund,
        pageName,
        isLoadingDataError,
        isLoading,
        isTradePortal,
        goBackToPreviousPage,
        getBreadcrumb,
    } = useStore((stores: TStores) => ({
        currentPath: stores.layoutStore.currentPath,
        pageName: stores.layoutStore.pageName,
        isLoading: stores.viewBookingStore.isLoading,
        isTradePortal: stores.layoutStore.isTradePortal,
        goBackToPreviousPage: stores.amendPaymentStore.goBackToPreviousPage,
        getBreadcrumb: stores.layoutStore.getBreadcrumb,

        ...(isHolidayStore(stores) && {
            amendmentType: stores.amendPaymentStore.amendmentType,
            isRefund: stores.amendPaymentStore.isRefund,
            isLoadingDataError: stores.amendPaymentStore.isLoadingDataError,
        }),
    }));

    const currentPageTitle = (isRefund ? RefundTitle?.value || '' : PayTitle?.value || '') || pageName;
    const handleGoBack = useGoBack(goBackToPreviousPage, true);

    const onBreadcrumbClick = (event: any): void => {
        event.preventDefault();
        handleGoBack();
    };

    const getBreadcrumbs = (): JSX.Element | null => {
        if (!amendmentType) {
            return null;
        }

        const { prevPage, prevPageBreadcrumbOverload } = getAmendPaymentConfig(amendmentType);

        const prevPageBreadcrumb = getBreadcrumb(prevPage, prevPageBreadcrumbOverload);

        const currentPageBreadcrumb = { value: currentPath, key: currentPageTitle };
        const breadcrumbs = prevPageBreadcrumb
            ? [
                  { ...prevPageBreadcrumb, dataTid: 'link-to-previous-page' },
                  { ...currentPageBreadcrumb, dataTid: 'current-page' },
              ]
            : [];

        return (
            <nav className='path-breadcrumbs-wrap' aria-label='Breadcrumb'>
                <ul className={'path-breadcrumbs'}>
                    {breadcrumbs.map((item, index) => (
                        <li key={item.value}>
                            {index > 0 && <SvgChevronRight />}

                            {breadcrumbs.length === index + 1 ? (
                                <span aria-current='page' data-tid={item.dataTid}>
                                    {item.key}
                                </span>
                            ) : (
                                <a href={item.value} onClick={onBreadcrumbClick} data-tid={item.dataTid}>
                                    {item.key}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        );
    };

    if (isLoadingDataError) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className='amend-payment-header wrapper-component-container__inner' data-tid='amend-payment-header'>
                <>{getBreadcrumbs()}</>

                {!!currentPageTitle && (
                    <div className={styles.heading}>
                        <Text tag='h1' field={{ value: currentPageTitle }} data-tid='amend-payment-header-title' />
                        <Text tag='p' field={Subtitle} data-tid='amend-payment-header-subtitle' />
                    </div>
                )}

                {isTradePortal && isLoading && (
                    <OverlaySpinner header={SpinnerTitle?.value} description={SpinnerDescription?.value} />
                )}
            </div>
        </div>
    );
};

export default observer(AmendPaymentHeader);
