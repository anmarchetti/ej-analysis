import * as React from 'react';
import classNames from 'classnames';

import styles from './Button.module.scss';

export interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: any;
    dataTid?: string;
    disabled?: boolean;
    // only looks like disabled but clickable
    hasDisabledStyles?: boolean;
    isBlackColor?: boolean;
    isCapitalize?: boolean;
    isFullWidth?: boolean;
    isLabel?: boolean;
    isLarge?: boolean;
    isLink?: boolean;
    isLoading?: boolean;
    isMd?: boolean;
    isMedium?: boolean;
    isOutlined?: boolean;
    isPlaceholderShimmer?: boolean; // isLoading shimmering alternative
    isPrimary?: boolean;
    isReversed?: boolean;
    isSecondary?: boolean;
    isSmall?: boolean;
    isText?: boolean;
    isTransparent?: boolean;
    isWide?: boolean;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    removeDefaultClass?: boolean;
}

const Button = React.forwardRef((props: IButtonProps, ref) => {
    const {
        disabled,
        children,
        removeDefaultClass,
        isLarge,
        isFullWidth,
        isTransparent,
        isWide,
        isMedium,
        isOutlined,
        isText,
        isMd,
        isLink,
        isReversed,
        isLoading,
        isLabel,
        isBlackColor,
        hasDisabledStyles,
        isPlaceholderShimmer,
        className,
        dataTid,
        isSmall,
        type,
        isCapitalize,
        onClick,
        onKeyUp,
        isSecondary,
        isPrimary,
        ...attributes
    } = props;

    const buttonClass = classNames(
        {
            btn: !removeDefaultClass,
            ['btn--large']: isLarge,
            ['btn--small']: isSmall,
            ['btn--full-width']: isFullWidth,
            ['btn--transparent']: isTransparent,
            ['btn--wide']: isWide,
            ['btn--medium']: isMedium,
            ['btn--outlined']: isOutlined,
            ['btn--reversed']: isReversed,
            ['btn--md']: isMd,
            ['btn--txt']: isText,
            ['btn--label']: isLabel,
            ['btn--disabled']: disabled || hasDisabledStyles,
            ['btn--loading']: isLoading,
            ['btn-link']: isLink,
            [styles.capitalize]: isCapitalize,
            ['placeholder-shimmer']: isPlaceholderShimmer,
            ['btn--black']: isBlackColor,
            [styles.secondary]: isSecondary,
            [styles.primary]: isPrimary,
        },
        className,
    );

    return (
        <button
            type={type || 'button'}
            onClick={e => !disabled && !isLoading && !isPlaceholderShimmer && onClick?.(e)}
            className={buttonClass}
            disabled={disabled}
            data-tid={dataTid}
            ref={ref ? (ref as React.RefObject<HTMLButtonElement>) : undefined}
            onKeyUp={onKeyUp}
            {...attributes}
        >
            {children}
        </button>
    );
});

export default Button;
