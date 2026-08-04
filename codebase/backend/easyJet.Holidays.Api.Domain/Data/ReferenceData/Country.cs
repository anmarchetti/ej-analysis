namespace easyJet.Holidays.Api.Domain.Data.ReferenceData
{
    /// <summary>
    /// Data model for Country from CMS (reference data)
    /// </summary>
    public class Country
    {
        /// <summary>
        /// Country name
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// 3-character country code
        /// </summary>
        public string Code { get; set; }
        
        /// <summary>
        /// 2-character country code
        /// </summary>
        public string Iso2 { get; set; }
    }
}
