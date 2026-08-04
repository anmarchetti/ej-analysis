import { OfferSectionTypes } from 'frontend/store/holidays/guestDetails/GuestDetailsStore';
import SitecoreDictionary from 'models/enum/SitecoreDictionary';
import { ISitecoreField } from 'models/sitecore/generic/ISitecoreField';
import RichTextWithLinks from 'frontend/components/common/RichTextWithLinks';

import SpecialOffers from './SpecialOffers';

import styles from './SpecialOffersBlock.module.scss';

export interface ISpecialOffersBlockError {
    description: string;
    title: string;
}

export interface IOffersAndUpdatesFields {
    OffersSectionDescription1: ISitecoreField<string>;
    OffersSectionDescription2: ISitecoreField<string>;
    OffersSectionTitle: ISitecoreField<string>;
    POffersSectionDescription1: ISitecoreField<string>;
    POffersSectionDescription2: ISitecoreField<string>;
    PartnerOffersSectionTitle: ISitecoreField<string>;
}

interface ISpecialOffersBlockProps {
    changeOffersAndUpdates: (field: OfferSectionTypes, value: boolean) => void;
    fields: IOffersAndUpdatesFields;
    forceErrors: boolean;
    isOffersOptedIn: Nullable<boolean>;
    isPartnerOffersOptedIn: Nullable<boolean>;
}

export const SpecialOffersBlock: React.FC<ISpecialOffersBlockProps> = ({
    fields,
    isOffersOptedIn,
    isPartnerOffersOptedIn,
    changeOffersAndUpdates,
    forceErrors,
}) => {
    const offersError =
        forceErrors && isOffersOptedIn == undefined
            ? {
                  title: SitecoreDictionary.GuestDetailsErrorMessagesEasyJetOffersNotSelected,
                  description: SitecoreDictionary.GuestDetailsErrorMessagesEasyJetOffersNotSelectedDescription,
              }
            : undefined;

    const partnerOffersError =
        forceErrors && isOffersOptedIn && isPartnerOffersOptedIn == undefined
            ? {
                  title: SitecoreDictionary.GuestDetailsErrorMessagesPartnersOffersNotSelected,
                  description: SitecoreDictionary.GuestDetailsErrorMessagesPartnersOffersNotSelectedDescription,
              }
            : undefined;

    return (
        <div className={styles.wrapper}>
            <SpecialOffers
                title={fields.OffersSectionTitle}
                desc1={fields.OffersSectionDescription1}
                field={OfferSectionTypes.IsPartnerOffersOptedIn}
                error={offersError}
                isOptedIn={isPartnerOffersOptedIn}
                dataTid='easyjet-offers'
                changeOffersAndUpdates={changeOffersAndUpdates}
            />

            {isPartnerOffersOptedIn && (
                <SpecialOffers
                    title={fields.PartnerOffersSectionTitle}
                    desc1={fields.POffersSectionDescription1}
                    desc2={fields.POffersSectionDescription2}
                    field={OfferSectionTypes.IsOffersOptedIn}
                    error={partnerOffersError}
                    isOptedIn={isOffersOptedIn}
                    dataTid='partner-offers'
                    changeOffersAndUpdates={changeOffersAndUpdates}
                />
            )}

            {!!fields.OffersSectionDescription2?.value && (
                <RichTextWithLinks tag={'p'} field={fields.OffersSectionDescription2} />
            )}
        </div>
    );
};

export default SpecialOffersBlock;
