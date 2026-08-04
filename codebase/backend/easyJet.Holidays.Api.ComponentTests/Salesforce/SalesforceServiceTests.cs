using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.AssistedTravel;
using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Salesforce.Api;
using easyJet.Holidays.External.Salesforce.Services;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using System.Linq;
using System.Net;
using System.Text;
using Xunit;

namespace easyJet.Holidays.Api.ComponentTests.Salesforce;

public class SalesforceServiceTests
{
    private readonly Mock<SalesforceApiClient> salesforceApiClient;
    private readonly SalesforceApiSettings settings;
    private readonly SalesforceService salesforceService;

    public SalesforceServiceTests()
    {
        var fixture = FixtureUtils.AutoMoqFixture();
        salesforceApiClient = fixture.Freeze<Mock<SalesforceApiClient>>();
        var salesforceApiService = new SalesforceApiService(salesforceApiClient.Object);

        settings = new SalesforceApiSettings
        {
            DataEndpoint = "https://easyjetholidays--dev1.sandbox.my.salesforce.com/services/data/v56.0/composite",
            LanguageMap = new Dictionary<string, string>
            {
                { "en", "EN_EN" }
            }
        };

        salesforceService = new SalesforceService(salesforceApiService, Options.Create<SalesforceApiSettings>(settings), Mock.Of<Microsoft.Extensions.Logging.ILogger<SalesforceService>>());
    }

    [Fact]
    public async Task ContactUsForm_WhenNoFilesAttachedAndSuccessfulResponseReturned_ReturnsTrue()
    {
        // Arrange
        var contactUsForm = new ContactFormRequest()
        {
            About = "Airport",
            BookingReference = "70147648",
            DepartureAndReturnDate = "test",
            EmailAddress = "test@test.test",
            LeadPassengerFirstName = "test",
            LeadPassengerLastName = "test",
            Question = "test",
            IsPastHoliday = false
        };

        var requestJsonPath = Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Salesforce", "request_without_files.json");
        var requestJson = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(requestJsonPath));

        var responseJsonPath = Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Salesforce", "response_without_files_success.json");
        var responseJson = await File.ReadAllTextAsync(responseJsonPath);

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Post, It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint), requestJson, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var res = await salesforceService.SendContacUsFormRequest(contactUsForm, "Airport", "en");

        // Assert
        res.IsSuccessful.Should().BeTrue();
        res.CaseNumber.Should().Be("00008791");
    }

    [Fact]
    public async Task ContactUsForm_WhenFileAttachedAndSuccessfulResponseReturned_ReturnsTrue()
    {
        var base64FileContent = "Qk1GAAAAAAAAADYAAAAoAAAAAgAAAAIAAAABABgAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAApEmjpEmjAACkSaOkSaMAAA==";
        var fileContent = Convert.FromBase64String(base64FileContent);
        var memoryStream = new MemoryStream();
        await memoryStream.WriteAsync(fileContent);
        memoryStream.Position = 0;

        // Arrange
        var contactUsForm = new ContactFormRequest()
        {
            About = "Airport",
            Attachments = new FormFileCollection
            {
                new FormFile(memoryStream, 0, memoryStream.Length, "purple.bmp", "purple.bmp")
            },
            BookingReference = "70147648",
            DepartureAndReturnDate = "test",
            EmailAddress = "test@test.test",
            LeadPassengerFirstName = "test",
            LeadPassengerLastName = "test",
            Question = "test",
            IsPastHoliday = false
        };

        var requestJsonPath = Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Salesforce", "request_with_file.json");
        var requestJson = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(requestJsonPath));

        var responseJsonPath = Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Salesforce", "response_with_file_success.json");
        var responseJson = await File.ReadAllTextAsync(responseJsonPath);

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Post, It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint), requestJson, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var res = await salesforceService.SendContacUsFormRequest(contactUsForm, "Airport", "en");

        // Assert
        res.IsSuccessful.Should().BeTrue();
        res.CaseNumber.Should().Be("00013765");
    }

    [Fact]
    public async Task ContactUsForm_WhenResponseHasErrors_ExceptionIsThrown()
    {
        // Arrange
        var contactUsForm = new ContactFormRequest()
        {
            About = "Airport",
            BookingReference = "70147648",
            DepartureAndReturnDate = "test",
            EmailAddress = "test@test.test",
            LeadPassengerFirstName = "test",
            LeadPassengerLastName = "test",
            Question = "test",
        };

        var requestJsonPath = Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Salesforce", "request_without_files.json");
        var requestJson = ObjectUtils.MinifyJson(await File.ReadAllTextAsync(requestJsonPath));

        var responseJsonPath = Path.Combine(Directory.GetCurrentDirectory(), "__admin", "files", "Salesforce", "response_without_files_error.json");
        var responseJson = await File.ReadAllTextAsync(responseJsonPath);

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Post, It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint), requestJson, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var func = async () => await salesforceService.SendContacUsFormRequest(contactUsForm, "Airport", "en");

        // Assert
        await func.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task GetAssistedTravelRequests_WhenSalesforceReturnsCaseData_ReturnsPassengerLevelResponse()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);
        var responseJson = """
        {
          "totalSize": 1,
          "done": true,
          "records": [
            {
              "Id": "500Pv00000RBPrlIAH",
              "CreatedDate": "2026-03-11T14:33:25.000+0000",
              "Booking_Ref__r": {
                "Name": "3625362"
              },
              "Incident_Questionnaires__r": {
                "totalSize": 4,
                "done": true,
                "records": [
                  {
                    "Passenger_Name__c": "Qjglq Nmsbbm Vhbhf",
                    "Question__c": "Which type of assistance do you require?",
                    "CreatedDate": "2026-03-11T14:33:26.000+0000",
                    "Seq__c": 1,
                    "Answer__c": "Mobility assistance;Deaf or hard of hearing"
                  },
                  {
                    "Passenger_Name__c": "Sqlpf Artiby Saajf Dblctqxl",
                    "Question__c": "Which type of assistance do you require?",
                    "CreatedDate": "2026-03-11T14:33:26.000+0000",
                    "Seq__c": 1,
                    "Answer__c": "Mobility assistance"
                  },
                  {
                    "Passenger_Name__c": "Qjglq Nmsbbm Vhbhf",
                    "Question__c": "Do you need any additional support?",
                    "CreatedDate": "2026-03-11T14:33:27.000+0000",
                    "Seq__c": 2,
                    "Answer__c": "Mobility assistance;Non-visible disability"
                  },
                  {
                    "Passenger_Name__c": "Xqgdgd Wqnb Wfumcul",
                    "Question__c": "Which type of assistance do you require?",
                    "CreatedDate": "2026-03-11T14:33:26.000+0000",
                    "Seq__c": 1,
                    "Answer__c": "Mobility assistance"
                  }
                ]
              }
            }
          ]
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var result = await salesforceService.GetAssistedTravelRequests(bookingReference);

        // Assert
        result.IsSuccessful.Should().BeTrue();
        result.RequestedAt.Should().Be(DateTimeOffset.Parse("2026-03-11T14:33:25+00:00"));
        result.CaseId.Should().Be("500Pv00000RBPrlIAH");
        result.BookingReference.Should().Be(bookingReference);
        result.Passengers.Should().HaveCount(3);
        result.Passengers.Should().ContainSingle(x => x.PassengerName == "Qjglq Nmsbbm Vhbhf" && x.AssistanceTypes.Count == 3);
        result.Passengers.Should().ContainSingle(x =>
            x.PassengerName == "Qjglq Nmsbbm Vhbhf" &&
            x.QuestionsAndAnswers.Any(qa => qa.Question == "Which type of assistance do you require?"));
    }

    [Fact]
    public async Task GetAssistedTravelRequests_WhenSalesforceReturnsNoCases_ReturnsEmptyResponse()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);
        var responseJson = """
        {
          "totalSize": 0,
          "done": true,
          "records": []
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var result = await salesforceService.GetAssistedTravelRequests(bookingReference);

        // Assert
        result.IsSuccessful.Should().BeTrue();
        result.Passengers.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAssistedTravelRequests_WhenSalesforceReturnsIncompleteData_ReturnsPartialResponse()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);
        var responseJson = """
        {
          "totalSize": 1,
          "done": false,
          "records": [
            {
              "Id": "500Pv00000RBPrlIAH",
              "CreatedDate": "2026-03-11T14:33:25.000+0000",
              "Booking_Ref__r": {
                "Name": "3625362"
              },
              "Incident_Questionnaires__r": {
                "totalSize": 2,
                "done": false,
                "records": [
                  {
                    "Passenger_Name__c": "Passenger One",
                    "Question__c": "Which type of assistance do you require?",
                    "CreatedDate": "2026-03-11T14:33:26.000+0000",
                    "Seq__c": 1,
                    "Answer__c": "Mobility assistance"
                  },
                  {
                    "Passenger_Name__c": "",
                    "Question__c": "Do you need any additional support?",
                    "CreatedDate": "2026-03-11T14:33:27.000+0000",
                    "Seq__c": 2,
                    "Answer__c": "Deaf or hard of hearing"
                  }
                ]
              }
            }
          ]
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var result = await salesforceService.GetAssistedTravelRequests(bookingReference);

        // Assert
        result.IsSuccessful.Should().BeFalse();
        result.ErrorMessage.Should().NotBeNullOrWhiteSpace();
        result.Passengers.Should().ContainSingle(x => x.PassengerName == "Passenger One");
    }

    [Fact]
    public async Task GetAssistedTravelRequests_WhenSalesforceCallFails_ThrowsException()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedEndpoint.AbsoluteUri), null, null, null))
            .ThrowsAsync(new HttpRequestException("Salesforce unavailable", null, HttpStatusCode.ServiceUnavailable));

        // Act
        var action = async () => await salesforceService.GetAssistedTravelRequests(bookingReference);

        // Assert
        await action.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task GetAssistedTravelRequests_WhenBookingReferenceIsWhitespace_ThrowsArgumentException()
    {
        // Act
        var action = async () => await salesforceService.GetAssistedTravelRequests(" ");

        // Assert
        await action.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_WhenNoExistingCaseIsFound_CreatesCaseAndQuestionnaireRecords()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedGetEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);
        var request = new AssistedTravelSubmissionRequest
        {
            Description = "Need airport assistance",
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Which type of assistance do you require?",
                            Answer = "Mobility assistance"
                        }
                    ]
                }
            ]
        };

        var responseJson = """
        {
          "compositeResponse": [
            {
              "body": {
                "id": "500Pv00000RYKpbIAH",
                "success": true,
                "errors": []
              },
              "httpHeaders": {
                "Location": "/services/data/v65.0/sobjects/Case/500Pv00000RYKpbIAH"
              },
              "httpStatusCode": 201,
              "referenceId": "refCaseId"
            },
            {
              "body": [
                {
                  "id": "a0nPv000003SUuHIAW",
                  "success": true,
                  "errors": []
                }
              ],
              "httpHeaders": {},
              "httpStatusCode": 200,
              "referenceId": "refAssistedTravelRecords"
            }
          ]
        }
        """;

        var getResponseJson = """
        {
          "totalSize": 0,
          "done": true,
          "records": []
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedGetEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(getResponseJson)));

        salesforceApiClient
            .Setup(x => x.MakeCall(
                HttpMethod.Post,
                It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint),
                It.Is<string>(payload =>
                    payload.Contains("\"referenceId\":\"refCaseId\"")
                    && payload.Contains("\"referenceId\":\"refAssistedTravelRecords\"")),
                null,
                null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var result = await salesforceService.SubmitAssistedTravelRequests(bookingReference, request);

        // Assert
        result.IsSuccessful.Should().BeTrue();
        result.CaseId.Should().Be("500Pv00000RYKpbIAH");
        result.SubmittedQuestionsCount.Should().Be(1);
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_WhenExistingCaseIsFound_SubmitsOnlyQuestionnaireRecords()
    {
        // Arrange
        const string bookingReference = "3625362";
        const string existingCaseId = "500Pv00000RBPrlIAH";
        var expectedGetEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);
        var request = new AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Do we have your permission to share this info?",
                            Answer = "Yes"
                        }
                    ]
                }
            ]
        };

        var responseJson = """
        {
          "compositeResponse": [
            {
              "body": [
                {
                  "id": "a0nPv000003SUuHIAW",
                  "success": true,
                  "errors": []
                }
              ],
              "httpHeaders": {},
              "httpStatusCode": 200,
              "referenceId": "refAssistedTravelRecords"
            }
          ]
        }
        """;

        var getResponseJson = """
        {
          "totalSize": 1,
          "done": true,
          "records": [
            {
              "Id": "500Pv00000RBPrlIAH",
              "Booking_Ref__r": {
                "Name": "3625362"
              },
              "Incident_Questionnaires__r": {
                "totalSize": 0,
                "done": true,
                "records": []
              }
            }
          ]
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedGetEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(getResponseJson)));

        salesforceApiClient
            .Setup(x => x.MakeCall(
                HttpMethod.Post,
                It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint),
                It.Is<string>(payload =>
                    !payload.Contains("\"referenceId\":\"refCaseId\"")
                    && payload.Contains("\"Case__c\":\"500Pv00000RBPrlIAH\"")
                    && !payload.Contains("\"Related_Booking__r\"")),
                null,
                null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(responseJson)));

        // Act
        var result = await salesforceService.SubmitAssistedTravelRequests(bookingReference, request);

        // Assert
        result.IsSuccessful.Should().BeTrue();
        result.CaseId.Should().Be(existingCaseId);
        result.SubmittedQuestionsCount.Should().Be(1);
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_WhenBookingReferenceIsWhitespace_ThrowsArgumentException()
    {
        // Arrange
        var request = new AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        var action = async () => await salesforceService.SubmitAssistedTravelRequests(" ", request);

        // Assert
        await action.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_WhenRequestIsNull_ThrowsArgumentNullException()
    {
        // Act
        var action = async () => await salesforceService.SubmitAssistedTravelRequests("3625362", null!);

        // Assert
        await action.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_WhenSalesforceSubmissionContainsErrors_ThrowsInvalidOperationException()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedGetEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);

        var request = new AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        var getResponseJson = """
        {
          "totalSize": 1,
          "done": true,
          "records": [
            {
              "Id": "500Pv00000RBPrlIAH",
              "Booking_Ref__r": {
                "Name": "3625362"
              },
              "Incident_Questionnaires__r": {
                "totalSize": 0,
                "done": true,
                "records": []
              }
            }
          ]
        }
        """;

        var errorSubmissionJson = """
        {
          "compositeResponse": [
            {
              "body": [
                {
                  "id": "a0nPv000003SUuHIAW",
                  "success": false,
                  "errors": ["validation failed"]
                }
              ],
              "httpHeaders": {},
              "httpStatusCode": 400,
              "referenceId": "refAssistedTravelRecords"
            }
          ]
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedGetEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(getResponseJson)));

        salesforceApiClient
            .Setup(x => x.MakeCall(
                HttpMethod.Post,
                It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint),
                It.IsAny<string>(),
                null,
                null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(errorSubmissionJson)));

        // Act
        var action = async () => await salesforceService.SubmitAssistedTravelRequests(bookingReference, request);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Salesforce Assisted Travel submission failed:*");
    }

    [Fact]
    public async Task SubmitAssistedTravelRequests_WhenNewCaseResponseHasNoCaseId_ThrowsInvalidOperationException()
    {
        // Arrange
        const string bookingReference = "3625362";
        var expectedGetEndpoint = BuildAssistedTravelEndpoint(settings.DataEndpoint, bookingReference);

        var request = new AssistedTravelSubmissionRequest
        {
            Description = "Need airport assistance",
            Passengers =
            [
                new AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        var getResponseJson = """
        {
          "totalSize": 0,
          "done": true,
          "records": []
        }
        """;

        var submissionWithoutCaseIdJson = """
        {
          "compositeResponse": [
            {
              "body": {
                "success": true,
                "errors": []
              },
              "httpHeaders": {},
              "httpStatusCode": 201,
              "referenceId": "refCaseId"
            },
            {
              "body": [
                {
                  "id": "a0nPv000003SUuHIAW",
                  "success": true,
                  "errors": []
                }
              ],
              "httpHeaders": {},
              "httpStatusCode": 200,
              "referenceId": "refAssistedTravelRecords"
            }
          ]
        }
        """;

        salesforceApiClient
            .Setup(x => x.MakeCall(HttpMethod.Get, It.Is<Uri>(uri => uri.AbsoluteUri == expectedGetEndpoint.AbsoluteUri), null, null, null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(getResponseJson)));

        salesforceApiClient
            .Setup(x => x.MakeCall(
                HttpMethod.Post,
                It.Is<Uri>(uri => uri.AbsoluteUri == settings.DataEndpoint),
                It.IsAny<string>(),
                null,
                null))
            .ReturnsAsync(new MemoryStream(Encoding.UTF8.GetBytes(submissionWithoutCaseIdJson)));

        // Act
        var action = async () => await salesforceService.SubmitAssistedTravelRequests(bookingReference, request);

        // Assert
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Salesforce Assisted Travel submission failed:*");
    }

    private static Uri BuildAssistedTravelEndpoint(string dataEndpoint, string bookingReference)
    {
        var dataRoot = dataEndpoint.Replace("/composite", string.Empty, StringComparison.OrdinalIgnoreCase);
        return new Uri($"{dataRoot}/named/query/getAssistedTravelPax?BookingRef={Uri.EscapeDataString(bookingReference)}");
    }
}
