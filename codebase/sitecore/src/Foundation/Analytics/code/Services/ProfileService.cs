using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Xml;
using System.Xml.Linq;
using easyJet.Foundation.Analytics.Helpers;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Models.Profiles.Base;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Logging;
using Sitecore.Analytics.Data;
using Sitecore.Analytics.Tracking;
using Sitecore.Collections;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Exceptions;
using Sitecore.Marketing.Definitions.Profiles;
using Sitecore.SecurityModel;

[assembly: InternalsVisibleTo("easyJet.Foundation.Analyitcs.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Foundation.Analytics.Services
{
    [Service(typeof(IProfileService), Lifetime = Lifetime.Singleton)]
    public class ProfileService : IProfileService
    {
        private readonly ISitecoreExtensionsLogger logger;

        public ProfileService(ISitecoreExtensionsLogger logger)
        {
            this.logger = logger;
        }

        /// <inheritdoc/>
        public bool TagProfile(Item item, string profileName, List<string> profileCardKeys, Dictionary<string, double> presets = null)
        {
            try
            {
                var (trackingField, hotelThemesProfile) = GetItemTrackingFieldAndContentProfile(item, profileName);

                if (trackingField == null)
                {
                    return false;
                }

                if (hotelThemesProfile != null)
                {
                    var presetInfo = GetProfileCards(hotelThemesProfile, profileCardKeys);

                    var presetCount = 100 / presetInfo.Count;

                    var dictionary = presetInfo.ToDictionary<string, string, double>(key => key, key => presetCount);

                    hotelThemesProfile.SaveToField = true;
                    hotelThemesProfile.Presets = presets != null ? presets : dictionary;

                    TrackingField.UpdateKeyValues(hotelThemesProfile);
                }

                var (fieldValue, tracking) = TrackingXElementHelper.GetOrCreateTrackingXDocumentWithTracking(trackingField);
                var list = tracking.Elements("profile").ToList();

                foreach (XElement profile in list)
                {
                    profile.Remove();
                }

                foreach (XElement savedProfile in trackingField.Profiles.Where(profile => profile.SaveToField).Select(profile => profile.ToXElement()))
                {
                    tracking.Add(savedProfile);
                }

                UpdateTrackingField(item, trackingField, fieldValue);

                return true;
            }
            catch (Exception exc)
            {
                logger.Error($"Error occurred while tagging item {item?.ID} with profile {profileName} cards {string.Join(", ", profileCardKeys?.ToArray() ?? Array.Empty<string>())}", exc, this);
                return false;
            }
        }

        /// <inheritdoc/>
        public bool BoostUserPattern(Item patternCard, Profile profile, Item profileCard)
        {
            if (patternCard != null && !patternCard.Name.Equals(profile.PatternLabel))
            {
                var xmlDoc = GetXmlDocumentFromFieldByName(patternCard, "Pattern");

                XmlNodeList parentNode = xmlDoc.GetElementsByTagName("key");
                var scores = new Dictionary<string, double>();

                foreach (XmlNode childrenNode in parentNode)
                {
                    if (childrenNode.Attributes != null)
                    {
                        scores.Add(childrenNode.Attributes["name"].Value, 0);
                    }
                }

                // Boost profile key(s) here
                scores[patternCard.Name] = GetProfileValue(profileCard, patternCard);

                UpdateProfile(profile, scores);

                return true;
            }

            logger.Debug($"Can not boost user pattern due {nameof(patternCard)} is null or {patternCard?.Name} is not the same as profile pattern label {profile?.PatternLabel}", this);

            return false;
        }

        /// <inheritdoc/>
        public bool BoostUserProfile(Item patternCard, Profile profile, Item profileCard)
        {
            if (patternCard != null)
            {
                // Boost profile key(s) here
                var scores = GetProfileValues(profileCard);
                UpdateProfile(profile, scores);

                return true;
            }

            logger.Debug($"Can not boost user pattern due {nameof(patternCard)} is null or {patternCard?.Name} is not the same as profile pattern label {profile?.PatternLabel}", this);

            return false;
        }

        /// <inheritdoc />
        public List<bool> TagGenericProfile<T>(Item item, T profileValues, TagChildrenSettings tagChildrenSettings = null)
            where T : BaseProfile => TagGenericProfile(new[] { item }, profileValues, tagChildrenSettings ?? new TagChildrenSettings());

        /// <inheritdoc />
        public List<bool> TagGenericProfile<T>(Item[] items, T profileValues, TagChildrenSettings tagChildrenSettings = null)
            where T : BaseProfile
        {
            var updatedValuesXElement = profileValues.ToXElement();
            return TagItemsInternal(items, updatedValuesXElement, profileValues.GetProfileName(), tagChildrenSettings ?? new TagChildrenSettings());
        }

        public (TrackingField trackingField, ContentProfile contentProfile) GetItemTrackingFieldAndContentProfile(Item item, string profileName)
        {
            if (item == null)
            {
                logger.Warn("[Profile tagging] Item is null.", this);
                throw new ItemNullException();
            }

            ProfileUtil.GetProfiles(item, out var trackingField);

            if (trackingField == null)
            {
                logger.Warn($"[Profile tagging] TrackingField is empty for item {item?.ID}", this);
                return (null, null);
            }

            var contentProfile = trackingField?.Profiles?.FirstOrDefault(p => p.Name.Equals(profileName, StringComparison.InvariantCultureIgnoreCase));
            return (trackingField, contentProfile);
        }

        internal virtual Dictionary<string, double> GetProfileValues(Item associatedProfileCardItem)
        {
            var xmlDoc = GetXmlDocumentFromFieldByName(associatedProfileCardItem, "Profile Card Value");

            XmlNodeList parentNode = xmlDoc.GetElementsByTagName("key");
            var scores = new Dictionary<string, double>();

            foreach (XmlNode childrenNode in parentNode)
            {
                if (childrenNode.Attributes != null)
                {
                    double.TryParse(childrenNode.Attributes["value"].Value, out var childrenNodeValue);
                    scores.Add(childrenNode.Attributes["name"].Value, childrenNodeValue);
                }
            }

            return scores;
        }

        protected internal virtual XmlDocument GetXmlDocumentFromFieldByName(Item itemContainingTheField, string fieldName)
        {
            Sitecore.Data.Fields.XmlField xmlData = itemContainingTheField.Fields[fieldName];
            XmlDocument xmlDoc = xmlData.Xml;
            return xmlDoc;
        }

        protected internal virtual void UpdateProfile(Profile profile, Dictionary<string, double> scores)
        {
            profile.Score(scores);

            profile.UpdatePattern();
        }

        private static void UpdateTrackingField(Item item, TrackingField trackingField, XDocument fieldValue)
        {
            using (new SecurityDisabler())
            {
                bool isEditing = item.Editing.IsEditing;

                if (!isEditing)
                {
                    item.Editing.BeginEdit();
                }

                trackingField.Value = fieldValue.ToString();

                if (!isEditing)
                {
                    item.Editing.EndEdit();
                }
            }
        }

        /// <summary>
        /// Gets Profile Cards aliases matched by keys.
        /// </summary>
        /// <param name="profileItem">Content profile item.</param>
        /// <param name="profileCardKeys">Collection of profile card aliases.</param>
        /// <returns>Collection of profile card aliases which exist in Sitecore.</returns>
        private List<string> GetProfileCards(ContentProfile profileItem, IEnumerable<string> profileCardKeys)
        {
            var presetInfoList = new List<string>();

            if (profileItem == null || profileCardKeys == null)
            {
                return presetInfoList;
            }

            foreach (var key in profileCardKeys)
            {
                var preset = profileItem.GetPreset(key);

                if (preset != null)
                {
                    presetInfoList.Add(preset.Alias.ToLower());
                }
            }

            return presetInfoList;
        }

        /// <summary>
        /// Get Profile value from associated profile card item.
        /// </summary>
        /// <param name="associatedProfileCardItem">Profile card.</param>
        /// <param name="patternCardItem">Pattern card item.</param>
        /// <returns>Profile card value.</returns>
        private double GetProfileValue(Item associatedProfileCardItem, Item patternCardItem)
        {
            var xmlDoc = GetXmlDocumentFromFieldByName(associatedProfileCardItem, "Profile Card Value");

            var parentNode = xmlDoc.GetElementsByTagName("key");
            double profileCardValue = 0;

            var profileCardNode = parentNode.Cast<XmlNode>().FirstOrDefault(x => x.Attributes["name"].Value.Equals(patternCardItem.Name, StringComparison.InvariantCultureIgnoreCase));

            if (profileCardNode != null)
            {
                double.TryParse(profileCardNode.Attributes["value"].Value, out profileCardValue);
            }

            return profileCardValue;
        }

        private List<bool> TagChildren(Item[] items, XElement element, string profileName)
            => TagItemsInternal(items, element, profileName, new TagChildrenSettings());

        private List<bool> TagItemsInternal(Item[] items, XElement element, string profileName, TagChildrenSettings tagChildrenSettings)
        {
            var result = new List<bool>();

            foreach (var item in items)
            {
                try
                {
                    var (trackingField, _) = GetItemTrackingFieldAndContentProfile(item, profileName);

                    if (trackingField == null)
                    {
                        result.Add(false);
                        continue;
                    }

                    var (fieldValue, tracking) = TrackingXElementHelper.GetOrCreateTrackingXDocumentWithTracking(trackingField);
                    var existingElement = tracking.Elements("profile").FirstOrDefault(x => x.Attribute("name") != null && x.Attribute("name").Value.Equals(profileName, StringComparison.OrdinalIgnoreCase));
                    if (existingElement != null)
                    {
                        existingElement.Remove();
                    }

                    tracking.Add(element);

                    UpdateTrackingField(item, trackingField, fieldValue);

                    if (tagChildrenSettings.TagChildren)
                    {
                        var tagChildrenResults = TagChildren(GetItemsToTag(item.Children, tagChildrenSettings.TemplatesId), element, profileName);
                        logger.Info($"[Profile tagging] {tagChildrenResults.Count(x => x)} out of {tagChildrenResults.Count} tagged successfully.", this);
                    }

                    result.Add(true);
                }
                catch (Exception ex)
                {
                    logger.Error($"[Profile tagging] Error occurred while updating {profileName} profile tag. Item {(item == null ? "is null" : $"Id is {item.ID}")}. ", ex, this);
                    result.Add(false);
                }
            }

            return result;

            Item[] GetItemsToTag(ChildList children, ID[] templateIds) => templateIds.Any() ? children.Where(child => templateIds.Contains(child.TemplateID)).ToArray() : children.ToArray();
        }
    }
}