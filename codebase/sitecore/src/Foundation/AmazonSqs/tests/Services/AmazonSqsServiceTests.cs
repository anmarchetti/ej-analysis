using System;
using Amazon;
using Amazon.SQS;
using Amazon.SQS.Model;
using easyJet.Foundation.AmazonSqs.Logging;
using easyJet.Foundation.AmazonSqs.Services;
using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace easyJet.Foundation.AmazonSqs.Tests.Services
{
    public class AmazonSqsServiceTests
    {
        private readonly AmazonSqsService sut;
        private readonly IAmazonSQS client;
        private readonly IAmazonSqsLogger logger;

        public AmazonSqsServiceTests()
        {
            client = Substitute.For<IAmazonSQS>();
            logger = Substitute.For<IAmazonSqsLogger>();
            sut = new AmazonSqsService(client, logger);
        }

        [Fact]
        public void SendMessageBatch_ShouldThrowException_IfParameterIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.SendMessageBatch(null));
        }

        [Fact]
        public void SendMessageBatch_ShouldBeNull_IfClientThrowsError()
        {
            // Arrange
            var request = new SendMessageBatchRequest();
            client.SendMessageBatch(Arg.Any<SendMessageBatchRequest>()).Throws(new Exception());

            // Act
            var result = sut.SendMessageBatch(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void SendMessageBatch_ShouldNotBeNull_IfClientThrowsNoError()
        {
            // Arrange
            var request = new SendMessageBatchRequest();
            var response = new SendMessageBatchResponse();
            client.SendMessageBatch(Arg.Any<SendMessageBatchRequest>()).ReturnsForAnyArgs(response);

            // Act
            var result = sut.SendMessageBatch(request);

            // Assert
            result.Should().NotBeNull();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void SendMessage_ShouldThrowException_IfParameterIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.SendMessage(null));
        }

        [Fact]
        public void SendMessage_ShouldBeNull_IfClientThrowsError()
        {
            // Arrange
            var request = new SendMessageRequest();
            client.SendMessage(Arg.Any<SendMessageRequest>()).Throws(new Exception());

            // Act
            var result = sut.SendMessage(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void SendMessage_ShouldNotBeNull_IfClientThrowsNoError()
        {
            // Arrange
            var request = new SendMessageRequest();
            var response = new SendMessageResponse();
            client.SendMessage(Arg.Any<SendMessageRequest>()).ReturnsForAnyArgs(response);

            // Act
            var result = sut.SendMessage(request);

            // Assert
            result.Should().NotBeNull();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void ReceiveMessage_ShouldThrowException_IfParameterIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.ReceiveMessage(null));
        }

        [Fact]
        public void ReceiveMessage_ShouldBeNull_IfClientThrowsError()
        {
            // Arrange
            var request = new ReceiveMessageRequest();
            client.ReceiveMessage(Arg.Any<ReceiveMessageRequest>()).Throws(new Exception());

            // Act
            var result = sut.ReceiveMessage(request);

            // Assert
            result.Should().BeNull();
            logger.Received().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void ReceiveMessage_ShouldNotBeNull_IfClientThrowsNoError()
        {
            // Arrange
            var request = new ReceiveMessageRequest();
            var response = new ReceiveMessageResponse();
            client.ReceiveMessage(Arg.Any<ReceiveMessageRequest>()).ReturnsForAnyArgs(response);

            // Act
            var result = sut.ReceiveMessage(request);

            // Assert
            result.Should().NotBeNull();
            logger.DidNotReceive().Error(Arg.Any<string>(), Arg.Any<Exception>(), Arg.Any<object>());
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl((string)null));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull2()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl((Arn)null));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull3()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl(string.Empty));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull4()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl(string.Empty, null, null));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull5()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl("test", null, null));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull6()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl("test", "null", null));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfParameterIsNull7()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentNullException>(() => sut.GetQueueUrl("test", "null", string.Empty));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfArnIsNotValid()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentException>(() => sut.GetQueueUrl("test"));
        }

        [Fact]
        public void GetQueueUrl_ShouldThrowException_IfArnIsNotValid2()
        {
            // Arrange
            // Act
            // Assert
            Assert.Throws<ArgumentException>(() => sut.GetQueueUrl("arn:aws:"));
        }

        [Fact]
        public void GetQueueUrl_ShouldReturnUrl_IfParamsAreCorrect()
        {
            // Arrange
            var parameter = "arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue";

            // Act
            var url = sut.GetQueueUrl(parameter);

            // Assert
            url.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GetQueueUrl_ShouldReturnUrl_IfParamsAreCorrect2()
        {
            // Arrange
            var parameter = Arn.Parse("arn:aws:sqs:eu-west-1:021499708211:holidays-dev-scraping-queue");

            // Act
            var url = sut.GetQueueUrl(parameter);

            // Assert
            url.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void GetQueueUrl_ShouldReturnUrl_IfParamsAreCorrect3()
        {
            // Arrange
            // Act
            var url = sut.GetQueueUrl("region", "accountId", "queueName");

            // Assert
            url.Should().NotBeNullOrEmpty();
        }
    }
}