namespace easyJet.Foundation.TripAdvisor.Models.Requests
{
    public class LocationMapperRequest : BaseRequest
    {
        public string Latitude { get; set; }

        public string Longitude { get; set; }

        public string Name { get; set; }

        public LocationMapperRequest(string latitude, string longitude, string name, string apiKey)
        {
            Latitude = latitude;
            Longitude = longitude;
            Name = name;
            ApiKey = $"{apiKey}-mapper";
        }

        public override string GetRequestString() => $"location_mapper/{Latitude},{Longitude}?key={ApiKey}&category=hotels&q={Name}";
    }
}
