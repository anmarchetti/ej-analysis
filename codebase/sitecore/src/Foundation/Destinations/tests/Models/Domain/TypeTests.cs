using easyJet.Foundation.Destinations.Models.Domain;
using FluentAssertions;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;
using Type = easyJet.Foundation.Destinations.Models.Domain.Type;

namespace easyJet.Foundation.Destinations.Tests.Models.Domain
{
    public class TypeTests
    {
        [Fact]
        public void Constructor_ShouldSetTrackingId_FromItemName()
        {
            using (var db = new Db
            {
                new DbItem("Luxury", ID.NewID, Constants.TemplateIds.ThemeType)
            })
            {
                var item = db.GetItem("/sitecore/content/Luxury");

                var actual = new Type(item);

                actual.TrackingId.Should().Be("Luxury");
            }
        }
    }
}
