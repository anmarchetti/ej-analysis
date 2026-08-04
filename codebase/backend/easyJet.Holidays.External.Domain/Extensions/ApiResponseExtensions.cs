using easyJet.Holidays.External.Domain.Models.Api;

namespace easyJet.Holidays.External.Domain.Extensions
{
    public static class ApiResponseExtensions
    {
        public static bool HasErrors<T>(this T apiResponse) where T : ApiResponse
        {
            return apiResponse?.ApiErrors?.Length > 0;
        }

        public static bool HasWarnings<T>(this T apiResponse) where T : ApiResponse
        {
            return apiResponse?.ApiWarnings?.Length > 0;
        }
    }
}
