import { FC, useEffect } from 'react';

import { useMobileViewport } from 'frontend/hooks/useMediaQuery';
import { scrollIntoViewHorizontal } from 'frontend/utils/scroll.utils';
import RadioButton from 'frontend/components/common/RadioButton';

interface IPillOption {
    label: string;
    value: number;
}

export interface IPillSelectorProps {
    dataTid: string;
    inputName: string;
    onChange: (value: number) => void;
    options: IPillOption[];
    className?: string;
    selectedValue?: number;
}

const PillSelector: FC<IPillSelectorProps> = ({ onChange, options, selectedValue, inputName, className, dataTid }) => {
    const isMobile = useMobileViewport();

    useEffect(() => {
        if (!isMobile) return;

        const selected = document.querySelector(`input[name="${inputName}"]:checked`);

        if (selected?.parentElement) {
            scrollIntoViewHorizontal(selected.parentElement, {
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [selectedValue, isMobile, inputName]);

    if (!options.length) {
        return null;
    }

    const handleChange = (value: number): void => {
        onChange(value);
    };

    return (
        <div className={className} data-tid={dataTid}>
            {options.map(({ value, label }, index: number) => {
                const isChecked = value === selectedValue;

                return (
                    <RadioButton
                        key={`option${value}`}
                        dataTid={`${dataTid}-pill-${index}`}
                        label={label}
                        name={inputName}
                        onChange={(): void => handleChange(value)}
                        checked={isChecked}
                        value={value}
                        className={isChecked ? 'is-selected' : ''}
                        pill
                    />
                );
            })}
        </div>
    );
};

export default PillSelector;
