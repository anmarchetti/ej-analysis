using System.Xml.Linq;
using Sitecore.Analytics.Data;

namespace easyJet.Foundation.Analytics.Helpers
{
    public static class TrackingXElementHelper
    {
        public static (XDocument fieldValue, XElement tracking) GetOrCreateTrackingXDocumentWithTracking(TrackingField trackingField)
        {
            var newTrackingFieldValue = string.IsNullOrEmpty(trackingField.Value) ? new XDocument(new XElement("tracking")) : XDocument.Parse(trackingField.Value);
            var tracking = newTrackingFieldValue.Element("tracking");
            if (tracking != null)
            {
                return (newTrackingFieldValue, tracking);
            }

            tracking = new XElement("tracking");
            newTrackingFieldValue.Add(tracking);
            return (newTrackingFieldValue, tracking);
        }
    }
}