using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Foundation.DynamoDb.Models;
using easyJet.Foundation.DynamoDb.Repositories.Base;
using easyJet.Foundation.XConnect.Common.Facets.ChatBot;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore.Cintel.Reporting;
using Sitecore.Cintel.Reporting.Processors;
using Sitecore.XConnect;

namespace easyJet.Feature.SitecoreEnhancment.Pipelines.ContactFacets.ChatBotMessages
{
    public class GetChatBotMessagesProcessor : ReportProcessorBase
    {
        private readonly IAwsDynamoDbRepository<LiveChatMessageAwsDbModel> repository;
        private readonly IXdbService xdbService;

        public GetChatBotMessagesProcessor(IAwsDynamoDbRepository<LiveChatMessageAwsDbModel> repository, IXdbService xdbService)
        {
            this.repository = repository;
            this.xdbService = xdbService;
        }

        /// <summary>
        /// Takes all the contact device ids (tracker ids from his sessions) and load chat bot messages from dynamoDB.
        /// </summary>
        /// <param name="args">args with ContactId.</param>
        public override void Process(ReportProcessorArgs args)
        {
            Guid contactId = args.ReportParameters.ContactId;
            var resultTableForView = args.ResultTableForView;

            var contactReference = new ContactReference(contactId);
            var execOptions = new ContactExecutionOptions
            {
                ExpandOptions =
                {
                    Interactions = new RelatedInteractionsExpandOptions()
                }
            };
            var contact = xdbService.GetTargetContact(contactReference, execOptions, TimeSpan.FromMilliseconds(2000));
            if (contact != null)
            {
                var messages = new List<LiveChatMessageAwsDbModel>();
                var contactDeviceIds = contact.Interactions.Where(i => i.DeviceProfile?.Id != null)
                    .Select(i => i.DeviceProfile.Id.Value.ToString("N")).Distinct();

                foreach (var trackerId in contactDeviceIds)
                {
                    var taskResponse = Task.Run(async () => await repository.Get(trackerId).ConfigureAwait(false));
                    var continuation = taskResponse.ContinueWith(t => messages.AddRange(t.Result));
                    continuation.Wait();
                }

                foreach (var message in messages.OrderByDescending(x => x.Timestamp))
                {
                    var dataRow = resultTableForView.NewRow();

                    dataRow["SessionId"] = message.SessionId;
                    dataRow["Query"] = message.Query;
                    dataRow["ConversationSource"] = ConversationSourceToString((ConversationSource)message.ConversationSource);
                    dataRow["Intent"] = message.Intent;
                    dataRow["ReferrerIntent"] = message.ReferrerIntent;
                    dataRow["Timestamp"] = TimestampToString(message.Timestamp);
                    resultTableForView.Rows.Add(dataRow);
                }
            }

            args.QueryResult = resultTableForView;
        }

        private string TimestampToString(ulong timeStamp)
        {
            var dt = new DateTime(1970, 1, 1, 0, 0, 0, 0).AddMilliseconds(timeStamp).ToLocalTime();
            return dt.ToString("G");
        }

        private string ConversationSourceToString(ConversationSource source)
        {
            switch (source)
            {
                case ConversationSource.Sales:
                    return "Sales";
                case ConversationSource.General:
                    return "General";
                default:
                    return "Unknown";
            }
        }
    }
}