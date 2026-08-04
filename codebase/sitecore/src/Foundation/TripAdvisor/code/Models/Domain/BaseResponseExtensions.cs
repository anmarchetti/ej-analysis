namespace easyJet.Foundation.TripAdvisor.Models.Domain
{
    public static class BaseResponseExtensions
    {
        public static bool HasError(this BaseResponse response) => response == null || response.Error != null;
    }
}
