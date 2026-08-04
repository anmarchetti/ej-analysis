import React, { FC, useState } from 'react';
import { observer } from 'mobx-react';

import { getCMSLang } from 'code/cmsLang';
import useStore from 'frontend/hooks/useStore';
import { IHolidaysStores } from 'frontend/store/holidays';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { EventTypes } from 'models/enum/tracking/EventTypes';
import { EventActions, EventCategories, GENERIC_CUSTOM_PARAMS_EMPTY } from 'models/enum/tracking/GenericEventParams';
import Button from 'frontend/components/common/Button';
import { TLanguageSelectorOption } from 'frontend/components/renderings/LanguageSelector/interfaces';

import LanguageOption from './LanguageOption/LanguageOption';

import styles from './LanguageSelectorForm.module.scss';

export interface ILanguageSelectorFormProps {
    items: TLanguageSelectorOption[];
    onClose: () => void;
    subtitle: string | undefined;
    title: string | undefined;
}

const LanguageSelectorForm: FC<ILanguageSelectorFormProps> = ({ items, title, subtitle, onClose }) => {
    const { siteLang, isHomePage, getPhrase, switchToNewLanguage, trackEventWithParams } = useStore(
        (stores: IHolidaysStores) => ({
            siteLang: stores.layoutStore.lang,
            isHomePage: stores.layoutStore.isHomePage,
            getPhrase: stores.layoutStore.getPhrase,
            switchToNewLanguage: stores.routerStore.switchToNewLanguage,
            trackEventWithParams: stores.trackingStore.trackEventWithParams,
        }),
    );

    const [selectedLang, setSelectedLang] = useState<string | undefined>(siteLang);

    const onSubmit = (e: React.FormEvent): void => {
        e.preventDefault();

        if (!!selectedLang) {
            trackEventWithParams(
                EventTypes.GenericEvent,
                {
                    eventAction: isHomePage ? EventActions.MarketSelection : EventActions.LanguageSelection,
                    eventCategory: EventCategories.NavigationBarMenu,
                    eventLabel: getCMSLang(selectedLang).toUpperCase(),
                    eventType: EventTypes.Interaction,
                },
                GENERIC_CUSTOM_PARAMS_EMPTY,
            );
            switchToNewLanguage(selectedLang);
        }
    };

    return (
        <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.header} data-tid='lang-selector-header'>
                {!!title && (
                    <h2 className={styles.title} data-tid='lang-selector-title'>
                        {title}
                    </h2>
                )}
                {!!subtitle && (
                    <h3 className={styles.subtitle} data-tid='lang-selector-subtitle'>
                        {subtitle}
                    </h3>
                )}
            </div>

            <div className={styles.options} role='radiogroup' aria-label={title} data-tid='lang-selector-options'>
                {items.map(item => {
                    const code = item.fields?.Code?.value;

                    return (
                        <LanguageOption
                            key={item.id}
                            item={item}
                            isSelected={selectedLang === code}
                            onSelect={(): void => setSelectedLang(code)}
                        />
                    );
                })}
            </div>

            <div className={styles.buttons} data-tid='lang-selector-buttons'>
                <Button className={styles.button} isText onClick={onClose} dataTid='close-lang-button'>
                    {getPhrase(SitecoreDictionary.GlobalsButtonsClose)}
                </Button>
                <Button
                    className={styles.button}
                    disabled={siteLang === selectedLang}
                    dataTid='select-lang-button'
                    type='submit'
                >
                    {getPhrase(SitecoreDictionary.GlobalsButtonsApply)}
                </Button>
            </div>
        </form>
    );
};

export default observer(LanguageSelectorForm);
