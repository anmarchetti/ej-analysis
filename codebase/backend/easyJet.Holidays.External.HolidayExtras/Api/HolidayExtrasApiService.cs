using easyJet.Holidays.External.Domain.Api;

namespace easyJet.Holidays.External.HolidayExtras.Api
{
    /// <inheritdoc />
    public class HolidayExtrasApiService : ApiService
    {
        /// <inheritdoc />
        public HolidayExtrasApiService(HolidayExtrasApiClient apiClient) : base(apiClient)
        {
            
        }

        /// <inheritdoc />
        public override string Name() => "HolidayExtras API service";
    }
}