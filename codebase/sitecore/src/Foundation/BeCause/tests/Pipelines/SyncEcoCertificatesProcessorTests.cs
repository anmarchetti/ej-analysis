using System.Linq;
using easyJet.Foundation.BeCause.Logging;
using easyJet.Foundation.BeCause.Models;
using easyJet.Foundation.BeCause.Pipelines.SyncEcoCertificatesPipeline;
using easyJet.Foundation.BeCause.Services;
using easyJet.Foundation.BeCause.Settings;
using easyJet.Foundation.SitecoreExtensions.Services;
using NSubstitute;
using NSubstitute.ReturnsExtensions;
using Sitecore.Pipelines;
using Xunit;

namespace easyJet.Foundation.BeCause.Tests.Pipelines
{
    public class SyncEcoCertificatesProcessorTests
    {
        private readonly SyncEcoCertificatesProcessor sut;
        private readonly IBeCauseLogger logger;
        private readonly ICertificationSynchronisationService certificationSynchronisationService;
        private readonly ISettingsService settingsService;
        private readonly IUserCreationService userCreationService;

        public SyncEcoCertificatesProcessorTests()
        {
            logger = Substitute.For<IBeCauseLogger>();
            certificationSynchronisationService = Substitute.For<ICertificationSynchronisationService>();
            userCreationService = Substitute.For<IUserCreationService>();
            settingsService = Substitute.For<ISettingsService>();
            var user = Substitute.ForPartsOf<Sitecore.Security.Accounts.User>("test", false);
            userCreationService.GetOrCreateNonAnonymousUser(Arg.Any<string>()).Returns(user);
            sut = new SyncEcoCertificatesProcessor(logger, certificationSynchronisationService, settingsService, userCreationService);
        }

        [Fact]
        public void Process_ShouldLogWarn_IfSettingsReturnNull()
        {
            // Arrange
            settingsService.GetSettings().ReturnsNull();
            certificationSynchronisationService.Synchronize(string.Empty).Returns(Enumerable.Empty<CertificationSynchronisationResult>());

            // Act
            sut.Process(null);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogWarn_IfFeatureIsDisabled()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = false });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(Enumerable.Empty<CertificationSynchronisationResult>());

            // Act
            sut.Process(null);

            // Assert
            logger.Received().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.DidNotReceive().Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult_IfFeatureIsEnabled()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = true });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(Enumerable.Empty<CertificationSynchronisationResult>());

            // Act
            sut.Process(new PipelineArgs());

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received(1).Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult_IfResultContainsError()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = true });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(new[] { new CertificationSynchronisationResult { Operation = SynchronizationOperation.Error, Message = "Error" } });

            // Act
            sut.Process(new PipelineArgs());

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult_IfResultContainsAdded()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = true });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(new[] { new CertificationSynchronisationResult { Operation = SynchronizationOperation.CertificateAdded, Message = "Add" } });

            // Act
            sut.Process(new PipelineArgs());

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult_IfResultContainsRemoved()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = true });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(new[] { new CertificationSynchronisationResult { Operation = SynchronizationOperation.CertificateRemoved, Message = "Remove" } });

            // Act
            sut.Process(new PipelineArgs());

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult_IfResultContainsUnchanged()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = true });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(new[] { new CertificationSynchronisationResult { Operation = SynchronizationOperation.Untouched, Message = "Untouched" } });

            // Act
            sut.Process(new PipelineArgs());

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
        }

        [Fact]
        public void Process_ShouldLogResult_IfResultContainsUiMessage()
        {
            // Arrange
            settingsService.GetSettings().Returns(new BeCauseSettings { IsEnabled = true });
            certificationSynchronisationService.Synchronize(string.Empty).Returns(new[] { new CertificationSynchronisationResult { Operation = SynchronizationOperation.UiMessage, Message = "UiMessage" } });

            // Act
            sut.Process(new PipelineArgs());

            // Assert
            logger.DidNotReceive().Warn(Arg.Any<string>(), Arg.Any<object>());
            logger.Received(2).Info(Arg.Any<string>(), Arg.Any<object>());
        }
    }
}