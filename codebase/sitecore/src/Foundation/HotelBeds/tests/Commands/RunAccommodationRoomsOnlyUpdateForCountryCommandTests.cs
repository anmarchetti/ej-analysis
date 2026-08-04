using easyJet.Foundation.HotelBeds.Commands;
using easyJet.Foundation.HotelBeds.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Data;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Xunit;
using IDestinationsRepository = easyJet.Foundation.Destinations.ContentSearch.Repositories.IDestinationsRepository;

namespace easyJet.Foundation.HotelBeds.Tests.Commands
{
    public class RunAccommodationRoomsOnlyUpdateForCountryCommandTests : BaseSyncCommandTests
    {
        private readonly RunAccommodationRoomsOnlyUpdateForCountryCommand sut;

        public RunAccommodationRoomsOnlyUpdateForCountryCommandTests()
        {
            var masterDataService = Substitute.For<IMasterDataService>();
            var databaseProvider = Substitute.For<IDatabaseProvider>();
            var destinationsRepository = Substitute.For<IDestinationsRepository>();
            var userCreationService = Substitute.For<IUserCreationService>();
            var sitecoreUiService = Substitute.For<ISitecoreUIService>();

            sut = new RunAccommodationRoomsOnlyUpdateForCountryCommand(
                masterDataService,
                Service,
                databaseProvider,
                Logger,
                destinationsRepository,
                userCreationService,
                sitecoreUiService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_WhenItemIsCountry()
        {
            var item = new FakeItem(ID.NewID).WithTemplate(Destinations.Constants.TemplateIds.Country).ToSitecoreItem();
            var commandContext = new CommandContext(item);
            sut.IsCommandContextValid(commandContext).Should().BeTrue();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_WhenItemIsNotCountry()
        {
            var item = new FakeItem(ID.NewID).WithTemplate(Destinations.Constants.TemplateIds.Accommodation).ToSitecoreItem();
            var commandContext = new CommandContext(item);
            sut.IsCommandContextValid(commandContext).Should().BeFalse();
        }
    }
}
