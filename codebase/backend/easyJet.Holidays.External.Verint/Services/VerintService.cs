using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Interfaces.Verint;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Verint.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text;

namespace easyJet.Holidays.External.Verint.Services
{
    /// <summary>
    /// Creates cases using verint REST API. Currently unused.
    /// </summary>
    public class VerintService : IVerintService
    {
        private readonly IApiService _apiService;
        private readonly VerintApiSettings _verintApiSettings;
        private readonly ContactUsSettings _contactUsSettings;
        private readonly ILogger<VerintService> _logger;

        public VerintService(IApiService apiService, IOptions<VerintApiSettings> verintApiSettings,
            IOptions<ContactUsSettings> contactUsSettings, ILogger<VerintService> logger)
        {
            _apiService = apiService;
            _verintApiSettings = verintApiSettings?.Value ?? throw new ArgumentNullException(nameof(verintApiSettings));
            _contactUsSettings = contactUsSettings.Value;
            _logger = logger;
        }

        public async Task<ContactUsResult> CreateCase(ContactFormRequest contactFormRequest, string caseType)
        {
            var caseId = await SendCreateCaseRequest(contactFormRequest, caseType);
            if (caseId == null)
                return new ContactUsResult { IsSuccessful = false };

            if (contactFormRequest.Attachments?.Count == 0 || contactFormRequest.Attachments == null)
                return new ContactUsResult { IsSuccessful = true, CaseNumber = caseId.Value.ToString() };

            var attachmentIdList = await CreateAttachments(contactFormRequest);
            if (attachmentIdList.Count != contactFormRequest.Attachments?.Count)
            {
                return new ContactUsResult { IsSuccessful = false };
            }

            if (await AssociateAttachmentsWithCase(caseId.Value, attachmentIdList))
            {
                return new ContactUsResult { IsSuccessful = true, CaseNumber = caseId.Value.ToString() };
            }

            return new ContactUsResult { IsSuccessful = false };
        }

        private async Task<int?> SendCreateCaseRequest(ContactFormRequest contactFormRequest, string caseType)
        {
            try
            {
                var createCaseRequestBody = new CreateCaseRequestBody()
                {
                    BookingReference = _contactUsSettings.VerintBookingReferenceId,
                    CaseNotes = GetCaseNotes(contactFormRequest), //ToDo ask what should be inside
                    CaseSummary = _contactUsSettings.VerintCaseSummary.Replace("{About}", contactFormRequest.About).Replace("{BookingReference}", contactFormRequest.BookingReference),
                    CaseTypeName = caseType,
                    CustomerEmailAddress = contactFormRequest.EmailAddress,
                    CustomerFirstName = contactFormRequest.LeadPassengerFirstName,
                    CustomerLastName = contactFormRequest.LeadPassengerLastName,
                    Language = _contactUsSettings.VerintCaseLanguage
                };

                var endPoint = Utils.ReplaceClientId(_verintApiSettings.CreateCaseEndPoint, _verintApiSettings.ClientId);

                var verintCreateCaseRequest = new CreateCaseRequest();
                verintCreateCaseRequest.Endpoint = new Uri(endPoint);
                verintCreateCaseRequest.Payload.Body = createCaseRequestBody;

                var response = await _apiService.GetResponseContentAsync<CreateCaseRequest, CreateCaseResponse>(verintCreateCaseRequest);
                return response.Payload.Body.CaseId;
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, $"{nameof(CreateCase)} Failed to send data to verint");
                return null;
            }
        }

        private async Task<List<string>> CreateAttachments(ContactFormRequest contactFormRequest)
        {
            var taskList = new List<Task<string>>();
            try
            {
                var attachments = contactFormRequest.Attachments.Select(attachment =>
                {
                    var memoryStream = new MemoryStream();
                    using (var stream = attachment.OpenReadStream())
                    {
                        stream.CopyTo(memoryStream);
                        memoryStream.Position = 0;
                    }
                    return new
                    {
                        MemoryStream = memoryStream,
                        FileName = attachment.FileName,
                        ContentType = attachment.ContentType
                    };
                }).ToList();

                try
                {
                    taskList = attachments.Select(attachment => UploadAttachment(attachment.MemoryStream, attachment.FileName, attachment.ContentType)).ToList();
                    await Task.WhenAll(taskList);
                    var identifierList = taskList.Select(i => i.Result).ToList();
                    if (identifierList.Any(i => i == null))
                        throw new Exception("Identifier is null");

                    return identifierList;
                }
                finally
                {
                    foreach (var attachment in attachments)
                    {
                        attachment.MemoryStream.Dispose();
                    }
                }
            }
            catch (Exception)
            {
                var exceptions = taskList.Where(t => t.Exception != null)
                    .Select(t => t.Exception);

                foreach (var aggregateException in exceptions)
                {
                    _logger.LogError(aggregateException, $"{nameof(CreateAttachments)} Failed to send data to verint");
                }

                return new List<string>();
            }
        }

        private async Task<bool> AssociateAttachmentsWithCase(int caseId, List<string> attachmentIdList)
        {
            var taskList = new List<Task>();
            try
            {
                taskList = attachmentIdList.Select(i => SendAssociateAttachmentRequest(caseId, i)).ToList();
                await Task.WhenAll(taskList);

                return true;
            }
            catch (Exception)
            {
                var exceptions = taskList.Where(t => t.Exception != null)
                    .Select(t => t.Exception);

                foreach (var aggregateException in exceptions)
                {
                    _logger.LogError(aggregateException, $"{nameof(AssociateAttachmentsWithCase)} Failed to associate attachment");
                }
                return false;
            }
        }

        private async Task SendAssociateAttachmentRequest(int caseId, string attachmentId)
        {
            var createCaseRequestBody = new AssociateCaseAttachmentRequestBody()
            {
                Description = "description",
                Identifier = attachmentId,
                Type = "vatt:ManagedAttachment"
            };

            var endPoint = Utils.ReplaceCaseId(
                    Utils.ReplaceClientId(_verintApiSettings.AssociateCaseAttachmentEndPoint,
                        _verintApiSettings.ClientId), caseId.ToString(CultureInfo.InvariantCulture));

            var verintAssociateCaseAttachmentRequest = new AssociateCaseAttachmentRequest();
            verintAssociateCaseAttachmentRequest.Endpoint = new Uri(endPoint);
            verintAssociateCaseAttachmentRequest.Payload.Body = createCaseRequestBody;

            var payload = verintAssociateCaseAttachmentRequest.PayloadString;
            var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, endPoint);
            httpRequestMessage.Content = new StringContent(payload, Encoding.UTF8, "application/ld+json");

            verintAssociateCaseAttachmentRequest.HttpRequestMessage = httpRequestMessage;

            await _apiService.GetResponseContentAsync<AssociateCaseAttachmentRequest, AssociateCaseAttachmentResponse>(
                verintAssociateCaseAttachmentRequest);
        }

        private async Task<string> UploadAttachment(Stream attachmentStream, string fileName, string contentType)
        {
            using (var content = new MultipartFormDataContent())
            {
                var fileContent = new StreamContent(attachmentStream);
                fileContent.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
                { Name = "file", FileName = fileName };
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                content.Add(fileContent);

                var endpoint = Utils.ReplaceClientId(_verintApiSettings.CreateAttachmentEndPoint,
                    _verintApiSettings.ClientId);
                var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
                httpRequestMessage.Content = content;

                var createAttachmentRequest = new CreateAttachmentRequest
                {
                    Endpoint = new Uri(endpoint),
                    HttpRequestMessage = httpRequestMessage
                };

                var response =
                    await _apiService.GetResponseContentAsync<CreateAttachmentRequest, CreateAttachmentResponse>(
                        createAttachmentRequest);

                return response.Payload.Body.Identifier;
            }
        }

        private string GetCaseNotes(ContactFormRequest contactFormRequest)
        {
            var template = _contactUsSettings.VerintCaseNotes;
            return template.Replace("{BookingReference}", contactFormRequest.BookingReference)
                .Replace("{DepartureAndReturnDate}", contactFormRequest.DepartureAndReturnDate)
                .Replace("{Question}", contactFormRequest.Question)
                .Replace("{ContactNumber}", contactFormRequest.ContactNumber);
        }
    }
}
