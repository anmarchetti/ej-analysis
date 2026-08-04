#nullable enable

using Amazon.SimpleEmailV2.Model;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.SES;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Interfaces.SES;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.External.AWS.Tests")]
namespace easyJet.Holidays.External.AWS.Services.SES
{
    public class SesClient : ISesClient
    {
        private readonly AwsSettings _awsSettings;
        
        /// <summary>
        /// Constructor for SesClient.
        /// </summary>
        /// <param name="awsClient">AWS client</param>
        /// <param name="awsSettings">AWS settings</param>
        /// <param name="logger"></param>
        /// <exception cref="ArgumentNullException"></exception>
        public SesClient(AwsClient awsClient, IOptions<AwsSettings> awsSettings, ILogger<SesClient> logger)
        {
            _awsClient = awsClient;
            _awsSettings = awsSettings?.Value ?? throw new ArgumentNullException(nameof(awsSettings));
            _logger = logger;
        }

        private readonly AwsClient _awsClient;
        private readonly ILogger<SesClient> _logger;

        public async Task SendEmail(Email email)
        {
            try
            {
                var message = ComposeMessage(email);

                using var memoryStream = new MemoryStream();
                await message.WriteToAsync(memoryStream);
                var emailRequest = new SendEmailRequest
                {
                    Content = new EmailContent
                    {
                        Raw = new RawMessage
                        {
                            Data = memoryStream
                        }
                    },
                    FromEmailAddressIdentityArn = _awsSettings.SES.FromEmailAddressIdentityArn,
                };

                using var sesClient = _awsClient.GetSESClient();
                var res = await sesClient.SendEmailAsync(emailRequest);
                _logger.LogInformation("Successfully sent email {Id}", res.MessageId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cannot send email from {X} to {Y}", email.From, email.To);
                throw new ApiException(ApiExceptionCodes.GenericSESError, null, ex);
            }
        }

        internal static MimeMessage ComposeMessage(Email email)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("from", email.From));
            message.To.Add(new MailboxAddress("to", email.To));
            message.Subject = email.Subject;

            if (!string.IsNullOrEmpty(email.ReplyTo))
            {
                message.ReplyTo.Add(new MailboxAddress("replyTo", email.ReplyTo));
            }

            var emailBody = email.Template;

            foreach (var variable in email.Variables.EmptyIfNull())
            {
                emailBody = emailBody.Replace($"{{{variable.Key}}}", variable.Value);
            }

            var body = new BodyBuilder { HtmlBody = emailBody };

            foreach (var attachment in email.Attachments.EmptyIfNull())
            {
                var contentType = ContentType.Parse(attachment.ContentType);
                body.Attachments.Add(attachment.FileName, attachment.Content, contentType);
            }

            message.Body = body.ToMessageBody();
            return message;
        }
    }
}
