using easyJet.Holiday.IntegrationTests.Shared.Exceptions;
using easyJet.Holiday.IntegrationTests.Shared.Models.Booking;
using easyJet.Holiday.IntegrationTests.Shared.Models.Customers;
using easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.Seats;
using easyJet.Holidays.IntegrationTests.TestApi.Service.Customers;
using easyJet.Holidays.IntegrationTests.TestApi.Service.TradePortal;
using Force.DeepCloner;
using System.Diagnostics;
using AgentCredentials = easyJet.Holiday.IntegrationTests.Shared.Models.TradePortals.AgentCredentials;
using Product = easyJet.Holidays.Api.Domain.Data.Booking.Product;

namespace easyJet.Holidays.IntegrationTests.TestApi.Service.Booking;

/// <summary>
/// Logic for creating bookings based on provided params
/// </summary>
public class BookingBuilder : IBookingBuilder
{
    private const int SearchRetryCount = 2;
    private const int BaseOfferRetryCount = 5;

    private CustomerCredentials? _customerCredentials;
    private Customer? _customer;
    public AgentCredentials? _agentCredentials;
    private Agent? _agent;
    private bool _isTradePortal;
    private bool _shouldHaveAlternativeRooms;
    private BookingCreationParams _bookingParams;
    private Payment _payment;

    private readonly ICustomerService _customerService;
    private readonly IBookingApiService _bookingApiService;
    private readonly ITradePortalAccountService _tradePortalAccountService;

    public BookingBuilder(
        ICustomerService customerService,
        IBookingApiService bookingApiService,
        ITradePortalAccountService tradePortalAccountService)
    {
        _customerService = customerService;
        _bookingApiService = bookingApiService;
        _tradePortalAccountService = tradePortalAccountService;
        _bookingParams = new BookingCreationParams();
    }

    #region FluentAPI

    public IBookingBuilder ApplyCreationParameters(BookingCreationParams creationParams)
    {
        _bookingParams = creationParams;
        return this;
    }

    public IBookingBuilder ForUser(CustomerCredentials? credentials, AgentCredentials? agentCredentials, bool isTradePortal = false)
    {
        _customerCredentials = credentials;
        _agentCredentials = agentCredentials;
        _isTradePortal = isTradePortal;
        return this;
    }

    public IBookingBuilder WithPayment(Payment payment)
    {
        _payment = payment;
        return this;
    }

    public IBookingBuilder ShouldHaveAlternativeRooms()
    {
        _shouldHaveAlternativeRooms = true;
        return this;
    }

    public IBookingBuilder WithLanguage(string language)
    {
        if (string.IsNullOrEmpty(language))
            return this;

        _bookingApiService.SetLanguage(language);
        return this;
    }

    #endregion

    public async Task<CreateBookingResponse> Build()
    {
        await ValidatePromocode();

        _customer = await _customerService.CreateOrGetCustomer(_customerCredentials);

        var booking = await CreateBookings();

        return new CreateBookingResponse
        {
            BookingResponse = booking.Bookings[0],
            CustomerCredentials = booking.CustomerCredentials,
            Customer = booking.Customer
        };
    }

    public async Task<CreateBookingsResponse> BuildMany(int numberOfBookings = 1)
    {
        await ValidatePromocode();

        if (!_isTradePortal)
        {
            _customer = await _customerService.CreateOrGetCustomer(_customerCredentials);    
        }
        else
        {
            _agent = await _tradePortalAccountService.Login(_agentCredentials!);
        }

        var bookings = await CreateBookings(numberOfBookings);

        return bookings;
    }

    private async Task<CreateBookingsResponse> CreateBookings(int numOfBookings = 1)
    {
        var bookingResponse = new CreateBookingsResponse
        {
            CustomerCredentials = _customer?.Credentials,
            Customer = _customer?.Info??_agent?.CustomerInfo??throw new BookingException("Customer is not set")
        };

        for (int i = 0; i < SearchRetryCount; i++)
        {
            try
            {
                var offers = await _bookingApiService.GetOffers(_bookingParams);

                var numberOfOffersToAttempt = Math.Min(BaseOfferRetryCount + numOfBookings, offers.Length);

                for (int j = 0; j < numberOfOffersToAttempt; j++)
                {
                    var (attempt, booking) = await TryToBookOffer(offers[j]);
                    bookingResponse.Attempts.Add(attempt);

                    if (booking is null)
                        continue;

                    bookingResponse.Bookings.Add(booking);

                    if (bookingResponse.Bookings.Count == numOfBookings)
                    {
                        return bookingResponse;
                    }
                }
            }
            catch(BookingException ex)
            {
                bookingResponse.Attempts.Add(ex.ToBookingAttempt());
            }
        }

        if (bookingResponse.Attempts.Count == 0)
        {
            throw new BookingException("Can not create booking.");
        }

        return bookingResponse;
    }

    private async Task<(BookingAttempt, BookingResponse?)> TryToBookOffer(Offer offer)
    {
        var timer = Stopwatch.StartNew();

        try
        {
            var booking = await CheckForRequirementsAndTryToBook(offer);
            timer.Stop();

            var attempt = new BookingAttempt("success") { TimeTaken = timer.Elapsed };
            return (attempt, booking);
        }
        catch (BookingException ex)
        {
            timer.Stop();
            var attempt = ex.ToBookingAttempt();
            attempt.TimeTaken = timer.Elapsed;
            return (attempt, null);
        }
    }

    private async Task<BookingResponse> CheckForRequirementsAndTryToBook(Offer offer)
    {
        if (_shouldHaveAlternativeRooms)
        {
            _ = await _bookingApiService.GetAlternativeRoomsAndBoards(offer);
        }

        var offerAlternationResult = await GetOfferWithAlterations(offer);
        var bookingResult = await CreateBooking(offerAlternationResult);
        return bookingResult;
    }

    private async Task<BookingResponse> CreateBooking(Offer offer)
    {
        // Validate packages
        var validateResponse = await _bookingApiService.ValidatePackage(offer, _bookingParams, null, _agent, _isTradePortal);

        if (_bookingParams.BookSeatsForAllNonInfants)
        {
            var seatSelection = await GetSeatSelection(offer, validateResponse);

            // Second validate request with seats
            validateResponse = await _bookingApiService.ValidatePackage(offer, _bookingParams, seatSelection, _agent, _isTradePortal);
        }

        // Create booking
        var commitResult = await _bookingApiService.CommitBooking(offer, validateResponse, _bookingParams, _customer, _payment, _agent, _isTradePortal);
        return commitResult;
    }

    private async Task<Offer> GetOfferWithAlterations(Offer offer)
    {
        if (!_bookingParams.BookTheMostExpensiveFlight && !_bookingParams.BookTheMostExpensiveRoomAndBoard && _bookingParams.FlightType == FlightType.Any)
            return offer;

        var updatedOffer = offer.DeepClone();

        if (_bookingParams.BookTheMostExpensiveFlight || _bookingParams.FlightType != FlightType.Any)
        {
            var offerWithRequestedFlight = await GetOfferWithRequestedFlight(offer);
            updatedOffer.Transport = offerWithRequestedFlight.Transport;
            updatedOffer.Price = offerWithRequestedFlight.Price;
            updatedOffer.PricePP = offerWithRequestedFlight.PricePP;
        }

        //this might require separate logic for X/Z accoms
        if (_bookingParams.BookTheMostExpensiveRoomAndBoard)
        {
            var roomsAndBoards = await _bookingApiService.GetAlternativeRoomsAndBoards(offer);

            var priceDelta = 0m;
            var newRooms = new List<Unit>();
            for (var i = 0; i < roomsAndBoards.Rooms.Count; i++)
            {
                var rooms = roomsAndBoards.Rooms[i];
                var mostExpensiveRoom = rooms.MaxBy(x => x.Price)!;
                newRooms.Add(mostExpensiveRoom);
                priceDelta += mostExpensiveRoom.Price - offer.Accom.Unit[i].Price;
            }

            updatedOffer.Accom.Unit = newRooms;

            var mostExpensiveBoard = roomsAndBoards.AltBoards.MaxBy(x => x.Price)!;
            updatedOffer.Accom.Unit.ForEach(x => x.Board = mostExpensiveBoard.Code);
            priceDelta += mostExpensiveBoard.Price - updatedOffer.Price;

            var payingCustomers = Math.Round(updatedOffer.Price / updatedOffer.PricePP);
            updatedOffer.Price += priceDelta;
            updatedOffer.PricePP = updatedOffer.Price / payingCustomers;
        }

        return updatedOffer;
    }

    private async Task<Offer> GetOfferWithRequestedFlight(Offer offer)
    {
        var response = await _bookingApiService.GetAlternativeFlights(offer);
        var flights = response.Offers;

        flights = _bookingParams.FlightType switch
        {
            FlightType.Internal => flights.Where(x => x.Transport.Routes.All(y => y.IsExternal == false)).ToList(),
            FlightType.External => flights.Where(x => x.Transport.Routes.All(y => y.IsExternal == true)).ToList(),
            _ => flights
        };

        if (flights.Count == 0)
            throw new BookingException($"no {_bookingParams.FlightType} flights found");

        if(_bookingParams.BookTheMostExpensiveFlight)
        {
            var offerWithTheMostExpensiveFlight = flights.MaxBy(x => x.Price);
            return offerWithTheMostExpensiveFlight!;
        }
        else
        {
            var randomOffer = flights[Random.Shared.Next(flights.Count)];
            return randomOffer;
        }
    }

    private async Task ValidatePromocode()
    {
        if (string.IsNullOrEmpty(_bookingParams.Promocode))
            return;

        var isPromocodeValid = await _bookingApiService.IsPromocodeValid(_bookingParams.Promocode);

        if (!isPromocodeValid)
            throw new BookingException($"Promocode {_bookingParams.Promocode} is not valid");
    }

    private async Task<List<SeatMap>> GetSeatSelection(Offer offer, ValidateBookingResponse validateResponse)
    {
        if (!validateResponse.SeatSelection.All(seatMap => seatMap.IsSeatReservationPossible))
            throw new BookingException("seat reservation not possible");

        var outboundSeats = await _bookingApiService.GetSeats(offer.Transport.OutboundFlight, _bookingParams);
        var inboundSeats = await _bookingApiService.GetSeats(offer.Transport.ReturnFlight, _bookingParams);

        var seatSelection = validateResponse.SeatSelection;
        AddSeats(seatSelection, outboundSeats, offer.Transport.OutboundFlight);
        AddSeats(seatSelection, inboundSeats, offer.Transport.ReturnFlight);
        return seatSelection;
    }

    private static void AddSeats(List<SeatMap> seatSelection, List<SeatMapSeat> availableSeats, Api.Domain.Data.PackageOffers.Route flight)
    {
        var seatMap = seatSelection
            .Single(sm => sm.FlightNumber == flight.FlightNumberWithoutCar);

        seatMap.Seats = new List<Seat>();
        int paxIndex = 1;
        foreach (var seat in availableSeats)
        {
            seatMap.Seats.Add(new Seat
            {
                SeatNumber = seat.Number,
                PaxIndex = paxIndex,
                Price = seat.Price,
                PriceBand = seat.PriceBand,
                Products = seat.Products.Select(p => new Product
                {
                    Name = p.Name,
                    Description = p.Description,
                    Icon = p.Icon,
                    Id = p.Id
                }).ToList()
            });

            paxIndex++;
        }
    }

}