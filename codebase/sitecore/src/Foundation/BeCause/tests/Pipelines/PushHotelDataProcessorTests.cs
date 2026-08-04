using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Pipelines.PushHotelDataPipeline;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Pipelines
{
    public class PushHotelDataProcessorTests
    {
        private readonly PushHotelDataProcessor sut;
        private readonly IBeCauseLogger logger;
        private readonly IDataPushService dataPushService;
        private readonly IUserCreationService userCreationService;

        public PushHotelDataProcessorTests()
        {
            logger = Substitute.For<IBeCauseLogger>();
            dataPushService = Substitute.For<IDataPushService>();
            userCreationService = Substitute.For<IUserCreationService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            sut = new PushHotelDataProcessor(logger, dataPushService, userCreationService);
        }

        [Fact]
        public void Process_ShouldLogResult()
        {
            // Arrange
            dataPushService.PushHotelData().Returns((true, "error"));

            // Act
            sut.Process(null);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult2()
        {
            // Arrange
            dataPushService.PushHotelData().Returns((false, string.Empty));

            // Act
            sut.Process(null);

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received().Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}