import { FC } from 'react';

import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import SiteSettings from 'models/enum/SiteSettings';
import { IDurationPillOption } from 'models/sitecore/IDurationPillOption';
import PillSelector from 'frontend/components/common/PillSelector/PillSelector';

export interface IDurationPillsProps {
    onChange: (value: number) => void;
    selectedValue: number | undefined;
    className?: string;
}

const DurationPills: FC<IDurationPillsProps> = ({ onChange, selectedValue, className }) => {
    const { getSetting } = useStore((stores: TStores) => ({
        getSetting: stores.layoutStore.getSetting,
    }));
    const durationPillOptions: IDurationPillOption[] = getSetting(SiteSettings.SearchPodDurationPillOptions) || [];

    if (!durationPillOptions.length) {
        return null;
    }

    const convertedOptions = durationPillOptions.map((option: IDurationPillOption) => ({
        value: Number.parseInt(option.Duration),
        label: option.Label,
    }));

    return (
        <PillSelector
            inputName='durationPills'
            selectedValue={selectedValue}
            options={convertedOptions}
            onChange={onChange}
            className={className}
            dataTid='duration-pills'
        />
    );
};

export default DurationPills;
