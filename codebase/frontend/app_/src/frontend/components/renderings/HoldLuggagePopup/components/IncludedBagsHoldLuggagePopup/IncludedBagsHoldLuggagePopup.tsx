import { FC } from 'react';
import { Text } from '@sitecore-jss/sitecore-jss-nextjs';
import { observer } from 'mobx-react';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { Tokenizer } from 'frontend/utils/tokenizer';
import OptionItemHoldLuggagePopup from 'frontend/components/renderings/HoldLuggagePopup/components/OptionItemHoldLuggagePopup/OptionItemHoldLuggagePopup';
import { IHoldLuggagePopupFields } from 'frontend/components/renderings/HoldLuggagePopup/HoldLuggagePopup';

import styles from './IncludedBagsHoldLuggagePopup.module.scss';

export interface IIncludedBagsHoldLuggagePopupProps {
    fields: IHoldLuggagePopupFields;
}

export const IncludedBagsHoldLuggagePopup: FC<IIncludedBagsHoldLuggagePopupProps> = ({ fields }) => {
    const { defaultBag, defaultBagsNumber, infantsNumber } = useStore(
        ({ bookingStore, guestDetailsStore }: TStores) => ({
            defaultBag: bookingStore.extraLuggage.defaultBag,
            infantsNumber: guestDetailsStore.infants.length,
            defaultBagsNumber: bookingStore.extraLuggage.defaultBagsNumber,
        }),
    );

    if (!defaultBag && !infantsNumber) {
        return null;
    }

    const { PramIcon, PramTitle, DefaultBagsTitle, DefaultBagsCounterSingle, DefaultBagsCounterPlural } = fields;
    const totalNumber = defaultBagsNumber + infantsNumber;
    const subtitleField = totalNumber === 1 ? DefaultBagsCounterSingle : DefaultBagsCounterPlural;
    const subtitle = Tokenizer.replaceToken(subtitleField?.value, Tokens.Number, totalNumber.toString());

    return (
        <div className={styles.wrapper} data-tid='included-bags-in-popup'>
            <Text field={DefaultBagsTitle} tag='h3' className={styles.title} data-tid='hl-section-title' />
            <p className={styles.subtitle} data-tid='hl-included-section-subtitle'>
                {subtitle}
            </p>

            {!!infantsNumber && (
                <OptionItemHoldLuggagePopup
                    name={`${infantsNumber} x ${PramTitle.value}`}
                    icon={PramIcon.value.src}
                    shouldRender
                />
            )}
            {defaultBag && (
                <OptionItemHoldLuggagePopup
                    name={`${defaultBagsNumber} x ${defaultBag.name}`}
                    icon={defaultBag.icon}
                    shouldRender
                />
            )}
        </div>
    );
};

export default observer(IncludedBagsHoldLuggagePopup);
