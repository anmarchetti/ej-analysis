import { FC } from 'react';
import classNames from 'classnames';

import styles from './FakeSearchBarInput.module.scss';
export interface IFakeSearchBarInputProps {
    icon: JSX.Element;
    id: string;
    isSubmitted: boolean;
    label: string;
    onClick: () => void;
    placeholder: string;
    value: string;
    extraLabel?: string;
}

export const FakeSearchBarInput: FC<IFakeSearchBarInputProps> = ({
    icon,
    id,
    label,
    isSubmitted,
    onClick,
    placeholder,
    value,
    extraLabel,
}) => (
    <button
        className={classNames(styles.input, {
            [styles.submitted]: isSubmitted,
            [styles.flexibleSubmitted]: isSubmitted && extraLabel,
        })}
        onClick={onClick}
        id={id}
        data-tid='input'
    >
        <div className={styles.value} data-tid='value'>
            {icon}
            {isSubmitted && (
                <span className={styles.label} data-tid='submitted-label'>
                    {label}
                </span>
            )}
            <div className={styles.textWrapper}>
                <span className={styles.text} data-tid='text'>
                    {value || placeholder}
                </span>
                {isSubmitted && extraLabel && (
                    <span className={styles.extraLabel} data-tid='extra-label'>
                        {extraLabel}
                    </span>
                )}
            </div>
        </div>
        {!isSubmitted && (
            <div className={styles.label} data-tid='label'>
                {label}
            </div>
        )}
    </button>
);

export default FakeSearchBarInput;
