using Sitecore.FakeDb;

namespace easyJet.Foundation.Destinations.Tests.Infrastructures
{
    public class PriceBreakdownSettingDbTemplate : DbTemplate
    {
        public PriceBreakdownSettingDbTemplate(string name)
            : base(name, Constants.TemplateIds.PriceBreakdownSetting)
        {
            Add(Constants.Fields.DatasourceItem.Code, "UI Codes");
            Add(Constants.Fields.PriceBreakdownSetting.Text, "Default text");
            Add(Constants.Fields.PriceBreakdownSetting.AtcomCodes, "AAA, BBB");
        }
    }
}
