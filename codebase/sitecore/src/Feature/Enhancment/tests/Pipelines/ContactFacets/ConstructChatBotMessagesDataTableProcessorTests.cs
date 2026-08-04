using easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.ChatBotMessages;
using FluentAssertions;
using Sitecore.Cintel.Reporting;
using Xunit;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets
{
    public class ConstructChatBotMessagesDataTableProcessorTests
    {
        [Fact]
        public void ConstructTable_Success()
        {
            var args = new ReportProcessorArgs(new ViewParameters() { ViewName = "test table name" });

            var processor = new ConstructChatBotMessagesDataTableProcessor();

            processor.Process(args);

            args.ResultTableForView.Should().NotBeNull();
            args.ResultTableForView.Columns["SessionId"].Should().NotBeNull();
            args.ResultTableForView.Columns["Query"].Should().NotBeNull();
            args.ResultTableForView.Columns["ConversationSource"].Should().NotBeNull();
            args.ResultTableForView.Columns["Intent"].Should().NotBeNull();
            args.ResultTableForView.Columns["ReferrerIntent"].Should().NotBeNull();
            args.ResultTableForView.Columns["Timestamp"].Should().NotBeNull();
        }
    }
}
