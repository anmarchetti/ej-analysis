import { FC, useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgChevronDown from 'frontend/components/icons-new/ChevronDown';
import SvgChevronUp from 'frontend/components/icons-new/ChevronUp';
import SvgInfoFilled from 'frontend/components/icons-new/InfoFilled';

import styles from './BookingAlert.module.scss';

export type TBookingAlertProps = {
    content: ISitecoreField<string>;
    title: ISitecoreField<string>;
    collapseBtnAriaLabel?: string;
    expandBtnAriaLabel?: string;
    isInPopup?: boolean;
};

const BookingAlert: FC<TBookingAlertProps> = ({
    title,
    content,
    expandBtnAriaLabel,
    collapseBtnAriaLabel,
    isInPopup,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={classNames(styles.container, { [styles.inPopup]: isInPopup })} data-tid='booking-alert'>
            <div className={styles.contentWrapper}>
                <div className={styles.titleContainer}>
                    <SvgInfoFilled className={styles.titleIcon} />
                    <Text
                        field={title}
                        tag='h3'
                        className={classNames(styles.title, {
                            [styles.titleExpanded]: isExpanded,
                        })}
                        data-tid='booking-alert-title'
                    />
                </div>
                <RichTextWithLinks
                    field={content}
                    className={classNames(styles.content, {
                        [styles.expanded]: isExpanded,
                    })}
                    dataId='booking-alert-content'
                />
            </div>
            <Button
                aria-label={isExpanded ? collapseBtnAriaLabel : expandBtnAriaLabel}
                className={styles.expandBtn}
                isTransparent
                onClick={() => setIsExpanded(!isExpanded)}
                dataTid='booking-alert-expand-btn'
            >
                {isExpanded ? <SvgChevronUp /> : <SvgChevronDown />}
            </Button>
        </div>
    );
};

export default BookingAlert;
