namespace easyJet.Holidays.Api.Domain.Data.Hotels
{
    /// <summary>
    /// Data model for airport
    /// </summary>
    public class Airport
    {
        /// <summary>
        /// arport code, e.g. LTN
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Airport name, e.g. Luton
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Airport group, e.g. London
        /// </summary>
        public string AirportGroup { get; set; }

        /// <summary>
        /// object itemName
        /// </summary>
        public string ItemName { get; set; }
    }
}
