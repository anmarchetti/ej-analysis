import React, { FC, useEffect, useState } from 'react';
import Select from 'react-select';
import classNames from 'classnames';

import settings from 'code/settings';
import { Tokens } from 'code/tokens';
import useStore from 'frontend/hooks/useStore';
import { TStores } from 'frontend/store/IStores';
import { areArraysEqual } from 'frontend/utils/array.utils';
import { validateChildrenAgesInRoom } from 'frontend/utils/guestsValidation';
import { Tokenizer } from 'frontend/utils/tokenizer';
import { ISelectOption } from 'models/data/ISelectOption';
import { SearchPodValidationFields } from 'models/data/tracking/SearchPodEvent';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RichTextDictionary from 'frontend/components/common/RichTextDictionary';
import DropdownIndicator from 'frontend/components/common/Select/DropdownIndicator/DropdownIndicator';
import ValueContainer from 'frontend/components/common/Select/ValueContainer';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import styles from './ChildrenAgesSelector.module.scss';

export const CHILDREN_AGE_SELECTOR_ID = 'children-age-selector';

export interface IChildrenAgesSelectorProps {
    childrenGuests: GuestInfo[];
    isChildrenAgeValid: boolean; // please don't use the prop from stores: they must be fetched directly on every render for component versatility
    validateChildrenAge: () => boolean; // please don't use the prop from stores: they must be fetched directly on every render for component versatility
    hideError?: boolean;
    isGroupBooking?: boolean;
    isSearchBar?: boolean;
}

const ChildrenAgesSelector: FC<IChildrenAgesSelectorProps> = ({
    isGroupBooking,
    isChildrenAgeValid,
    validateChildrenAge,
    childrenGuests,
    hideError,
    isSearchBar,
}) => {
    const { getPhrase, trackValidation } = useStore((stores: TStores) => ({
        getPhrase: stores.layoutStore.getPhrase,
        trackValidation: stores.trackingStore.trackValidation,
    }));

    // We add state to track changes in the class instance and trigger re-render when it updates.
    const [ages, setAges] = useState<number[]>(() => childrenGuests.map(child => child.age));
    const title: string =
        childrenGuests.length === 1
            ? SitecoreDictionary.RoomAllocationLabelsKidAge
            : SitecoreDictionary.RoomAllocationLabelsKidsAge;

    useEffect(() => {
        const newAges = childrenGuests.map(child => child.age);

        if (!areArraysEqual(ages, newAges)) {
            setAges(newAges);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childrenGuests.length]);

    const isErrorVisible = !hideError && !isChildrenAgeValid && validateChildrenAgesInRoom(childrenGuests);

    useEffect(() => {
        if (isSearchBar && isErrorVisible) {
            trackValidation(
                SearchPodValidationFields.ChildAge,
                getPhrase(SitecoreDictionary.RoomAllocationErrorsChildAgeIsUnset),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSearchBar, isErrorVisible]);

    const getChildNumberLabel = (number: number): string =>
        Tokenizer.replaceToken(
            getPhrase(SitecoreDictionary.RoomAllocationLabelsChildNumber),
            Tokens.Number,
            number.toString(),
        );

    const options: Array<ISelectOption> = settings.RoomAllocation.ChildAges.map(age => ({ value: age, label: age }));

    const selectClass = (age: number): string =>
        classNames('custom-select', styles.select, {
            'custom-select--error': !isChildrenAgeValid && !settings.RoomAllocation.ChildAges.includes(age),
        });

    const onChange = (selectedOption: ISelectOption, index: number): void => {
        const newAges = ages.map((oldValue, oldAgeIndex) =>
            oldAgeIndex === index ? Number(selectedOption.value) : oldValue,
        );
        setAges(newAges);
        childrenGuests[index].onChangeField('age', selectedOption.value);

        !isChildrenAgeValid && validateChildrenAge();
    };

    if (!childrenGuests.length) {
        return null;
    }

    return (
        <div
            data-tid='children-age-selector'
            id={CHILDREN_AGE_SELECTOR_ID}
            className={classNames(styles.wrapper, isGroupBooking && styles.groupBookingWrapper)}
        >
            {!isGroupBooking && <RichTextDictionary dictionaryKey={title} className={styles.title} />}

            <div data-tid='children-age-selectors' className={styles.selectWrapper}>
                {ages.map((age, index) => (
                    <div data-tid={`children-age-select-${index}`} key={`select-${age}-${index}`}>
                        <Select
                            id={'child-age-' + index}
                            className={selectClass(age)}
                            classNamePrefix='custom-select'
                            label={getChildNumberLabel(index + 1)}
                            dataTid='children-age-select'
                            options={options}
                            placeholder={getChildNumberLabel(index + 1)}
                            defaultValue={{ value: age, label: age }}
                            value={{ value: age, label: age || '-' }}
                            onChange={(selectedOption: ISelectOption): void => onChange(selectedOption, index)}
                            isSearchable={false}
                            components={{ DropdownIndicator, ValueContainer }}
                            blurInputOnSelect={true}
                            menuPlacement='top'
                            minMenuHeight={150}
                            maxMenuHeight={150}
                        />
                    </div>
                ))}
            </div>

            {isErrorVisible && (
                <ErrorMessage
                    message={getPhrase(SitecoreDictionary.RoomAllocationErrorsChildAgeIsUnset)}
                    icon={<SvgWarningFilled />}
                    IsDesc
                    errorMessageClass={styles.errorMessage}
                />
            )}
        </div>
    );
};

export default ChildrenAgesSelector;
