using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Ccp.Models;
using easyJet.Holidays.External.Domain.Api;
using easyJet.Holidays.External.Domain.Extensions;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.Ccp.Services;

/// <summary>
/// Provides functionality for interacting with the CCP API to retrieve booking confirmation documents.
/// </summary>
public class CcpDocumentService: IBookingConfirmationService, IVatInvoiceService
{
    private readonly IApiService _apiService;
    private readonly CcpSettings _ccpSettings;

    /// <summary>
    /// Service responsible for retrieving booking confirmation documents from the CCP API.
    /// </summary>
    /// <remarks>
    /// This service interacts with the CCP API to retrieve documents by utilizing configurable endpoints
    /// and handling API exceptions as needed. It implements the IBookingConfirmationService interface.
    /// </remarks>
    public CcpDocumentService(IApiService apiService, IOptions<CcpSettings> ccpSettings)
    {
        _apiService = apiService;
        _ccpSettings = ccpSettings?.Value ?? throw new ArgumentNullException(nameof(ccpSettings));
    }

    /// Retrieves the booking confirmation document stream based on the provided booking reference.
    /// <param name="bookingReference">The booking reference to identify the corresponding confirmation document.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the stream of the booking confirmation document.</returns>
    public async Task<Stream> GetBookingConfirmation(string bookingReference)
    {
        var request = new GetDocumentRequest { Endpoint = new Uri($"{_ccpSettings.CcpUrl.AbsoluteUri.TrimEnd('/')}/{_ccpSettings.DocumentRetrievalEndpoint.TrimStart('/')}/{bookingReference}") };

        var response = await _apiService.GetResponseStreamAsyncWithErrorMapping(request,
            ApiExceptionCodes.DfloGetDocumentsError);
        
        using var reader = new StreamReader(response);
        var base64Content = await reader.ReadToEndAsync();
        var pdfBytes = Convert.FromBase64String(base64Content);
        
        return new MemoryStream(pdfBytes);
    }

    /// <inheritdoc />
    public async Task<Stream> GetVatInvoicePdf(string bookingReference)
    {
        var request = new GetDocumentRequest
        {
            Endpoint = new Uri($"{_ccpSettings.CcpUrl.AbsoluteUri.TrimEnd('/')}/{_ccpSettings.VatInvoicePdfEndpoint.TrimStart('/')}/{bookingReference}")
        };

        var response = await _apiService.GetResponseStreamAsyncWithErrorMapping(request,
            ApiExceptionCodes.DfloGetDocumentsError);

        using var reader = new StreamReader(response);
        var base64Content = await reader.ReadToEndAsync();
        var pdfBytes = Convert.FromBase64String(base64Content);

        return new MemoryStream(pdfBytes);
    }
}