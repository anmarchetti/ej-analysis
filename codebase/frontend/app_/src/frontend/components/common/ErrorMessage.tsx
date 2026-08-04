import { FC } from 'react';
import classNames from 'classnames';

import { ISitecoreField, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';

import RouterLink from './RouterLink';

export const ERROR_MESSAGE_CLASSNAME = 'error-message';

interface IErrorMessageProps {
    IfIsNotificationOrange?: boolean;
    IsDesc?: boolean;
    IsIconOnTop?: boolean;
    IsNotification?: boolean;
    IsSuccess?: boolean;
    btnLink?: ISitecoreField<ISitecoreLink>;
    correlationId?: string;
    dataTid?: string;
    description?: string | JSX.Element;
    errorMessageClass?: string;
    icon?: any;
    isSmallText?: boolean;
    isTransparent?: boolean;
    isWarning?: boolean;
    message?: string | JSX.Element;
    onClick?: (e: React.MouseEvent) => void;
    role?: string; // WAI-ARIA
}

const ErrorMessage: FC<IErrorMessageProps> = ({
    IfIsNotificationOrange,
    IsDesc,
    IsIconOnTop,
    IsNotification,
    IsSuccess,
    btnLink,
    correlationId,
    dataTid,
    description,
    errorMessageClass,
    icon,
    isSmallText,
    isTransparent,
    isWarning,
    message,
    onClick,
    role,
}) => {
    const className = classNames(
        ERROR_MESSAGE_CLASSNAME,
        IfIsNotificationOrange && 'error-message--orange',
        IsNotification && 'error-message--blue',
        isWarning && 'error-message--yellow',
        IsSuccess && 'error-message--green',
        isTransparent && 'error-message--transparent',
        btnLink && 'row',
        (description || IsDesc) && 'error-message--with-desc',
        errorMessageClass,
    );

    return (
        <div className={className} data-tid={dataTid} role={role}>
            <div className='row'>
                <div className={classNames('d-flex', !!btnLink && !!onClick ? 'col-sm-8 col-md-10' : 'col-sm-12')}>
                    <div className={classNames('error-message__icon', IsIconOnTop && 'error-message__icon-on-top')}>
                        {icon}
                    </div>

                    <div className='error-message__container'>
                        {description || correlationId ? (
                            <span
                                className={classNames('error-message__label', isSmallText && 'error-text-small')}
                                data-tid='msg-title'
                            >
                                {message}
                            </span>
                        ) : (
                            <span data-tid='msg-title'>{message}</span>
                        )}
                        {description && (
                            <span
                                className={classNames('error-message__description', isSmallText && 'error-text-small')}
                                data-tid='msg-description'
                            >
                                {description}
                            </span>
                        )}
                        {correlationId && (
                            <span className='error-message__description' data-tid='msg-correlation-id'>
                                {correlationId}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!!btnLink && !!onClick && (
                <div className='error-message__button col-sm-4 col-md-2'>
                    <RouterLink link={btnLink} className='btn' onClick={onClick}>
                        {btnLink.value.text}
                    </RouterLink>
                </div>
            )}
        </div>
    );
};

export default ErrorMessage;
