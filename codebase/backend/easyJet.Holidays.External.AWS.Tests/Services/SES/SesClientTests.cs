using Amazon;
using Amazon.SimpleEmailV2;
using Amazon.SimpleEmailV2.Model;
using easyJet.Holidays.Api.Domain.Data.SES;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.AWS.Services.SES;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.AWS.Tests.Services.SES
{
    public class SesClientTests
    {
        public SesClientTests()
        {
            _awsClientMock = new Mock<AwsClient>();
            var loggerMock = new Mock<ILogger<SesClient>>();
            var awsSettingsMock = new Mock<IOptions<AwsSettings>>();

            var awsSettings = new AwsSettings
            {
                SES = new AwsSettingsSES
                {
                    FromEmailAddressIdentityArn = "arn:aws:ses:region:account-id:identity/from@example.com"
                }
            };
            awsSettingsMock.Setup(x => x.Value).Returns(awsSettings);

            _sut = new SesClient(_awsClientMock.Object, awsSettingsMock.Object, loggerMock.Object);
        }

        private readonly SesClient _sut;
        private readonly Mock<AwsClient> _awsClientMock;

        [Fact]
        public async Task SendEmail_CallsSendEmailAsync()
        {
            // Arrange
            var email = new Email
            {
                From = "from@test.com",
                To = "to@test.com",
                Subject = "test"
            };
            var awsSesClientMock = new Mock<AmazonSimpleEmailServiceV2Client>(() => new AmazonSimpleEmailServiceV2Client(RegionEndpoint.EUWest1));
            awsSesClientMock.Setup(x => x.SendEmailAsync(It.IsAny<SendEmailRequest>(), default)).ReturnsAsync(new SendEmailResponse() { MessageId = "123" });
            _awsClientMock.Setup(x => x.GetSESClient()).Returns(awsSesClientMock.Object);

            // Act
            await _sut.SendEmail(email);

            // Assert
            awsSesClientMock.Verify(x => x.SendEmailAsync(It.IsAny<SendEmailRequest>(), default), Times.Once);
        }

        [Fact]
        public void ComposeMessage_WhenEmailDoesntHaveReplyToAddress_ReplyToIsEmpty()
        {
            // Arrange
            var email = new Email
            {
                From = "from@test.com",
                To = "to@test.com",
                Subject = "test"
            };

            // Act
            var res = SesClient.ComposeMessage(email);

            // Arrange
            res.From.Single().As<MailboxAddress>().Address.Should().Be(email.From);
            res.To.Single().As<MailboxAddress>().Address.Should().Be(email.To);
            res.Subject.Should().Be(email.Subject);
            (res.ReplyTo as IList<InternetAddress>).Should().BeEmpty();
        }

        [Fact]
        public void ComposeMessage_WhenEmailHasReplyToAddress_ReplyToIsSet()
        {
            // Arrange
            var email = new Email
            {
                From = "from@test.com",
                To = "to@test.com",
                ReplyTo = "reply@test.com",
                Subject = "test"
            };

            // Act
            var res = SesClient.ComposeMessage(email);

            // Arrange
            res.From.Single().As<MailboxAddress>().Address.Should().Be(email.From);
            res.To.Single().As<MailboxAddress>().Address.Should().Be(email.To);
            res.Subject.Should().Be(email.Subject);
            res.ReplyTo.Single().As<MailboxAddress>().Address.Should().Be(email.ReplyTo);
        }

        [Fact]
        public void ComposeMessage_WhenTemplateHasVariable_ThenValuesAreAddedToTemplate()
        {
            // Arrange
            var email = new Email
            {
                From = "from@test.com",
                To = "to@test.com",
                Subject = "test",
                Template = "<html><h3>Booking reference: {BookingReference}</h3></html>",
                Variables = new Dictionary<string, string> { { "BookingReference", "12345678" } }
            };

            // Act
            var res = SesClient.ComposeMessage(email);

            // Assert
            res.HtmlBody.Should().Be("<html><h3>Booking reference: 12345678</h3></html>");
        }

        [Fact]
        public void ComposeMessage_Attachments()
        {
            // Arrange
            var attachment = new EmailAttachment
            {
                Content = new MemoryStream(),
                ContentType = "image/png",
                FileName = "pic.png"
            };

            var email = new Email
            {
                From = "from@test.com",
                To = "to@test.com",
                Subject = "test",
                Template = "test",
                Attachments = new List<EmailAttachment> { attachment }
            };

            // Act
            var response = SesClient.ComposeMessage(email);

            // Assert
            response.Attachments.Should().HaveCount(1);
        }
    }
}
