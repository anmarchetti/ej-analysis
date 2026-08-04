import React, { FC, useState } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import isBackend from 'frontend/utils/isBackend';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';

import LanguageSelectorButton from './components/LanguageSelectorButton/LanguageSelectorButton';
import LanguageSelectorPopup from './components/LanguageSelectorPopup/LanguageSelectorPopup';
import { TLanguageSelectorOption } from './interfaces';

export interface ILanguageSelectorFields {
    Items: TLanguageSelectorOption[];
    PopUpSubtitle: ISitecoreField<string>;
    PopUpTitle: ISitecoreField<string>;
}

interface ILanguageSelectorProps {
    fields: ILanguageSelectorFields;
}

const LanguageSelector: FC<ILanguageSelectorProps> = ({ fields }) => {
    const { siteLang } = useStore(stores => ({
        siteLang: stores.layoutStore.lang,
    }));
    const [isLanguageSelectorPopupShown, setIsLanguageSelectorPopupShown] = useState<boolean>(false);

    const items = (fields.Items || []).filter(item => item.fields?.Code?.value);
    const activeLangOption = items.find(item => item.fields.Code.value === siteLang);
    const hasPopup = items.length > 1;

    const onLangButtonClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
        e.preventDefault();

        if (hasPopup) {
            setIsLanguageSelectorPopupShown(true);
        }
    };

    const closePopup = (): void => {
        setIsLanguageSelectorPopupShown(false);
    };

    if (!items.length) return null;

    return (
        <>
            <LanguageSelectorButton
                onClick={onLangButtonClick}
                langOption={activeLangOption}
                aria-haspopup={hasPopup ? 'dialog' : undefined}
                aria-expanded={hasPopup ? isLanguageSelectorPopupShown : undefined}
            />

            {/* Use React portal to render popup outside of <header/> to avoid issues with z-index */}
            {!isBackend() &&
                hasPopup &&
                createPortal(
                    <LanguageSelectorPopup
                        isOpen={isLanguageSelectorPopupShown}
                        items={items}
                        title={fields.PopUpTitle?.value}
                        subtitle={fields.PopUpSubtitle?.value}
                        onClose={closePopup}
                    />,
                    document.body,
                )}
        </>
    );
};

export default observer(LanguageSelector);
