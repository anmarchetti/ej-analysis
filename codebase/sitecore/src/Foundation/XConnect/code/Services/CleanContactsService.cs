using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.XConnect.Common.Logging;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.XConnect;
using Sitecore.XConnect.Client;
using Sitecore.XConnect.Client.Synchronous;

namespace easyJet.Foundation.XConnect.Common.Services
{
    [Service(typeof(ICleanContactsService), Lifetime = Lifetime.Transient)]
    public class CleanContactsService : ICleanContactsService
    {
        private static int BatchSize => Settings.GetIntSetting(Constants.Performance.XConnectBatchSize, 100);

        private readonly IXConnectLogger logger;

        private readonly IXdbService xConnectService;

        public CleanContactsService(IXConnectLogger logger, IXdbService xConnectService)
        {
            this.logger = logger;
            this.xConnectService = xConnectService;
        }

        public IEnumerable<Contact> CleanContacts(DateTime inactiveDateTime, bool performDeletion = false)
        {
            if (!performDeletion)
            {
                logger.Debug($"No data will be deleted!", this);
            }

            inactiveDateTime = inactiveDateTime.ToUniversalTime();
            var inactiveTimeSpan = DateTime.UtcNow - inactiveDateTime;
            var client = xConnectService.GetContext();

            var queryable = xConnectService.GetContactsQuery()
                .Where(i => !i.IsKnown)
                .Where(i => !i.Interactions.Any(j => j.EndDateTime > inactiveDateTime));

            return Process(performDeletion, queryable, client, (i) => client.DeleteContact(i), $" contacts with interactions older than {inactiveTimeSpan.TotalDays} has been deleted!\"");
        }

        public IEnumerable<Interaction> CleanInteractions(DateTime inactiveDateTime, bool performDeletion = false)
        {
            if (!performDeletion)
            {
                logger.Debug($"No data will be deleted!", this);
            }

            inactiveDateTime = inactiveDateTime.ToUniversalTime();
            var inactiveTimeSpan = DateTime.UtcNow - inactiveDateTime;
            var client = xConnectService.GetContext();
            var queryable = client.Interactions
                .Where(i => i.EndDateTime < inactiveDateTime);

            return Process(performDeletion, queryable, client, (i) => client.DeleteInteraction(i), $"interactions older than {inactiveTimeSpan.TotalDays} days!");
        }

        protected internal virtual IEntityBatchEnumerator<T> GetBatchEnumeratorSync<T>(IAsyncQueryable<T> queryable)
            where T : Entity
        {
            return queryable.GetBatchEnumeratorSync(BatchSize);
        }

        private static TimeSpan GetRemainingTime<T>(Stopwatch sw, int countDeletedItems, IEntityBatchEnumerator<T> enumerator, out double itemsPerSecond)
            where T : Entity
        {
            itemsPerSecond = countDeletedItems / Math.Max(1, sw.Elapsed.TotalSeconds);
            var leftElements = enumerator.TotalCount - countDeletedItems;
            var remainingSeconds = leftElements / itemsPerSecond;
            var ts = TimeSpan.FromSeconds(remainingSeconds);
            return ts;
        }

        private IEnumerable<T> Process<T>(bool performDeletion, IAsyncQueryable<T> queryable, IXdbContext client, Action<T> action, string foundMessage)
        where T : Entity
        {
            int countDeletedItems = 0;
            var enumerator = GetBatchEnumeratorSync(queryable);
            if (Context.Job?.Status != null)
            {
                Context.Job.Status.Total = enumerator.TotalCount;
                Context.Job.Status.Processed = 0;
            }

            logger.Debug($"Found {enumerator.TotalCount} {foundMessage}", this);
            var sw = new Stopwatch();
            sw.Start();
            while (enumerator.MoveNext())
            {
                if (enumerator.Current == null)
                {
                    continue;
                }

                foreach (var interaction in enumerator.Current)
                {
                    countDeletedItems++;
                    yield return interaction;
                    logger.Debug($"Processing contact with ID {interaction.Id} !", this);
                    if (!performDeletion)
                    {
                        continue;
                    }

                    action(interaction);
                }

                var ts = GetRemainingTime(sw, countDeletedItems, enumerator, out var itemsPerSecond);
                Context.Job?.Status?.AddMessage($"{countDeletedItems} / {enumerator.TotalCount} {typeof(T).Name}s processed. {(int)itemsPerSecond} per second<br>{ts:dd\\.hh\\:mm\\:ss} remaining");
                client.Submit();
            }

            logger.Debug($"{countDeletedItems} {foundMessage} has been deleted!", this);
        }
    }
}