using System;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Requests;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.Configuration;
using Sitecore.Data;
using Sitecore.FakeDb;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Services
{
    public class HotelStructureBuilderServiceTests
    {
        private const string BranchTemplatePath = "/sitecore/content/Hotel Branch";

        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDestinationsLogger logger;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IExpediaHotelContentResolverService expediaHotelContentResolverService;
        private readonly HotelStructureBuilderService service;

        public HotelStructureBuilderServiceTests()
        {
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            expediaHotelContentResolverService = Substitute.For<IExpediaHotelContentResolverService>();
            logger = Substitute.For<IDestinationsLogger>();

            service = new HotelStructureBuilderService(
                datasourceRepository,
                databaseProvider,
                expediaHotelContentResolverService,
                logger);
        }

        [Fact]
        public void CreateHotel_ShouldThrowArgumentNullException_WhenRequestIsNull()
        {
            Action act = () => service.CreateHotel(null);

            act.Should().Throw<ArgumentNullException>();
        }

        [Fact]
        public void CreateHotel_ShouldThrowInvalidOperationException_WhenResortCodeIsMissing()
        {
            var request = CreateRequest();
            request.Resort.Code = null;

            Action act = () => service.CreateHotel(request);

            act.Should().Throw<InvalidOperationException>()
                .WithMessage("Resort code is required. Cannot create hotel without Resort Code.");

            expediaHotelContentResolverService.DidNotReceiveWithAnyArgs()
                .ResolveResortByCode(default(string));

            databaseProvider.DidNotReceiveWithAnyArgs()
                .GetDatabase(default(DatabaseType));
        }

        [Fact]
        public void CreateHotel_ShouldUseExistingResort_WhenResortExists()
        {
            using (var db = CreateDb())
            {
                var resortItem = db.GetItem("/sitecore/content/Existing Resort");
                var hotelItem = db.GetItem("/sitecore/content/Created Hotel");

                var request = CreateRequest();

                expediaHotelContentResolverService
                    .ResolveResortByCode(request.Resort.Code)
                    .Returns(resortItem);

                databaseProvider
                    .GetDatabase(DatabaseType.Master)
                    .Returns(db.Database);

                datasourceRepository
                    .GetOrCreateFromHotelBranchTemplate(
                        request.Name,
                        resortItem,
                        Arg.Any<Sitecore.Data.Items.BranchItem>(),
                        displayName: null,
                        lockItem: false)
                    .Returns(hotelItem);

                using (new SettingsSwitcher("Destinations.HotelBranchTemplatePath", BranchTemplatePath))
                {
                    var actual = service.CreateHotel(request);

                    actual.Should().Be(hotelItem);

                    expediaHotelContentResolverService.Received(1)
                        .ResolveResortByCode(request.Resort.Code);

                    databaseProvider.Received(1)
                        .GetDatabase(DatabaseType.Master);

                    datasourceRepository.Received(1).GetOrCreateFromHotelBranchTemplate(
                        request.Name,
                        resortItem,
                        Arg.Any<Sitecore.Data.Items.BranchItem>(),
                        displayName: null,
                        lockItem: false);

                    datasourceRepository.DidNotReceiveWithAnyArgs()
                        .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item));

                    datasourceRepository.DidNotReceiveWithAnyArgs()
                        .CreateFromHotelBranchTemplate(
                            default(string),
                            default(Sitecore.Data.Items.Item),
                            default(Sitecore.Data.Items.BranchItem));
                }
            }
        }

        [Fact]
        public void CreateHotel_ShouldThrowInvalidOperationException_WhenResortDoesNotExist()
        {
            var request = CreateRequest();

            expediaHotelContentResolverService
                .ResolveResortByCode(request.Resort.Code)
                .Returns((Sitecore.Data.Items.Item)null);

            Action act = () => service.CreateHotel(request);

            act.Should().Throw<InvalidOperationException>()
                .WithMessage($"Cannot create Expedia hotel because resort with code '{request.Resort.Code}' does not exist in Sitecore. GiataCode: '{request.GiataCode}', HotelName: '{request.Name}'.");

            expediaHotelContentResolverService.Received(1)
                .ResolveResortByCode(request.Resort.Code);

            databaseProvider.DidNotReceiveWithAnyArgs()
                .GetDatabase(default(DatabaseType));

            datasourceRepository.DidNotReceiveWithAnyArgs()
                .CreateItem(default(string), default(ID), default(Sitecore.Data.Items.Item));

            datasourceRepository.DidNotReceiveWithAnyArgs()
                .GetOrCreateFromHotelBranchTemplate(
                    default(string),
                    default(Sitecore.Data.Items.Item),
                    default(Sitecore.Data.Items.BranchItem));

            datasourceRepository.DidNotReceiveWithAnyArgs()
                .CreateFromHotelBranchTemplate(
                    default(string),
                    default(Sitecore.Data.Items.Item),
                    default(Sitecore.Data.Items.BranchItem));
        }

        [Fact]
        public void CreateHotel_ShouldThrowInvalidOperationException_WhenHotelBranchTemplateIsMissing()
        {
            using (var db = new Db
            {
                new DbItem("Existing Resort", ID.NewID, Constants.TemplateIds.Resort)
            })
            {
                var resortItem = db.GetItem("/sitecore/content/Existing Resort");
                var request = CreateRequest();

                expediaHotelContentResolverService
                    .ResolveResortByCode(request.Resort.Code)
                    .Returns(resortItem);

                databaseProvider
                    .GetDatabase(DatabaseType.Master)
                    .Returns(db.Database);

                using (new SettingsSwitcher("Destinations.HotelBranchTemplatePath", "/sitecore/content/Missing Branch"))
                {
                    Action act = () => service.CreateHotel(request);

                    act.Should().Throw<InvalidOperationException>()
                        .WithMessage("Hotel branch template not found at path: /sitecore/content/Missing Branch");

                    expediaHotelContentResolverService.Received(1)
                        .ResolveResortByCode(request.Resort.Code);

                    databaseProvider.Received(1)
                        .GetDatabase(DatabaseType.Master);

                    datasourceRepository.DidNotReceiveWithAnyArgs()
                        .GetOrCreateFromHotelBranchTemplate(
                            default(string),
                            default(Sitecore.Data.Items.Item),
                            default(Sitecore.Data.Items.BranchItem));
                }
            }
        }

        [Fact]
        public void CreateHotel_ShouldThrowInvalidOperationException_WhenMasterDatabaseIsMissing()
        {
            using (var db = CreateDb())
            {
                var resortItem = db.GetItem("/sitecore/content/Existing Resort");
                var request = CreateRequest();

                expediaHotelContentResolverService
                    .ResolveResortByCode(request.Resort.Code)
                    .Returns(resortItem);

                databaseProvider
                    .GetDatabase(DatabaseType.Master)
                    .Returns((Database)null);

                using (new SettingsSwitcher("Destinations.HotelBranchTemplatePath", BranchTemplatePath))
                {
                    Action act = () => service.CreateHotel(request);

                    act.Should().Throw<InvalidOperationException>()
                        .WithMessage("Master database is not available.");

                    expediaHotelContentResolverService.Received(1)
                        .ResolveResortByCode(request.Resort.Code);

                    databaseProvider.Received(1)
                        .GetDatabase(DatabaseType.Master);

                    datasourceRepository.DidNotReceiveWithAnyArgs()
                        .GetOrCreateFromHotelBranchTemplate(
                            default(string),
                            default(Sitecore.Data.Items.Item),
                            default(Sitecore.Data.Items.BranchItem));
                }
            }
        }

        private static UpsertHotelRequest CreateRequest()
        {
            return new UpsertHotelRequest
            {
                GiataCode = "99887665432",
                Name = "Demo Hotel",
                Country = new DestinationBase
                {
                    Code = "PL",
                    Name = "Poland"
                },
                Location = new DestinationBase
                {
                    Code = "PLKR",
                    Name = "Krakow"
                },
                Resort = new DestinationBase
                {
                    Code = "PLKRKR",
                    Name = "Krakow City"
                }
            };
        }

        private static Db CreateDb()
        {
            return new Db
            {
                new DbItem("Hotel Branch", ID.NewID),
                new DbItem("Existing Resort", ID.NewID, Constants.TemplateIds.Resort),
                new DbItem("Created Hotel", ID.NewID, Constants.TemplateIds.Accommodation)
            };
        }
    }
}