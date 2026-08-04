import classNames from 'classnames';

import ChevronDown from 'frontend/components/icons-new/ChevronDown';

import styles from './GuestDetailsBlock.module.scss';

interface IGuestDetailsHeadProps {
    icon: JSX.Element;
    title: string;
    disabled?: boolean;
    isExpanded?: boolean;
    onClick?: () => void;
    secondaryText?: string;
}

const GuestDetailsHeader: React.FC<IGuestDetailsHeadProps> = ({
    title,
    secondaryText,
    icon,
    onClick,
    isExpanded = true,
    disabled = false,
}) => {
    const content = (
        <>
            <div>
                <i className={styles.icon}>{icon}</i>
                <span className={styles.title}>{title}</span>

                {!!secondaryText && <span className={styles.secondaryText}>{secondaryText}</span>}
            </div>

            <div>
                <i className={classNames(styles.chevron, { [styles.expanded]: isExpanded })}>
                    <ChevronDown />
                </i>
            </div>
        </>
    );

    if (disabled) return content;

    return (
        <div className={styles.header}>
            <button onClick={onClick}>{content}</button>
        </div>
    );
};

export default GuestDetailsHeader;
