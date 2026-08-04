namespace easyJet.Foundation.TripAdvisor.Models.Requests
{
    public abstract class BaseRequest
    {
        public string LocationId { get; set; }

        public string ApiKey { get; set; }

        public abstract string GetRequestString();

        protected virtual string GetQueryString()
        {
            return string.Empty;
        }
    }
}