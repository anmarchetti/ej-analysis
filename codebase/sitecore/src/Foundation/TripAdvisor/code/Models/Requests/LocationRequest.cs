namespace easyJet.Foundation.TripAdvisor.Models.Requests
{
    public class LocationRequest : BaseRequest
    {
        public override string GetRequestString() => $"location/{LocationId}?key={ApiKey}";
    }
}
