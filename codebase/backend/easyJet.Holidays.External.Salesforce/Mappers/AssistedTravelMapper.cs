using easyJet.Holidays.Api.Domain.Data.AssistedTravel;
using easyJet.Holidays.External.Salesforce.Models;
using easyJet.Holidays.External.Salesforce.Models.AssistedTravel;
using Newtonsoft.Json.Linq;
using System.Net;

namespace easyJet.Holidays.External.Salesforce.Mappers;

internal static class AssistedTravelMapper
{
    private const string ApiVersionSegment = "/services/data/";
    private const string CompositeSegment = "/composite";
    private const string AssistedTravelNamedQueryPath = "/named/query/getAssistedTravelPax";
    private const string CaseReferenceId = "refCaseId";
    private const string QuestionsReferenceId = "refAssistedTravelRecords";
    private const string Version = "v65.0";

    internal static Uri ToSalesforceAssistedTravelRequest(string dataEndpoint, string bookingReference)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dataEndpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(bookingReference);

        var encodedBookingReference = Uri.EscapeDataString(bookingReference.Trim());
        return new Uri($"{GetSalesforceDataRoot(dataEndpoint)}{AssistedTravelNamedQueryPath}?BookingRef={encodedBookingReference}");
    }

    internal static AssistedTravelResult ToAssistedTravelResult(SalesforceAssistedTravelResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        var payload = response.Payload?.Body;
        if (payload is null || payload.Records.Count == 0)
        {
            return new AssistedTravelResult
            {
                IsSuccessful = true,
                Passengers = new List<AssistedTravelPassengerResult>()
            };
        }

        var firstRecord = payload.Records[0];
        var questionnaires = firstRecord.IncidentQuestionnaires;
        var partialErrors = new List<string>();

        if (!payload.Done)
        {
            partialErrors.Add("Salesforce case retrieval was incomplete.");
        }

        if (questionnaires is null)
        {
            partialErrors.Add("Salesforce response did not include questionnaire records.");
        }
        else if (!questionnaires.Done)
        {
            partialErrors.Add("Salesforce questionnaire retrieval was incomplete.");
        }

        var passengers = (questionnaires?.Records ?? Enumerable.Empty<SalesforceIncidentQuestionnaireRecord>())
            .Where(x => !string.IsNullOrWhiteSpace(x.PassengerName))
            .GroupBy(x => x.PassengerName!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var orderedRows = group
                    .OrderBy(x => x.Sequence ?? int.MaxValue)
                    .ThenBy(x => x.CreatedDate ?? DateTimeOffset.MaxValue)
                    .ToList();

                return new AssistedTravelPassengerResult
                {
                    PassengerName = group.First().PassengerName!.Trim(),
                    QuestionsAndAnswers = orderedRows
                        .Where(x => !string.IsNullOrWhiteSpace(x.Question) || !string.IsNullOrWhiteSpace(x.Answer))
                        .Select(x => new AssistedTravelQuestionAnswerResult
                        {
                            Question = x.Question?.Trim() ?? string.Empty,
                            Answer = x.Answer?.Trim() ?? string.Empty,
                            RequestedAt = x.CreatedDate
                        })
                        .ToList(),
                    AssistanceTypes = group
                        .SelectMany(x => SplitAssistanceTypes(x.Answer))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(x => x, StringComparer.OrdinalIgnoreCase)
                        .ToList(),
                    RequestedAt = orderedRows
                        .Select(x => x.CreatedDate)
                        .Where(x => x.HasValue)
                        .OrderBy(x => x)
                        .FirstOrDefault()
                };
            })
            .OrderBy(x => x.PassengerName, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var requestedAt = firstRecord.CreatedDate;
        if (requestedAt is null)
        {
            requestedAt = (questionnaires?.Records ?? Enumerable.Empty<SalesforceIncidentQuestionnaireRecord>())
                .Select(x => x.CreatedDate)
                .Where(x => x.HasValue)
                .OrderBy(x => x)
                .FirstOrDefault();
        }

        if (questionnaires is not null)
        {
            var missingPassengerNames = questionnaires.Records.Any(x => string.IsNullOrWhiteSpace(x.PassengerName));
            if (missingPassengerNames)
            {
                partialErrors.Add("One or more Salesforce questionnaire records were missing passenger names.");
            }
        }

        return new AssistedTravelResult
        {
            IsSuccessful = partialErrors.Count == 0,
            ErrorMessage = partialErrors.Count > 0 ? string.Join(" ", partialErrors) : null,
            RequestedAt = requestedAt,
            CaseId = firstRecord.Id,
            BookingReference = firstRecord.BookingReference?.Name,
            Passengers = passengers
        };
    }

    internal static SalesforceCompositeRequestBody ToSalesforceAssistedTravelSubmissionRequest(
        string bookingReference,
        string? existingCaseId,
        AssistedTravelSubmissionRequest request)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(bookingReference);
        ArgumentNullException.ThrowIfNull(request);

        var requests = new List<SalesforceRequestBase>();
        
        var isNewCaseRequest = string.IsNullOrWhiteSpace(existingCaseId);

        if (isNewCaseRequest)
        {
            requests.Add(new SalesforcePostRequest<AssistedTravelCaseBody>
            {
                ReferenceId = CaseReferenceId,
                Url = new Uri($"/services/data/{Version}/sobjects/Case", UriKind.Relative),
                Body = new AssistedTravelCaseBody
                {
                    BookingReference = new AssistedTravelBookingLookup { Name = bookingReference },
                    Description = string.IsNullOrWhiteSpace(request.Description)
                        ? "Assisted travel request"
                        : request.Description.Trim()
                }
            });
        }
        
        var caseIdRef = isNewCaseRequest
            ? $"@{{{CaseReferenceId}.id}}"
            : existingCaseId!.Trim();

        requests.Add(new SalesforcePostRequest<AssistedTravelQuestionnaireBatchBody>
        {
            ReferenceId = QuestionsReferenceId,
            Url = new Uri($"/services/data/{Version}/composite/sobjects", UriKind.Relative),
            Body = new AssistedTravelQuestionnaireBatchBody
            {
                Records = BuildQuestionnaireRecords(bookingReference, caseIdRef, request.Passengers, isNewCaseRequest)
            }
        });

        var compositeRequest  =new SalesforceCompositeRequestBody
        {
            AllOrNone = true,
            CollateSubrequests = false,
            Requests = requests
        };
        return compositeRequest;
    }

    internal static AssistedTravelSubmissionResult ToAssistedTravelSubmissionResult(
        SalesforceCompositeResponse response,
        string? existingCaseId)
    {
        ArgumentNullException.ThrowIfNull(response);

        var responses = response.Payload?.Body?.Responses;
        if (responses is null || responses.Count == 0)
        {
            return new AssistedTravelSubmissionResult
            {
                IsSuccessful = false,
                ErrorMessage = "Salesforce submission response was empty."
            };
        }

        var caseResponse = responses.FirstOrDefault(x => x.ReferenceId == CaseReferenceId);
        var questionResponse = responses.FirstOrDefault(x => x.ReferenceId == QuestionsReferenceId);

        var isStatusSuccessful = responses.All(x =>
            x.StatusCode == HttpStatusCode.OK || x.StatusCode == HttpStatusCode.Created);

        var caseId = !string.IsNullOrWhiteSpace(existingCaseId)
            ? existingCaseId
            : ExtractCaseId(caseResponse?.Body);

        var submittedQuestionsCount = CountSubmittedQuestions(questionResponse?.Body);
        var allQuestionsSuccessful = AreAllQuestionRecordsSuccessful(questionResponse?.Body);

        var isSuccessful = isStatusSuccessful && allQuestionsSuccessful && !string.IsNullOrWhiteSpace(caseId);

        return new AssistedTravelSubmissionResult
        {
            IsSuccessful = isSuccessful,
            CaseId = caseId,
            SubmittedQuestionsCount = submittedQuestionsCount,
            ErrorMessage = isSuccessful ? null : response.PayloadString
        };
    }

    private static IEnumerable<string> SplitAssistanceTypes(string? answer)
    {
        if (string.IsNullOrWhiteSpace(answer))
        {
            return Enumerable.Empty<string>();
        }

        return answer
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => !string.IsNullOrWhiteSpace(x));
    }

    private static string GetSalesforceDataRoot(string dataEndpoint)
    {
        var dataRoot = dataEndpoint.TrimEnd('/');
        var compositeIndex = dataRoot.IndexOf(CompositeSegment, StringComparison.OrdinalIgnoreCase);
        if (compositeIndex >= 0)
        {
            dataRoot = dataRoot[..compositeIndex];
        }

        var apiVersionIndex = dataRoot.IndexOf(ApiVersionSegment, StringComparison.OrdinalIgnoreCase);
        if (apiVersionIndex < 0)
        {
            throw new ArgumentException("Salesforce data endpoint must contain a /services/data/ segment.", nameof(dataEndpoint));
        }

        return dataRoot;
    }

    private static IReadOnlyList<AssistedTravelQuestionnaireRecord> BuildQuestionnaireRecords(
        string bookingReference,
        string caseIdRef,
        IReadOnlyList<AssistedTravelPassengerSubmission> passengers,
        bool includeRelatedBooking)
    {
        var questionnaireEntries = passengers
            .Where(x => !string.IsNullOrWhiteSpace(x.PassengerName))
            .SelectMany(
                passenger => passenger.QuestionsAndAnswers,
                (passenger, qa) => new { passenger, qa });

        return questionnaireEntries
            .Select((entry, index) => new AssistedTravelQuestionnaireRecord
            {
                PassengerName = entry.passenger.PassengerName.Trim(),
                Question = entry.qa.Question.Trim(),
                QuestionCode = entry.qa.QuestionCode.Trim(),
                Answer = entry.qa.Answer.Trim(),
                Sequence = index + 1,
                CaseId = caseIdRef,
                RelatedBooking = includeRelatedBooking
                    ? new AssistedTravelBookingLookup { Name = bookingReference }
                    : null
            })
            .ToList();
    }

    private static string? ExtractCaseId(dynamic? caseBody)
    {
        if (caseBody is not JObject caseObj)
        {
            return null;
        }

        return caseObj["id"]?.Value<string>();
    }

    private static int CountSubmittedQuestions(dynamic? questionBody)
    {
        if (questionBody is not JArray array)
        {
            return 0;
        }

        return array.Count(x => x["success"]?.Value<bool>() == true);
    }

    private static bool AreAllQuestionRecordsSuccessful(dynamic? questionBody)
    {
        if (questionBody is not JArray array || array.Count == 0)
        {
            return false;
        }

        return array.All(x => x["success"]?.Value<bool>() == true);
    }

}

