using Sitecore.FakeDb;
using DestinationsConstants = easyJet.Foundation.Destinations.Constants;

namespace easyJet.Foundation.AmazonS3.Tests.Templates
{
    public class ExternalImageDbTemplate : DbTemplate
    {
        public ExternalImageDbTemplate(string name)
            : base(name, DestinationsConstants.TemplateIds.ExternalImage)
        {
        }
    }
}
