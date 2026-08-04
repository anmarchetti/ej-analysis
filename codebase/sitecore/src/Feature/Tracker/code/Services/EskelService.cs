using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Eskel;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;
using easyJet.Foundation.SitecoreExtensions.Utils;
using Newtonsoft.Json;
using Sitecore.Configuration;
using Sitecore.Diagnostics;

[assembly: InternalsVisibleTo("easyJet.Feature.Tracker.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Services
{
    [Service(typeof(IEskelService), Lifetime = Lifetime.Singleton)]
    public class EskelService : IEskelService
    {
        internal virtual string Endpoint => Settings.GetSetting(Constants.EskelSettings.Endpoint);

        internal virtual string EskelToken => SecretsManager.GetSecret(Settings.GetSetting("Eskel.TokenKey"));

        internal virtual int MaxConcurrentTasks => Settings.GetIntSetting(Constants.Performance.MaxConcurrentTasks, 7);

        internal virtual int RequestTimeout => Settings.GetIntSetting(Constants.Performance.RequestTimeout, 5);

        public async Task<IReadOnlyCollection<Booking>> GetBookings(DateTime startDate, DateTime endDate)
        {
            Log.Info($"Trying to get bookings from {startDate} to {endDate}", this);

            var bookings = new List<Booking>();

            using (var semaphore = new SemaphoreSlim(MaxConcurrentTasks))
            using (var client = new HttpClient() { Timeout = TimeSpan.FromMinutes(RequestTimeout) })
            {
                var currentDate = startDate;
                while (currentDate.Date <= endDate.Date)
                {
                    var datesToSync = GetDatesToSync(currentDate, endDate, MaxConcurrentTasks);

                    var tasks = datesToSync.Select(async dateToSync =>
                    {
                        await semaphore.WaitAsync();
                        try
                        {
                            return await Task.Run(() => GetBookingsAsync(dateToSync, client));
                        }
                        finally
                        {
                            semaphore.Release();
                        }
                    });
                    var tasksResults = await Task.WhenAll(tasks);
                    bookings.AddRange(tasksResults.SelectMany(b => b));

                    currentDate = currentDate.AddDays(MaxConcurrentTasks);
                }
            }

            Log.Info($"Bookings were received successfully from {startDate} to {endDate}. Number of bookings: {bookings.Count}", this);

            return bookings;
        }

        internal virtual Task<HttpResponseMessage> GetResponseAsyncFromProvidedClient(HttpClient client, string requestUri) => client.GetAsync(requestUri);

        private static IEnumerable<DateTime> GetDatesToSync(DateTime currentDateTime, DateTime endDateTime, int incrementBy)
        {
            var datesToSync = new List<DateTime>();
            for (var i = 0; i < incrementBy; i++)
            {
                var dateToSync = currentDateTime.AddDays(i);
                if (dateToSync <= endDateTime)
                {
                    datesToSync.Add(dateToSync);
                }
            }

            return datesToSync;
        }

        private async Task<IEnumerable<Booking>> GetBookingsAsync(DateTime dateToSync, HttpClient client)
        {
            try
            {
                var date = dateToSync.Date.ToString("yyyy-MM-dd");
                var requestUri = $"{Endpoint}?createdDate={date}&token={EskelToken}";

                Log.Info($"Trying to get bookings data for {date} by using uri: {requestUri}", this);
                var httpResponse = await GetResponseAsyncFromProvidedClient(client, requestUri).ConfigureAwait(false);

                if (httpResponse.StatusCode != HttpStatusCode.OK)
                {
                    Log.Error($"Could not get response from eskel for request: {requestUri}. Status code: {httpResponse.StatusCode}.", this);
                    return new List<Booking>();
                }

                Log.Info($"Data for booking was received successfully for {date}.", this);

                var resultString = await httpResponse.Content.ReadAsStringAsync().ConfigureAwait(false);

                var bookings = (JsonConvert.DeserializeObject<IEnumerable<Booking>>(resultString) ?? Array.Empty<Booking>()).ToList();
                return bookings;
            }
            catch (Exception ex)
            {
                Log.Error($"Couldn't process/receive response form Eskel. For date:{dateToSync}", ex, this);
                return new List<Booking>();
            }
        }
    }
}