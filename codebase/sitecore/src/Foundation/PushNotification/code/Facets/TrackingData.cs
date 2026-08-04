using System;
using Sitecore.XConnect;

namespace easyJet.Foundation.PushNotifications.Facets
{
    /// <summary>
    /// Tracking data facet.
    /// Note: If the model has been changed, it should be serilized and deployed to xConnect.
    /// <see cref="https://doc.sitecore.com/developers/90/sitecore-experience-platform/en/deploy-a-custom-model.html"/>.
    /// </summary>
    /// <example>
    /// <code>
    ///     var json = Sitecore.XConnect.Serialization.XdbModelWriter.Serialize(model);
    ///     System.IO.File.WriteAllText("easyJet.Foundation.PushNotifications.Model.json", json);
    /// </code>
    /// </example>
    [Serializable]
    [FacetKey(DefaultFacetKey)]
    public class TrackingData : Facet
    {
        public const string DefaultFacetKey = "TrackingData";

        public string Endpoint { get; set; }

        public string AccommodationId { get; set; }
    }
}