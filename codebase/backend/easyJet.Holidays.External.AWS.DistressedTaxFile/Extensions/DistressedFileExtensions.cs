using easyJet.Holidays.External.AWS.DistressedTaxFile.Models;
using System.Globalization;

namespace easyJet.Holidays.External.AWS.DistressedTaxFile.Extensions
{
    /// <summary>
    /// Provides extension methods for manipulation of records from the distressed file
    /// </summary>
    public static class DistressedFileExtensions
    {
        /// <summary>
        /// Extend the distressed file with appropriate taxes
        /// </summary>
        /// <param name="distressedFileIn"></param>
        /// <param name="taxFile"></param>
        /// <param name="departureAirportsChildTaxFree"></param>
        /// <returns></returns>
        public static IEnumerable<DistressedOutputDataRowWithTaxes> AddTaxes(this IEnumerable<DistressedOutputDataRow> distressedFileIn,
            IEnumerable<TaxDataRow> taxFile, IEnumerable<string> departureAirportsChildTaxFree)
        {
            var distressedFileOut = from dis in distressedFileIn
                                    join taxRow in taxFile on dis.Sector equals taxRow.Sector into dt
                                    from tax in dt.DefaultIfEmpty()
                                    select new DistressedOutputDataRowWithTaxes(dis)
                                    {
                                        AdultTax = (tax?.GetTaxInCurrency(dis.Currency) ?? 0).ToString("0.00", CultureInfo.InvariantCulture),
                                        ChildTax = (departureAirportsChildTaxFree.Contains(dis.DepartureAirport) ? 0 : (tax?.GetTaxInCurrency(dis.Currency) ?? 0)).ToString("0.00", CultureInfo.InvariantCulture)
                                    };

            return distressedFileOut;
        }

        private static decimal GetTaxInCurrency(this TaxDataRow taxRow, string currency)
        {
            if (taxRow == null)
            {
                throw new ArgumentNullException(nameof(taxRow), "The taxRow argument cannot be null.");
            }
            return currency switch
            {
                nameof(taxRow.GBP) => taxRow.GBP,
                nameof(taxRow.EUR) => taxRow.EUR,
                nameof(taxRow.CHF) => taxRow.CHF,
                _ => throw new ArgumentNullException($"No tax data found for currency: {currency}")
            };
        }
    }
}