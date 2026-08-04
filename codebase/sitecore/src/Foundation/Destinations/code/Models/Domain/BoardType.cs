namespace easyJet.Foundation.Destinations.Models.Domain
{
    public class BoardType : BaseReferenceDataType
    {
        public string IconUrl { get; set; }

        public DatasourceObject BoardGroup { get; set; }
    }
}