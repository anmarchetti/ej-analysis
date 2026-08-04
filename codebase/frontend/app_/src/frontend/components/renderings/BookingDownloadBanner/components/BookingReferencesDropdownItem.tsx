import { copyToClipboard } from 'frontend/utils/clipboard.utils';
import Button from 'frontend/components/common/Button';
import SvgExternalShare from 'frontend/components/icons-new/ExternalShare';

import styles from './BookingReferencesDropdown.module.scss';

export type TBookingReferencesDropdownItemProps = {
    description: string;
    isCopyButtonShown: boolean;
    refNumber: string;
    title: string;
    ariaLabel?: string;
    dataTid?: string;
};

const BookingReferencesDropdownItem = ({
    title,
    description,
    refNumber,
    ariaLabel,
    isCopyButtonShown,
    dataTid,
}: TBookingReferencesDropdownItemProps) => (
    <li className={styles.dropdownItem} data-tid={dataTid}>
        <span className={styles.dropdownItemTitle} data-tid='booking-ref-item-title'>
            {title}:{' '}
            <span className={styles.refNumber} data-tid='booking-ref-code'>
                {refNumber}
                {isCopyButtonShown && (
                    <Button
                        isTransparent
                        className={styles.shareBtn}
                        aria-label={ariaLabel}
                        dataTid='holiday-ref-copy-to-clipboard-btn'
                        onClick={() => copyToClipboard(refNumber)}
                    >
                        <SvgExternalShare />
                    </Button>
                )}
            </span>
        </span>
        {!!description && (
            <span className={styles.dropdownItemText} data-tid='booking-ref-item-description'>
                {description}
            </span>
        )}
    </li>
);

export default BookingReferencesDropdownItem;
