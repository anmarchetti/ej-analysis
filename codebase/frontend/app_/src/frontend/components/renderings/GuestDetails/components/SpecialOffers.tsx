import { Text } from '@sitecore-jss/sitecore-jss-nextjs';

import useStore from 'frontend/hooks/useStore';
import { OfferSectionTypes } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import ErrorMessage from 'frontend/components/common/ErrorMessage';
import RadioButton from 'frontend/components/common/RadioButton';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';
import SvgWarningFilled from 'frontend/components/icons-new/WarningFilled';

import { ISpecialOffersBlockError } from './SpecialOffersBlock';

import styles from './SpecialOffers.module.scss';

interface ISpecialOffersProps {
    changeOffersAndUpdates: (field: OfferSectionTypes, value: boolean) => void;
    desc1: ISitecoreField<string>;
    error: Nullable<ISpecialOffersBlockError>;
    field: OfferSectionTypes;
    isOptedIn: Nullable<boolean>;
    title: ISitecoreField<string>;
    dataTid?: string;
    desc2?: ISitecoreField<string>;
}

export const SpecialOffers: React.FC<ISpecialOffersProps> = ({
    isOptedIn,
    title,
    desc1,
    desc2,
    field,
    dataTid,
    changeOffersAndUpdates,
    error,
}) => {
    const { getPhrase } = useStore(stores => ({
        getPhrase: stores.layoutStore.getPhrase,
    }));

    return (
        <div data-tid={dataTid} className={styles.wrapper}>
            <Text field={title} tag='p' className={styles.title} />

            <RichTextWithLinks field={desc1} tag='p' />

            <div className={styles.options}>
                <RadioButton
                    label={getPhrase(SitecoreDictionary.GlobalsFormFieldsRadioButtonsYes)}
                    name={'partner_offer-' + field}
                    onChange={(): void => changeOffersAndUpdates(field, true)}
                    checked={isOptedIn === true}
                    dataTid='yes-option'
                />

                <RadioButton
                    label={getPhrase(SitecoreDictionary.GlobalsFormFieldsRadioButtonsNo)}
                    name={'partner_offer-' + field}
                    onChange={(): void => changeOffersAndUpdates(field, false)}
                    checked={isOptedIn === false}
                    dataTid='no-option'
                />
            </div>

            {!!desc2 && <RichTextWithLinks tag={'p'} field={desc2} />}

            {error && (
                <ErrorMessage
                    errorMessageClass='error-container error'
                    icon={<SvgWarningFilled />}
                    description={getPhrase(error.description)}
                    message={getPhrase(error.title)}
                />
            )}
        </div>
    );
};

export default SpecialOffers;
