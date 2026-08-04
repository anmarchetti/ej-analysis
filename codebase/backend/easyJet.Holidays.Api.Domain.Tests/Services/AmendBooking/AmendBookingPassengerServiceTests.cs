using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.Guests;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.AmendBooking;
using easyJet.Holidays.Api.Domain.Services.Authentication;
using easyJet.Holidays.Api.Domain.Services.Authentication.TradeAgent;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.AmendBooking;

public class AmendBookingPassengerServiceTests
{
    private readonly Mock<IBookingRepository> _bookingRepository;
    private readonly Mock<IAuthenticationService> _authService;
    private readonly Mock<IAmendPassengerValidationService> _amendPassengerValidationService;
    private AmendBookingPassengerService _amendBookingPassengerService;
    private readonly IOptions<ApiSettings> _apiSettings = Options.Create(new ApiSettings());
    private readonly Mock<IReferenceDataService> _referenceService;
    private readonly Mock<ITradeAgentAuthenticationService> _tradeAgentAuthServiceMock = new();

    private IFixture _fixture = FixtureUtils.AutoMoqFixture();

    public AmendBookingPassengerServiceTests()
    {
        _bookingRepository = new Mock<IBookingRepository>();
        _authService = new Mock<IAuthenticationService>();
        _amendPassengerValidationService = new Mock<IAmendPassengerValidationService>();
        _referenceService = new Mock<IReferenceDataService>();
        _amendBookingPassengerService = new AmendBookingPassengerService(
            _bookingRepository.Object,
            _amendPassengerValidationService.Object,
            _apiSettings,
            _referenceService.Object,
            _tradeAgentAuthServiceMock.Object,
            _authService.Object);
    }

    [Fact]
    public async Task PaxNameChangesValidation_ChangeMore_3_Characters_ThrowException()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new PersonWithDetails { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } }
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "TestFirst",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);

        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(4);

        _authService
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        Func<Task> act = () => _amendBookingPassengerService.ValidatePaxNameChange(request);

        await act.Should().ThrowAsync<ApiException>().Where(x => x.Message.Equals("Can not change more than 3 characters."));
    }

    [Fact]
    public async Task PaxNameChangesValidation_ChangeLess_3_Characters_SuccessResult()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new PersonWithDetails { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } }
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "TestFirst",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _authService.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);
        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);
        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>())).Returns(2);

        var result = await _amendBookingPassengerService.ValidatePaxNameChange(request);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task PaxNameChangeValidation_ChangeName_ChangeWasAmendFlag()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new PersonWithDetails { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } }
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "FirstTestt",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _authService.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);
        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);
        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>())).Returns(1);

        var result = await _amendBookingPassengerService.ValidatePaxNameChange(request);

        result.Should().BeTrue();
        request.Guest.PaxNameChanged.Should().BeTrue();
    }

    [Fact]
    public async Task PaxNameChangeValidation_ChangeLead_ThrowException()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new PersonWithDetails { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } }
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "FirstTestt",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);

        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>())).Returns(1);

        _amendPassengerValidationService
            .Setup(x => x.IsAmendingLeadPassenger(It.IsAny<IEnumerable<PersonWithDetails>>(), It.IsAny<string>())).Returns(true);

        _authService
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        Func<Task> act = () => _amendBookingPassengerService.ValidatePaxNameChange(request);

        await act.Should().ThrowAsync<ApiException>().Where(x => x.Message.Equals("Can not change lead passenger information."));
    }

    [Fact]
    public async Task PaxNameChangeValidation_ThrowsExceptionForNonTradeAgentWithTradePortalBooking()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new() { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } },
            IsExternalAgency = true
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "FirstTestt",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);

        _tradeAgentAuthServiceMock.Setup(x => x.IsLoggedInAsTradeAgent()).Returns(false);

        Func<Task> act = () => _amendBookingPassengerService.ValidatePaxNameChange(request);

        await act.Should().ThrowAsync<ApiException>().WithMessage("Only trade agents can amend Trade Portal booking");
    }

    [Fact]
    public async Task PaxNameChangeValidation_ChangeMoreThanOnes_ThrowException()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new PersonWithDetails { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } }
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "FirstTestt",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);

        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>())).Returns(1);

        _amendPassengerValidationService
            .Setup(x => x.IsAmendingLeadPassenger(It.IsAny<IEnumerable<PersonWithDetails>>(), It.IsAny<string>()))
            .Returns(false);

        _amendPassengerValidationService
            .Setup(x => x.CalculateNameChangeCount(It.IsAny<IEnumerable<AmendPaxHistoryItem>>(), It.IsAny<string>()))
            .Returns(1);

        _authService
            .Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>()))
            .ReturnsAsync(true);

        Func<Task> act = () => _amendBookingPassengerService.ValidatePaxNameChange(request);

        await act.Should().ThrowAsync<ApiException>().Where(x => x.Message.Equals("Can not change name more."));
    }

    [Fact]
    public async Task PaxNameChangeValidation_WasChanged_NotChangesNow_Success()
    {
        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails> { new PersonWithDetails { Index = "1", FirstName = "FirstTest", LastName = "LastTest" } }
        };

        var request = new AmendPaxRequest
        {
            Guest = new AmendPersonWithDetails
            {
                Index = "1",
                FirstName = "FirstTestt",
                LastName = "LastTest"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _authService.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);
        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);
        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>())).Returns(0);
        _amendPassengerValidationService
            .Setup(x => x.IsAmendingLeadPassenger(It.IsAny<IEnumerable<PersonWithDetails>>(), It.IsAny<string>())).Returns(false);
        _amendPassengerValidationService
            .Setup(x => x.CalculateNameChangeCount(It.IsAny<IEnumerable<AmendPaxHistoryItem>>(), It.IsAny<string>())).Returns(1);

        var result = await _amendBookingPassengerService.ValidatePaxNameChange(request);

        result.Should().BeTrue();
        request.Guest.PaxNameChanged.Should().BeFalse();
    }

    [Fact]
    public async Task ValidatePaxChangeLimit_PassengerInformationIsNull_ThrowException()
    {
        var request = new AmendPaxValidationRequest
        {
            BookingReference = "ref",
            Guests = null
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        Func<Task> act = () => _amendBookingPassengerService.ValidatePaxChangeLimit(request);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task ValidatePaxChangeLimit_BookingReferenceIsEmpty_ThrowException()
    {
        var request = new AmendPaxValidationRequest
        {
            BookingReference = "",
            Guests = new[]
            {
                new AmendPersonWithDetails
                {
                    Index = "1"
                },
                new AmendPersonWithDetails
                {
                    Index = "2"
                }
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        Func<Task> act = () => _amendBookingPassengerService.ValidatePaxChangeLimit(request);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task ValidatePaxChangeLimit_SitecoreLimitOnes_PaxWasChanged_CanNotBeChanged()
    {
        var request = new AmendPaxValidationRequest
        {
            BookingReference = "ref",
            Guests = new[]
            {
                new AmendPersonWithDetails
                {
                    Index = "1"
                }
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        var response = new List<AmendPaxValidationResponse>
        {
            new AmendPaxValidationResponse
            {
                PaxId = "1",
                CanBeChanged = false
            }
        };

        var paxMemo = new List<BookingMemo>
        {
            new BookingMemo
            {
                Description = "Name changed online: Pax_1 = No, Pax_2 = Yes, Pax_3 = No"
            },
            new BookingMemo
            {
                Description = "Name changed online: Pax_1 = No, Pax_2 = Yes, Pax_3 = Yes"
            }
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        _amendPassengerValidationService
            .Setup(x => x.CalculateNameChangeCount(It.IsAny<IEnumerable<AmendPaxHistoryItem>>(), It.IsAny<string>())).Returns(1);

        var result = await _amendBookingPassengerService.ValidatePaxChangeLimit(request);

        result.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task ValidatePaxChangeLimit_SitecoreLimitOnes_PaxNeverWasChanged_CanChange()
    {
        var request = new AmendPaxValidationRequest
        {
            BookingReference = "ref",
            Guests = new[]
            {
                new AmendPersonWithDetails
                {
                    Index = "1"
                }
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        var response = new List<AmendPaxValidationResponse>
        {
            new AmendPaxValidationResponse
            {
                PaxId = "1",
                CanBeChanged = true
            }
        };

        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);

        _amendPassengerValidationService
            .Setup(x => x.CalculateNameChangeCount(It.IsAny<IEnumerable<AmendPaxHistoryItem>>(), It.IsAny<string>())).Returns(0);

        var result = await _amendBookingPassengerService.ValidatePaxChangeLimit(request);

        result.Should().BeEquivalentTo(response);
    }

    [Fact]
    public async Task ValidatePaxNameChange_CanChange()
    {

        var booking = new BookingResponse
        {
            LeadPassenger = new LeadPassenger
            {
                Email = "TestEmail"
            },
            Guests = new List<PersonWithDetails>
            {
                new PersonWithDetails
                {
                    Index = "1", FirstName = "FirstTest", LastName = "LastTest"
                },
                new PersonWithDetails
                {
                    Index = "2", FirstName = "FirstTest", LastName = "LastTest"
                }
            }
        };

        var amendPersonWithDetails = new List<AmendPersonWithDetails>
        {
            new AmendPersonWithDetails
            {
                FirstName = _fixture.Create<string>(),
                LastName = _fixture.Create<string>(),
                Index = "1"
            },
            new AmendPersonWithDetails
            {
                FirstName = _fixture.Create<string>(),
                LastName = _fixture.Create<string>(),
                Index = "2"
            }
        };

        var amendSettings = new AmendBookingSetting
        {
            IsAmendPassengerNameEnable = true,
            AmendPassengerNameCharacterCount = 3,
            AmendPassengerNameCount = 1,
            AmendPassengerThresholdHours = 72
        };

        _authService.Setup(x => x.IsLoggedInAsLeadPax(It.IsAny<string>())).ReturnsAsync(true);
        _referenceService.Setup(x => x.GetAmendBookingSetting()).ReturnsAsync(amendSettings);
        _bookingRepository.Setup(x => x.GetBooking(It.IsAny<string>(), (string)null)).ReturnsAsync(booking);
        _amendPassengerValidationService
            .Setup(x => x.CalculateNumberChangedCharacters(It.IsAny<string>(), It.IsAny<string>())).Returns(2);

        var result = await _amendBookingPassengerService.ValidatePaxNameChange(booking, amendPersonWithDetails);

        result.Should().BeTrue();
    }
}