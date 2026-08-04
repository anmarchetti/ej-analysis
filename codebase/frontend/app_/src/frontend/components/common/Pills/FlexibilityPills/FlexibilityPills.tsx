import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { IFlexOption } from 'models/data/IFlexOption';
import SiteSettings from 'models/enum/SiteSettings';
import PillSelector from 'frontend/components/common/PillSelector/PillSelector';

export interface IFlexibilityPillsProps {
    flexDays: number;
    onChange: (value: number) => void;
    className?: string;
}

const FlexibilityPills: FC<IFlexibilityPillsProps> = ({ onChange, flexDays, className }) => {
    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));

    const flexOptions: IFlexOption[] = getSetting(SiteSettings.FlexibilityOptions) || [];

    if (!flexOptions.length) {
        return null;
    }

    const convertedOptions = flexOptions.map((option: IFlexOption) => ({
        value: Number.parseInt(option.Days),
        label: option.Label,
    }));

    return (
        <PillSelector
            inputName='flexDays'
            selectedValue={flexDays}
            options={convertedOptions}
            onChange={onChange}
            className={className}
            dataTid='flexibility-pills'
        />
    );
};

export default FlexibilityPills;
