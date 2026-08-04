using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.PackageOffers.AccommodationOffer;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Interfaces.Offers;
using easyJet.Holidays.Api.Domain.Services.AmendBooking.Hotels;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.Transfers;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Logging;
using Moq;
using System.Net;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking.AmendHotels;

public class AmendHotelServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepositoryMock;
    private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthenticationServiceMock;
    private readonly Mock<IAuthenticationService> _authenticationServiceMock;
    private readonly Mock<IAccommodationOfferService> _accommodationOfferServiceMock;
    private readonly Mock<IAlternativeHotelService> _alternativeHotelServiceMock;

    private readonly Mock<IAmendPromocodeHandlerService> _amendPromocodeHandlerService;
    private readonly Mock<ITransferService> _transferServiceMock;
    private readonly Mock<ILogger<AmendHotelService>> _loggerMock;
    private readonly AmendHotelService _amendHotelService;

    private IFixture _fixture = FixtureUtils.AutoMoqFixture();

    public AmendHotelServiceTests()
    {
        _bookingRepositoryMock = new Mock<IBookingRepository>();
        _tradeAgentAuthenticationServiceMock = new Mock<ITradeAgentAuthenticationService>();
        _authenticationServiceMock = new Mock<IAuthenticationService>();
        _accommodationOfferServiceMock = new Mock<IAccommodationOfferService>();
        _alternativeHotelServiceMock = new Mock<IAlternativeHotelService>();

        _amendPromocodeHandlerService = new Mock<IAmendPromocodeHandlerService>();
        _transferServiceMock = new Mock<ITransferService>();
        _loggerMock = new Mock<ILogger<AmendHotelService>>();

        _amendHotelService = new AmendHotelService(
            _bookingRepositoryMock.Object,
            _tradeAgentAuthenticationServiceMock.Object,
            _authenticationServiceMock.Object,
            _accommodationOfferServiceMock.Object,
            _alternativeHotelServiceMock.Object,
            _loggerMock.Object,
            _amendPromocodeHandlerService.Object,
            _transferServiceMock.Object);
    }

    [Fact]
    public async Task GetAmendHotelList_ShouldReturnResponse_WhenOffersAreAvailable()
    {
        // Arrange
        var request = new GetAmendHotelListRequest {BookingRef = "BookingRef1"};
        var booking = new BookingResponse {Prom = "Prom1"};
        var offers = new SearchOffersResponse() {Offers = new List<Offer> {new Offer()}};
        var response = new GetAmendHotelListResponse();

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelsSearchRequest(It.IsAny<BookingResponse>()))
            .Returns(new AlternativeHotelsSearchRequest());

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotels(It.IsAny<AlternativeHotelsSearchRequest>(), It.IsAny<PackagesSearchRequest>()))
            .ReturnsAsync(offers);

        _alternativeHotelServiceMock
            .Setup(x => x.EnrichHotelsInformation(It.IsAny<SearchOffersResponse>()))
            .Returns(Task.CompletedTask);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotelListResponse(It.IsAny<BookingResponse>(), It.IsAny<SearchOffersResponse>()))
            .Returns(response);

        // Act
        var result = await _amendHotelService.GetAmendHotelList(request);

        // Assert
        using (new AssertionScope())
        {
            result.Should().NotBeNull();
            result.Should().Be(response);
        }
    }

    [Fact]
    public async Task GetAmendHotelList_NoAvailableOffer_WhenOffersAreAvailable()
    {
        // Arrange
        var request = new GetAmendHotelListRequest {BookingRef = "BookingRef1"};
        var booking = new BookingResponse {Prom = "Prom1"};
        var offers = new SearchOffersResponse() { Offers = null };
        var response = new GetAmendHotelListResponse();

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelsSearchRequest(It.IsAny<BookingResponse>()))
            .Returns(new AlternativeHotelsSearchRequest());

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotels(It.IsAny<AlternativeHotelsSearchRequest>(), It.IsAny<PackagesSearchRequest>()))
            .ReturnsAsync(offers);

        // Act
        var result = await _amendHotelService.GetAmendHotelList(request);

        // Assert
        using (new AssertionScope())
        {
            result.AmendHotelOffers.Should().BeEmpty();
        }
    }

    [Fact]
    public async Task GetAmendHotelList_ShouldThrowException_WhenNoLoginAsLeadPassenger()
    {
        // Arrange
        var request = new GetAmendHotelListRequest {BookingRef = "BookingRef1"};
        var booking = new BookingResponse {Prom = "Prom1"};
        var offers = new SearchOffersResponse() {Offers = new List<Offer> {new Offer()}};
        var response = new GetAmendHotelListResponse();

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(false);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelsSearchRequest(It.IsAny<BookingResponse>()))
            .Returns(new AlternativeHotelsSearchRequest());

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotels(It.IsAny<AlternativeHotelsSearchRequest>(), It.IsAny<PackagesSearchRequest>()))
            .ReturnsAsync(offers);

        _alternativeHotelServiceMock
            .Setup(x => x.EnrichHotelsInformation(It.IsAny<SearchOffersResponse>()))
            .Returns(Task.CompletedTask);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotelListResponse(It.IsAny<BookingResponse>(), It.IsAny<SearchOffersResponse>()))
            .Returns(response);

        // Act
        Func<Task> act = async () => await _amendHotelService.GetAmendHotelList(request);

        // Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(e => e.Code.Code == ApiExceptionCodes.LoggedNotAsBookingLeadPassenger.Code);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_RequestNull_ThrowException()
    {
        //Arrange
        //Act
        Func<Task<AmendHotelResponse>> act = async () => await _amendHotelService.ValidateAlternativeHotel(new AmendHotelRequest());

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.InvalidModelState.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_LoggedUsNonLeadPassenger_ThrowException()
    {
        //Arrange
        var request = _fixture.Create<AmendHotelRequest>();

        //Act
        Func<Task<AmendHotelResponse>> act = async () => await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.LoggedNotAsBookingLeadPassenger.Code);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_AmendmentRestrict_ThrowException()
    {
        //Arrange
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = false
            }
        };

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);

        //Act
        Func<Task<AmendHotelResponse>> act = async () => await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.AmendHotelRestriction.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_ValidationFail_ThrowException()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var transfers = _fixture.CreateMany<TransferItem>();

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _transferServiceMock
            .Setup(x => x.BuildTransfers(It.IsAny<Offer>(), It.IsAny<bool>()))
            .ReturnsAsync(transfers);

        //Act
        Func<Task<AmendHotelResponse>> act = async () => await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.CanNotValidateAlternativeHotel.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_HandlePromocodeReturnsNull_ThrowException()
    {
        //Arrange
        var request = new AmendHotelRequest
        {
            BookingRef = "REF",
            AmendHotelOffer = new AmendHotelOffer
            {
                Accom = new Accom
                {
                    Code = "Code1",
                    Prom = "EUBA",
                    Unit = new List<Unit>
                    {
                        new Unit
                        {
                            Code = "code1",
                            Board = "board1"
                        }
                    }
                },
                Transfers = new List<TransferItem>
                {
                    new TransferItem
                    {
                        Code = "SS"
                    }
                }
            }
        };

        var bookingResponse = new BookingResponse
        {
            DiscountCode = "pormocode",
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            }
        };


        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), (string)null))
            .ReturnsAsync(bookingResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .ReturnsAsync(new ValidateAmendBookingResponse());

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), null, It.IsAny<AmendHotelOffer>(), null))
            .Returns<AmendHotelResponse>(null);

        //Act
        Func<Task<AmendHotelResponse>> act = async () => await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.CanNotValidateAlternativeHotel.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_ThrowAnyException()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var transfers = _fixture.CreateMany<TransferItem>(1);

        var validateBookingResponse = new ValidateAmendBookingResponse();

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _transferServiceMock
            .Setup(x => x.BuildTransfers(It.IsAny<Offer>(), It.IsAny<bool>()))
            .ReturnsAsync(transfers);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null))
            .ThrowsAsync(new Exception());

        //Act
        Func<Task<AmendHotelResponse>> act = async () => await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task ValidateAlternativeHotel_Success()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var transfers = _fixture.CreateMany<TransferItem>(1);

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendHotelResponse = _fixture.Create<AmendHotelResponse>();

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _transferServiceMock
            .Setup(x => x.BuildTransfers(It.IsAny<Offer>(), It.IsAny<bool>()))
            .ReturnsAsync(transfers);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null))
            .ReturnsAsync(amendHotelResponse);

        //Act
        var act = await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        _bookingRepositoryMock
            .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        _transferServiceMock
            .Verify(x => x.BuildTransfers(It.IsAny<Offer>(), It.IsAny<bool>()), Times.Once);

        _bookingRepositoryMock
            .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Once);

        _alternativeHotelServiceMock
            .Verify(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null), Times.Once);
        
        _transferServiceMock
            .Verify(x=>x.EnrichTransferWithCmsInfo(It.IsAny<string>(), It.IsAny<Transport>(), It.IsAny<List<TransferItem>>()), Times.Once);
    }

    [Fact]
    public async Task ValidateAlternativeHotel_BookingWithPromocode_Success()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>(),
            DiscountCode = "Test code"
        };

        var transfers = _fixture.CreateMany<TransferItem>(1);

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendHotelResponse = _fixture.Create<AmendHotelResponse>();

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _transferServiceMock
            .Setup(x => x.BuildTransfers(It.IsAny<Offer>(), It.IsAny<bool>()))
            .ReturnsAsync(transfers);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _amendPromocodeHandlerService
            .Setup(x => x.HandlePromocode(It.IsAny<BookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>()))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null))
            .ReturnsAsync(amendHotelResponse);

        //Act
        var act = await _amendHotelService.ValidateAlternativeHotel(request);

        //Assert
        _bookingRepositoryMock
            .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        _transferServiceMock
            .Verify(x => x.BuildTransfers(It.IsAny<Offer>(), It.IsAny<bool>()), Times.Once);

        _bookingRepositoryMock
            .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Once);

        _amendPromocodeHandlerService
            .Verify(x => x.HandlePromocode(It.IsAny<BookingResponse>(), It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>()), Times.Once);

        _alternativeHotelServiceMock
            .Verify(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null), Times.Once);
    }

    [Fact]
    public async Task GetAlternativeRooms_RequestNull_ThrowException()
    {
        //Arrange
        //Act
        Func<Task<GetAmendHotelRoomsResponse>> act = async () => await _amendHotelService.GetAlternativeRooms(new AmendHotelRequest());

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.InvalidModelState.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAlternativeRooms_LoggedUsNonLeadPassenger_ThrowException()
    {
        //Arrange
        var request = _fixture.Create<AmendHotelRequest>();

        //Act
        Func<Task<GetAmendHotelRoomsResponse>> act = async () => await _amendHotelService.GetAlternativeRooms(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.LoggedNotAsBookingLeadPassenger.Code);
    }

    [Fact]
    public async Task GetAlternativeRooms_AmendmentRestrict_ThrowException()
    {
        //Arrange
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = false
            }
        };

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);

        //Act
        Func<Task<GetAmendHotelRoomsResponse>> act = async () => await _amendHotelService.GetAlternativeRooms(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.AmendHotelRestriction.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAlternativeRooms_ThrowAnyException_ShouldReturnEmptyList()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var alternativeHotelRoomsSearchRequest = _fixture.Create<AlternativeHotelRoomsSearchRequest>();

        var searchOfferResponse = new SearchOffersResponse
        {
            Offers = new List<Offer>
            {
                new Offer
                {
                    Accom = new Accom
                    {
                        Unit = new List<Unit>
                        {
                            new Unit
                            {
                                Code = "Room code",
                                Board = "Board code"
                            }
                        }
                    },
                    AltBoards = new List<AltBoardType>
                    {
                        new AltBoardType {Code = "AltBoard"}
                    }
                }
            }
        };

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelRoomsSearchRequest(It.IsAny<BookingResponse>(), It.IsAny<AmendHotelOffer>()))
            .Returns(alternativeHotelRoomsSearchRequest);

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotelRooms(alternativeHotelRoomsSearchRequest))
            .ReturnsAsync(searchOfferResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null))
            .ThrowsAsync(new Exception());

        //Act
        var act = await _amendHotelService.GetAlternativeRooms(request);

        //Assert
        act.AmendHotelOffers.ToList().Count.Should().Be(0);
    }

    [Fact]
    public async Task GetAlternativeRooms_Success()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>(),
            PaymentInfo = new PriceInfo { TotalPrice = 0}
        };

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendHotelResponse = _fixture.Create<AmendHotelResponse>();
        var alternativeHotelRoomsSearchRequest = _fixture.Create<AlternativeHotelRoomsSearchRequest>();

        var searchOfferResponse = new SearchOffersResponse
        {
            Offers = new List<Offer>
            {
                new Offer
                {
                    Accom = new Accom
                    {
                        Unit = new List<Unit>
                        {
                            new Unit
                            {
                                Code = "Room code",
                                Board = "Board code"
                            }
                        }
                    },
                    AltBoards = new List<AltBoardType>
                    {
                        new AltBoardType {Code = "AltBoard"}
                    }
                }
            }
        };

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelRoomsSearchRequest(It.IsAny<BookingResponse>(), It.IsAny<AmendHotelOffer>()))
            .Returns(alternativeHotelRoomsSearchRequest);

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotelRooms(alternativeHotelRoomsSearchRequest))
            .ReturnsAsync(searchOfferResponse);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), It.IsAny<AmendHotelOffer>()))
            .ReturnsAsync(amendHotelResponse);

        //Act
        var act = await _amendHotelService.GetAlternativeRooms(request);

        //Assert
        _bookingRepositoryMock
            .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        _alternativeHotelServiceMock
            .Verify(x => x.CreateAlternativeHotelRoomsSearchRequest(It.IsAny<BookingResponse>(), It.IsAny<AmendHotelOffer>()), Times.Once);

        _accommodationOfferServiceMock
            .Verify(x => x.AlternativeHotelRooms(alternativeHotelRoomsSearchRequest), Times.Once);

        _bookingRepositoryMock
            .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Exactly(2));

        _alternativeHotelServiceMock
            .Verify(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), It.IsAny<AmendHotelOffer>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetAlternativeRooms_EmptyOfferList_EmptyResult()
    {
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var alternativeHotelRoomsSearchRequest = _fixture.Create<AlternativeHotelRoomsSearchRequest>();

        var searchOfferResponse = new SearchOffersResponse
        {
            Offers = Enumerable.Empty<Offer>().ToList()
        };

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelRoomsSearchRequest(It.IsAny<BookingResponse>(), It.IsAny<AmendHotelOffer>()))
            .Returns(alternativeHotelRoomsSearchRequest);

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotelRooms(alternativeHotelRoomsSearchRequest))
            .ReturnsAsync(searchOfferResponse);

        //Act
        var act = await _amendHotelService.GetAlternativeRooms(request);

        //Assert
        _bookingRepositoryMock
            .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        _alternativeHotelServiceMock
            .Verify(x => x.CreateAlternativeHotelRoomsSearchRequest(It.IsAny<BookingResponse>(), It.IsAny<AmendHotelOffer>()), Times.Once);

        _accommodationOfferServiceMock
            .Verify(x => x.AlternativeHotelRooms(alternativeHotelRoomsSearchRequest), Times.Once);

        _bookingRepositoryMock
            .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Never);

        _alternativeHotelServiceMock
            .Verify(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null), Times.Never);

        act.AmendHotelOffers.ToList().Count.Should().Be(0);
    }

    [Fact]
    public async Task GetAlternativeTransfers_RequestNull_ThrowException()
    {
        //Arrange
        //Act
        Func<Task<IEnumerable<AmendHotelResponse>>> act = async () => await _amendHotelService.GetAlternativeTransfers(new AmendHotelRequest());

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.InvalidModelState.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAlternativeTransfers_LoggedUsNonLeadPassenger_ThrowException()
    {
        //Arrange
        var request = _fixture.Create<AmendHotelRequest>();

        //Act
        Func<Task<IEnumerable<AmendHotelResponse>>> act = async () => await _amendHotelService.GetAlternativeTransfers(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.LoggedNotAsBookingLeadPassenger.Code);
    }

    [Fact]
    public async Task GetAlternativeTransfers_AmendmentRestrict_ThrowException()
    {
        //Arrange
        var request = _fixture.Create<AmendHotelRequest>();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = false
            }
        };

        _authenticationServiceMock.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _bookingRepositoryMock.Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(bookingResponse);

        //Act
        Func<Task<IEnumerable<AmendHotelResponse>>> act = async () => await _amendHotelService.GetAlternativeTransfers(request);

        //Assert
        await act.Should().ThrowAsync<ApiException>()
            .Where(ex => ex.Code.Code == ApiExceptionCodes.AmendHotelRestriction.Code && ex.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAlternativeTransfers_Success()
    {
        var request = _fixture.Create<AmendHotelRequest>();
        request.AmendHotelOffer.Transfers = _fixture.CreateMany<TransferItem>(1).ToList();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var transfers = _fixture.CreateMany<TransferItem>(2).ToList();
        transfers.AddRange(request.AmendHotelOffer.Transfers);

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendHotelResponse = _fixture.Create<AmendHotelResponse>();

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _transferServiceMock
            .Setup(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()))
            .ReturnsAsync(transfers);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), It.IsAny<AmendHotelOffer>()))
            .ReturnsAsync(amendHotelResponse);

        //Act
        var act = await _amendHotelService.GetAlternativeTransfers(request);

        //Assert
        _bookingRepositoryMock
            .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        _transferServiceMock
            .Verify(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()), Times.Once);

        _bookingRepositoryMock
            .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Exactly(2));

        _alternativeHotelServiceMock
            .Verify(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), It.IsAny<AmendHotelOffer>()), Times.Exactly(2));
        
        _transferServiceMock
            .Verify(x=>x.EnrichTransferWithCmsInfo(It.IsAny<string>(), It.IsAny<Transport>(), It.IsAny<List<TransferItem>>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetAlternativeTransfers_ThrowAnyException_ShouldReturnEmptyList()
    {
        var request = _fixture.Create<AmendHotelRequest>();
        request.AmendHotelOffer.Transfers = _fixture.CreateMany<TransferItem>(1).ToList();

        var bookingResponse = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = true
            },
            Package = new BookingPackage
            {
                Transport = new Transport(),
                Accom = new BookingAccommodation()
            },
            Transfers = new List<TransferItem>()
        };

        var transfers = _fixture.CreateMany<TransferItem>(2).ToList();
        transfers.AddRange(request.AmendHotelOffer.Transfers);

        var validateBookingResponse = new ValidateAmendBookingResponse();
        var amendHotelResponse = _fixture.Create<AmendHotelResponse>();

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _bookingRepositoryMock
            .Setup(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(bookingResponse);

        _transferServiceMock
            .Setup(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()))
            .ReturnsAsync(transfers);

        _bookingRepositoryMock
            .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false))
            .ReturnsAsync(validateBookingResponse);

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), null))
            .ThrowsAsync(new Exception());

        //Act
        var act = await _amendHotelService.GetAlternativeTransfers(request);

        //Assert
        _bookingRepositoryMock
            .Verify(x => x.GetBooking(It.IsAny<string>(), It.IsAny<string>()), Times.Once);

        _transferServiceMock
            .Verify(x => x.GetAll(It.IsAny<Offer>(), It.IsAny<string>()), Times.Once);

        _bookingRepositoryMock
            .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), false), Times.Exactly(2));

        _alternativeHotelServiceMock
            .Verify(x => x.BuildAmendHotel(It.IsAny<BookingResponse>(), It.IsAny<ValidateAmendBookingResponse>(), It.IsAny<AmendHotelOffer>(), It.IsAny<AmendHotelOffer>()), Times.Exactly(2));

        act.ToList().Count.Should().Be(0);
    }

    [Fact]
    public async Task GetAmendHotelList_HasNoPaginatedRequest_ReturnsDefaultPaginatedResults()
    {
        // Arrange
        var request = new GetAmendHotelListRequest { BookingRef = "BookingRef1" };
        var booking = new BookingResponse { Prom = "Prom1" };
        var offers = GenerateOffers(100);
        var defaultNumberOfOfferToTake = 10;

        _bookingRepositoryMock
            .Setup(x => x.GetBaseBooking(It.IsAny<string>(), It.IsAny<GetBookingOptions>()))
            .ReturnsAsync(booking);

        _authenticationServiceMock
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        _alternativeHotelServiceMock
            .Setup(x => x.CreateAlternativeHotelsSearchRequest(It.IsAny<BookingResponse>()))
            .Returns(new AlternativeHotelsSearchRequest());

        _accommodationOfferServiceMock
            .Setup(x => x.AlternativeHotels(It.IsAny<AlternativeHotelsSearchRequest>(), It.IsAny<PackagesSearchRequest>()))
            .ReturnsAsync(offers);

        var response = new GetAmendHotelListResponse()
        {
            AmendHotelOffers = offers.Offers.Select(offer => new AmendHotelOffer()).Take(defaultNumberOfOfferToTake).ToList()
        };

        _alternativeHotelServiceMock
            .Setup(x => x.BuildAmendHotelListResponse(It.IsAny<BookingResponse>(), It.IsAny<SearchOffersResponse>()))
            .Returns(response);

        // Act
        var result = await _amendHotelService.GetAmendHotelList(request);

        // Assert
        Assert.Equal(defaultNumberOfOfferToTake, result.AmendHotelOffers.Count());
    }

    public static IEnumerable<object[]> ValidateTestData()
    {
        yield return new object[] {
            new AmendHotelRequest
            {
                BookingRef = "REF",
                AmendHotelOffer = new AmendHotelOffer
                {
                    Accom = new Accom
                    {
                        Code = "Code1",
                        Prom = "EUBA",
                        Unit = new List<Unit>
                        {
                            new Unit
                            {
                                Code = "code1",
                                Board = "board1"
                            }
                        }
                    },
                    Transfers = new List<TransferItem>
                    {
                        new TransferItem
                        {
                            Code = "SS"
                        }
                    }
                }
            },
            null
        };
    }

    private static SearchOffersResponse GenerateOffers(int numberOfOffers)
    {
        var offers = new SearchOffersResponse { Offers = new List<Offer>() };

        for (int i = 0; i < numberOfOffers; i++)
        {
            offers.Offers.Add(new Offer()
            {
                Id = i.ToString()
            });
        }

        return offers;
    }
}
