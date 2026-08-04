import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';

import BreadcrumbsPage from 'models/enum/BreadcrumbsPage';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import ActionPopup from 'frontend/components/common/ActionPopup';

import BreadItem from './components/BreadItem';
import useBreadcrumbs from './useBreadcrumbs';

import styles from './Breadcrumbs.module.scss';

interface IBreadcrumbsSitecoreParameters {
    ActivePage?: BreadcrumbsPage;
}

type TBreadcrumbsProps = ISitecoreComponent<null, IBreadcrumbsSitecoreParameters>;

export const Breadcrumbs = observer((props: TBreadcrumbsProps) => {
    const {
        breadItems,
        activeItemIndex,
        isExtrasPage,
        isFlightPlusHotelFunnel,
        changeIsClickChangeButton,
        selectedBreadcrumb,
        handleBreadcrumbClick,
        handlePopupClose,
        handlePopupContinue,
    } = useBreadcrumbs(props.params?.ActivePage);

    return activeItemIndex > -1 ? (
        <>
            <div
                className={classNames('bread', {
                    'bread__extra-space': isExtrasPage && !isFlightPlusHotelFunnel,
                    [styles.fphWrapper]: isFlightPlusHotelFunnel,
                    [styles.priority]: isFlightPlusHotelFunnel,
                    [styles.lastStep]: isFlightPlusHotelFunnel && activeItemIndex === breadItems.length - 1,
                })}
                data-tid='bread-crumbs-wrapper'
            >
                {breadItems.map((el, idx) => (
                    <BreadItem
                        key={idx}
                        isActive={idx === activeItemIndex}
                        isPrev={idx < activeItemIndex}
                        title={el.title}
                        number={idx + 1}
                        href={el.href}
                        onClick={(): void => changeIsClickChangeButton(false)}
                        isFlightPlusHotelFunnel={isFlightPlusHotelFunnel}
                        onPopupAction={el.shouldShowPopup ? (): void => handleBreadcrumbClick(el) : undefined}
                    />
                ))}
            </div>
            {selectedBreadcrumb?.popupData && (
                <ActionPopup
                    {...selectedBreadcrumb.popupData}
                    onContinue={handlePopupContinue}
                    onCancel={handlePopupClose}
                    onClose={handlePopupClose}
                    isBigWrapper
                />
            )}
        </>
    ) : null;
});

export default Breadcrumbs;
