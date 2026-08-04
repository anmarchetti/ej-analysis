using System;
using System.Linq;
using System.Threading.Tasks;
using easyJet.Foundation.PushNotifications.Facets;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Diagnostics;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using Sitecore.XConnect;

namespace easyJet.Feature.Tracker.Commands
{
    public class MarkSubscribedAnonymousContacts : BaseAsyncCommand
    {
        private static int BatchSize => Settings.GetIntSetting(Constants.Performance.XConnectBatchSize, 100);

        private readonly IXdbService xdbService;

        public MarkSubscribedAnonymousContacts(IXdbService xdbService, IUserCreationService userCreationService)
            : base(userCreationService)
        {
            this.xdbService = xdbService;
        }

        internal virtual async Task<IAsyncEntityBatchEnumerator<Contact>> GetEnumerator()
        {
            var query = xdbService.GetContactsQuery().Where(contact => contact.GetFacet<PushSubscriptions>(PushSubscriptions.DefaultFacetKey).Subscriptions.Any() && !contact.IsKnown).WithExpandOptions(new ContactExpandOptions(PushSubscriptions.DefaultFacetKey));
            return await query.GetBatchEnumerator(BatchSize);
        }

        protected override bool IsCommandContextValid(CommandContext context) => true;

        protected override void Action(ClientPipelineArgs args)
        {
            var task = Task.Run(async () => await MarkAnonymousContacts().ConfigureAwait(false));
            task.Wait();
        }

        protected override void PostAction(ClientPipelineArgs args) => Context.ClientPage.SendMessage(this, "Finished marking Anonymous contacts");

        private async Task MarkAnonymousContacts()
        {
            var enumerator = await GetEnumerator();
            var contactCount = 0;
            var batchCount = 1;

            while (await enumerator.MoveNextAsync())
            {
                var contacts = enumerator.Current;

                var batch = contacts.ToDictionary(c => c, c => new[] { GetContactIdentifier() });
                await xdbService.BatchAddIdentifiers(batch);

                Log.Info($"[MarkAnonymous] Batch {batchCount} submitted with {batch.Count} anomymous contacts marked.", this);

                contactCount += batch.Count;
                batchCount++;
            }

            Log.Info($"[MarkAnonymous] Finished updating {contactCount} anonymous contacts", this);

            ContactIdentifier GetContactIdentifier() => new ContactIdentifier(Foundation.Analytics.Constants.Tracking.PushNotificationsSource, Guid.NewGuid().ToString(), ContactIdentifierType.Known);
        }
    }
}