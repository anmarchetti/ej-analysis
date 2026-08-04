import classNames from 'classnames';

import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Checkbox from 'frontend/components/common/Checkbox';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

interface IConfirmationCheckboxProps {
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    errorDescription?: string | JSX.Element;
    errorMessage?: string;

    hasError?: boolean;
    label?: ISitecoreField<string> | string;
    large?: boolean;

    title?: string;
}

const ConfirmationCheckbox: React.FC<IConfirmationCheckboxProps> = ({
    checked,
    disabled,
    title,
    label,
    large,
    errorMessage,
    errorDescription,
    hasError,
    onChange,
}) => (
    <div
        data-tid='confirmation-checkbox-wrapper'
        className={classNames('confirmation-checkbox', large && 'confirmation-checkbox--large', hasError && 'error')}
    >
        <div className='confirmation-checkbox__region'>
            {!!title && <h2 className='confirmation-checkbox__title'>{title}</h2>}

            <Checkbox
                id='confirmation-checkbox'
                large={large}
                textRight
                tick
                hasError={hasError}
                checked={checked}
                disabled={disabled}
                required
                label={label}
                onChange={onChange}
                dataTid='confirmation-checkbox'
            />
        </div>

        {hasError && errorMessage && (
            <ErrorMessage
                message={errorMessage}
                description={errorDescription}
                errorMessageClass={classNames('error', !errorDescription && 'checkbox-error')}
                IsDesc
                icon={
                    <i className='error-message__icon'>
                        <SvgWarningFilled />
                    </i>
                }
            />
        )}
    </div>
);

export default ConfirmationCheckbox;
