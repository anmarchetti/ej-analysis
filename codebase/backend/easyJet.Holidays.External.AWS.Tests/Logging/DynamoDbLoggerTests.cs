using Amazon.DynamoDBv2.Model;
using Amazon.Runtime;
using easyJet.Holidays.External.AWS.Logging.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net;
using System.Reflection;
using Xunit;

namespace easyJet.Holidays.External.AWS.Logging.Tests
{
    public class DynamoDbLoggerTests
    {
        private readonly Mock<ILogger<DynamoDbLogger>> _mockLogger;
        private readonly IDynamoDbLogger _dynamoDbLogger;

        public DynamoDbLoggerTests()
        {
            _mockLogger = new Mock<ILogger<DynamoDbLogger>>();
            _dynamoDbLogger = new DynamoDbLogger(_mockLogger.Object);
        }

        [Fact]
        public void LoggingResponseEventHandler_NullEventArgs_ShouldLogUnknownTableAndCannotParse()
        {
            // Arrange
            ResponseEventArgs eventArgs = null;

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("Unknown table");
            log.Should().Contain("Can not parse response message");
        }

        [Fact]
        public void LoggingResponseEventHandler_ResponseEventArgsNotWebService_ShouldLogUnknownTableAndCannotParse()
        {
            // Arrange
            var eventArgs = new FakeResponseEventArgs(); // Base type, not WebServiceResponseEventArgs

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("Unknown table");
            log.Should().Contain("Can not parse response message");
        }

        [Fact]
        public void LoggingResponseEventHandler_GetItemRequestNullResponse_ShouldLogCannotParse()
        {
            // Arrange
            var request = new GetItemRequest { TableName = "TestTable" };
            var eventArgs = new TestableWebServiceResponseEventArgs(request, null);

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("TestTable");
            log.Should().Contain("Can not parse response message");
        }

        [Fact]
        public void LoggingResponseEventHandler_GetItemRequestUnrecognizedResponse_ShouldLogCannotParse()
        {
            // Arrange
            var request = new GetItemRequest { TableName = "TestTable" };
            // A generic AmazonWebServiceResponse won't match the switch statement in DynamoDbLogger
            var unrecognizedResponse = new AmazonWebServiceResponse();
            var eventArgs = new TestableWebServiceResponseEventArgs(request, unrecognizedResponse);

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("TestTable");
            log.Should().Contain("Can not parse response message");
        }

        [Fact]
        public void LoggingResponseEventHandler_GetItemRequestAndEmptyGetItemResponse_ShouldLogSuccessWithoutAttributes()
        {
            // Arrange
            var request = new GetItemRequest { TableName = "TestTable" };
            var emptyResponse = new GetItemResponse
            {
                HttpStatusCode = HttpStatusCode.OK,
                Item = new Dictionary<string, AttributeValue>()
            };
            var eventArgs = new TestableWebServiceResponseEventArgs(request, emptyResponse);

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("TestTable");
            log.Should().Contain("HttpStatusCode > OK");
        }

        [Fact]
        public void LoggingResponseEventHandler_GetItemRequestAndPopulatedGetItemResponse_ShouldLogSuccessWithAttributes()
        {
            // Arrange
            var request = new GetItemRequest { TableName = "TestTable" };
            var populatedResponse = new GetItemResponse
            {
                HttpStatusCode = HttpStatusCode.OK,
                Item = new Dictionary<string, AttributeValue>
                {
                    { "Id", new AttributeValue { S = "123" } },
                    { "Name", new AttributeValue { S = "TestName" } }
                }
            };
            var eventArgs = new TestableWebServiceResponseEventArgs(request, populatedResponse);

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("TestTable");
            log.Should().Contain("HttpStatusCode > OK");
            log.Should().Contain("Id > 123");
            log.Should().Contain("Name > TestName");
        }

        [Fact]
        public void LoggingResponseEventHandler_UnrecognizedRequest_ShouldLogUnknownTableAndCannotParse()
        {
            // Arrange
            var request = new FakeRequest();
            var response = new AmazonWebServiceResponse();
            var eventArgs = new TestableWebServiceResponseEventArgs(request, response);

            // Act
            _dynamoDbLogger.LoggingResponseEventHandler(this, eventArgs);

            var log = CaptureLogMessage();
            log.Should().Contain("Unknown table");
            log.Should().Contain("Can not parse response message");
        }

        private string CaptureLogMessage()
        {
            var logInvocations = _mockLogger.Invocations;
            logInvocations.Count.Should().BeGreaterOrEqualTo(1, "Expected at least one log message.");

            var invocation = logInvocations[0];
            var messageState = invocation.Arguments[2];

            return messageState.ToString();
        }

        /// <summary>
        /// A custom request type that doesn't match the switch statement in DynamoDbLogger, 
        /// ensuring \"Unknown table\" gets logged.
        /// </summary>
        public class FakeRequest : AmazonWebServiceRequest
        {
            // No additional properties or methods needed.
        }
    }

    /// <summary>
    /// Subclass that allows us to set Request/Response despite their private setters.
    /// </summary>
    internal class TestableWebServiceResponseEventArgs : WebServiceResponseEventArgs
    {
        public TestableWebServiceResponseEventArgs(AmazonWebServiceRequest request, AmazonWebServiceResponse response)
        {
            // Because WebServiceResponseEventArgs has a protected constructor and private set 
            // for Request/Response, we must use reflection to set these properties.
            var type = typeof(WebServiceResponseEventArgs);

            var requestProp = type.GetProperty("Request", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            requestProp?.SetValue(this, request);

            var responseProp = type.GetProperty("Response", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            responseProp?.SetValue(this, response);
        }
    }

    /// <summary>
    /// Subclasses to allow instantiation of otherwise protected classes.
    /// </summary>
    internal class FakeResponseEventArgs : ResponseEventArgs
    {
        // No additional overrides or properties needed 
        // unless you want to store extra data for tests.
    }
}
