import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import { IAddAssistanceFields } from 'frontend/components/renderings/SpecialRequests/components/SpecialAssistance/SpecialAssistance';

import styles from './SpecialAssistancePopup.module.scss';

export interface ISpecialAssistancePopupProps extends IAddAssistanceFields {
    onClose: () => void;
}

const SpecialAssistancePopup: FC<ISpecialAssistancePopupProps> = ({
    onClose,
    AddAssistanceTitle,
    AddAssistanceDescription,
    AddAssistancePhone,
    AddAssistanceExtra,
}) => {
    const { getPhrase } = useStore(store => ({
        getPhrase: store.layoutStore.getPhrase,
    }));

    return (
        <Popup
            onClose={onClose}
            contentClass={styles.popupContent}
            footerContent={
                <Button isOutlined onClick={onClose} data-tid='special-assistance-popup-button'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
            }
            id='special-assistance-popup'
        >
            <Text
                field={AddAssistanceTitle}
                className={styles.title}
                tag='h3'
                data-tid='special-assistance-popup-title'
            />
            <RichTextWithLinks
                field={AddAssistanceDescription}
                tag='p'
                className={styles.text}
                dataId='special-assistance-popup-description'
            />
            <Text
                field={AddAssistancePhone}
                tag='div'
                className={styles.phone}
                data-tid='special-assistance-popup-phone'
            />
            <RichTextWithLinks
                field={AddAssistanceExtra}
                tag='p'
                className={styles.text}
                dataId='special-assistance-popup-extra'
            />
        </Popup>
    );
};

export default observer(SpecialAssistancePopup);
