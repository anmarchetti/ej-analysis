import { IExtraLuggageContent, ILuggageInfoItem } from 'models/data/IFlightExtras';

export interface IGetLuggageInfoItemsProps {
    defaultBagsOneDirection: ILuggageInfoItem[];
    extraLuggageFullInfo: Record<string, IExtraLuggageContent>[];
    infantsNumber: number;
    luxuryInternalFlightBagsLabel: string | undefined;
    pramLabel: string;
    sportEquipmentsLabel: string;
}

export interface ILuggageLine {
    dataTid: string;
    text: string;
}

const getHoldLuggageTid = (text: string | undefined): string => {
    const kgAmount = text?.match(/\d+/g)?.pop();
    const dataTid = 'hold-luggage';

    return kgAmount ? `${dataTid}-${kgAmount}` : dataTid;
};

export const getLuggageInfoItems = ({
    pramLabel,
    sportEquipmentsLabel,
    infantsNumber,
    extraLuggageFullInfo,
    defaultBagsOneDirection,
    luxuryInternalFlightBagsLabel,
}: IGetLuggageInfoItemsProps): ILuggageLine[] => {
    const [selectedLuggage, selectedSportEquipment] = extraLuggageFullInfo;
    const luggageItems: ILuggageLine[] = [];
    const selectedSportItems = Object.values(selectedSportEquipment);

    if (infantsNumber) {
        luggageItems.push({ text: `${infantsNumber} x ${pramLabel}`, dataTid: 'default-pram' });
    }

    if (luxuryInternalFlightBagsLabel) {
        luggageItems.push({ text: luxuryInternalFlightBagsLabel, dataTid: 'luxury-internal-flight-default-bags' });

        return luggageItems;
    }

    if (defaultBagsOneDirection.length) {
        const defaultBag = defaultBagsOneDirection[0];

        luggageItems.push({ text: `${defaultBagsOneDirection.length} x ${defaultBag.name}`, dataTid: 'default-bag' });
    }

    if (selectedLuggage) {
        Object.values(selectedLuggage).forEach(({ name, quantity }) =>
            luggageItems.push({
                text: `${quantity} x ${name}`,
                dataTid: getHoldLuggageTid(name),
            }),
        );
    }

    if (selectedSportItems.length) {
        const items: string[] = [];
        let totalNumber = 0;

        selectedSportItems.forEach(({ quantity, name }) => {
            totalNumber += quantity;
            items.push(`${quantity} x ${name}`);
        });

        luggageItems.push({
            text: `${totalNumber} x ${sportEquipmentsLabel} (${items.join(', ')})`,
            dataTid: 'sport-equipment',
        });
    }

    return luggageItems;
};
