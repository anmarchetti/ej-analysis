import { SignDisplay } from 'code/currency';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IHoldLuggageRowProps } from 'frontend/components/renderings/HoldLuggage/components/HoldLuggageRow/HoldLuggageRow';
import { IHoldLuggageFields } from 'frontend/components/renderings/HoldLuggage/IHoldLuggageFields';

export interface IUseLuggageItemsProps {
    selectedSportEquipmentPrice: number;
    additionalFields?: IHoldLuggageFields;
}

const useLuggageItems = ({
    selectedSportEquipmentPrice,
    additionalFields,
}: IUseLuggageItemsProps): IHoldLuggageRowProps[] => {
    const { isHoldLuggageEnabled, isSportsEquipmentEnabled, formatMoney, extraLuggage, currency } = useStore(
        ({ bookingStore, marketStore, layoutStore }: TStores) => ({
            isHoldLuggageEnabled: layoutStore.isHoldLuggageEnabled,
            isSportsEquipmentEnabled: layoutStore.isSportsEquipmentEnabled,
            formatMoney: marketStore.formatMoney,
            extraLuggage: bookingStore.extraLuggage,
            currency: bookingStore.currency,
            sportEquipmentNumber: bookingStore.extraLuggage.sportEquipmentNumber,
        }),
    );

    if (!additionalFields) {
        return [];
    }

    const { extraLuggageFullInfo, sportEquipmentNumber } = extraLuggage;
    const [selectedLuggage, selectedSportEquipment] = extraLuggageFullInfo;
    const editLabel = additionalFields.EditLabel?.value;
    const luggageItems: IHoldLuggageRowProps[] = [];

    const generateTitle = (title: string, quantity: number): string => `${quantity} x ${title}`;

    const generateObject = (
        title: string,
        uniqueId: string,
        price: number,
        description: string,
        icon: string,
        subtitle?: string,
        feesWarning?: string,
    ): IHoldLuggageRowProps => ({
        title,
        price: formatMoney(price, {
            currency,
            signDisplay: SignDisplay.Always,
        }),
        editLabel,
        description,
        icon,
        subtitle,
        feesWarning,
        uniqueId: uniqueId,
    });

    if (isHoldLuggageEnabled) {
        for (const bag of Object.values(selectedLuggage)) {
            const { name, description, icon, quantity, price, uniqueId } = bag;

            luggageItems.push(
                generateObject(generateTitle(name, quantity), uniqueId || '', price * quantity, description, icon),
            );
        }
    }

    if (isSportsEquipmentEnabled && sportEquipmentNumber) {
        const { SportTitle, SportDescription, SportEquipmentIcon, SportTransferFees } = additionalFields;
        const items: string[] = [];

        for (const bag of Object.values(selectedSportEquipment)) {
            items.push(generateTitle(bag.name, bag.quantity));
        }

        luggageItems.push(
            generateObject(
                generateTitle(SportTitle?.value, sportEquipmentNumber),
                'sport-equipment',
                selectedSportEquipmentPrice,
                SportDescription?.value,
                SportEquipmentIcon?.value?.src,
                `(${items.join(', ')})`,
                sportEquipmentNumber ? SportTransferFees?.value : undefined,
            ),
        );
    }

    return luggageItems;
};

export default useLuggageItems;
