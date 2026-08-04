import classNames from 'classnames';

export interface IRoundButtonProps {
    content: number | string;

    withoutBg: boolean;

    disabled?: boolean;
    onClick?: () => void;
}

const RoundButton: React.FC<IRoundButtonProps> = props => {
    const { onClick, withoutBg, content, disabled } = props;

    return (
        <button
            onClick={onClick}
            className={classNames('btn-round', withoutBg && 'no-bg', disabled && 'disabled')}
            disabled={disabled}
        >
            {content}
        </button>
    );
};

export default RoundButton;
