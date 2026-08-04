import { forwardRef } from 'react';

import Button from 'frontend/components/common/Button';
import styles from 'frontend/components/common/DatePickerComponent/components/MonthHeader/MonthHeader.module.scss';

export interface IChangeMonthButtonProps {
    label?: string;
    onClick?: () => void;
}

const ChangeMonthButton = forwardRef<HTMLButtonElement, IChangeMonthButtonProps>(({ onClick, label }, ref) => (
    <Button className={styles.changeMonthButton} onClick={onClick} ref={ref} data-tid='change-month-button' isOutlined>
        {label}
    </Button>
));

export default ChangeMonthButton;
