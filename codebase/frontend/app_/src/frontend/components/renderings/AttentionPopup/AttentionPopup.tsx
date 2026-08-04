import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField, ISitecoreImage, ISitecoreLink } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import JSSImage from 'frontend/components/common/JSSImage';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import RouterLink from 'frontend/components/common/RouterLink';

import styles from './AttentionPopup.module.scss';

export interface IAttentionPopupFields {
    Title: ISitecoreField<string>;
    CTA?: ISitecoreField<string>;
    CTALink?: ISitecoreField<ISitecoreLink>;
    Description?: ISitecoreField<string>;
    Icon?: ISitecoreField<ISitecoreImage>;
    SecondaryCTA?: ISitecoreField<string>;
}

export enum PopupType {
    InventoryError = 'InventoryError',
    NoDatesAvailable = 'NoDatesError',
    NoRoomAndBoardAvailable = 'NoRoomAndBoardAvailable',
}

export enum AttentionPopupMobilePosition {
    Bottom = 'bottom',
    Center = 'center',
    TopCenter = 'top-center',
}

export interface IAttentionComponentPopupProps {
    onClose: () => void;
    className?: string;
    descriptionHandler?: (string) => string;
    disableOutsideClick?: boolean;
    id?: string;
    isInnerPopup?: boolean;
    isLoading?: boolean;
    mobilePosition?: AttentionPopupMobilePosition;
    onConfirm?: () => Promise<void> | void;
    popupType?: PopupType;
    showCloseButton?: boolean;
}

export interface IAttentionPopupProps
    extends Partial<ISitecoreComponent<IAttentionPopupFields>>,
        IAttentionComponentPopupProps {}

const AttentionPopup: FC<IAttentionPopupProps> = ({
    fields,
    onClose,
    id = 'attention-popup',
    descriptionHandler = value => value,
    popupType,
    params,
    showCloseButton,
    className,
    mobilePosition = AttentionPopupMobilePosition.Bottom,
    onConfirm,
    isLoading,
    isInnerPopup,
    disableOutsideClick,
}: IAttentionPopupProps) => {
    // Check if popupType is provided and if it's the same as the one from Sitecore params
    const isPopupTypeProvided = !!popupType;
    const isExistingPopupType = popupType === params?.popupType;

    // Only render null if popupProp is provided and it doesn't match Sitecore params, or no fields
    if (!fields || (isPopupTypeProvided && !isExistingPopupType)) {
        return null;
    }

    const handleConfirm = async () => {
        await onConfirm?.();

        onClose();
    };

    const { Icon, SecondaryCTA, Title, Description, CTA, CTALink } = fields;

    return (
        <Popup
            id={id}
            onClose={onClose}
            contentClass={classNames(styles.content, 'popup_content', styles[mobilePosition])}
            bodyClass={classNames(styles.body, 'popup_body')}
            showCloseButton={showCloseButton}
            dialogClass={classNames(styles.dialog, className)}
            isInnerPopup={isInnerPopup}
            disableOutsideClick={disableOutsideClick}
        >
            <div className={styles.heading}>
                <JSSImage field={Icon} dataTid={id + '-icon'} className={styles.errorPopupIcon} />
                <Text
                    field={Title}
                    tag='h2'
                    data-tid={id + '-title'}
                    className={classNames(styles.title, 'popup_title')}
                />
            </div>

            {!!Description && (
                <RichTextWithLinks
                    field={{ value: descriptionHandler(Description.value) } as ISitecoreField<string>}
                    className={classNames(styles.description, 'popup_description')}
                    tag='p'
                    dataId={id + '-description'}
                />
            )}
            <div className={styles.footer}>
                {SecondaryCTA?.value && (
                    <Button
                        onClick={onClose}
                        type='button'
                        dataTid={id + '-secondary-cta'}
                        isOutlined
                        className={classNames(styles.cta, styles.secondaryCta)}
                    >
                        <Text tag='span' field={SecondaryCTA} />
                    </Button>
                )}
                {!!CTALink?.value.href ? (
                    <RouterLink link={CTALink} className='btn' dataId={id + '-link'} onClick={handleConfirm}>
                        <Text field={CTA} />
                    </RouterLink>
                ) : (
                    <Button
                        onClick={handleConfirm}
                        type='button'
                        dataTid={id + '-cta'}
                        className={classNames(styles.cta, 'popup_cta')}
                        isLoading={isLoading}
                    >
                        <Text tag='span' field={CTA} />
                    </Button>
                )}
            </div>
        </Popup>
    );
};

export default AttentionPopup;
