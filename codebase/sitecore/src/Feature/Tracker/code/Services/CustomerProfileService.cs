using System;
using System.Collections.Generic;
using System.Linq;
using easyJet.Feature.Tracker.Logging;
using easyJet.Feature.Tracker.Models.Requests;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.XConnect.Common.Facets.MarketingPreferences;
using easyJet.Foundation.XConnect.Common.Helpers;
using easyJet.Foundation.XConnect.Common.Model;
using Sitecore.XConnect;
using Sitecore.XConnect.Client;
using Sitecore.XConnect.Collection.Model;
using TrackingConstants = easyJet.Foundation.Analytics.Constants.Tracking;

namespace easyJet.Feature.Tracker.Services
{
    [Service(typeof(ICustomerProfileService), Lifetime = Lifetime.Singleton)]
    public class CustomerProfileService : AnalyticsServiceBase, ICustomerProfileService
    {
        public CustomerProfileService(ITrackerLogger logger, IContactService contactService)
            : base(contactService, logger)
        {
        }

        public void TrackLogIn(TrackCustomerLogInRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            try
            {
                using (var client = GetClient())
                {
                    ApplyIdentifiers(request);
                    var currentContact = GetCurrentTrackerContact(client, PersonalInformation.DefaultFacetKey, PhoneNumberList.DefaultFacetKey, EmailAddressList.DefaultFacetKey, MarketingPreferencesFacet.DefaultFacetKey);
                    if (currentContact == null)
                    {
                        throw new XdbExecutionException("No current contact was found");
                    }

                    var needToSubmitToXdb = false;
                    needToSubmitToXdb |= FacetHelper.AddOrUpdatePersonalInfoContactFacetIfNecessary(currentContact, client, new ContactPersonalInfoData(request.FirstName, request.LastName, request.Title));
                    needToSubmitToXdb |= FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(currentContact, client, new ContactPhoneData(request.MobilePhoneCode, request.MobilePhoneNumber));
                    needToSubmitToXdb |= FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(currentContact, client, request.Email);
                    needToSubmitToXdb |= AddOrUpdateMarketingPreferencesFacetIfNecessary(currentContact, client, request.MarketingPreferences);

                    if (needToSubmitToXdb)
                    {
                        client.Submit();
                    }
                }
            }
            catch (XdbExecutionException ex)
            {
                Logger.Error($"Updating contact facet is failed. {ex.Message}", ex, this);
                throw;
            }
        }

        private static bool MarketingPreferencesHasChanges(MarketingPreferencesFacet marketingPreferencesFacet, MarketingPreferences marketingPreferences)
        {
            return marketingPreferencesFacet.FirstPartyMarketing != (marketingPreferences?.FirstPartyMarketing ?? false) ||
                   marketingPreferencesFacet.ThirdPartyMarketing != (marketingPreferences?.ThirdPartyMarketing ?? false);
        }

        private void ApplyIdentifiers(TrackCustomerLogInRequest request)
        {
            var identifiers = new List<string>() { request.Email, request.Id, request.Ucid }.Where(value => !string.IsNullOrEmpty(value));
            AddIdentifiersToCurrentContact(TrackingConstants.DefaultIdentifierSource, identifiers);
        }

        private bool AddOrUpdateMarketingPreferencesFacetIfNecessary(Contact contact, IXdbContext client, MarketingPreferences marketingPreferences)
        {
            var marketingPreferencesFacet = contact.GetFacet<MarketingPreferencesFacet>(MarketingPreferencesFacet.DefaultFacetKey);
            if (marketingPreferencesFacet != null && !MarketingPreferencesHasChanges(marketingPreferencesFacet, marketingPreferences))
            {
                return false;
            }

            marketingPreferencesFacet = marketingPreferencesFacet ?? new MarketingPreferencesFacet();
            marketingPreferencesFacet.FirstPartyMarketing = marketingPreferences?.FirstPartyMarketing ?? false;
            marketingPreferencesFacet.ThirdPartyMarketing = marketingPreferences?.ThirdPartyMarketing ?? false;

            client.SetFacet(contact, MarketingPreferencesFacet.DefaultFacetKey, marketingPreferencesFacet);

            Logger.Debug($"The marketing preferences facet has been successfully added/updates to the contact [{contact.Id}]", this);
            return true;
        }
    }
}