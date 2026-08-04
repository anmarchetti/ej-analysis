using easyJet.Foundation.XConnect.Common.Model;
using Sitecore.XConnect;
using Sitecore.XConnect.Collection.Model;

namespace easyJet.Foundation.XConnect.Common.Helpers
{
    public static class FacetHelper
    {
        public static bool AddOrUpdatePersonalInfoContactFacetIfNecessary(Contact contact, IXdbContext client, ContactPersonalInfoData personalInfo)
        {
            if (string.IsNullOrWhiteSpace(personalInfo.FirstName) && string.IsNullOrWhiteSpace(personalInfo.LastName))
            {
                return false;
            }

            var facet = contact.GetFacet<PersonalInformation>(PersonalInformation.DefaultFacetKey);
            if (facet != null && !PersonalInfoHasChanges(facet, personalInfo))
            {
                return false;
            }

            facet = facet ?? new PersonalInformation();
            facet.FirstName = personalInfo.FirstName;
            facet.LastName = personalInfo.LastName;
            facet.Title = personalInfo.Title;

            client.SetPersonal(contact, facet);
            return true;
        }

        public static bool AddOrUpdatePhoneNumberFacetIfNecessary(Contact contact, IXdbContext client, ContactPhoneData phoneData)
        {
            if (string.IsNullOrWhiteSpace(phoneData.MobilePhoneNumber))
            {
                return false;
            }

            var facet = contact.GetFacet<PhoneNumberList>(PhoneNumberList.DefaultFacetKey);
            if (facet != null && !PhoneNumberHasChanges(facet, phoneData))
            {
                return false;
            }

            facet = facet ?? new PhoneNumberList(null, string.Empty);
            facet.PreferredPhoneNumber = new PhoneNumber(phoneData.MobilePhoneCode, phoneData.MobilePhoneNumber);
            facet.PreferredKey = Constants.Tracking.PreferredPhoneNumberKey;

            client.SetPhoneNumbers(contact, facet);
            return true;
        }

        public static bool AddOrUpdateEmailAddressListFacetIfNecessary(Contact contact, IXdbContext client, string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return false;
            }

            var facet = contact.GetFacet<EmailAddressList>(EmailAddressList.DefaultFacetKey);
            if (facet != null && !EmailAlreadySavedHasChanges(facet, email))
            {
                return false;
            }

            facet = facet ?? new EmailAddressList(null, string.Empty);
            facet.PreferredEmail = new EmailAddress(email, true);
            facet.PreferredKey = Constants.Tracking.PreferredEmailKey;

            client.SetEmails(contact, facet);
            return true;
        }

        private static bool PhoneNumberHasChanges(PhoneNumberList phoneNumberListFacet, ContactPhoneData phoneData)
        {
            if (phoneNumberListFacet.PreferredKey != Constants.Tracking.PreferredPhoneNumberKey)
            {
                return false;
            }

            return phoneNumberListFacet.PreferredPhoneNumber?.CountryCode != phoneData.MobilePhoneCode ||
                   phoneNumberListFacet.PreferredPhoneNumber?.Number != phoneData.MobilePhoneNumber;
        }

        private static bool EmailAlreadySavedHasChanges(EmailAddressList emailAddressListFacet, string email)
        {
            if (emailAddressListFacet.PreferredKey != Constants.Tracking.PreferredEmailKey)
            {
                return false;
            }

            return emailAddressListFacet.PreferredEmail?.SmtpAddress != email;
        }

        private static bool PersonalInfoHasChanges(PersonalInformation personalInformationFacet, ContactPersonalInfoData contactPersonalInfoData)
        {
            return personalInformationFacet.FirstName != contactPersonalInfoData.FirstName ||
                   personalInformationFacet.LastName != contactPersonalInfoData.LastName ||
                   personalInformationFacet.Title != contactPersonalInfoData.Title;
        }
    }
}