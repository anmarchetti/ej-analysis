using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Verint.Models;
using easyJet.Holidays.External.Verint.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Microsoft.Net.Http.Headers;
using Moq;
using Xunit;

namespace easyJet.Holidays.External.Verint.Test.Services
{
    public class VerintServiceTest
    {
        private readonly Mock<IApiService> _apiServiceMock;
        private readonly VerintApiSettings _verintApiSettings;
        private readonly ContactUsSettings _contactUsSettings;
        private readonly Mock<ILogger<VerintService>> _loggerMock;

        private readonly VerintService _sut;

        public VerintServiceTest()
        {
            _apiServiceMock = new Mock<IApiService>();
            _verintApiSettings = new VerintApiSettings()
            {
                ClientId = "TestClient",
                UserName = "TestUser",
                GrantType = "TestGrantType",
                Password = "TestPassword",
                Scope = "TestScope",
                CreateCaseEndPoint = @"https://test.endpoint:1234",
                AssociateCaseAttachmentEndPoint = @"https://test.endpoint:1234",
                AuthEndPoint = @"https://test.endpoint:1234",
                AuthKey = "TestAuthKey",
                CreateAttachmentEndPoint = @"https://test.endpoint:1234",
            };

            _contactUsSettings = new ContactUsSettings
            {
                RequestFormAttachmentAllowedExtensions = new[] { ".png", ".jpeg", ".jpg" },
                VerintBookingReferenceId = "K000000",
                VerintCaseLanguage = "en-GB",
                VerintCaseSummary = "{About} for booking {BookingReference}",
                VerintCaseNotes = "# SUMMARY #\r\nBooking Reference: {BookingReference}\r\nDepartureAndReturnDate: {DepartureAndReturnDate}\r\nQuestion: {Question}\r\nContactNumber: {ContactNumber}",
                RequestFormAttachmentMaxSizeOfAllFiles = 21321321,
                RequestFormEnableRecaptcha = false
            };

            _loggerMock = new Mock<ILogger<VerintService>>();

            _sut = new VerintService(
                _apiServiceMock.Object,
                Options.Create(_verintApiSettings),
                Options.Create(_contactUsSettings),
                _loggerMock.Object
            );
        }

        [Theory]
        [MemberData(nameof(VerintServiceTestsData.VerintServiceTestRequestData), MemberType = typeof(VerintServiceTestsData))]
        public async Task CreateCaseWithAttachmentTest(string because, ContactFormRequest contactFormRequest,
            CreateCaseResponse createCaseResponse, CreateAttachmentResponse createAttachmentResponse,
            bool throwsExceptionOnAssociateCase, ContactUsResult expectedResult)
        {
            // Arrange
            _apiServiceMock.Setup(i =>
                    i.GetResponseContentAsync<CreateCaseRequest, CreateCaseResponse>(It.IsAny<CreateCaseRequest>()))
                .ReturnsAsync(createCaseResponse);

            _apiServiceMock.Setup(i =>
                    i.GetResponseContentAsync<CreateAttachmentRequest, CreateAttachmentResponse>(It.IsAny<CreateAttachmentRequest>()))
                .ReturnsAsync(createAttachmentResponse);

            if (!throwsExceptionOnAssociateCase)
            {
                var associateCaseAttachmentResponse = new AssociateCaseAttachmentResponse();
                _apiServiceMock.Setup(i =>
                        i.GetResponseContentAsync<AssociateCaseAttachmentRequest, AssociateCaseAttachmentResponse>(
                            It.IsAny<AssociateCaseAttachmentRequest>()))
                    .ReturnsAsync(associateCaseAttachmentResponse);
            }
            else
            {
                _apiServiceMock.Setup(i =>
                        i.GetResponseContentAsync<AssociateCaseAttachmentRequest, AssociateCaseAttachmentResponse>(
                            It.IsAny<AssociateCaseAttachmentRequest>()))
                    .ThrowsAsync(new BadHttpRequestException("Bad Request"));
            }

            // Act
            var result = await _sut.CreateCase(contactFormRequest, "easyJetHoldaysCapeTown");

            // Assert
            result.Should().Be(expectedResult, because);
        }
    }

    public class VerintServiceTestsData
    {
        public static IEnumerable<object[]> VerintServiceTestRequestData()
        {
            yield return new object[] {
                "No attachments",
                GetContactFormRequest(null),
                new CreateCaseResponse()
                {
                    Payload =
                    {
                        Body = new CreateCaseResponseBody { CaseId = 12345 }
                    }
                },
                new CreateAttachmentResponse { Payload = { Body = new CreateAttachmentResponseBody { Identifier = "1234567890" }}},
                false,
                new ContactUsResult { IsSuccessful = true, CaseNumber = "12345" }
            };

            yield return new object[] {
                "No attachments create case fails",
                GetContactFormRequest(null),
                new CreateCaseResponse()
                {
                },
                new CreateAttachmentResponse { Payload = { Body = new CreateAttachmentResponseBody { Identifier = "1234567890" }}},
                false,
                new ContactUsResult { IsSuccessful = false }
            };

            yield return new object[] {
                "With attachments",
                GetContactFormRequest(new FormFileCollection() { GetTestFormFile("test" , "test.txt"), GetTestFormFile("test", "test2.txt")}),
                new CreateCaseResponse()
                {
                    Payload =
                    {
                        Body = new CreateCaseResponseBody { CaseId = 12345 }
                    }
                },
                new CreateAttachmentResponse { Payload = { Body = new CreateAttachmentResponseBody { Identifier = "1234567890" }}},
                false,
                new ContactUsResult { IsSuccessful = true, CaseNumber = "12345" }
            };

            yield return new object[] {
                "With attachments upload attachment returns null",
                GetContactFormRequest(new FormFileCollection() { GetTestFormFile("test" , "test.txt")}),
                new CreateCaseResponse()
                {
                    Payload =
                    {
                        Body = new CreateCaseResponseBody {CaseId = 12345, ReturnCode = "12345", ReturnMessage = "Test Message"},
                    }
                },
                new CreateAttachmentResponse { Payload = { Body = new CreateAttachmentResponseBody { Identifier = null }}},
                true,
                new ContactUsResult { IsSuccessful = false }
            };

            yield return new object[] {
                "With attachments upload attachment fails",
                GetContactFormRequest(new FormFileCollection() { GetTestFormFile("test" , "test.txt"), GetTestFormFile("test", "test2.txt")}),
                new CreateCaseResponse()
                {
                    Payload =
                    {
                        Body = new CreateCaseResponseBody {CaseId = 12345}
                    }
                },
                new CreateAttachmentResponse {  },
                true,
                new ContactUsResult { IsSuccessful = false }
            };

            yield return new object[] {
                "With attachments associate attachment fails",
                GetContactFormRequest(new FormFileCollection() { GetTestFormFile("test" , "test.txt"), GetTestFormFile("test", "test2.txt")}),
                new CreateCaseResponse()
                {
                    Payload =
                    {
                        Body = new CreateCaseResponseBody {CaseId = 12345}
                    }
                },
                new CreateAttachmentResponse { Payload = { Body = new CreateAttachmentResponseBody { Identifier = "1234567890" }}},
                true,
                new ContactUsResult { IsSuccessful = false }
            };
        }

        private static ContactFormRequest GetContactFormRequest(IFormFileCollection formFileCollection)
        {
            return new ContactFormRequest
            {
                BookingReference = "23234211",
                About = "TestAbout",
                ContactNumber = "0123456789",
                DepartureAndReturnDate = "TestDepartureAndReturnDate",
                EmailAddress = "test@test-neveling.net",
                LeadPassengerFirstName = "Test",
                LeadPassengerLastName = "Tester",
                Question = "TestQuestion",
                Attachments = formFileCollection
            };
        }

        private static FormFile GetTestFormFile(string name, string fileName)
        {
            var content = "Fake File";
            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            writer.Write(content);
            writer.Flush();
            stream.Position = 0;

            var formFile = new FormFile(stream, 0, stream.Length, name, fileName)
            {
                Headers = new HeaderDictionary(new Dictionary<string, StringValues>() { { HeaderNames.ContentType, "text/plain" } })
            };
            return formFile;
        }
    }
}
