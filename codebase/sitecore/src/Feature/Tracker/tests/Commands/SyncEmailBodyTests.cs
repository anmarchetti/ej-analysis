using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoFixture;
using easyJet.Feature.Tracker.Commands;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.SitecoreExtensions.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.Extensions;
using NSubstitute.ReceivedExtensions;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Xunit;

namespace easyJet.Feature.Tracker.Tests.Commands
{
    public class SyncEmailBodyTests
    {
        private readonly Fixture fixture;
        private readonly IDfloService dfloServiceMock;
        private readonly IDynamoDbEmailRepository dynamoRepoMock;
        private readonly SyncEmailBodyProxy sut;
        private readonly ISyncEmailBodyConfigurationProvider emailSyncRepoConfig;
        private readonly IUserCreationService userCreationService;

        public SyncEmailBodyTests()
        {
            fixture = new Fixture();

            dfloServiceMock = Substitute.For<IDfloService>();
            dynamoRepoMock = Substitute.For<IDynamoDbEmailRepository>();
            emailSyncRepoConfig = Substitute.For<ISyncEmailBodyConfigurationProvider>();
            emailSyncRepoConfig.Configure().MaxConcurrentTasks.Returns(10);
            emailSyncRepoConfig.Configure().BatchFailureLimit.Returns(10);
            userCreationService = Substitute.For<IUserCreationService>();
            sut = Substitute.For<SyncEmailBodyProxy>(dfloServiceMock, dynamoRepoMock, emailSyncRepoConfig, userCreationService);
        }

        [Fact]
        public void ActionInvokingUpdateEmails_OnExceededBatchFailureLimit_AbortsExecution()
        {
            // Arrange
            const int resubLimit = 0;
            const int batchFailureLimit = 1;
            emailSyncRepoConfig.Configure().InitialMillisecondsDelay.Returns(1); // no need to wait for limit * 500ms delay during each test run.
            emailSyncRepoConfig.Configure().ResubmissionLimit.Returns(resubLimit);
            emailSyncRepoConfig.Configure().BatchFailureLimit.Returns(batchFailureLimit);

            dynamoRepoMock.Configure().GetDoneStateFromWorker().ReturnsForAnyArgs(false);

            dynamoRepoMock.Configure().GetNextSetFromWorker().ReturnsForAnyArgs(
                Task.FromResult(new List<EmailMessageAwsDbModel>() { fixture.Create<EmailMessageAwsDbModel>() }));

            dfloServiceMock.GetEmailBodyByIdAsync(default)
                .ReturnsForAnyArgs(ci => (ci[0] as string, fixture.Create<string>()));

            dynamoRepoMock.SaveBatch(default).ReturnsForAnyArgs(_ => Task.FromException(new Exception()));

            // Act
            sut.ActionProxy(null);

            // Assert
            dynamoRepoMock.Received().GetDoneStateFromWorker();
            // ensuring that this was called only once regardless of IsDone being always false means that breaking on exceeded failure limit works.
            dynamoRepoMock.Received(Quantity.Exactly(1)).GetNextSetFromWorker();
            dfloServiceMock.ReceivedWithAnyArgs().GetEmailBodyByIdAsync(default);
            // +1 as this is basically a limit for failed attempts.
            dynamoRepoMock.ReceivedWithAnyArgs(Quantity.AtLeastOne()).SaveBatch(default);
        }

        [Fact]
        public void ActionInvokingUpdateEmails_OnFailedBatchSave_AttemptsResubmissionTillLimitIsReached()
        {
            const int resubLimit = 2;
            emailSyncRepoConfig.Configure().InitialMillisecondsDelay.Returns(1); // no need to wait for limit * 500ms delay during each test run.
            emailSyncRepoConfig.Configure().ResubmissionLimit.Returns(resubLimit);

            dynamoRepoMock.Configure().GetDoneStateFromWorker().ReturnsForAnyArgs(false, true);

            dynamoRepoMock.Configure().GetNextSetFromWorker().ReturnsForAnyArgs(
                Task.FromResult(new List<EmailMessageAwsDbModel>() { fixture.Create<EmailMessageAwsDbModel>() }));

            dfloServiceMock.GetEmailBodyByIdAsync(default)
                .ReturnsForAnyArgs(ci => (ci[0] as string, fixture.Create<string>()));

            dynamoRepoMock.SaveBatch(default).ReturnsForAnyArgs(
                ci => Task.FromException(new Exception()),
                ci => Task.FromException(new Exception()),
                ci => Task.FromException(new Exception()),
                ci => Task.CompletedTask);

            // Act
            sut.ActionProxy(null);

            // Assert
            dynamoRepoMock.Received().GetDoneStateFromWorker();
            dynamoRepoMock.Received().GetNextSetFromWorker();
            dfloServiceMock.ReceivedWithAnyArgs().GetEmailBodyByIdAsync(default);
            // +1 as this is basically a limit for failed attempts.
            dynamoRepoMock.ReceivedWithAnyArgs(Quantity.Within(0, resubLimit + 1)).SaveBatch(default);
        }

        [Fact]
        public void ActionInvokingUpdateEmails_WithUpdateableEmails_UpdatesAndSavesSuccessfully()
        {
            emailSyncRepoConfig.Configure().BatchFailureLimit.Returns(2);
            dynamoRepoMock.Configure().GetDoneStateFromWorker().ReturnsForAnyArgs(false, true);

            dynamoRepoMock.Configure().GetNextSetFromWorker().ReturnsForAnyArgs(
                Task.FromResult(new List<EmailMessageAwsDbModel>() { fixture.Create<EmailMessageAwsDbModel>() }));

            dfloServiceMock.GetEmailBodyByIdAsync(default)
                .ReturnsForAnyArgs(ci => (ci[0] as string, fixture.Create<string>()));

            // Act
            sut.ActionProxy(null);

            // Assert
            dynamoRepoMock.Received().GetDoneStateFromWorker();
            dynamoRepoMock.Received().GetNextSetFromWorker();
            dfloServiceMock.ReceivedWithAnyArgs().GetEmailBodyByIdAsync(default);
            dynamoRepoMock.ReceivedWithAnyArgs(1).SaveBatch(default);
        }

        [Fact]
        public void ActionInvokingUpdateEmails_DoesNotFindUpdateableEmailsInDflo_Returns()
        {
            dynamoRepoMock.Configure().GetDoneStateFromWorker().ReturnsForAnyArgs(false, true);

            dynamoRepoMock.Configure().GetNextSetFromWorker().ReturnsForAnyArgs(
                Task.FromResult(new List<EmailMessageAwsDbModel>() { fixture.Create<EmailMessageAwsDbModel>() }));

            // Act
            sut.ActionProxy(null);

            // Assert
            dynamoRepoMock.Received().GetDoneStateFromWorker();
            dynamoRepoMock.Received().GetNextSetFromWorker();
            dfloServiceMock.ReceivedWithAnyArgs().GetEmailBodyByIdAsync(default);
            dynamoRepoMock.DidNotReceiveWithAnyArgs().SaveBatch(default);
        }

        [Fact]
        public void ActionInvokingUpdateEmails_WithNoEmailsToUpdate_DoesNothing()
        {
            // Arrange
            dynamoRepoMock.Configure().GetDoneStateFromWorker().ReturnsForAnyArgs(false, true);

            dynamoRepoMock.Configure().GetNextSetFromWorker().ReturnsForAnyArgs(
                Task.FromResult(new List<EmailMessageAwsDbModel>(Enumerable.Empty<EmailMessageAwsDbModel>())));

            // Act
            sut.ActionProxy(null);

            // Assert
            dynamoRepoMock.Received().GetDoneStateFromWorker();
            dynamoRepoMock.Received().GetNextSetFromWorker();
            dfloServiceMock.DidNotReceiveWithAnyArgs().GetEmailBodyByIdAsync(default);
            dynamoRepoMock.DidNotReceiveWithAnyArgs().SaveBatch(default);
        }

        [Fact]
        public void ActionInvokingUpdateEmails_WorkerAlreadyDone_DoesNothing()
        {
            // Arrange
            dynamoRepoMock.Configure().GetDoneStateFromWorker().ReturnsForAnyArgs(true);

            // Act
            sut.ActionProxy(null);

            // Assert
            dynamoRepoMock.Received().GetDoneStateFromWorker();
            dynamoRepoMock.DidNotReceive().GetNextSetFromWorker();
            dfloServiceMock.DidNotReceiveWithAnyArgs().GetEmailBodyByIdAsync(default);
            dynamoRepoMock.DidNotReceiveWithAnyArgs().SaveBatch(default);
        }

        [Theory]
        [MemberData(nameof(SyncEmailBodyTestsData.ValidCommandContexts), MemberType = typeof(SyncEmailBodyTestsData))]
        public void IsCommandContextValid_ContextIsAlwaysValid(CommandContext ctx)
        {
            // Arrange

            // Act
            var validityResult = sut.IsCommandContextValidProxy(ctx);

            // Assert
            validityResult.Should().BeTrue();
        }

        public class SyncEmailBodyProxy : SyncEmailBody
        {
            public SyncEmailBodyProxy(IDfloService dfloService, IDynamoDbEmailRepository repository, ISyncEmailBodyConfigurationProvider syncEmailBodyConfigurationProvider, IUserCreationService userCreationService)
                : base(dfloService, repository, syncEmailBodyConfigurationProvider, userCreationService)
            {
            }

            public void ActionProxy(ClientPipelineArgs args) => base.Action(args);

            public bool IsCommandContextValidProxy(CommandContext context) => base.IsCommandContextValid(context);
        }
    }
}
