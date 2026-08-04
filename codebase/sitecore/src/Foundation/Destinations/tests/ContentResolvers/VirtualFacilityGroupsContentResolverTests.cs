using System.Collections.Generic;
using easyJet.Foundation.Destinations.ContentResolvers;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.Destinations.Tests.Infrastructures;
using easyjet.Foundation.Testing.Attributes;
using easyJet.Foundation.Testing.Switchers;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.Mvc.Presentation;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.ContentResolvers
{
    public class VirtualFacilityGroupsContentResolverTests
    {
        private readonly VirtualFacilityGroupsContentResolver resolver;
        private readonly IVirtualFacilityGroupingService service;

        public VirtualFacilityGroupsContentResolverTests()
        {
            // Arrange
            service = Substitute.For<IVirtualFacilityGroupingService>();
            resolver = new VirtualFacilityGroupsContentResolver(service);

            service
                .GetAllVirtualFacilities(Arg.Any<Item>())
                .Returns(new List<VirtualFacilityGroup>());
            service
                .MapFacilities(Arg.Any<IEnumerable<VirtualFacilityGroup>>(), Arg.Any<IEnumerable<HotelFacility>>(), Arg.Any<Item>()).
                Returns(new List<AccommodationFacilityVirtualGroup>());
        }

        [Theory]
        [MemberData(nameof(VirtualFacilityGroupsContentResolverTestsData.NotValidRendering), MemberType = typeof(VirtualFacilityGroupsContentResolverTestsData))]
        public void ResolveContents_ShouldBeNull_RenderingDatasourceIsNotValid(Rendering rendering)
        {
            // Act
            var actual = resolver.ResolveContents(rendering, null);

            // Assert
            actual.Should().BeNull();
        }

        [Theory]
        [AutoDbData]
        public void ResolveContents_ShouldBeNotNull_IfHasFacilityToMap(
            Item item,
            AccommodationFacilityFolder facilityFolderTemplate,
            AccommodationFacilityTemplate accomdatationTemplate,
            FacilityTemplate facilityTemplate)
        {
            // Arrange
            var facilityType = item.Add("test facility type", new TemplateID(facilityTemplate.ID));
            var folder = item.Add("test facility folder", new TemplateID(facilityFolderTemplate.ID));
            var facility = folder.Add("test facility 1", new TemplateID(accomdatationTemplate.ID));
            folder.Add("test facility 2", new TemplateID(accomdatationTemplate.ID));

            using (new EditContext(facility))
            {
                facility.Fields[Constants.Fields.AccommodationFacilityItem.FacilityType].Value = facilityType.ID.ToString();
            }

            using (new SafeContextItemSwitcher(item))
            {
                resolver.UseContextItem = true;
                var rendering = new Rendering();

                // Act
                var actual = resolver.ResolveContents(rendering, null);

                // Assert
                actual.Should().NotBeNull();
            }
        }

        [Fact]
        public void ResolveContents_ShouldBeNull_IfMethodThrowException()
        {
            using (new SafeContextItemSwitcher(null))
            {
                // Act
                var actual = resolver.ResolveContents(null, null);

                // Assert
                actual.Should().BeNull();
            }
        }
    }
}
