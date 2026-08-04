import React, { useMemo, useState } from 'react';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreImage } from 'models/sitecore/generic/ISitecoreField';
import JSSImage from 'frontend/components/common/JSSImage';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

import styles from './AlertBanner.module.scss';

interface ISpecialRequestsDrawerAlertsProps {
    title: string;
    collapsible?: boolean;
    dataTid?: string;
    description?: string;
    icon?: ISitecoreField<ISitecoreImage>;
    isInline?: boolean;
    key?: string | number;
}

function AlertBanner({
    title,
    description,
    icon,
    collapsible,
    key,
    isInline,
    dataTid,
}: ISpecialRequestsDrawerAlertsProps) {
    const [opened, setOpen] = useState(!collapsible);

    const toggleOpen = () => setOpen(!opened);

    const alertId = useMemo(() => 'alert' + (key || Date.now()), [key]);

    if (!title && !description) {
        return null;
    }

    return (
        <div
            data-tid={dataTid}
            role='alert'
            onClick={toggleOpen}
            className={classNames({
                [styles.content]: true,
                [styles.opened]: opened,
                [styles.inline]: isInline,
            })}
            id={alertId}
        >
            <div className={styles.alert}>
                <div className={styles.attention}>
                    {icon?.value?.src ? <JSSImage field={icon} role='presentation' /> : <SvgInfoFilled />}
                </div>
                {!!title && (
                    <p className={styles.title} data-tid='alert-banner-title'>
                        {title}
                    </p>
                )}
                {!!description && (
                    <p className={styles.text} data-tid='alert-banner-description'>
                        {description}
                    </p>
                )}
            </div>

            {!opened && !isInline && <span className={styles.sideFog} />}
            {collapsible && (
                <button
                    className={styles.button}
                    aria-expanded={opened}
                    aria-controls={alertId}
                    aria-label={opened ? 'Collapse' : 'Expand'}
                >
                    <SvgChevronDown />
                </button>
            )}
        </div>
    );
}

export default AlertBanner;
