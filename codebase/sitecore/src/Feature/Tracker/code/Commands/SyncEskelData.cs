using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using easyJet.Feature.Tracker.Models.Eskel;
using easyJet.Feature.Tracker.Services;
using easyJet.Foundation.Analytics.Services;
using easyJet.Foundation.Destinations.Services;
using easyJet.Foundation.SitecoreExtensions.Commands;
using easyJet.Foundation.SitecoreExtensions.Services;
using easyJet.Foundation.XConnect.Common.Facets.Booking;
using easyJet.Foundation.XConnect.Common.Helpers;
using easyJet.Foundation.XConnect.Common.Model;
using easyJet.Foundation.XConnect.Common.Services;
using Sitecore;
using Sitecore.Configuration;
using Sitecore.Diagnostics;
using Sitecore.Shell.Framework.Commands;
using Sitecore.Text;
using Sitecore.Web.UI.Sheer;
using Sitecore.XConnect;
using Sitecore.XConnect.Client.Configuration;
using Sitecore.XConnect.Collection.Model;
using Booking = easyJet.Feature.Tracker.Models.Eskel.Booking;
using Flight = easyJet.Foundation.XConnect.Common.Facets.Booking.Flight;
using Hotel = easyJet.Foundation.Destinations.Models.Domain.Hotel;

[assembly: InternalsVisibleTo("easyJet.Feature.Tracker.Tests")]
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]

namespace easyJet.Feature.Tracker.Commands
{
    // todo: use wrapper for xdb context and refactor after refactoring analytics project
    public class SyncEskelData : BaseAsyncCommand
    {
        protected override string CommandTitle => "Eskel Data Synchronization";

        protected override string CommandCategory => "Eskel Bookings Synchronization";

        private static int ContactBatchSize => Settings.GetIntSetting(Constants.Performance.XConnectBatchSize, 100);

        private static int MaxConcurrentTasks => Settings.GetIntSetting(Constants.Performance.MaxConcurrentTasks, 7);

        private const string DialogWidth = "600";
        private const string DialogHeight = "400";
        private const int ParsedPhoneNumberParts = 2;

        private readonly string[] contactFacets =
        {
            PersonalInformation.DefaultFacetKey,
            BookingsFacet.DefaultFacetKey,
            PhoneNumberList.DefaultFacetKey,
            EmailAddressList.DefaultFacetKey
        };

        private readonly IDestinationsSearchService destinationsSearchService;
        private readonly IContactService contactService;
        private readonly IEskelService eskelService;

        public SyncEskelData(
            IDestinationsSearchService destinationsSearchService,
            IContactService contactService,
            IEskelService eskelService,
            IXdbService xdbService,
            IUserCreationService userCreationService)
            : base(userCreationService)
        {
            this.destinationsSearchService = destinationsSearchService;
            this.contactService = contactService;
            this.eskelService = eskelService;
        }

        /// <inheritdoc />
        public override void Execute(CommandContext context)
        {
            Context.ClientPage.Start(this, nameof(ExecuteJob), context.Parameters);
        }

        internal virtual async Task<bool> UpdateContactsBookingsAsync(
            IXdbContext xdbClient,
            string email,
            List<Hotel> destinations,
            IReadOnlyCollection<Contact> contacts,
            Dictionary<string, List<Booking>> contactsGroupingsBatch,
            bool submitInBatch = true)
        {
            var bookings = contactsGroupingsBatch[email];

            try
            {
                var contact = contacts.FirstOrDefault(c => c.Identifiers.Any(id => id.Identifier.Equals(email, StringComparison.OrdinalIgnoreCase))) ??
                              CreateContact(email, xdbClient);

                var contactBookings = GetContactBookings(bookings, destinations);

                AddOrUpdateContactInfo(contact, xdbClient, bookings.FirstOrDefault());
                AddOrUpdateBookingInfoToContact(contact, xdbClient, contactBookings);

                if (!submitInBatch)
                {
                    await xdbClient.SubmitAsync();
                }

                return true;
            }
            catch (Exception ex)
            {
                var bookingsString = string.Join(", ", bookings.Select(b => b.ReservationId));
                Log.Error($"Couldn't update facets for contact with bookings ID: {bookingsString}.", ex, this);
                return false;
            }
        }

        internal virtual async Task UpdateBookings(DateTime startDate, DateTime endDate)
        {
            var eskelBookings = await eskelService.GetBookings(startDate, endDate).ConfigureAwait(false);
            var contactGroupings = eskelBookings.Where(booking => !string.IsNullOrEmpty(booking.EmailAddress)).GroupBy(booking => booking.EmailAddress).ToList();

            using (var semaphore = new SemaphoreSlim(MaxConcurrentTasks))
            using (var xdbClient = GetClient())
            {
                var submitInBatch = true;
                var processedContactsCount = 0;
                var failedContactCount = 0;
                var contactsToProcessCount = contactGroupings.Count;
                var batchCount = 1;
                var destinations = new List<Hotel>();
                while (contactsToProcessCount > 0)
                {
                    try
                    {
                        var contactsToTake = contactsToProcessCount < ContactBatchSize ? contactsToProcessCount : ContactBatchSize;
                        var contactsGroupingsBatch = contactGroupings.GetRange(processedContactsCount, contactsToTake).ToDictionary(x => x.Key, x => x.ToList());
                        var emails = contactsGroupingsBatch.Keys.ToList();
                        Log.Debug($"Batch {batchCount} contacts to take:{contactsToTake}", this);

                        var hotelsToGet = eskelBookings.SelectMany(b => b.Hotels.Select(hotel => hotel.Code)).Distinct().ToArray();
                        var hotelBatchSize = HotelBatchSize;

                        GetHotels(destinations, hotelBatchSize, hotelsToGet);
                        Log.Debug($"{destinations.Count} destionations count. Hotels to get count: {hotelsToGet.Length}.", this);

                        var contacts = await contactService.GetContacts(xdbClient, emails, contactFacets).ConfigureAwait(false);
                        Log.Info($"Contacts retrivied: {contacts.Count}", this);

                        var processedContacts = new List<bool>();
                        // Update Contacts
                        foreach (var email in emails)
                        {
                            var updateContactResult = await UpdateContactsBookingsAsync(xdbClient, email, destinations, contacts, contactsGroupingsBatch, submitInBatch);
                            processedContacts.Add(updateContactResult);
                        }

                        var failedToUpdateContacts = processedContacts.Count(result => !result);

                        if (submitInBatch)
                        {
                            await xdbClient.SubmitAsync();
                        }

                        failedContactCount += failedToUpdateContacts;
                        processedContactsCount += processedContacts.Count;
                        contactsToProcessCount -= processedContacts.Count;

                        if (!submitInBatch)
                        {
                            Log.Info($"Finished submitting contacts from batch {batchCount} one by one. Number of failed contacts is {failedToUpdateContacts}.", this);
                            submitInBatch = true;
                        }
                        else
                        {
                            Log.Info($"Batch {batchCount} succesfully submitted to xConnect. Number of contacts processed: {processedContactsCount - contactsToTake} to {processedContactsCount}. Contacts failed to update: {failedToUpdateContacts}", this);
                        }

                        batchCount++;
                    }
                    catch (XdbExecutionException ex)
                    {
                        Log.Error($"Couldn't submit contacts from following batch {batchCount}. Trying to push to xConnect contacts from this batch one by one.", ex, this);
                        submitInBatch = false;
                    }
                    catch (Exception ex)
                    {
                        Log.Error($"Couldn't submit contacts from following batch {batchCount}.", ex, this);
                        batchCount++;
                        failedContactCount++;
                        processedContactsCount++;
                        contactsToProcessCount--;
                    }
                }

                Log.Info($"Finished import of {processedContactsCount - failedContactCount} from eskel. Failed import for {failedContactCount} contacts.", this);
            }
        }

        internal virtual int HotelBatchSize => int.Parse(Settings.GetSetting(Constants.EskelSettings.SolrBatch));

        internal virtual IXdbContext GetClient() => SitecoreXConnectClientConfiguration.GetClient();

        protected override bool IsCommandContextValid(CommandContext context) => true;

        protected override void PostAction(ClientPipelineArgs args) => Context.ClientPage.SendMessage(this, "Finished syncing Eskel Data");

        protected override void ExecuteJob(ClientPipelineArgs args)
        {
            if (!args.IsPostBack)
            {
                UrlString urlString = new UrlString(UIUtil.GetUri("control:SyncEskelData"));
                SheerResponse.ShowModalDialog(urlString.ToString(), DialogWidth, DialogHeight, string.Empty, true);
                args.WaitForPostBack();
            }
            else
            {
                args.Parameters.Add("dates", args.Result);
                base.ExecuteJob(args);
            }
        }

        protected override void Action(ClientPipelineArgs args)
        {
            var datesString = args.Parameters["dates"];
            (bool isDatesParsed, DateTime startDate, DateTime endDate) = ParseDate(datesString);

            if (!isDatesParsed)
            {
                return;
            }

            var task = Task.Run(async () => await UpdateBookings(startDate, endDate).ConfigureAwait(false));
            task.Wait();
        }

        private static (bool isDatesParsed, DateTime startDate, DateTime endDate) ParseDate(string datesString)
        {
            var dates = datesString.Split('|');
            var startDateParsed = DateTime.TryParse(dates.First(), out var startDate);
            var endDateParse = DateTime.TryParse(dates.Last(), out var endDate);
            return (startDateParsed && endDateParse, startDate, endDate);
        }

        private static Dictionary<string, Foundation.XConnect.Common.Facets.Booking.Booking> GetContactBookings(
            IReadOnlyCollection<Booking> bookings,
            List<Hotel> destinations)
        {
            var contactBookings = new Dictionary<string, Foundation.XConnect.Common.Facets.Booking.Booking>();

            foreach (var booking in bookings)
            {
                var adultCounts = booking.Guests?.Count(guest => guest.PassengerType == PassengerType.ADU) ?? 0;
                var childrenCounts = booking.Guests?.Count(guest => guest.PassengerType == PassengerType.CHD) ?? 0;
                var infantsCounts = booking.Guests?.Count(guest => guest.PassengerType == PassengerType.INF) ?? 0;

                var accommodation =
                    destinations.FirstOrDefault(destination => booking.Hotels?.Any(hotel => !string.IsNullOrEmpty(hotel.Code) && hotel.Code.Equals(destination.Code, StringComparison.OrdinalIgnoreCase)) ?? false);

                var reservationId = booking.ReservationId;
                var currencyCode = booking.Payments?.FirstOrDefault(x => x.ReservationId == reservationId)?.CurrencyCode;

                contactBookings.Add(reservationId, new Foundation.XConnect.Common.Facets.Booking.Booking
                {
                    ReservationId = reservationId,
                    Status = booking.BookingStatus.GetValue(),
                    VersionId = 1,
                    CreatedDate = booking.CreatedDateTime ?? DateTime.MinValue,
                    UpdatedDate = DateTime.UtcNow,
                    AdultsCount = adultCounts,
                    ChildrenCount = childrenCounts,
                    InfantsCount = infantsCounts,
                    Transfers = booking.Transfers?.Select(b => b.Airport).ToList() ?? new List<string>(),
                    Theme = accommodation?.HotelTheme?.Name,
                    Type = accommodation?.HighestPriorityType?.Name,
                    Accommodation = new Accommodation
                    {
                        Id = accommodation?.Code,
                        Name = accommodation?.Name,
                        Country = accommodation?.Country?.Code,
                        Region = accommodation?.Location?.Name,
                        Resort = accommodation?.Resort?.Name
                    },
                    Flights = booking.Flights?.Where(f => f != null).Select(f => new Flight
                    {
                        Number = f.FlightNumber,
                        To = f.ArrivalAirport,
                        From = f.DepartureAirport,
                        IsOutboundDirection = f.Direction == DirectionType.OUT,
                        ArrivalTime = f.ArrivalTime,
                        DepartureTime = f.DepartureTime
                    }).ToList() ?? new List<Flight>(),
                    BookingStartDate = booking.DepartureDate ?? DateTime.MinValue,
                    BookingEndDate = booking.ReturnDate ?? DateTime.MinValue,
                    Currency = currencyCode,
                    MarketCode = booking.AgentName
                });
            }

            return contactBookings;
        }

        private Contact CreateContact(string identifier, IXdbContext client)
        {
            var contactIdentifier = new ContactIdentifier(
                Foundation.Analytics.Constants.Tracking.DefaultIdentifierSource,
                identifier,
                ContactIdentifierType.Known);

            var contact = new Contact(contactIdentifier);
            client.AddContact(contact);
            return contact;
        }

        private void AddOrUpdateContactInfo(Contact contact, IXdbContext client, Booking booking)
        {
            var contactData = booking?.Guests?.FirstOrDefault(guest => guest.IsLeadPassenger);
            if (contactData == null)
            {
                Log.Error($"The personal info facet can't be update for the contact [{contact.Id}]", this);
                return;
            }

            (string phoneCode, string phoneNumber) = ParsePhoneNumber(booking.PhoneNumber);

            FacetHelper.AddOrUpdatePersonalInfoContactFacetIfNecessary(contact, client, new ContactPersonalInfoData(contactData.Forename, contactData.Surname, contactData.Title));
            FacetHelper.AddOrUpdatePhoneNumberFacetIfNecessary(contact, client, new ContactPhoneData(phoneCode, phoneNumber));
            FacetHelper.AddOrUpdateEmailAddressListFacetIfNecessary(contact, client, booking.EmailAddress);

            Log.Debug($"The personal info facet has been successfully added/updates to the contact [{contact.Id}]", this);

            (string phoneCode, string phoneNumber) ParsePhoneNumber(string bookingPhoneNumber)
            {
                var phoneParsed = bookingPhoneNumber.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                if (phoneParsed.Length == ParsedPhoneNumberParts)
                {
                    return (phoneParsed.First(), phoneParsed.Last());
                }
                else
                {
                    return (string.Empty, bookingPhoneNumber);
                }
            }
        }

        private void AddOrUpdateBookingInfoToContact(
            Contact contact,
            IXdbContext client,
            Dictionary<string, Foundation.XConnect.Common.Facets.Booking.Booking> bookings)
        {
            if (!bookings.Any())
            {
                Log.Info($"The booking info facet can't be updated for the contact [{contact.Id}]", this);
                return;
            }

            var bookingsFacet = contact.GetFacet<BookingsFacet>(BookingsFacet.DefaultFacetKey) ?? new BookingsFacet();
            if (bookingsFacet.Bookings == null)
            {
                bookingsFacet.Bookings = bookings;
            }
            else
            {
                foreach (var contactBooking in bookings.Where(contactBooking => !bookingsFacet.Bookings.ContainsKey(contactBooking.Key)))
                {
                    bookingsFacet.Bookings.Add(contactBooking.Key, contactBooking.Value);
                }
            }

            client.SetFacet(contact, BookingsFacet.DefaultFacetKey, bookingsFacet);

            Log.Info($"The booking info facet has been successfully added/updates to the contact [{contact.Id}]", this);
        }

        private void GetHotels(
            List<Hotel> destinations,
            int hotelBatchSize,
            string[] hotelIds)
        {
            var hotelsIdsToGet = hotelIds.Except(destinations.Select(d => d.Code)).ToList();
            var hotelsToGetCount = hotelsIdsToGet.Count;
            var processedHotelsCount = 0;

            Log.Debug($"Trying to get hotel data from index for {hotelsToGetCount} destinations.", this);

            while (hotelsToGetCount > 0)
            {
                var itemsToGetCount = hotelBatchSize > hotelsToGetCount ? hotelsToGetCount : hotelBatchSize;
                var hotelBatch = hotelsIdsToGet.GetRange(processedHotelsCount, itemsToGetCount).ToArray();
                var hotels = destinationsSearchService.GetHotelsByAtcomCodes(hotelBatch).ToList();
                destinations.AddRange(hotels);

                hotelsToGetCount -= itemsToGetCount;
                processedHotelsCount += itemsToGetCount;
            }

            Log.Debug($"destination count is {destinations.Count}.", this);
        }
    }
}