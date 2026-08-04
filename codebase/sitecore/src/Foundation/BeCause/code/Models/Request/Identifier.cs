using System;
using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace easyJet.Foundation.BeCause.Models.Request
{
    [ExcludeFromCodeCoverage]
    public class Identifier
    {
        [JsonProperty("becauseProfileId")]
        public Guid BecauseProfileId { get; set; }

        [JsonProperty("domainName")]
        public string DomainName { get; set; }

        [JsonProperty("vatNumber")]
        public string VatNumber { get; set; }

        [JsonProperty("customIdentifiers")]
        public CustomIdentifier[] CustomIdentifiers { get; set; }

        [JsonProperty("locationCoordinates")]
        public LocationCoordinates LocationCoordinates { get; set; }
    }
}