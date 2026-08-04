using easyJet.Holidays.Api.Domain.Data.AirportParking;
using easyJet.Holidays.Api.Domain.Utils;
using easyJet.Holidays.External.Atcom.Models.Internal;
using System.Globalization;
using System.Text.RegularExpressions;
using System.Net;

namespace easyJet.Holidays.External.Atcom.Mappers.Booking
{
    /// <summary>
    /// Helper class to extract an <see cref="AirportParkingItem"/> from AtCom model type objects.
    /// </summary>
    public static partial class AirportParkingMapper
    {
        /// <summary>
        /// Extract an <see cref="AirportParkingItem"/> from <see cref="Bkg_Ent"/> object.
        /// </summary>
        /// <param name="bookingEntry">Booking Entry from AtCom responses.</param>
        /// <returns><see cref="AirportParkingItem"/> or Null if not found.</returns>
        public static AirportParkingItem MapResponseToAirportParking(Bkg_Ent bookingEntry)
        {
            if (bookingEntry == null)
                return null;

            var item = bookingEntry.Item?.FirstOrDefault(x => x.Set_Type == Set_Type.AIRPORT_PARKING);

            return MapResponseToAirportParking(item);
        }

        /// <summary>
        /// Extract an <see cref="AirportParkingItem"/> from <see cref="Item"/> object.
        /// </summary>
        /// <param name="item">Item from AtCom responses.</param>
        /// <returns><see cref="AirportParkingItem"/> or Null if not found.</returns>
        public static AirportParkingItem MapResponseToAirportParking(Item item)
        {
            if (item == null)
                return null;

            CarPark carPark = item.Items.OfType<CarPark>().First();
            if (!Enum.TryParse(carPark.Type.ToString(), out ParkingType parkingType))
                parkingType = ParkingType.ON_SITE;

            // If we're on the payment flow, the value will come in item.Tot_Prc.Value
            // If we're on the post-booking flow, it will come in item.Prices.Prc.Value
            decimal price = Convert.ToDecimal(item.Tot_Prc?.Value ?? item.Prices?[0]?.Prc.Value,
                CultureInfo.InvariantCulture);

            var airportParkingItem = new AirportParkingItem
            {
                Title = WebUtility.HtmlDecode(item.Name),
                BookingDetails =
                {
                    TotalPrice = price,
                    StartTime = carPark.Start_TimeStr,
                    EndTime = carPark.End_TimeStr,
                    Type = parkingType,
                    StartDate = DateFormatUtils.Parse(item.St_Dt).DateTime,
                    EndDate = DateFormatUtils.Parse(item.End_Dt).DateTime,
                    PromotionCode = ((Prom)item.Item1).Code,
                    ProductCode = item.Code,
                    KeyData = item.Items.OfType<SrcData>().First().KeyValuePair.FirstOrDefault(x =>
                        string.Equals(x.Key, "KeyData", StringComparison.OrdinalIgnoreCase))?.Value,
                    BookingReferenceCode = item.Ext_Ref_Id?.Code
                }
            };

            SanitizeKeyData(airportParkingItem);

            return airportParkingItem;
        }

        /// <summary>
        /// Removes unnecessary characters from KeyData object, including redundant spaces and new lines.
        /// </summary>
        /// <param name="airportParkingItem"></param>
        private static void SanitizeKeyData(AirportParkingItem airportParkingItem)
        {
            if (airportParkingItem?.BookingDetails?.KeyData == null)
                return;

            airportParkingItem.BookingDetails.KeyData =
                RemoveTrailingSpacesRegex()
                    .Replace(airportParkingItem.BookingDetails.KeyData, "$1"); // leave only one space when several
            airportParkingItem.BookingDetails.KeyData =
                airportParkingItem.BookingDetails.KeyData.Replace("\n", string.Empty,
                    StringComparison.OrdinalIgnoreCase);
        }

        [GeneratedRegex(@"(\s)\s+", RegexOptions.Compiled, matchTimeoutMilliseconds: 100)]
        private static partial Regex RemoveTrailingSpacesRegex();
    }
}