import React, { FC } from 'react';
import classNames from 'classnames';

import useStore from 'frontend/hooks/useStore';
import { MediaSize } from 'models/data/MediaSizeParams';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { JSSImageNext } from 'frontend/components/common/JSSImageNext/JSSImageNext';
import { TLanguageSelectorOption } from 'frontend/components/renderings/LanguageSelector/interfaces';

import styles from './LanguageSelectorButton.module.scss';

interface ILanguageSelectorButtonProps extends Pick<React.AriaAttributes, 'aria-expanded' | 'aria-haspopup'> {
    langOption: TLanguageSelectorOption | undefined;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const LanguageSelectorButton: FC<ILanguageSelectorButtonProps> = ({
    onClick,
    langOption,
    ...ariaAttributes
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    const { IconCircle, Icon } = langOption?.fields || {};
    const iconSrc = IconCircle?.value?.src || Icon?.value?.src;

    return (
        <button
            type='button'
            className={classNames(styles.button)}
            onClick={onClick}
            aria-label={getPhrase(SitecoreDictionary.GlobalsLabelsChooseLanguage)}
            {...ariaAttributes}
        >
            {!!iconSrc && <JSSImageNext field={IconCircle || Icon} fill mediaSize={MediaSize.Small} priority />}
        </button>
    );
};

export default LanguageSelectorButton;
