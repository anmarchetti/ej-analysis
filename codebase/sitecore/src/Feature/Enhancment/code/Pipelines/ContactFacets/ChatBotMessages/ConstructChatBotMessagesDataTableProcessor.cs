using System.Data;
using Sitecore.Cintel.Reporting;
using Sitecore.Cintel.Reporting.Processors;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.ChatBotMessages
{
    public class ConstructChatBotMessagesDataTableProcessor : ReportProcessorBase
    {
        public override void Process(ReportProcessorArgs args)
        {
            args.ResultTableForView = new DataTable();
            args.ResultTableForView.Columns.Add(new ViewField<string>("SessionId").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Query").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("ConversationSource").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Intent").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("ReferrerIntent").ToColumn());
            args.ResultTableForView.Columns.Add(new ViewField<string>("Timestamp").ToColumn());
        }
    }
}