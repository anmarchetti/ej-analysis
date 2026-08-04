import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import Button from 'frontend/components/common/Button';
import { Popup } from 'frontend/components/common/Popup';
import PopupCloseButton from 'frontend/components/common/Popup/PopupCloseButton';
import styles from 'frontend/components/renderings/AmendFlights/AmendFlights.module.scss';

interface ISeatDropOffPopup {
    onClose: () => void;
    onContinue: () => void;
    backCTA?: ISitecoreField<string>;
    description?: ISitecoreField<string>;
    title?: ISitecoreField<string>;
}

export const SeatDropOffPopup = ({ title, description, backCTA, onClose, onContinue }: ISeatDropOffPopup) => {
    const { getPhrase } = useStore((stores: IHolidaysStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <Popup contentClass={styles.popupContainer} onClose={onClose}>
            <PopupCloseButton onClick={onClose} className={styles.popupCloseButton} />
            <div className={styles.popupTopPart}>
                {title && <Text field={title} tag='h2' className={styles.popupHeader} />}
                {description && <Text field={description} tag='span' className={styles.popupDescription} />}
            </div>

            <div className={styles.popupFooter}>
                <Button className={styles.popupButton} onClick={onClose} isOutlined>
                    {backCTA?.value}
                </Button>
                <Button className={styles.popupButton} onClick={onContinue}>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsContinue)}
                </Button>
            </div>
        </Popup>
    );
};
