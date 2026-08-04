using System.Runtime.Serialization;

namespace easyJet.Holidays.External.SmartSeer.Models
{
    [Serializable]
    [DataContract]
    public class SmartSeerRecommendationsRequestBody
    {
        [DataMember(Name = "userId")]
        public string UserId { get; set; }

        [DataMember(Name = "limit")]
        public int Limit { get; set; }

        [DataMember(Name = "placementId")]
        public string PlacementId { get; set; }

        [DataMember(Name = "context")]
        public RecommendationsRequestContent Context { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RecommendationsRequestContent
    {
        [DataMember(Name = "url")]
        public string Url { get; set; }

        [DataMember(Name = "reffer")]
        public string Reffer { get; set; }

        [DataMember(Name = "filter")]
        public RecommendationsRequestFilter Filter { get; set; }

        [DataMember(Name = "products")]
        public IEnumerable<RecommendationsProduct> Products { get; set; }

        [DataMember(Name = "type")]
        public string PageType { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RecommendationsRequestFilter
    {
        [DataMember(Name = "origin")]
        public string[] Origin { get; set; }

        [DataMember(Name = "destination")]
        public IEnumerable<string> Destination { get; set; }

        [DataMember(Name = "tags")]
        public string[] Tags { get; set; }

        [DataMember(Name = "board")]
        public string[] Board { get; set; }

        [DataMember(Name = "period")]
        public RecommendationsRequestPeriod Period { get; set; }

        [DataMember(Name = "duration")]
        public RecommendationsRequestMaxMin<int?> Duration { get; set; }

        [DataMember(Name = "categoryStars10")]
        public RecommendationsRequestMaxMin<int?> CategoryStars10 { get; set; }

        [DataMember(Name = "rating10")]
        public RecommendationsRequestMaxMin<int?> Rating10 { get; set; }

        [DataMember(Name = "price")]
        public RecommendationsRequestMaxMin<decimal?> Price { get; set; }

        [DataMember(Name = "rooms")]
        public IEnumerable<RecommendationsRequestRooms> Rooms { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RecommendationsRequestPeriod
    {
        [DataMember(Name = "from")]
        public string From { get; set; }

        [DataMember(Name = "to")]
        public string To { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RecommendationsProduct
    {
        [DataMember(Name = "type")]
        public string Type { get; set; }

        [DataMember(Name = "id")]
        public string Id { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RecommendationsRequestMaxMin<T>
    {
        [DataMember(Name = "max")]
        public T Max { get; set; }

        [DataMember(Name = "min")]
        public T Min { get; set; }
    }

    [Serializable]
    [DataContract]
    public class RecommendationsRequestRooms
    {
        [DataMember(Name = "adults")]
        public int Adults { get; set; }

        [DataMember(Name = "infants")]
        public int Infants { get; set; }

        [DataMember(Name = "children")]
        public int[] Children { get; set; }
    }
}
