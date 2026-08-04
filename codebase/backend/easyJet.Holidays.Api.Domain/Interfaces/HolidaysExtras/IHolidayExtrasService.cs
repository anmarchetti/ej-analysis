using easyJet.Holidays.Api.Domain.Data.AirportParking;

namespace easyJet.Holidays.Api.Domain.Interfaces.HolidaysExtras
{
    /// <summary>
    /// Service to communicate with Holiday Extras API.
    /// </summary>
    public interface IHolidayExtrasService
    {
        /// <summary>
        /// Get extra information from the Holiday Extras API for the given product.
        /// </summary>
        /// <param name="productCode">Product to obtain more information from.</param>
        /// <returns>Information from the given product.</returns>
        Task<HolidayExtrasProducts> GetHolidayExtrasProduct(string productCode);

        /// <summary>
        /// Get the image base path
        /// </summary>
        /// <returns>The image base path</returns>
        Uri GetImagesBaseUrl();
    }
}