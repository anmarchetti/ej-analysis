namespace easyJet.Holidays.External.B2B.Models.CountryInformation
{
    public class CountryInformationResponse : B2BApiResponseBase<CountriesRoot>
    {
    }

    public class CountriesRoot
    {
        public List<Holidays.Api.Domain.Data.ReferenceData.CountryInformation> CountryInformationList { get; set; }
    }

}
