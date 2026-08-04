using easyJet.Holidays.Api.Domain.Data.ContactUs;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Domain.Extensions;
using easyJet.Holidays.External.Salesforce.Models;
using easyJet.Holidays.External.Salesforce.Models.ContactUs;
using Newtonsoft.Json.Linq;
using System.Net;

namespace easyJet.Holidays.External.Salesforce.Mappers
{
    public static class ContactUsFormMapper
    {
        public static async Task<SalesforceCompositeRequestBody> ToSalesforceContactUsFormRequest(ContactFormRequest contactFormRequest, string caseCategory, string language)
        {
            ArgumentNullException.ThrowIfNull(contactFormRequest);

            var recordTypeName = contactFormRequest.IsPastHoliday ? "Standard" : "Pre_Travel";

            var getRecordTypeRequest = new SalesforceGetRequest
            {
                ReferenceId = "refRecordType",
                Url = new Uri($"/services/data/v56.0/query?q=SELECT+Id+FROM+RecordType+WHERE+SObjectType='Case'+AND+DeveloperName='{recordTypeName}'+LIMIT+1", UriKind.Relative)
            };

            var createCaseRequest = new SalesforcePostRequest<CaseBody>
            {
                Body = GetCaseBody(contactFormRequest, caseCategory, language),
                ReferenceId = "refCase",
                Url = new Uri("/services/data/v56.0/sobjects/Case", UriKind.Relative)
            };

            var getCaseNumberRequest = new SalesforceGetRequest
            {
                ReferenceId = "refCaseNoInfo",
                Url = new Uri("/services/data/v56.0/query?q=SELECT+CaseNumber+FROM+Case+where+Id=+'@{refCase.id}'+limit+1", UriKind.Relative)
            };

            var compositeRequestBody = new SalesforceCompositeRequestBody
            {
                AllOrNone = true,
                CollateSubrequests = false,
                Requests = new List<SalesforceRequestBase> { getRecordTypeRequest, createCaseRequest, getCaseNumberRequest }
            };

            if (contactFormRequest.Attachments.IsNullOrEmpty())
            {
                return compositeRequestBody;
            }

            var uploadFilesRequest = new SalesforcePostRequest<UploadsBody>
            {
                Body = await GetUploadsBody(contactFormRequest),
                ReferenceId = "filedatas",
                Url = new Uri("/services/data/v56.0/composite/sobjects", UriKind.Relative)
            };

            var fileDataIds = Enumerable.Range(0, contactFormRequest.Attachments.Count).Select(x => "@{filedatas[" + x + "].id}").ToList();

            var getContentIdsRequest = new SalesforceGetRequest
            {
                ReferenceId = "refcntInfo",
                Url = new Uri($"/services/data/v56.0/composite/sobjects/ContentVersion?ids={string.Join(",", fileDataIds)}&fields=id,ContentDocumentId", UriKind.Relative)
            };

            var linkDocumentsToCaseRequest = new SalesforcePostRequest<DocumentLinksBody>
            {
                Body = GetDocumentLinksBody(contactFormRequest),
                ReferenceId = "refCDL",
                Url = new Uri("/services/data/v56.0/composite/sobjects", UriKind.Relative)
            };

            compositeRequestBody.Requests.AddRange(new SalesforceRequestBase[] { uploadFilesRequest, getContentIdsRequest, linkDocumentsToCaseRequest });
            return compositeRequestBody;
        }

        public static ContactUsResult ToContactUsResult(SalesforceCompositeResponse response)
        {
            var responses = response.Payload?.Body?.Responses;

            var isSuccessful = responses?.All(x => x.StatusCode == HttpStatusCode.OK || x.StatusCode == HttpStatusCode.Created) ?? false;

            string? caseNumber = null;

            if (isSuccessful)
            {
                caseNumber = GetCaseNumber(responses);
            }

            return new ContactUsResult
            {
                CaseNumber = caseNumber,
                IsSuccessful = isSuccessful
            };
        }

        private static string GetCaseNumber(List<SalesforceResponse> responses)
        {
            try
            {
                var caseInfoResponseBody = responses.FirstOrDefault(x => x.ReferenceId == "refCaseNoInfo")?.Body as JObject;
                var records = caseInfoResponseBody?["records"] as JArray;
                var caseNumberProp = records?[0]["CaseNumber"];
                var caseNumber = caseNumberProp?.Value<string>();
                return caseNumber;
            }
            catch (Exception ex)
            {
                return string.Empty;
            }
        }

        private static CaseBody GetCaseBody(ContactFormRequest contactFormRequest, string caseCategory, string language)
        {
            var caseBody = new CaseBody
            {
                BookingRef = contactFormRequest.BookingReference,
                Description = contactFormRequest.Question,
                Email = contactFormRequest.EmailAddress,
                FirstName = contactFormRequest.LeadPassengerFirstName,
                LastName = contactFormRequest.LeadPassengerLastName,
                MobilePhone = contactFormRequest.ContactNumber ?? string.Empty,
                Origin = "Web",
                PrimaryCaseCategory = caseCategory,
                Subject = GetSubject(contactFormRequest.IsPastHoliday),
                Language = language,
                Stage = contactFormRequest.IsPastHoliday ? "Post-Travel" : "Pre-Travel",
                RecordTypeId = "@{refRecordType.records[0].Id}"
            };

            return caseBody;
        }
        
        internal static string GetSubject(bool isPastHoliday)
        {
            return isPastHoliday 
                ? "easyJet holidays Customer Resolution" 
                : "easyJet holidays Customer Service";
        }

        private static async Task<UploadsBody> GetUploadsBody(ContactFormRequest contactFormRequest)
        {
            var uploadFiles = new List<UploadFile>();

            foreach (var file in contactFormRequest.Attachments)
            {
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = await memoryStream.ReadAllBytesAsync();

                var uploadFile = new UploadFile
                {
                    Attributes = new Attributes { Type = "ContentVersion" },
                    Base64EncodedFile = Base64Helper.Encode(fileBytes),
                    PathOnClient = file.FileName,
                    Title = file.FileName
                };

                uploadFiles.Add(uploadFile);
            }

            return new UploadsBody
            {
                AllOrNone = false,
                Files = uploadFiles
            };
        }

        private static DocumentLinksBody GetDocumentLinksBody(ContactFormRequest contactFormRequest)
        {
            var filesCount = contactFormRequest.Attachments.Count;

            var linkDocuments = Enumerable.Range(0, filesCount)
                .Select(x => new DocumentLink
                {
                    Attributes = new Attributes { Type = "ContentDocumentLink" },
                    ContentDocumentId = "@{refcntInfo[" + x + "].ContentDocumentId}",
                    LinkedEntityId = "@{refCase.id}",
                    Visibility = "AllUsers"
                })
                .ToList();

            return new DocumentLinksBody
            {
                AllOrNone = true,
                Links = linkDocuments,
            };
        }


    }
}
