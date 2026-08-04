import React from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { ISitecoreComponent } from 'models/sitecore/generic/ISitecoreComponent';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import styles from './CabinBagsValidationPopup.module.scss';

interface ICabinBagsValidationPopupFields {
    CTA: ISitecoreField<string>;
    Description: ISitecoreField<string>;
    Title: ISitecoreField<string>;
}

export type TCabinBagsValidationPopupProps = ISitecoreComponent<ICabinBagsValidationPopupFields>;

const CabinBagsValidationPopup: React.FC<TCabinBagsValidationPopupProps> = ({ fields }) => {
    const { isLCBFullPopupShown, setLCBFullPopupShown } = useStore(({ bookingStore: { extraLuggage } }: TStores) => ({
        setLCBFullPopupShown: extraLuggage.setLCBFullPopupShown,
        isLCBFullPopupShown: extraLuggage.isLCBFullPopupShown,
    }));

    if (!fields || !isLCBFullPopupShown) {
        return null;
    }

    const handleClick = () => {
        setLCBFullPopupShown(false);
    };

    const { Title, Description, CTA } = fields;

    return (
        <Popup
            aria-label={Title?.value}
            containerClass={styles.cabinBagsValidationPopup}
            id='cabin-bags-validation-popup'
        >
            <Text tag={'h2'} field={Title} className={styles.title} data-tid='cabin-bags-validation-popup--title' />
            <RichTextWithLinks
                tag={'p'}
                field={Description}
                className={styles.description}
                dataId='cabin-bags-validation-popup--subtitle'
            />
            <Button className={styles.button} onClick={handleClick} data-tid='cabin-bags-validation-popup--button'>
                {CTA?.value}
            </Button>
        </Popup>
    );
};

export default observer(CabinBagsValidationPopup);
