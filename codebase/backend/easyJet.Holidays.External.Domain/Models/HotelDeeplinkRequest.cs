using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Domain.Models.Api;
using System.Runtime.Serialization;

namespace easyJet.Holidays.External.Domain.Models
{
    public class HotelDeepLinkRequest : JsonApiRequest<object>
    {
        public HotelDeepLinkRequest(Offer offer, PackagesSearchRequest request)
        {
            var geography = GeographyParseUtils.ParseGeographyField(request.Geography);

            //building destination field
            //there are regions -> all regions separated by commas
            //no regions and there are countries -> all countries separated by commas
            //no regions, no countries -> build based on the hotel location
            var destination = !geography.regions.IsNullOrEmpty() ? string.Join(",", geography.regions) :
                !geography.countries.IsNullOrEmpty() ? string.Join(",", geography.countries) :
                offer.Hotel?.Location?.Code ?? offer.Hotel?.Country?.Code;

            // Values from offer
            var to = request.EndDate != null
                ? request.EndDate
                : DateFormatUtils.DateOnly(DateFormatUtils.Parse(request.StartDate).AddDays(request.Duration.FirstOrDefault()), DateFormatUtils.DateOnlyFormatFrontend);
            var roomAllocation = offer.Accom.Unit.Select(x => new DeepLinkRoomAllocation()
            {
                Adults = x.Occupation.Adults,
                Children = x.Occupation.Children,
                Infants = x.Occupation.Infants,
                ChildrenAges = x.Occupation?.ChildAges?.Select(u => u.ToString()).ToArray(),
                RoomCode = x.Code,
            }).ToArray();
            Geography = request.Geography;
            OutboundId = offer.Transport.Routes[0]?.Id;
            InboundId = offer.Transport.Routes[1]?.Id;
            AccommodationId = offer.Accom.Id;
            Destinations = destination;
            PackageId = offer.Accom.PackageId;
            OfferCode = OfferUtils.BuildOfferCode(offer);
            BoardType = offer.Accom?.Unit?.FirstOrDefault()?.BoardType?.Code ?? offer.Accom?.Unit?.FirstOrDefault()?.Board;
            OfferRooms = roomAllocation;
            Transfer = offer.Transfers.FirstOrDefault()?.Code;
            DefaultTransfer = offer.Transfers.FirstOrDefault()?.Code;
            IsExternal = offer.Accom.IsExternal ? "1" : "0";
            Rooms = roomAllocation;
            AlternativeAccommodationIds = offer.AlternativeAccommodations is null ? string.Empty : string.Join(",", offer.AlternativeAccommodations.Select(x => x.Code));
            AlternativePackageIds = offer.AlternativeAccommodations is null ? string.Empty : string.Join(",", offer.AlternativeAccommodations.Select(x => x.PackageId));
            isbf = true;

            // Values from initial request
            To = to;
            From = DateFormatUtils.DateOnly(DateFormatUtils.Parse(request.StartDate), DateFormatUtils.DateOnlyFormatFrontend);
            IsFlex = request.FlexibleDays != 0;
            Origins = request.Departure.Split(',');

            // UTM values
            UtmSource = request.Utm_source;
            UtmTerm = request.Utm_term;
            UtmMedium = request.Utm_medium;
            UtmContent = request.Utm_content;
            UtmCampaign = request.Utm_campaign;
        }

        public override HttpMethod Method => HttpMethod.Get;

        /// <summary>
        /// Holiday end date
        /// </summary>
        [DataMember(Name = "to")]
        public string To { get; set; }

        /// <summary>
        /// Holiday start date
        /// </summary>
        [DataMember(Name = "from")]
        public string From { get; set; }

        /// <summary>
        /// Check if request is booking request
        /// </summary>
        [DataMember(Name = "ibf")]
        public bool isbf { get; set; }

        /// <summary>
        /// Destination codes
        /// </summary>
        [DataMember(Name = "dst")]
        public string Destinations { get; set; }

        /// <summary>
        /// Geography codes
        /// </summary>
        [DataMember(Name = "geog")]
        public string Geography { get; set; }

        /// <summary>
        /// If flex search
        /// </summary>
        [DataMember(Name = "flex")]
        public bool IsFlex { get; set; }

        /// <summary>
        /// Ofigin codes
        /// </summary>
        [DataMember(Name = "org")]
        public string[] Origins { get; set; }

        /// <summary>
        /// Rooms
        /// </summary>
        [DataMember(Name = "rooms")]
        public DeepLinkRoomAllocation[] Rooms { get; set; }

        /// <summary>
        /// Outbound filght id
        /// </summary>
        [DataMember(Name = "outId")]
        public string OutboundId { get; set; }

        /// <summary>
        /// Inbound fight id
        /// </summary>
        [DataMember(Name = "inId")]
        public string InboundId { get; set; }

        /// <summary>
        /// AccommodationId id
        /// </summary>
        [DataMember(Name = "accId")]
        public string AccommodationId { get; set; }

        /// <summary>
        /// Pacjage ID
        /// </summary>
        [DataMember(Name = "packId")]
        public string PackageId { get; set; }

        /// <summary>
        /// Specific offer code
        /// </summary>
        [DataMember(Name = "offerCode")]
        public string OfferCode { get; set; }

        /// <summary>
        /// Holiday board type
        /// </summary>
        [DataMember(Name = "boardType")]
        public string BoardType { get; set; }

        /// <summary>
        /// Offer rooms
        /// </summary>
        [DataMember(Name = "offerRooms")]
        public DeepLinkRoomAllocation[] OfferRooms { get; set; }

        /// <summary>
        /// Selected transfer
        /// </summary>
        [DataMember(Name = "transfer")]
        public string Transfer { get; set; }

        /// <summary>
        /// Holiday default transfer
        /// </summary>
        [DataMember(Name = "dtransfer")]
        public string DefaultTransfer { get; set; }

        /// <summary>
        /// Comma-separated alternative accommodation ids
        /// </summary>
        [DataMember(Name = "altAccIds")]
        public string AlternativeAccommodationIds { get; set; }

        /// <summary>
        /// Comma-separated alternative package ids
        /// </summary>
        [DataMember(Name = "altPackIds")]
        public string AlternativePackageIds { get; set; }

        /// <summary>
        /// Is hotel external
        /// </summary>
        [DataMember(Name = "isExt")]
        public string IsExternal { get; set; }

        /// <summary>
        /// Identifies which site sent the traffic, and is a required parameter.
        /// </summary>
        [DataMember(Name = "utm_source")]
        public string UtmSource { get; set; }

        /// <summary>
        /// Identifies what type of link was used, such as cost per click or email.
        /// </summary>
        [DataMember(Name = "utm_medium")]
        public string UtmMedium { get; set; }

        /// <summary>
        /// Identifies a specific product promotion or strategic campaign.
        /// </summary>
        [DataMember(Name = "utm_campaign")]
        public string UtmCampaign { get; set; }

        /// <summary>
        /// Identifies search terms.
        /// </summary>
        [DataMember(Name = "utm_term")]
        public string UtmTerm { get; set; }

        /// <summary>
        /// Identifies what specifically was clicked to bring the user to the site, such as a banner ad or a text link. It is often used for A/B testing and content-targeted ads.
        /// </summary>
        [DataMember(Name = "utm_content")]
        public string UtmContent { get; set; }

    }

    /// <summary>
    /// Room ocupation inforamtion
    /// </summary>
    public class DeepLinkRoomAllocation
    {
        /// <summary>
        /// Number of adults
        /// </summary>
        [DataMember(Name = "adults")]
        public int Adults { get; set; }

        /// <summary>
        /// Number of children
        /// </summary>
        [DataMember(Name = "children")]
        public int Children { get; set; }

        /// <summary>
        /// Number of infants
        /// </summary>
        [DataMember(Name = "infants")]
        public int Infants { get; set; }

        /// <summary>
        /// Children ages
        /// </summary>
        [DataMember(Name = "childrenAges")]
        public string[] ChildrenAges { get; set; }

        /// <summary>
        /// Room code
        /// </summary>
        [DataMember(Name = "roomCode")]
        public string RoomCode { get; set; }
    }
}
