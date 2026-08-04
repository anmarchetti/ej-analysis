import { FC } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import HoldLuggageRow from 'frontend/components/renderings/HoldLuggage/components/HoldLuggageRow/HoldLuggageRow';
import { IHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/IHoldLuggageFields';

export interface IComplementaryBagsProps {
    additionalFields: IHoldLuggageFields;
    infantsNumber: number;
}

export const ComplementaryBags: FC<IComplementaryBagsProps> = ({ infantsNumber, additionalFields }) => {
    const { defaultBag, defaultBagsNumber } = useStore(({ bookingStore }: TStores) => ({
        defaultBag: bookingStore.extraLuggage.defaultBag,
        defaultBagsNumber: bookingStore.extraLuggage.defaultBagsNumber,
    }));

    if (!infantsNumber && !defaultBag) {
        return null;
    }

    const { IncludedForFreeText, PramHeading, PramDescription, PramIcon } = additionalFields;
    const pramTitle = `${infantsNumber} x ${PramHeading?.value}`;
    const { name, description, icon } = defaultBag || {};
    const defaultBagTitle = `${defaultBagsNumber} x ${name}`;

    return (
        <div data-tid='included-bags'>
            {!!infantsNumber && (
                <HoldLuggageRow
                    title={pramTitle}
                    description={PramDescription?.value}
                    icon={PramIcon?.value?.src}
                    uniqueId='pram'
                    includedForFreeText={IncludedForFreeText}
                />
            )}
            {defaultBag && (
                <HoldLuggageRow
                    title={defaultBagTitle}
                    description={description || ''}
                    icon={icon || ''}
                    uniqueId={defaultBag.itemCode}
                    includedForFreeText={IncludedForFreeText}
                />
            )}
        </div>
    );
};

export default observer(ComplementaryBags);
