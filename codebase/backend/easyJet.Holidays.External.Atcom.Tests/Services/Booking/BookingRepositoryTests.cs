using AutoFixture;
using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.AmendBooking.Hotel;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Data.Settings;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.Atcom.Mappers.Booking;
using easyJet.Holidays.External.Atcom.Models.ModifyBooking;
using easyJet.Holidays.External.Atcom.Services.Booking;
using easyJet.Holidays.Tests.Domain;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using BookingResponse = easyJet.Holidays.Api.Domain.Data.Booking.BookingResponse;

namespace easyJet.Holidays.External.Atcom.Tests.Services.Booking;

public class BookingRepositoryTests
{
    private IFixture _fixture = FixtureUtils.AutoMoqFixture();
    private IOptions<AtcomSettings> _atcomSettings;
    private IOptions<ApiSettings> _apiSettings;

    public BookingRepositoryTests()
    {
        _atcomSettings = Options.Create(new AtcomSettings
        {
            Booking = new AtcomApiSettings
            {
                Host = "http://localhost",
                BaseUrl = "/b"
            },
            Search = new()
            {
                Uk = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchuk",
                },
                Ch = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchch",
                },
                De = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchde",
                },
                Fr = new()
                {
                    Host = "http://search-domain",
                    BaseUrl = "api/searchfr",
                }
            },
            EndpointTemplate = new AtcomEndpointTemplateSettings
            {
                SearchRoomVariants = "search_rooms_tmpl&{0}",
                BrandParam = "brnd={0}"
            },
            Transfers = new TransfersSettings
            {
                Types = new TransferTypesSettings
                {
                    SyntheticNoTransfer = "SyntheticNoTransferTests"
                }
            },
            PaymentCodes = new Dictionary<string, PaymentCodesSettings>(),
            CltInfo = _fixture.Create<AtcomCltInfoSettings>()
        });

        _apiSettings = Options.Create(new ApiSettings()
        {
            Vouchers = new VoucherSettings()
            {
                BookingMemos = new BookingMemoSettings()
                {
                    Cred = new MemoSettings()
                    {
                        Code = "CRED"
                    },
                    MovedToCredit = new MemoSettings()
                    {
                        Code = "REP3"
                    }
                },
                Metadata = new Dictionary<string, object>
                {
                    {"currency", "GBP"}
                },
                Source = new VoucherifySource
                {
                    BulkTool = "Bulk Tool",
                    CallCentre = "Call Centre",
                    Web = "Web"
                },
                Types = new VoucherTypeSettings
                {
                    Refund = "refund",
                    Incentive = "incentive",
                    Goodwill = "goodwill"
                },
                PromoVouchers = new VoucherReasonSettings()
                {
                    Types = new List<string>() { "marketing" }
                }
            }
        });

        _fixture.Inject(_atcomSettings);
        _fixture.Inject(_apiSettings);

        var modifyBookingMapper = _fixture.Freeze<Mock<IModifyBookingMapper>>();
        modifyBookingMapper.Setup(x => x.BuildInfoModifyBookingRequest(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
            .Returns(new Models.Internal.InfoModifyBookingRequest.InfoModifyBookingRequest());
        modifyBookingMapper.Setup(x => x.Map(It.IsAny<InfoModifyBookingResponse>(), It.IsAny<PriceBreakdownResponse>(), It.IsAny<List<Benefit>>(), It.IsAny<bool>()))
            .ReturnsAsync(new ValidateAmendBookingResponse { PaymentInfo = new PriceInfo { TotalPrice = 120 } });
    }

    [Fact]
    public async Task ValidateAmendBookingInfo_EnsureAmendmentCharges()
    {
        var sut = _fixture.Create<BookingRepository>();
        var booking = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Route = true
            },
            Package = new(),
            PaymentInfo = new PriceInfo
            {
                TotalPrice = 100
            }
        };

        var request = new AmendBookingRequest
        {
            Transport = _fixture.Create<Transport>()
        };

        var result = await sut.ValidateAmendBookingInfo(request, booking, true);

        result.PaymentInfo.AmendmentCharges.Should().Be(20);
    }

    [Fact]
    public async Task ValidateAmendBookingInfo_RestrictRouteChanges_ThrowException()
    {
        var sut = _fixture.Create<BookingRepository>();
        var booking = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Route = false
            }
        };

        var request = new AmendBookingRequest
        {
            Transport = _fixture.Create<Transport>()
        };

        var action = () => sut.ValidateAmendBookingInfo(request, booking, true);

        await action
            .Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.AmendBookingRoutes.Code);
    }

    [Fact]
    public async Task ValidateAmendBookingInfo_RestrictTransferChanges_ThrowException()
    {
        var sut = _fixture.Create<BookingRepository>();
        var booking = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Transfer = new AmendItem
                {
                    AmendAllow = false
                }
            }
        };

        var request = new AmendBookingRequest
        {
            Transfers = _fixture.CreateMany<TransferItem>(1)
        };

        var action = () => sut.ValidateAmendBookingInfo(request, booking, true);

        await action
            .Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.AmendBookingTransfers.Code);
    }
    
    [Fact]
    public async Task ValidateAmendBookingInfo_RestrictDateChanges_ThrowException()
    {
        var sut = _fixture.Create<BookingRepository>();
        var booking = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                ChangeDates = false
            }
        };

        var request = new AmendBookingRequest
        {
            Offer = new Offer()
        };

        var action = () => sut.ValidateAmendBookingInfo(request, booking, true);

        await action
            .Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.AmendBookingDatesLimit.Code);
    }
    
    [Fact]
    public async Task ValidateAmendBookingInfo_RestrictUnitsChanges_ThrowException()
    {
        var sut = _fixture.Create<BookingRepository>();
        var booking = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                RoomAndBoard = false
            }
        };

        var request = new AmendBookingRequest
        {
            Units = []
        };

        var action = () => sut.ValidateAmendBookingInfo(request, booking, true);

        await action
            .Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.AmendRoomLimit.Code);
    }
    
    [Fact]
    public async Task ValidateAmendBookingInfo_RestrictAccomChanges_ThrowException()
    {
        var sut = _fixture.Create<BookingRepository>();
        var booking = new BookingResponse
        {
            AmendmentInfo = new AmendmentsInfo
            {
                Accom = false
            }
        };

        var request = new AmendBookingRequest
        {
            AmendHotelOffer = new AmendHotelOffer()
        };

        var action = () => sut.ValidateAmendBookingInfo(request, booking, true);

        await action
            .Should()
            .ThrowAsync<ApiException>()
            .Where(x => x.Code.Code == ApiExceptionCodes.AmendHotelRestriction.Code);
    }
}