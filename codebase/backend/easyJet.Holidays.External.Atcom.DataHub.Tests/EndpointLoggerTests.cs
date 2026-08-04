using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.DataHub.Logging;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.ServiceModel;
using System.ServiceModel.Channels;

namespace easyJet.Holidays.External.DataHub.Tests
{
    public class LoggingInterceptorTests
    {
        private readonly RequestInterceptor _sut;
        private readonly Mock<ILogger<RequestInterceptor>> _loggerMock = new();
        private readonly Mock<IClientChannel> _channelMock = new();

        public LoggingInterceptorTests()
        {
            AtcomSettings settings = new AtcomSettings
            {
                DataHub = new AtcomApiSettings
                {
                    BaseUrl = "baseurl",
                    Host = "host"
                }
            };

            _sut = new RequestInterceptor(Options.Create(settings), _loggerMock.Object);
        }

        [Fact]
        public void BeforeSendRequest_Trigger_NoException()
        {
            Message mm = Message.CreateMessage(MessageVersion.Soap11, "action");

            _ = _sut.BeforeSendRequest(ref mm, _channelMock.Object);

            _loggerMock.Verify(
                LoggerTestUtils.VerifyForLogLevel<RequestInterceptor>(LogLevel.Information),
                Times.Once()
            );

            mm.Should().NotBeNull();
        }


        [Fact]
        public void AfterReceiveReply_Trigger_NoException()
        {
            Message mm = Message.CreateMessage(MessageVersion.Soap11, "action");

            _sut.AfterReceiveReply(ref mm, null!);

            _loggerMock.Verify(
                LoggerTestUtils.VerifyForLogLevel<RequestInterceptor>(LogLevel.Debug),
                Times.Once()
            );
            mm.Should().NotBeNull();
        }
    }

    public class EndpointLoggerTests
    {
        private readonly DataHubEndpointBehavior _sut;
        private readonly Mock<ILogger<RequestInterceptor>> _loggerMock = new();

        public EndpointLoggerTests()
        {
            AtcomSettings settings = new AtcomSettings
            {
                DataHub = new AtcomApiSettings
                {
                    BaseUrl = "baseurl",
                    Host = "host"
                }
            };

            RequestInterceptor logger = new(Options.Create(settings), _loggerMock.Object);
            _sut = new DataHubEndpointBehavior(logger);
        }

        [Fact]
        public void AddBindingParameters_NoException()
        {
            // Arrange

            // Act
            var action = () => _sut.AddBindingParameters(null!, null!);

            // Assert
            action.Should().NotThrow();
        }

        [Fact]
        public void ApplyDispatchBehavior_NoException()
        {
            // Arrange

            // Act
            var action = () => _sut.ApplyDispatchBehavior(null!, null!);

            // Assert
            action.Should().NotThrow();
        }

        [Fact]
        public void Validate_NoException()
        {
            // Arrange

            // Act
            var action = () => _sut.Validate(null!);

            // Assert
            action.Should().NotThrow();
        }
    }
}
