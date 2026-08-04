import React, { FC } from 'react';

import RadioButton from 'frontend/components/common/RadioButton';
import { TLanguageSelectorOption } from 'frontend/components/renderings/LanguageSelector/interfaces';

import styles from './LanguageOption.module.scss';

interface ILanguageOptionProps {
    isSelected: boolean;
    item: TLanguageSelectorOption;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LanguageOption: FC<ILanguageOptionProps> = ({ item, isSelected, onSelect }) => {
    if (!item.fields) return null;

    const { Icon, Title, Code } = item.fields;
    const codeValue = Code?.value;
    const iconSrc = Icon?.value?.src;

    return (
        <div className={styles.option}>
            <RadioButton
                name='language'
                onChange={onSelect}
                checked={isSelected}
                dataTid={`${codeValue}-lang-option`}
                value={codeValue}
                label={
                    <span className={styles.label}>
                        {!!iconSrc && <img src={iconSrc} className={styles.icon} role='presentation' alt='' />}
                        {Title?.value ?? ''}
                    </span>
                }
            />
        </div>
    );
};

export default LanguageOption;
