using System;
using AutoFixture.Xunit2;
using easyJet.Foundation.Destinations.Commands;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Sitecore.Abstractions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.NSubstituteUtils;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Foundation.Destinations.Tests.Commands
{
    public class AddHotelCommandTests
    {
        private readonly IDatasourceRepository datasourceRepository;
        private readonly IDatabaseProvider databaseProvider;
        private readonly IDestinationsLogger logger;
        private readonly ISitecoreUIService sitecoreUIService;
        private readonly BaseSettings settings;
        private readonly AddHotelCommandProxy command;

        public AddHotelCommandTests()
        {
            sitecoreUIService = Substitute.For<ISitecoreUIService>();
            logger = Substitute.For<IDestinationsLogger>();
            databaseProvider = Substitute.For<IDatabaseProvider>();
            datasourceRepository = Substitute.For<IDatasourceRepository>();
            settings = Substitute.For<BaseSettings>();
            command = new AddHotelCommandProxy(datasourceRepository, databaseProvider, logger, Substitute.For<IUserCreationService>(), settings, sitecoreUIService);
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeFalse_IfTemplateIsNotResort()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.Location);
            var context = new CommandContext(item);

            // Act
            var actual = command.IsCommandContextValidProxy(context);

            // Assert
            actual.Should().BeFalse();
        }

        [Fact]
        public void IsCommandContextValid_ShouldBeTrue_IfTemplateIsResort()
        {
            // Arrange
            var item = new FakeItem().WithTemplate(Constants.TemplateIds.Resort);
            var context = new CommandContext(item);

            // Act
            var actual = command.IsCommandContextValidProxy(context);

            // Assert
            actual.Should().BeTrue();
        }

        [Fact]
        public void Action_ShouldThrowException_IfDatabaseThrowException()
        {
            // Arrange
            var args = new ClientPipelineArgs();
            databaseProvider.GetDatabase(DatabaseType.Content).Throws<Exception>();

            // Act
            Action action = () => command.ActionProxy(args);

            // Assert
            action.Should().Throw<Exception>();
        }

        [Theory]
        [AutoData]
        public void Action_ShouldGetOrCreateFromHotelBranchTemplate(ID id, string itemName)
        {
            // Arrange
            var args = new ClientPipelineArgs();
            args.Parameters.Add("name", itemName);
            args.Parameters.Add("id", id.ToString());

            // Act
            command.ActionProxy(args);

            // Assert
            datasourceRepository.ReceivedWithAnyArgs(1).GetOrCreateFromHotelBranchTemplate(Arg.Any<string>(), Arg.Any<Item>(), Arg.Any<BranchItem>(), Arg.Any<string>());
        }

        [Theory]
        [AutoData]
        public void PostAction_ShouldSendMessage(ID id)
        {
            // Arrange
            var args = new ClientPipelineArgs();
            args.Parameters.Add("id", id.ToString());

            // Act
            command.PostActionProxy(args);

            // Assert
            sitecoreUIService.Received(1).ClientPage_SendMessage(Arg.Any<object>(), Arg.Is($"item:refreshchildren(id={id})"));
        }

        [Fact]
        public void ExecuteJob_ShouldExecuteInputMethod_IfArgsIsNotPostBack()
        {
            // Arrange
            var args = new ClientPipelineArgs()
            {
                IsPostBack = false
            };

            // Act
            command.ExecuteJobProxy(args);

            // Assert
            sitecoreUIService.Received(1).SheerResponse_Input("Please specify the name of new Hotel", string.Empty);
        }

        [Fact]
        public void ExecuteJob_ShouldExecuteInputMethod_IfArgsIsHasNoResult()
        {
            // Arrange
            var args = new ClientPipelineArgs()
            {
                IsPostBack = true,
                Result = string.Empty
            };

            // Act
            command.ExecuteJobProxy(args);

            // Assert
            args.Parameters["name"].Should().BeNull();
        }

        private class AddHotelCommandProxy : AddHotelCommand
        {
            public AddHotelCommandProxy(
                IDatasourceRepository datasourceRepository,
                IDatabaseProvider databaseProvider,
                IDestinationsLogger logger,
                IUserCreationService userCreationService,
                BaseSettings settings,
                ISitecoreUIService sitecoreUIService)
                : base(datasourceRepository, databaseProvider, logger, userCreationService, settings, sitecoreUIService)
            {
            }

            public void ActionProxy(ClientPipelineArgs args) => Action(args);

            public bool IsCommandContextValidProxy(CommandContext context) => IsCommandContextValid(context);

            public void PostActionProxy(ClientPipelineArgs args) => PostAction(args);

            public void ExecuteJobProxy(ClientPipelineArgs args) => ExecuteJob(args);
        }
    }
}
