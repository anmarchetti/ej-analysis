namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class AirportTemplate : DatasourceTemplate
    {
        public AirportTemplate(string name)
            : base(name, Constants.TemplateIds.Airport)
        {
        }
    }
}
