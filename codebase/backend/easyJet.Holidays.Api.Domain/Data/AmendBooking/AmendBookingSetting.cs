using easyJet.Holidays.Api.Domain.CustomJsonConverters;
using Newtonsoft.Json;
using System.Runtime.Serialization;

namespace easyJet.Holidays.Api.Domain.Data.AmendBooking
{
    [Serializable]
    [DataContract]
    public class AmendBookingSetting
    {
        #region Flighit
        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsAmendFlightsEnabled { get; set; }

        [DataMember]
        public int? AmendFlightsThresholdHours { get; set; }

        [IgnoreDataMember] public string AmendFlightsRedirectPage { get; set; }

        [DataMember] public int? AmendFlightCount { get; set; }

        #endregion Flighit

        #region Transfer

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsAmendTransfersEnabled { get; set; }

        [DataMember]
        public int? AmendTransfersThresholdHours { get; set; }

        [DataMember]
        public int? AmendTransferCount { get; set; }

        [IgnoreDataMember]
        public string AmendTransfersRedirectPage { get; set; }

        #endregion Transfer

        #region Special Request

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsAmendSpecialRequestEnabled { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableSSRAmendForDynamicInventoryHotels { get; set; }

        [DataMember]
        public int? AmendSpecialRequestThresholdHours { get; set; }

        [DataMember]
        public int? AmendSpecialRequestCount { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsEligibleToAmendSSRForDC { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsEligibleToAmendSSRForHBG { get; set; }

        #endregion Special Request

        #region Passenger

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsAmendPassengerNameEnable { get; set; }

        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnablePassengerAmendForDynamicInventoryHotels { get; set; }

        [DataMember]
        public int? AmendPassengerThresholdHours { get; set; }

        [DataMember]
        public int? AmendPassengerNameCharacterCount { get; set; }

        [DataMember]
        public int? AmendPassengerNameCount { get; set; }

        #endregion Passenger

        #region Change Dates

        /// <summary>
        /// Is change date enable by sitecore settings.
        /// </summary>
        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsChangeDatesEnable { get; set; }

        /// <summary>
        /// The time during which change dates are available.
        /// </summary>
        [DataMember]
        public int? ChangeDatesThresholdHours { get; set; }

        /// <summary>
        /// Time-Bound Threshold - for when amendment is available before departure date
        /// </summary>
        [DataMember]
        public int? ChangeDatesThresholdHoursBeforeDeparture { get; set; }

        /// <summary>
        /// Amendment restrictions to X times post booking for amend dates.
        /// </summary>
        [DataMember]
        public int? AmendChangeDateCount { get; set; }

        /// <summary>
        /// Amendment restriction for DC hotels.
        /// </summary>
        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool EnableForDirectlyContractedBookings { get; set; }
        #endregion

        #region Room and Board

        /// <summary>
        /// Is change date enable by sitecore settings.
        /// </summary>
        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsRoomAndBoardEnabled { get; set; }

        /// <summary>
        /// The time during which change dates are available.
        /// </summary>
        [DataMember]
        public int? RoomAndBoardThresholdHours { get; set; }

        /// <summary>
        /// How many times we can update room and board.
        /// </summary>
        [DataMember]
        public int? RoomAndBoardAmendCount { get; set; }
        
        /// <summary>
        /// Enable amendment for multiroom
        /// </summary>
        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool? AllowMultiRoomAmendment { get; set; }
        #endregion

        #region Cancel booking

        [DataMember]
        public int? CancellationRestrictionHours { get; set; }

        #endregion

        #region Hotel

        /// <summary>
        /// The hours during which change hotel is available.
        /// </summary>
        [DataMember]
        public int? AmendHotelThresholdHours { get; set; }

        /// <summary>
        /// Is change hotel enable by sitecore settings.
        /// </summary>
        [DataMember]
        [JsonConverter(typeof(SiteCoreBooleanConverter))]
        public bool IsAmendHotelEnabled { get; set; }

        /// <summary>
        /// How many times it's allowed to change hotel
        /// </summary>
        [DataMember]
        public int? AmendHotelCount { get; set; }

        /// <summary>
        /// Upper limit for upsell message
        /// </summary>
        [DataMember]
        public int? AmendHotelUpsellLimit { get; set; }


        #endregion
    }
}