using System.Collections.Generic;
using System.IO;
using System.Linq;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Pipelines.Arguments;
using easyJet.Foundation.SitecoreExtensions.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using Sitecore.FakeDb;
using Sitecore.FakeDb.Pipelines;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class GreatDealsUploadCommandTests
    {
        private readonly IDatabaseProvider databaseProvider;
        private readonly ICsvUtilsService csvUtilsService;
        private readonly IDestinationsLogger logger;
        private readonly IUserCreationService userCreationService;
        private readonly ISitecoreUIService sitecoreUiService;
        private GreatDealsUploadCommand command;

        public GreatDealsUploadCommandTests()
        {
            csvUtilsService = Substitute.For<ICsvUtilsService>();
            logger = Substitute.For<IDestinationsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            userCreationService = Substitute.For<IUserCreationService>();
            sitecoreUiService = Substitute.For<ISitecoreUIService>();
            command = new GreatDealsUploadCommand(databaseProvider, csvUtilsService, logger, userCreationService, sitecoreUiService);
        }

        [Theory]
        [AutoData]
        public void ProcessItems_Success(Db db)
        {
            var mockItem = new DbItem("MockItem");
            mockItem.TemplateID = Constants.TemplateIds.DestinationsFolder;
            db.Add(mockItem);

            var contextItem = db.GetItem(mockItem.ID);

            var processor = Substitute.For<IPipelineProcessor>();
            processor.When(p => p.Process(Arg.Any<UploadPipelineArgs<GreatDealUploadRow>>()))
                .Do(ci => ci.Arg<UploadPipelineArgs<GreatDealUploadRow>>().ProcessedItems = new[] { contextItem });

            db.PipelineWatcher.Register("GreatDealsUpload", processor);

            csvUtilsService.ReadFromCsv<GreatDealUploadRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>())
                .Returns(new List<GreatDealUploadRow>()
                {
                    new GreatDealUploadRow("test", "test1")
                });

            var result = command.ProcessItems(contextItem);

            result.Count().Should().Be(1);
            logger.Received().Info("Great deals uploading has been finished (1 hotels were proceeded).", Arg.Any<object>());
        }

        [Theory]
        [AutoData]
        public void ProcessItems_Failure_PipelineAborted(Db db)
        {
            var mockItem = new DbItem("MockItem");
            mockItem.TemplateID = Constants.TemplateIds.DestinationsFolder;
            db.Add(mockItem);

            var contextItem = db.GetItem(mockItem.ID);

            var processor = Substitute.For<IPipelineProcessor>();
            db.PipelineWatcher.Register("GreatDealsUpload", processor);

            csvUtilsService.ReadFromCsv<GreatDealUploadRow>(Arg.Any<Stream>(), Arg.Any<FileParameters>())
                .Returns((object)null);

            var result = command.ProcessItems(contextItem);

            result.Count().Should().Be(0);
        }
    }
}
