using System.Collections.Generic;
using easyJet.Foundation.Analytics.Models.Profiles;
using easyJet.Foundation.Analytics.Models.Profiles.Base;
using Sitecore.Analytics.Data;
using Sitecore.Analytics.Tracking;
using Sitecore.Data.Items;

namespace easyJet.Foundation.Analytics.Services
{
    public interface IProfileService
    {
        /// <summary>
        /// Tags item to passed profile.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="profileName">Profile name.</param>
        /// <param name="profileCardKeys">Collection of profile card aliases.</param>
        /// <param name="presets">Collection of profile card values - presets.</param>
        /// <returns>Indicates if tagging was successful or not.</returns>
        bool TagProfile(Item item, string profileName, List<string> profileCardKeys, Dictionary<string, double> presets = null);

        /// <summary>
        /// Boost pattern card for user.
        /// </summary>
        /// <param name="patternCard">Pattern card.</param>
        /// <param name="profile">Profile.</param>
        /// <param name="profileCard">Profile card.</param>
        /// <returns>Indicates if boosting was successful or not.</returns>
        bool BoostUserPattern(Item patternCard, Profile profile, Item profileCard);

        /// <summary>
        /// Boost profile card for user.
        /// </summary>
        /// <param name="patternCard">Pattern card.</param>
        /// <param name="profile">Profile.</param>
        /// <param name="profileCard">Profile card.</param>
        /// <returns>Indicates if boosting was successful or not.</returns>
        bool BoostUserProfile(Item patternCard, Profile profile, Item profileCard);

        /// <summary>
        /// Tags item to passed profile.
        /// </summary>
        /// <param name="item">Sitecore item.</param>
        /// <param name="profileValues">Collection of profile values.</param>
        /// <param name="tagChildrenSettings">Children tp tag settings.</param>
        /// <returns>Indicates if tagging was successful or not.</returns>
        List<bool> TagGenericProfile<T>(Item item, T profileValues, TagChildrenSettings tagChildrenSettings = null)
            where T : BaseProfile;

        /// <summary>
        /// Tags item to passed profile.
        /// </summary>
        /// <param name="items">Sitecore items.</param>
        /// <param name="profileValues">Collection of profile values.</param>
        /// <param name="tagChildrenSettings">Children tp tag settings.</param>
        /// <returns>Indicates if tagging was successful or not.</returns>
        List<bool> TagGenericProfile<T>(Item[] items, T profileValues, TagChildrenSettings tagChildrenSettings = null)
            where T : BaseProfile;

        (TrackingField trackingField, ContentProfile contentProfile) GetItemTrackingFieldAndContentProfile(Item item, string profileName);
    }
}