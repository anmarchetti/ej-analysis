import React, { FC } from 'react';
import { observer } from 'mobx-react';

import { useIsMounted } from 'frontend/hooks/useIsMounted';
import useStore from 'frontend/hooks/useStore';
import Drawer from 'frontend/components/common/Drawer';
import { Popup } from 'frontend/components/common/Popup';
import { TLanguageSelectorOption } from 'frontend/components/renderings/LanguageSelector/interfaces';

import LanguageSelectorForm from './LanguageSelectorForm/LanguageSelectorForm';

import styles from './LanguageSelectorPopup.module.scss';

interface ILanguageSelectorPopupProps {
    isOpen: boolean;
    items: TLanguageSelectorOption[];
    onClose: () => void;
    subtitle: string | undefined;
    title: string | undefined;
}

const LANG_SELECTOR_POPUP_ID = 'language-selector-popup';

const LanguageSelectorPopup: FC<ILanguageSelectorPopupProps> = ({ isOpen, items, title, subtitle, onClose }) => {
    const isMounted = useIsMounted();

    const { isScreenLarge } = useStore(stores => ({
        isScreenLarge: stores.appStore.isScreenLarge,
    }));

    if (!isMounted) {
        return null;
    }

    if (isScreenLarge) {
        return isOpen ? (
            <Popup id={LANG_SELECTOR_POPUP_ID} aria-label={title} containerClass={styles.popup} onClose={onClose}>
                <LanguageSelectorForm items={items} title={title} subtitle={subtitle} onClose={onClose} />
            </Popup>
        ) : null;
    }

    return (
        <Drawer id={LANG_SELECTOR_POPUP_ID} aria-label={title} open={isOpen}>
            {isOpen && <LanguageSelectorForm items={items} title={title} subtitle={subtitle} onClose={onClose} />}
        </Drawer>
    );
};

export default observer(LanguageSelectorPopup);
