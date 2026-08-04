namespace easyJet.Holidays.External.Feefo.Models.EnterSale
{
    public class FeefoEnterSale
    {
        public string Description { get; set; }
        public string MerchantIdentifier { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public string OrderReference { get; set; }
        public string ProductSearchCode { get; set; }
        public string CustomerReference { get; set; }
        public string PackageType { get; set; }
        public DateTime? Date { get; set; }
        public string DestinationCountryName { get; set; }
        public string DestinationRegionName { get; set; }
        public string ResortName { get; set; }
        public string HotelName { get; set; }
        public string HotelTheme { get; set; }
        public double? Amount { get; set; }
        public string Currency { get; set; }
        public int NumberOfPassengers { get; set; }
        public string UnsubscribeLink { get; set; }
    }
}
