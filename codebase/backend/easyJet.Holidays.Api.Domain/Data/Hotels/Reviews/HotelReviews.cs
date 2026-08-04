using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.Hotels.Reviews
{
    /// <summary>
    /// TripAdvisor reviews for a hotel
    /// </summary>
    [DataContract]
    public class HotelReviews
    {
        /// <summary>
        /// Total count of reviews
        /// </summary>
        [DataMember(Name = "num_reviews")]
        public long NumReviews { get; set; }

        /// <summary>
        /// Average TripAdvisor rating
        /// </summary>
        [DataMember(Name = "rating")]
        public double? Rating { get; set; }

        /// <summary>
        /// Reviews collection
        /// </summary>
        [DataMember(Name = "reviews")]
        public IEnumerable<ReviewItem> Reviews { get; set; }

        /// <summary>
        /// Total stars count (from 1 to 5 star set in the review)
        /// </summary>
        [DataMember(Name = "review_rating_count")]
        public Dictionary<string, string> ReviewRatingCount { get; set; }

        /// <summary>
        /// Additional assessments, done by Tripadvisor reviewers. rate_location, rate_sleep, rate_room, rate_service, rate_value, rate_cleanliness could be encountered
        /// </summary>
        [DataMember(Name = "subratings")]
        public IEnumerable<SubratingItem> Subratings { get; set; }

        /// <summary>
        /// Hotel awards
        /// </summary>
        [DataMember(Name = "awards")]
        public IEnumerable<AwardItem> Awards { get; set; }

        /// <summary>
        /// Hotel web url
        /// </summary>
        [DataMember(Name = "web_url")]
        public string WebUrl { get; set; }
    }

    /// <summary>
    /// Additional ratings for particular accommodation aspects
    /// </summary>
    [DataContract]
    public class SubratingItem
    {
        /// <summary>
        /// Rating name
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }

        /// <summary>
        /// Average rating value
        /// </summary>
        [DataMember(Name = "value")]
        public double? Value { get; set; }

        /// <summary>
        /// Rating image
        /// </summary>
        [DataMember(Name = "rating_image_url")]
        public string RatingImageUrl { get; set; }

        /// <summary>
        /// Rating name for displaying
        /// </summary>
        [DataMember(Name = "localized_name")]
        public string LocalizedName { get; set; }
    }

    /// <summary>
    /// Hotel award
    /// </summary>
    [DataContract]
    public class AwardItem
    {
        /// <summary>
        /// Award type
        /// </summary>
        [DataMember(Name = "award_type")]
        public string AwardType { get; set; }

        /// <summary>
        /// Year, the award was obtained
        /// </summary>
        [DataMember(Name = "year")]
        public double? Year { get; set; }

        /// <summary>
        /// Supporting images
        /// </summary>
        [DataMember(Name = "images")]
        public Dictionary<string, string> Images { get; set; }

        /// <summary>
        /// Award categories
        /// </summary>
        [DataMember(Name = "categories")]
        public IEnumerable<string> Categories { get; set; }

        /// <summary>
        /// Award name
        /// </summary>
        [DataMember(Name = "display_name")]
        public string DisplayName { get; set; }
    }

    /// <summary>
    /// Review, posted on TripAdvisor
    /// </summary>
    [DataContract]
    public class ReviewItem
    {
        /// <summary>
        /// Id
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Review title
        /// </summary>
        [DataMember(Name = "title")]
        public string Title { get; set; }

        /// <summary>
        /// Language, review was written in
        /// </summary>
        [DataMember(Name = "lang")]
        public string Lang { get; set; }

        /// <summary>
        /// Location id
        /// </summary>
        [DataMember(Name = "location_id")]
        public string LocationId { get; set; }

        /// <summary>
        /// Date, when the review was published
        /// </summary>
        [DataMember(Name = "published_date")]
        public string PublishedDate { get; set; }

        /// <summary>
        /// The rating mark, that was set by this review
        /// </summary>
        [DataMember(Name = "rating")]
        public double? Rating { get; set; }

        /// <summary>
        /// How many times users pressed a button "this review was helpful"
        /// </summary>
        [DataMember(Name = "helpful_votes")]
        public double? HelpfulVotes { get; set; }

        /// <summary>
        /// Rating image url
        /// </summary>
        [DataMember(Name = "rating_image_url")]
        public string RatingImageUrl { get; set; }

        /// <summary>
        /// Url to access the review on TripAdvisor site
        /// </summary>
        [DataMember(Name = "url")]
        public string Url { get; set; }

        /// <summary>
        /// Trip type
        /// </summary>
        [DataMember(Name = "trip_type")]
        public string TripType { get; set; }

        /// <summary>
        /// Travel date
        /// </summary>
        [DataMember(Name = "travel_date")]
        public string TravelDate { get; set; }

        /// <summary>
        /// The body text of the review
        /// </summary>
        [DataMember(Name = "text")]
        public string Text { get; set; }

        /// <summary>
        /// The user, who left the review
        /// </summary>
        [DataMember(Name = "user")]
        public ReviewUser User { get; set; }
    }

    /// <summary>
    /// TripAdvisor user, who left the review
    /// </summary>
    [DataContract]
    public class ReviewUser
    {
        /// <summary>
        /// Username
        /// </summary>
        [DataMember(Name = "username")]
        public string Username { get; set; }

        /// <summary>
        /// User location
        /// </summary>
        [DataMember(Name = "user_location")]
        public ReviewUserLocation UserLocation { get; set; }
    }

    /// <summary>
    /// The location of the user, who left a review on TripAdvisor
    /// </summary>
    [DataContract]
    public class ReviewUserLocation
    {
        /// <summary>
        /// Id
        /// </summary>
        [DataMember(Name = "id")]
        public string Id { get; set; }

        /// <summary>
        /// Location name. could be like "city, country", no particular format was seen
        /// </summary>
        [DataMember(Name = "name")]
        public string Name { get; set; }
    }
}
