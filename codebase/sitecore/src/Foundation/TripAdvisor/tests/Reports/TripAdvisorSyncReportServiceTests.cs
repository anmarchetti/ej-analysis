using System.IO;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.TripAdvisor.Logging;
using easyJet.Foundation.TripAdvisor.Models;
using easyJet.Foundation.TripAdvisor.Models.Domain;
using easyJet.Foundation.TripAdvisor.Reports;
using FluentAssertions;
using NSubstitute;
using Sitecore;
using Sitecore.Abstractions;
using Sitecore.Configuration;
using Sitecore.Data.Items;
using Sitecore.FakeDb;
using Sitecore.NSubstituteUtils;
using Sitecore.Resources.Media;
using Xunit;

namespace easyJet.Foundation.TripAdvisor.Tests.Reports
{
    public class TripAdvisorSyncReportServiceTests
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly BaseMediaManager mediaManager;
        private readonly ITripAdvisorLogger logger;
        private readonly TripAdvisorSyncReportService service;

        public TripAdvisorSyncReportServiceTests()
        {
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            mediaManager = Substitute.For<BaseMediaManager>();
            logger = Substitute.For<ITripAdvisorLogger>();
            service = new TripAdvisorSyncReportService(datasourceRepository, databaseProvider, mediaManager, logger);
        }

        [Fact]
        public void GetOrCreateReportFolder_ShouldReturnNull_WhenSettingIsEmpty()
        {
            using (new SettingsSwitcher("TripAdvisor.SyncReportPath", string.Empty))
            {
                var result = service.GetOrCreateReportFolder();
                result.Should().BeNull();
            }
        }

        [Fact]
        public void GetOrCreateReportFolder_ShouldReturnExistingFolder_WhenFolderExists()
        {
            var fakeFolder = new FakeItem();

            using (new SettingsSwitcher("TripAdvisor.SyncReportPath", "/sitecore/media library/TripAdvisor/Sync Reports"))
            {
                databaseProvider.GetItem("/sitecore/media library/TripAdvisor/Sync Reports", DatabaseType.Master).Returns(fakeFolder.ToSitecoreItem());
                var result = service.GetOrCreateReportFolder();
                result.Should().BeSameAs(fakeFolder.ToSitecoreItem());
            }
        }

        [Fact]
        public void GetOrCreateReportFolder_ShouldReturnNull_WhenMediaLibraryRootNotFound()
        {
            using (new SettingsSwitcher("TripAdvisor.SyncReportPath", "/sitecore/media library/TripAdvisor/Sync Reports"))
            {
                databaseProvider.GetItem("/sitecore/media library/TripAdvisor/Sync Reports", DatabaseType.Master).Returns((Item)null);
                databaseProvider.GetItem(ItemIDs.MediaLibraryRoot, DatabaseType.Master).Returns((Item)null);
                var result = service.GetOrCreateReportFolder();
                result.Should().BeNull();
            }
        }

        [Fact]
        public void GetOrCreateReportFolder_ShouldCreateFolders_WhenFolderDoesNotExist()
        {
            using (new SettingsSwitcher("TripAdvisor.SyncReportPath", "/sitecore/media library/TripAdvisor/Sync Reports"))
            using (var db = new Db())
            {
                db.Add(new DbTemplate("MediaFolder", TemplateIDs.MediaFolder));
                var mediaLibrary = db.GetItem(ItemIDs.MediaLibraryRoot);
                databaseProvider.GetItem("/sitecore/media library/TripAdvisor/Sync Reports", DatabaseType.Master).Returns((Item)null);
                databaseProvider.GetItem(ItemIDs.MediaLibraryRoot, DatabaseType.Master).Returns(mediaLibrary);
                var result = service.GetOrCreateReportFolder();
                result.Should().NotBeNull();
                result.Name.Should().Be("Sync Reports");
                result.Parent.Name.Should().Be("TripAdvisor");
                result.Parent.Parent.ID.Should().Be(ItemIDs.MediaLibraryRoot);
            }
        }

        [Fact]
        public void CreateReport_ShouldWriteCsvToMediaItem_WhenFailedResultsExist()
        {
            // Arrange
            var fakeFolder = new FakeItem();
            var fakeReportItem = new FakeItem();
            var mediaData = Substitute.For<MediaData>(new MediaItem(fakeReportItem.ToSitecoreItem()));
            var media = Substitute.For<Media>(mediaData);
            var hotelItem = new FakeItem();
            hotelItem.WithField(Destinations.Constants.Fields.AccommodationItem.TripAdvisorId, "12345");

            var error = new TripAdvisorError { Code = "160", Type = "UnauthorizedException", Message = "invalid key" };
            var failedResults = new[] { new SyncResult(error, hotelItem.ToSitecoreItem()) };

            using (new SettingsSwitcher("TripAdvisor.SyncReportPath", "/sitecore/media library/TripAdvisor/Sync Reports"))
            {
                databaseProvider.GetItem("/sitecore/media library/TripAdvisor/Sync Reports", DatabaseType.Master).Returns(fakeFolder.ToSitecoreItem());
                datasourceRepository.GetOrCreateItem(Arg.Any<string>(), TemplateIDs.UnversionedFile, fakeFolder.ToSitecoreItem()).Returns(fakeReportItem.ToSitecoreItem());
                mediaManager.GetMedia(Arg.Any<MediaItem>()).Returns(media);

                // Act
                service.CreateReport(failedResults);

                // Assert
                datasourceRepository.Received(1).GetOrCreateItem(Arg.Any<string>(), TemplateIDs.UnversionedFile, fakeFolder.ToSitecoreItem());
                media.Received(1).SetStream(Arg.Any<Stream>(), "csv");
                logger.Received(1).Info(Arg.Is<string>(s => s.Contains("1 failures")), Arg.Any<object>());
            }
        }
    }
}
