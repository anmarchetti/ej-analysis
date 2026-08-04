import React, { useState } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './ContentModal.module.scss';

export interface IModalContentFields {
    ModalButtonText: ISitecoreField<string>;
    ModalDescription: ISitecoreField<string>;
    ModalTitle: ISitecoreField<string>;
}

interface IModalContentParameters {
    IsOutlined: boolean;
}

interface IModalContentProps extends ISitecoreComponent<IModalContentFields, IModalContentParameters> {
    className?: string;
}

export const ContentModal = (props: IModalContentProps) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const [isShowPopup, setIsShowPopup] = useState(false);

    const { fields, className, params } = props;

    if (!fields?.ModalButtonText?.value) {
        return null;
    }

    const modalClasses = classNames(styles['btn'], className);

    return (
        <>
            <Button
                isOutlined={!!params?.IsOutlined}
                className={modalClasses}
                onClick={() => setIsShowPopup(true)}
                dataTid='promo-block-button'
            >
                {fields.ModalButtonText.value}
            </Button>
            {isShowPopup && (
                <Popup
                    onClose={() => setIsShowPopup(false)}
                    showCloseButton
                    containerClass={styles['modal-dialog']}
                    footerContent={
                        <Button onClick={() => setIsShowPopup(false)} data-tid='modal-close-button'>
                            {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                        </Button>
                    }
                >
                    {!!fields && (
                        <div className='content'>
                            {!!fields.ModalTitle && (
                                <Text
                                    field={fields.ModalTitle}
                                    className={styles['modal-title']}
                                    tag='p'
                                    data-tid='modal-title'
                                />
                            )}
                            {!!fields.ModalDescription && (
                                <RichTextWithLinks field={fields.ModalDescription} tag='div' />
                            )}
                        </div>
                    )}
                </Popup>
            )}
        </>
    );
};

export default ContentModal;
