using easyJet.Holidays.External.Salesforce.Mappers;
using easyJet.Holidays.External.Salesforce.Models;
using easyJet.Holidays.External.Salesforce.Models.AssistedTravel;
using FluentAssertions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Globalization;
using System.Net;

namespace easyJet.Holidays.External.Salesforce.Tests.Mappers;

public class AssistedTravelMapperTests
{
    [Fact]
    public void ToSalesforceAssistedTravelSubmissionRequest_WhenExistingCaseIdMissing_ShouldIncludeCaseAndQuestionRequests()
    {
        // Arrange
        var request = new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            QuestionCode = "AT-001",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        var result = AssistedTravelMapper.ToSalesforceAssistedTravelSubmissionRequest("3625362", null, request);

        // Assert
        result.Requests.Should().HaveCount(2);
        result.Requests[0].Should().BeOfType<SalesforcePostRequest<AssistedTravelCaseBody>>();
        result.Requests[1].Should().BeOfType<SalesforcePostRequest<AssistedTravelQuestionnaireBatchBody>>();

        var payload = JsonConvert.SerializeObject(result, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
        payload.Should().Contain("\"Related_Booking__r\"");
        payload.Should().Contain("\"Question_Code__c\":\"AT-001\"");
    }

    [Fact]
    public void ToSalesforceAssistedTravelSubmissionRequest_WhenExistingCaseIdProvided_ShouldOnlyIncludeQuestionRequest()
    {
        // Arrange
        var request = new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            QuestionCode = "AT-002",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        var result = AssistedTravelMapper.ToSalesforceAssistedTravelSubmissionRequest("3625362", "500Pv00000RBPrlIAH", request);

        // Assert
        result.Requests.Should().HaveCount(1);
        result.Requests[0].Should().BeOfType<SalesforcePostRequest<AssistedTravelQuestionnaireBatchBody>>();

        var payload = JsonConvert.SerializeObject(result, new JsonSerializerSettings { NullValueHandling = NullValueHandling.Ignore });
        payload.Should().NotContain("\"Related_Booking__r\"");
        payload.Should().Contain("\"Question_Code__c\":\"AT-002\"");
    }

    [Fact]
    public void ToSalesforceAssistedTravelRequest_ShouldBuildQueryEndpointFromCompositeEndpoint()
    {
        // Act
        var result = AssistedTravelMapper.ToSalesforceAssistedTravelRequest(
            "https://example.my.salesforce.com/services/data/v56.0/composite",
            "ABC'123");

        // Assert
        result.AbsoluteUri.Should().Be("https://example.my.salesforce.com/services/data/v56.0/named/query/getAssistedTravelPax?BookingRef=ABC%27123");
    }

    [Fact]
    public void ToAssistedTravelResult_ShouldReturnDeduplicatedPassengerAssistanceTypes()
    {
        // Arrange
        var caseCreatedAt = DateTimeOffset.Parse("2026-03-11T14:33:25+00:00", CultureInfo.InvariantCulture);
        var questionCreatedAt1 = DateTimeOffset.Parse("2026-03-11T14:33:26+00:00", CultureInfo.InvariantCulture);
        var questionCreatedAt2 = DateTimeOffset.Parse("2026-03-11T14:33:27+00:00", CultureInfo.InvariantCulture);
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = true,
                    TotalSize = 1,
                    Records =
                    [
                        new SalesforceAssistedTravelCaseRecord
                        {
                            Id = "500Pv00000RBPrlIAH",
                            CreatedDate = caseCreatedAt,
                            BookingReference = new SalesforceBookingReference { Name = "3625362" },
                            IncidentQuestionnaires = new SalesforceIncidentQuestionnaireGroup
                            {
                                Done = true,
                                TotalSize = 4,
                                Records =
                                [
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Qjglq Nmsbbm Vhbhf", Question = "Which assistance do you require?", Answer = "Mobility assistance;Deaf or hard of hearing", Sequence = 1, CreatedDate = questionCreatedAt1 },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Qjglq Nmsbbm Vhbhf", Question = "Any other support needed?", Answer = "Mobility assistance;Non-visible disability", Sequence = 2, CreatedDate = questionCreatedAt2 },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Sqlpf Artiby Saajf Dblctqxl", Question = "Which assistance do you require?", Answer = "Mobility assistance", Sequence = 1, CreatedDate = questionCreatedAt1 },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Sqlpf Artiby Saajf Dblctqxl", Question = "Any other support needed?", Answer = "Mobility assistance", Sequence = 2, CreatedDate = questionCreatedAt2 }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.IsSuccessful.Should().BeTrue();
        result.RequestedAt.Should().Be(caseCreatedAt);
        result.CaseId.Should().Be("500Pv00000RBPrlIAH");
        result.BookingReference.Should().Be("3625362");
        result.Passengers.Should().HaveCount(2);
        result.Passengers[0].PassengerName.Should().Be("Qjglq Nmsbbm Vhbhf");
        result.Passengers[0].QuestionsAndAnswers.Should().HaveCount(2);
        result.Passengers[0].QuestionsAndAnswers[0].Question.Should().Be("Which assistance do you require?");
        result.Passengers[0].QuestionsAndAnswers[0].RequestedAt.Should().Be(questionCreatedAt1);
        result.Passengers[0].AssistanceTypes.Should().BeEquivalentTo(
            ["Deaf or hard of hearing", "Mobility assistance", "Non-visible disability"],
            options => options.WithStrictOrdering());
        result.Passengers[1].PassengerName.Should().Be("Sqlpf Artiby Saajf Dblctqxl");
        result.Passengers[1].QuestionsAndAnswers.Should().HaveCount(2);
        result.Passengers[1].AssistanceTypes.Should().BeEquivalentTo(["Mobility assistance"]);
    }

    [Fact]
    public void ToAssistedTravelResult_ShouldSetPassengerRequestedAtToEarliestQuestionnaireCreatedDate()
    {
        // Arrange
        var caseCreatedAt = DateTimeOffset.Parse("2026-03-11T14:33:25+00:00", CultureInfo.InvariantCulture);
        var earlierDate = DateTimeOffset.Parse("2026-03-11T14:33:26+00:00", CultureInfo.InvariantCulture);
        var laterDate = DateTimeOffset.Parse("2026-03-11T14:33:27+00:00", CultureInfo.InvariantCulture);
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = true,
                    TotalSize = 1,
                    Records =
                    [
                        new SalesforceAssistedTravelCaseRecord
                        {
                            Id = "500Pv00000RBPrlIAH",
                            CreatedDate = caseCreatedAt,
                            BookingReference = new SalesforceBookingReference { Name = "3625362" },
                            IncidentQuestionnaires = new SalesforceIncidentQuestionnaireGroup
                            {
                                Done = true,
                                TotalSize = 2,
                                Records =
                                [
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Jane Doe", Question = "Q1", Answer = "A1", Sequence = 1, CreatedDate = laterDate },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Jane Doe", Question = "Q2", Answer = "A2", Sequence = 2, CreatedDate = earlierDate }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.Passengers.Should().HaveCount(1);
        result.Passengers[0].RequestedAt.Should().Be(earlierDate);
    }

    [Fact]
    public void ToAssistedTravelResult_WhenAllQuestionnaireRecordsHaveNoCreatedDate_ShouldSetPassengerRequestedAtToNull()
    {
        // Arrange
        var caseCreatedAt = DateTimeOffset.Parse("2026-03-11T14:33:25+00:00", CultureInfo.InvariantCulture);
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = true,
                    TotalSize = 1,
                    Records =
                    [
                        new SalesforceAssistedTravelCaseRecord
                        {
                            Id = "500Pv00000RBPrlIAH",
                            CreatedDate = caseCreatedAt,
                            BookingReference = new SalesforceBookingReference { Name = "3625362" },
                            IncidentQuestionnaires = new SalesforceIncidentQuestionnaireGroup
                            {
                                Done = true,
                                TotalSize = 1,
                                Records =
                                [
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Jane Doe", Question = "Q1", Answer = "A1", Sequence = 1, CreatedDate = null }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.Passengers.Should().HaveCount(1);
        result.Passengers[0].RequestedAt.Should().BeNull();
    }

    [Fact]
    public void ToAssistedTravelResult_WhenMultiplePassengers_ShouldSetRequestedAtIndependentlyPerPassenger()
    {
        // Arrange
        var caseCreatedAt = DateTimeOffset.Parse("2026-03-11T14:33:25+00:00", CultureInfo.InvariantCulture);
        var passenger1Date = DateTimeOffset.Parse("2026-03-11T09:00:00+00:00", CultureInfo.InvariantCulture);
        var passenger2Date = DateTimeOffset.Parse("2026-03-12T10:00:00+00:00", CultureInfo.InvariantCulture);
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = true,
                    TotalSize = 1,
                    Records =
                    [
                        new SalesforceAssistedTravelCaseRecord
                        {
                            Id = "500Pv00000RBPrlIAH",
                            CreatedDate = caseCreatedAt,
                            BookingReference = new SalesforceBookingReference { Name = "3625362" },
                            IncidentQuestionnaires = new SalesforceIncidentQuestionnaireGroup
                            {
                                Done = true,
                                TotalSize = 2,
                                Records =
                                [
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Alice Smith", Question = "Q1", Answer = "A1", Sequence = 1, CreatedDate = passenger1Date },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Bob Jones", Question = "Q1", Answer = "A1", Sequence = 1, CreatedDate = passenger2Date }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.Passengers.Should().HaveCount(2);
        var alice = result.Passengers.Single(p => p.PassengerName == "Alice Smith");
        var bob = result.Passengers.Single(p => p.PassengerName == "Bob Jones");
        alice.RequestedAt.Should().Be(passenger1Date);
        bob.RequestedAt.Should().Be(passenger2Date);
    }

    [Fact]
    public void ToAssistedTravelResult_WhenNoRecordsExist_ShouldReturnSuccessfulEmptyResponse()
    {
        // Arrange
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = true,
                    TotalSize = 0,
                    Records = []
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.IsSuccessful.Should().BeTrue();
        result.Passengers.Should().BeEmpty();
    }

    [Fact]
    public void ToSalesforceAssistedTravelRequest_WhenEndpointMissingServicesData_ShouldThrowArgumentException()
    {
        // Act
        var action = () => AssistedTravelMapper.ToSalesforceAssistedTravelRequest(
            "https://example.my.salesforce.com/invalid-endpoint",
            "3625362");

        // Assert
        action.Should().Throw<ArgumentException>()
            .WithMessage("*services/data/*");
    }

    [Fact]
    public void ToSalesforceAssistedTravelSubmissionRequest_ShouldTrimValuesFilterEmptyPassengersAndIncrementSequence()
    {
        // Arrange
        var request = new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelSubmissionRequest
        {
            Description = "  Needs support at airport  ",
            Passengers =
            [
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = " Passenger One ",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "  Q1  ",
                            QuestionCode = "  AT-001  ",
                            Answer = "  A1  "
                        }
                    ]
                },
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = "   ",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "Should be ignored",
                            QuestionCode = "AT-999",
                            Answer = "Should be ignored"
                        }
                    ]
                },
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger Two",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "Q2",
                            QuestionCode = "AT-002",
                            Answer = "A2"
                        }
                    ]
                }
            ]
        };

        // Act
        var result = AssistedTravelMapper.ToSalesforceAssistedTravelSubmissionRequest("3625362", null, request);

        // Assert
        var caseRequest = result.Requests[0].Should().BeOfType<SalesforcePostRequest<AssistedTravelCaseBody>>().Subject;
        caseRequest.Body.Description.Should().Be("Needs support at airport");

        var questionnaireRequest = result.Requests[1].Should().BeOfType<SalesforcePostRequest<AssistedTravelQuestionnaireBatchBody>>().Subject;
        questionnaireRequest.Body.Records.Should().HaveCount(2);
        questionnaireRequest.Body.Records[0].PassengerName.Should().Be("Passenger One");
        questionnaireRequest.Body.Records[0].Question.Should().Be("Q1");
        questionnaireRequest.Body.Records[0].QuestionCode.Should().Be("AT-001");
        questionnaireRequest.Body.Records[0].Answer.Should().Be("A1");
        questionnaireRequest.Body.Records[0].Sequence.Should().Be(1);
        questionnaireRequest.Body.Records[1].PassengerName.Should().Be("Passenger Two");
        questionnaireRequest.Body.Records[1].QuestionCode.Should().Be("AT-002");
        questionnaireRequest.Body.Records[1].Sequence.Should().Be(2);
    }

    [Fact]
    public void ToAssistedTravelResult_WhenCaseCreatedDateMissing_ShouldFallbackRequestedAtFromQuestionnaireDates()
    {
        // Arrange
        var earlierDate = DateTimeOffset.Parse("2026-03-11T14:33:26+00:00", CultureInfo.InvariantCulture);
        var laterDate = DateTimeOffset.Parse("2026-03-11T14:33:27+00:00", CultureInfo.InvariantCulture);
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = true,
                    TotalSize = 1,
                    Records =
                    [
                        new SalesforceAssistedTravelCaseRecord
                        {
                            Id = "500Pv00000RBPrlIAH",
                            CreatedDate = null,
                            BookingReference = new SalesforceBookingReference { Name = "3625362" },
                            IncidentQuestionnaires = new SalesforceIncidentQuestionnaireGroup
                            {
                                Done = true,
                                TotalSize = 2,
                                Records =
                                [
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Jane Doe", Question = "Q1", Answer = "A1", Sequence = 1, CreatedDate = laterDate },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Jane Doe", Question = "Q2", Answer = "A2", Sequence = 2, CreatedDate = earlierDate }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.RequestedAt.Should().Be(earlierDate);
    }

    [Fact]
    public void ToAssistedTravelResult_WhenPayloadAndQuestionnairesArePartial_ShouldIncludeAllWarnings()
    {
        // Arrange
        var response = new SalesforceAssistedTravelResponse
        {
            Payload =
            {
                Body = new SalesforceAssistedTravelResponseBody
                {
                    Done = false,
                    TotalSize = 1,
                    Records =
                    [
                        new SalesforceAssistedTravelCaseRecord
                        {
                            Id = "500Pv00000RBPrlIAH",
                            BookingReference = new SalesforceBookingReference { Name = "3625362" },
                            IncidentQuestionnaires = new SalesforceIncidentQuestionnaireGroup
                            {
                                Done = false,
                                TotalSize = 2,
                                Records =
                                [
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = " ", Question = "Q0", Answer = "A0", Sequence = 1 },
                                    new SalesforceIncidentQuestionnaireRecord { PassengerName = "Jane Doe", Question = "Q1", Answer = "A1", Sequence = 2 }
                                ]
                            }
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelResult(response);

        // Assert
        result.IsSuccessful.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Salesforce case retrieval was incomplete.");
        result.ErrorMessage.Should().Contain("Salesforce questionnaire retrieval was incomplete.");
        result.ErrorMessage.Should().Contain("One or more Salesforce questionnaire records were missing passenger names.");
        result.Passengers.Should().HaveCount(1);
    }

    [Fact]
    public void ToSalesforceAssistedTravelSubmissionRequest_WhenExistingCaseIdHasWhitespace_ShouldTrimCaseIdOnQuestionRecords()
    {
        // Arrange
        var request = new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelSubmissionRequest
        {
            Passengers =
            [
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        var result = AssistedTravelMapper.ToSalesforceAssistedTravelSubmissionRequest("3625362", " 500Pv00000RBPrlIAH ", request);

        // Assert
        result.Requests.Should().HaveCount(1);
        var questionnaireRequest = result.Requests[0].Should().BeOfType<SalesforcePostRequest<AssistedTravelQuestionnaireBatchBody>>().Subject;
        questionnaireRequest.Body.Records.Should().HaveCount(1);
        questionnaireRequest.Body.Records[0].CaseId.Should().Be("500Pv00000RBPrlIAH");
        questionnaireRequest.Body.Records[0].RelatedBooking.Should().BeNull();
    }

    [Fact]
    public void ToSalesforceAssistedTravelSubmissionRequest_WhenDescriptionIsWhitespace_ShouldUseDefaultCaseDescription()
    {
        // Arrange
        var request = new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelSubmissionRequest
        {
            Description = "   ",
            Passengers =
            [
                new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelPassengerSubmission
                {
                    PassengerName = "Passenger One",
                    QuestionsAndAnswers =
                    [
                        new easyJet.Holidays.Api.Domain.Data.AssistedTravel.AssistedTravelQuestionAnswer
                        {
                            Question = "Q1",
                            Answer = "A1"
                        }
                    ]
                }
            ]
        };

        // Act
        var result = AssistedTravelMapper.ToSalesforceAssistedTravelSubmissionRequest("3625362", null, request);

        // Assert
        var caseRequest = result.Requests[0].Should().BeOfType<SalesforcePostRequest<AssistedTravelCaseBody>>().Subject;
        caseRequest.Body.Description.Should().Be("Assisted travel request");
    }

    [Fact]
    public void ToAssistedTravelSubmissionResult_WhenQuestionResponseIsMissing_ShouldBeUnsuccessfulWithZeroSubmittedQuestions()
    {
        // Arrange
        var response = new SalesforceCompositeResponse
        {
            Payload =
            {
                Body = new SalesforceCompositeResponseBody
                {
                    Responses =
                    [
                        new SalesforceResponse
                        {
                            StatusCode = HttpStatusCode.Created,
                            ReferenceId = "refCaseId",
                            Body = JObject.Parse("{\"id\":\"500Pv00000RYKpbIAH\"}")
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelSubmissionResult(response, null);

        // Assert
        result.IsSuccessful.Should().BeFalse();
        result.CaseId.Should().Be("500Pv00000RYKpbIAH");
        result.SubmittedQuestionsCount.Should().Be(0);
    }

    [Fact]
    public void ToAssistedTravelSubmissionResult_WhenCaseBodyIsNotAnObject_ShouldBeUnsuccessful()
    {
        // Arrange
        var response = new SalesforceCompositeResponse
        {
            Payload =
            {
                Body = new SalesforceCompositeResponseBody
                {
                    Responses =
                    [
                        new SalesforceResponse
                        {
                            StatusCode = HttpStatusCode.Created,
                            ReferenceId = "refCaseId",
                            Body = JArray.Parse("[]")
                        },
                        new SalesforceResponse
                        {
                            StatusCode = HttpStatusCode.OK,
                            ReferenceId = "refAssistedTravelRecords",
                            Body = JArray.Parse("[{\"id\":\"a0n1\",\"success\":true}]")
                        }
                    ]
                }
            }
        };

        // Act
        var result = AssistedTravelMapper.ToAssistedTravelSubmissionResult(response, null);

        // Assert
        result.IsSuccessful.Should().BeFalse();
        result.CaseId.Should().BeNull();
        result.SubmittedQuestionsCount.Should().Be(1);
    }
}
