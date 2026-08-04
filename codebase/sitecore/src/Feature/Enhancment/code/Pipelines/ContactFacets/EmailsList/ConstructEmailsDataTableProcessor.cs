using System.Data;
using Sitecore.Cintel.Reporting;
using Sitecore.Cintel.Reporting.Processors;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.EmailsList
{
    public class ConstructEmailsDataTableProcessor : ReportProcessorBase
    {
        public override void Process(ReportProcessorArgs args)
        {
            args.ResultTableForView = new DataTable();
            args.ResultTableForView.Columns.Add(new ViewField<string>("Id").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("BodyPreview").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Body").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("SentDate").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Subject").ToColumn());
        }
    }
}