using System.Collections.Generic;
using easyJet.Foundation.Destinations.Models.Domain;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    public interface IFoodAndDrinkUploadReportService
    {
        /// <summary>
        /// Report warning during food and drink upload.
        /// </summary>
        /// <param name="hotelCode">Hotel code.</param>
        /// <param name="hotelName">Hotel name.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(string hotelCode, string hotelName, string message);

        /// <summary>
        /// Report warning during food and drink upload.
        /// </summary>
        /// <param name="foodAndDrinkUploadRecords">Failed hotels.</param>
        /// <param name="message">Failure reason message.</param>
        void Warn(IEnumerable<FoodAndDrinkRow> foodAndDrinkUploadRecords, string message);
    }
}
