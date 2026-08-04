namespace easyJet.Holidays.Api.Domain.Interfaces.Booking
{
    /// <summary>
    /// VAT invoice / payment receipt document service
    /// </summary>
    public interface IVatInvoiceService
    {
        /// <summary>
        /// Get VAT invoice PDF stream by booking reference
        /// </summary>
        /// <param name="bookingReference">Booking reference</param>
        /// <returns>PDF file stream</returns>
        Task<Stream> GetVatInvoicePdf(string bookingReference);
    }
}

