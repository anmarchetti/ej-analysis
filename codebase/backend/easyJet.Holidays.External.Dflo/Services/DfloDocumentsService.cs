using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.External.Dflo.Models.Search;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace easyJet.Holidays.External.Dflo.Services
{
    public class DfloDocumentsService : IBookingConfirmationService, IVatInvoiceService
    {
        private readonly IApiService _apiService;
        private readonly EndpointsProvider _endpointsProvider;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<DfloDocumentsService> _logger;
        private readonly string DocTypePDF = "PDF";

        public DfloDocumentsService(IApiService apiService, EndpointsProvider endpointsProvider,
            IHttpContextAccessor httpContextAccessor, ILogger<DfloDocumentsService> logger)
        {
            _apiService = apiService;
            _endpointsProvider = endpointsProvider;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<Stream> GetBookingConfirmation(string bookingReference)
        {
            var documentId = await GetConfirmationDocumentId(bookingReference);

            if (string.IsNullOrWhiteSpace(documentId))
            {
                throw new ApiException(ApiExceptionCodes.DfloDocumentsSearchError,
                    $"Can not find document for booking: {bookingReference}", null, null);
            }

            var request = new GetDocumentRequest();

            // Build Uri
            var endpointBase = _endpointsProvider.GetEndpoint(DfloEndpoint.GetById,
                _httpContextAccessor.HttpContext.Request.Cookies);
            request.Endpoint = new Uri($"{endpointBase.AbsoluteUri}/{documentId}");

            var response =
                await _apiService.GetResponseStreamAsyncWithErrorMapping(request,
                    ApiExceptionCodes.DfloGetDocumentsError);
            return response;
        }

        /// <summary>
        /// Get PDF confirmation file id by booking reference.
        /// If no document found it will return null
        /// </summary>
        /// <param name="bookingReference"></param>
        /// <returns></returns>
        private async Task<string> GetConfirmationDocumentId(string bookingReference)
        {
            var request = new DocumentsSearchRequest();
            request.Endpoint = _endpointsProvider.GetEndpoint(DfloEndpoint.Documents,
                _httpContextAccessor.HttpContext.Request.Cookies);
            request.Payload.Body = new DocumentsSearchRequestBody[]
            {
                new DocumentsSearchRequestBody
                {
                    Field = "ResID",
                    Operator = "eq",
                    Value = bookingReference
                }
            };

            var response = await _apiService
                .GetResponseContentAsyncWithErrorMapping<DocumentsSearchRequest, DocumentsSearchResponse>(
                    request, ApiExceptionCodes.DfloDocumentsSearchError);

            var allPdfs = response.Payload?.Body?.Where(x => x.DocType == DocTypePDF) ?? new List<DocumentItem>();

            if (allPdfs.All(x => x.DateStored.HasValue))
            {
                // sort by date if all documents have it, otherwise it can be a mess 
                return allPdfs.OrderByDescending(x => x.DateStored).FirstOrDefault()?.ID;
            }

            return allPdfs.LastOrDefault()?.ID;
        }

        /// <inheritdoc />
        public Task<Stream> GetVatInvoicePdf(string bookingReference)
        {
            throw new ApiException(ApiExceptionCodes.DfloGetDocumentsError,
                "Can not get payment receipt", null, null);
        }
    }
}