import { useState } from 'react';
import { observer } from 'mobx-react';

import useStore from 'frontend/hooks/useStore';
import validationService from 'frontend/services/validation.service';
import { IHolidaysStores } from 'frontend/store/holidays';
import { ICountryCodeSelectOption } from 'models/data/ISelectOption';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { GuestInfo } from 'models/GuestInfo';
import Button from 'frontend/components/common/Button';
import ValidatableFieldNew from 'frontend/components/common/ValidatableField/ValidatableFieldNew';
import ValidatableFieldSearch from 'frontend/components/common/ValidatableField/ValidatableFieldSearch';
import ValidatableSelectField from 'frontend/components/common/ValidatableSelectField';

import { searchAddressItem, searchAddressList } from './GuestAddressSection.utils';

import styles from './GuestAddressSection.module.scss';

interface IGuestAddressSectionProps {
    countryCodesSelectOptions: ICountryCodeSelectOption[];
    forceErrors: boolean;
    getGuestSrLabel: (key: string) => string;
    guestDetails: GuestInfo;
    id: number;
    onChange: (key: string) => (val: string) => void;
}

export const GuestAddressSection: React.FC<IGuestAddressSectionProps> = props => {
    const { guestDetails, id, getGuestSrLabel, onChange, forceErrors, countryCodesSelectOptions } = props;

    const { isAddressLookup, isAddressLookupEnabled, setIsAddressLookup, getPhrase } = useStore(
        (stores: IHolidaysStores) => ({
            isAddressLookup: stores.guestDetailsStore.isAddressLookup,
            isAddressLookupEnabled: stores.layoutStore.isAddressLookupEnabled,
            setIsAddressLookup: stores.guestDetailsStore.setIsAddressLookup,
            getPhrase: stores.layoutStore.getPhrase,
        }),
    );

    const [key, setKey] = useState(0);

    const isPolluted = guestDetails.address || guestDetails.address2 || guestDetails.city || guestDetails.postCode;

    return (
        <>
            <ValidatableSelectField
                onChange={(val: string): void => {
                    onChange('countryCode')(val);

                    // reset ValidatableFieldSearch on country-code change
                    if (isAddressLookupEnabled && isAddressLookup) {
                        setKey(v => v + 1);
                    }
                }}
                disabled={false}
                id={`country-${guestDetails.type}-${id}`}
                label={getPhrase(SitecoreDictionary.GlobalsDestinationTypesCountry)}
                srLabel={getGuestSrLabel(getPhrase(SitecoreDictionary.GlobalsDestinationTypesCountry))}
                value={guestDetails.countryCode}
                options={countryCodesSelectOptions}
                errors={validationService.validateField(guestDetails, 'countryCode')}
                forceError={forceErrors}
                disableValidationTraking
                portal
            />

            {isAddressLookupEnabled && isAddressLookup ? (
                <ValidatableFieldSearch
                    key={key}
                    id={`address-${guestDetails.type}-${id}`}
                    label={getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress)}
                    placeholder={getPhrase(SitecoreDictionary.AddressLookupLabelsPlaceholder)}
                    loadingMessage={(): string => getPhrase(SitecoreDictionary.AddressLookupLabelsLoading)}
                    errors={[]}
                    forceError={forceErrors}
                    onChange={searchAddressItem}
                    onInputChange={searchAddressList}
                    params={{
                        iso2: countryCodesSelectOptions.find(el => el.value === guestDetails.countryCode)?.iso2,
                        onChange: (data: {
                            addressLine1: string;
                            addressLine2: string;
                            postcode: string;
                            townCity: string;
                        }): void => {
                            queueMicrotask(() => {
                                onChange('address')(data.addressLine1);
                                onChange('address2')(data.addressLine2);
                                onChange('city')(data.townCity);
                                onChange('postCode')(data.postcode);

                                setIsAddressLookup(false);
                            });
                        },
                    }}
                />
            ) : (
                <>
                    <ValidatableFieldNew
                        id={`address-${guestDetails.type}-${id}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress)}
                        ariaLabel={getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress))}
                        value={guestDetails.address}
                        errors={validationService.validateField(guestDetails, 'address')}
                        onChange={onChange('address')}
                        autoComplete='address-line1'
                        submitted={forceErrors}
                    />

                    <ValidatableFieldNew
                        id={`address2-${guestDetails.type}-${id}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress2)}
                        ariaLabel={getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsAddress2))}
                        value={guestDetails.address2}
                        errors={validationService.validateField(guestDetails, 'address2')}
                        onChange={onChange('address2')}
                        autoComplete='address-line2'
                    />

                    <ValidatableFieldNew
                        id={`city-${guestDetails.type}-${id}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsCity)}
                        ariaLabel={getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsCity))}
                        value={guestDetails.city}
                        errors={validationService.validateField(guestDetails, 'city')}
                        onChange={onChange('city')}
                        autoComplete='address-level2'
                        submitted={forceErrors}
                    />

                    <ValidatableFieldNew
                        id={`postCode-${guestDetails.type}-${id}`}
                        label={getPhrase(SitecoreDictionary.GuestDetailsLabelsPostcode)}
                        ariaLabel={getGuestSrLabel(getPhrase(SitecoreDictionary.GuestDetailsLabelsPostcode))}
                        value={guestDetails.postCode}
                        errors={validationService.validateField(guestDetails, 'postCode')}
                        onChange={onChange('postCode')}
                        autoComplete='postal-code'
                        submitted={forceErrors}
                    />
                </>
            )}

            {isAddressLookupEnabled && (
                <div className={styles.changeAddressWrapper}>
                    <Button isText onClick={(): void => setIsAddressLookup(!isAddressLookup)}>
                        {isAddressLookup && getPhrase(SitecoreDictionary.AddressLookupLabelsAddAddressManually)}

                        {!isAddressLookup &&
                            (isPolluted
                                ? getPhrase(SitecoreDictionary.AddressLookupLabelsSearchForAnotherAddress)
                                : getPhrase(SitecoreDictionary.AddressLookupLabelsSearchForAddress))}
                    </Button>
                </div>
            )}
        </>
    );
};

export default observer(GuestAddressSection);
