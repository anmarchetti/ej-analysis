import { FC } from 'react';
import { ComponentRendering, Placeholder, Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import IncludedBagsHoldLuggagePopup from 'frontend/components/renderings/HoldLuggagePopup/components/IncludedBagsHoldLuggagePopup/IncludedBagsHoldLuggagePopup';
import { IHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup';

import styles from './HoldLuggagePopupContent.module.scss';

export interface IHoldLuggagePopupContentProps {
    fields: IHoldLuggagePopupFields;
    rendering: ComponentRendering;
}

export const HoldLuggagePopupContent: FC<IHoldLuggagePopupContentProps> = ({ fields, rendering }) => {
    const { isSportsEquipmentAvailable, isHoldLuggageAvailable } = useStore((stores: TStores) => ({
        isSportsEquipmentAvailable: stores.bookingStore.extraLuggage.isSportsEquipmentAvailable,
        isHoldLuggageAvailable: stores.bookingStore.extraLuggage.isHoldLuggageAvailable,
    }));

    const { DescriptionHoldLuggageAndSport, DescriptionHoldLuggage, DescriptionSport, Header, DescriptionNote } =
        fields;

    const getDescription = () => {
        if (isHoldLuggageAvailable && isSportsEquipmentAvailable) return DescriptionHoldLuggageAndSport;

        if (isHoldLuggageAvailable) return DescriptionHoldLuggage;

        return DescriptionSport;
    };

    return (
        <>
            <div className={styles.headingGroup} data-tid='hold-luggage-popup-content'>
                <Text className={styles.heading} field={Header} tag='h2' data-tid='hold-luggage-popup-heading' />
                <Text
                    className={styles.subheading}
                    field={getDescription()}
                    tag='div'
                    data-tid='hold-luggage-popup-subheading'
                />
                <Text field={DescriptionNote} tag='div' className={styles.note} data-tid='hold-luggage-popup-note' />
            </div>

            <div className={styles.fullWidthContent}>
                <IncludedBagsHoldLuggagePopup fields={fields} />
                <Placeholder name='extra-luggage' rendering={rendering} additionalFields={fields} />
            </div>
        </>
    );
};

export default observer(HoldLuggagePopupContent);
