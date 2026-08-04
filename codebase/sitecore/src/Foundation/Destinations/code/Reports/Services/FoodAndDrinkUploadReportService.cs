using System;
using System.Collections.Generic;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.Destinations.Logging;
using easyJet.Foundation.Destinations.Models.Domain;
using easyJet.Foundation.Destinations.Reports.Models;
using easyJet.Foundation.Destinations.Reports.Repositories;
using easyJet.Foundation.SitecoreExtensions.Services;

namespace easyJet.Foundation.Destinations.Reports.Services
{
    [Service(typeof(IFoodAndDrinkUploadReportService), Lifetime = Lifetime.Singleton)]
    public class FoodAndDrinkUploadReportService : BaseUploadReportService<FoodAndDrinkRow, FacilityTabUploadRecord>, IFoodAndDrinkUploadReportService
    {
        public FoodAndDrinkUploadReportService(IFoodAndDrinkUploadReportRepository repository, IDestinationsLogger destinationsLogger)
            : base(repository, destinationsLogger)
        {
        }

        /// <inheritdoc />
        public void Warn(string hotelCode, string hotelName, string message)
        {
            AddRecord(new FoodAndDrinkRow(hotelCode, hotelName), message);
        }

        /// <inheritdoc />
        public void Warn(IEnumerable<FoodAndDrinkRow> foodAndDrinkUploadRecords, string message)
        {
            AddRecords(foodAndDrinkUploadRecords, message);
        }

        /// <inheritdoc />
        protected override FacilityTabUploadRecord BuildReportRecord(FoodAndDrinkRow modelData, string message)
        {
            return new FacilityTabUploadRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = modelData.HotelCode,
                HotelName = modelData.HotelName,
                Message = message
            };
        }

        /// <inheritdoc />
        protected override string BuildLogRecord(FoodAndDrinkRow modelData, string message)
        {
            return $"Food and drink for hotel {modelData.HotelName} with code {modelData.HotelCode} failed to upload. Reason: {message}.";
        }
    }
}
