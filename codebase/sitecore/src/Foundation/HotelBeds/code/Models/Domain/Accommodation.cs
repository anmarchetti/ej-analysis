using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;

namespace easyJet.Foundation.HotelBeds.Models.Domain
{
    public class Accommodation : BaseObject
    {
        [JsonProperty("name")]
        public LocalizedContent Name { get; set; }

        [JsonProperty("giataCode")]
        public string GiataCode { get; set; }

        [JsonProperty("description")]
        public LocalizedContent Description { get; set; }

        [JsonProperty("countryCode")]
        public string CountryCode { get; set; }

        [JsonProperty("stateCode")]
        public string StateCode { get; set; }

        [JsonProperty("destinationCode")]
        public string DestinationCode { get; set; }

        [JsonProperty("categoryCode")]
        public string CategoryCode { get; set; }

        [JsonProperty("categoryGroupCode")]
        public string CategoryGroupCode { get; set; }

        [JsonProperty("chainCode")]
        public string ChainCode { get; set; }

        [JsonProperty("accommodationTypeCode")]
        public string AccommodationTypeCode { get; set; }

        [JsonProperty("coordinates")]
        public Coordinates Coordinates { get; set; }

        [JsonProperty("address")]
        public LocalizedContent Address { get; set; }

        [JsonProperty("city")]
        public LocalizedContent City { get; set; }

        [JsonProperty("postalCode")]
        public string PostalCode { get; set; }

        [JsonProperty("web")]
        public string Website { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }

        [JsonProperty("license")]
        public string License { get; set; }

        [JsonProperty("S2C")]
        public string StarRating { get; set; }

        [JsonProperty("boardCodes")]
        public IEnumerable<string> BoardCodes { get; set; }

        [JsonProperty("boards")]
        public IEnumerable<Board> Boards { get; set; }

        [JsonProperty("phones")]
        public IEnumerable<Phone> Phones { get; set; }

        [JsonProperty("images")]
        public IEnumerable<Image> Images { get; set; }

        [JsonProperty("facilities")]
        public IEnumerable<AccommodationFacility> Facilities { get; set; }

        [JsonProperty("rooms")]
        public IEnumerable<Room> Rooms { get; set; }

        [JsonProperty("terminals")]
        public IEnumerable<AccommodationAirports> Airports { get; set; }

        [JsonProperty("wildcards")]
        public IEnumerable<Wildcard> Wildcards { get; set; }

        public string GetBookingPhone()
        {
            return GetPhoneNumberByType(PhoneType.PHONEBOOKING);
        }

        public string GetManagementPhone()
        {
            return GetPhoneNumberByType(PhoneType.PHONEMANAGEMENT);
        }

        public string GetHotelPhone()
        {
            return GetPhoneNumberByType(PhoneType.PHONEHOTEL);
        }

        public string GetFaxNumber()
        {
            return GetPhoneNumberByType(PhoneType.FAXNUMBER);
        }

        private string GetPhoneNumberByType(PhoneType phoneType)
        {
            return Phones?.FirstOrDefault(x => x.Type == phoneType)?.Number;
        }
    }
}