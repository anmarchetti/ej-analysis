import React, { useEffect } from 'react';
import { RichText, Text } from '@sitecore-jss/sitecore-jss-react';
import classNames from 'classnames';

import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { HolidaysRootStore } from 'frontend/store/holidays/HolidaysRootStore';
import { Tokenizer } from 'frontend/utils/tokenizer';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import SvgWarningFilledTransparent from 'frontend/components/icons-new/WarningFilledTransparent';
import { IAmendPassengersFields } from 'frontend/components/renderings/AmendPassengers/AmendPassengers';
import { useAmendPassengersLocalStore } from 'frontend/components/renderings/AmendPassengers/stores/amendPassengerLocalStore';

import styles from './CharacterChangeWarning.module.scss';

const CharacterChangeWarning = ({
    remainingCharactersToChange,
    fields,
}: {
    remainingCharactersToChange: number;
    fields?: IAmendPassengersFields;
}) => {
    const { tracking } = useAmendPassengersLocalStore();
    const { getPhrase, characterCountLimit } = useStore((stores: HolidaysRootStore) => ({
        getPhrase: stores.layoutStore.getPhrase,
        characterCountLimit: stores.amendPassengerStore.amendPassengerNameCharacterCount,
    }));

    const characterChangeLimitExceeded = remainingCharactersToChange < 0;
    const phoneNumber = fields?.Phone?.value;
    const errorMessage = Tokenizer.replaceTokens(fields?.CharacterCountExceededAdvice?.value, {
        [Tokens.Number]: phoneNumber ? `<a class='btn-txt' href='tel:${phoneNumber}'>${phoneNumber}</a>` : '',
        [Tokens.Count]: characterCountLimit,
    });

    const characterChangeWarningDescription = Tokenizer.replaceTokens(
        characterChangeLimitExceeded
            ? fields?.CharacterCountExceededWarning?.value
            : fields?.CharacterCountWarning?.value,
        {
            [Tokens.Count]: Math.abs(remainingCharactersToChange).toString(),
            [Tokens.ChangeNoun]:
                Math.abs(remainingCharactersToChange) === 1
                    ? getPhrase(SitecoreDictionary.GlobalsLabelsChangeSingular)
                    : getPhrase(SitecoreDictionary.GlobalsLabelsChangesPlural),
        },
    );

    useEffect(() => {
        if (!characterChangeLimitExceeded) {
            return;
        }

        tracking.onShowExceedCharactersCountError(characterChangeWarningDescription);
    }, [characterChangeLimitExceeded]);

    return (
        <div data-tid='character-change-warning' className={styles.nameValidation}>
            <div
                className={classNames(styles.characterInfo, {
                    [styles['characterInfo--error']]: characterChangeLimitExceeded,
                })}
            >
                {characterChangeLimitExceeded && (
                    <i className='me-2 mt-1' data-tid='character-change-warning-tooltip'>
                        <SvgWarningFilledTransparent />
                    </i>
                )}
                <Text
                    field={{
                        value: characterChangeWarningDescription,
                    }}
                    tag='p'
                />
            </div>

            {characterChangeLimitExceeded && (
                <RichText
                    field={{
                        value: errorMessage,
                    }}
                    tag='p'
                />
            )}
        </div>
    );
};

export default CharacterChangeWarning;
