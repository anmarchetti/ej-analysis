using CsvHelper.Configuration.Attributes;

namespace easyJet.Foundation.Destinations.Reports.Models
{
    public class BrokenImageRecord
    {
        [Name(nameof(Name))]
        public string Name { get; set; }

        [Name(nameof(Size))]
        public string Size { get; set; }

        [Name(nameof(Url))]
        public string Url { get; set; }

        [Name(nameof(Type))]
        public string Type { get; set; }

        [Name(nameof(Published))]
        public string Published { get; set; }

        [Name(nameof(CountryName))]
        public string CountryName { get; set; }

        [Name(nameof(CountryCode))]
        public string CountryCode { get; set; }

        [Name(nameof(RegionName))]
        public string RegionName { get; set; }

        [Name(nameof(RegionCode))]
        public string RegionCode { get; set; }

        [Name(nameof(ResortName))]
        public string ResortName { get; set; }

        [Name(nameof(ResortCode))]
        public string ResortCode { get; set; }

        [Name("GIATA")]
        public string Giata { get; set; }

        [Name(nameof(AtcomCodes))]
        public string AtcomCodes { get; set; }

        [Name(nameof(HotelName))]
        public string HotelName { get; set; }
    }
}