using AutoFixture;

using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.ReferenceData;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;
using easyJet.Holidays.Api.Domain.Services.Booking;
using easyJet.Holidays.Api.Domain.Services.ReferenceData;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.Tests.Domain;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Services.Booking
{
    public class BookingSpecialRequestServiceTests
    {
        private IFixture _fixture { get; set; }
        private BookingSpecialRequestService _sut;
        private Mock<IBookingRepository> _bookingRepositoryMock;
        private Mock<IReferenceDataService> _referenceDataServiceMock;

        public BookingSpecialRequestServiceTests()
        {
            _fixture = FixtureUtils.AutoMoqFixture();
            _bookingRepositoryMock = _fixture.Freeze<Mock<IBookingRepository>>();
            _referenceDataServiceMock = _fixture.Freeze<Mock<IReferenceDataService>>();

            var atcomSettings = Options.Create(new AtcomSettings
            {
                ChangeBooking = new ChangeBookingSettings
                {
                    AllowedStatuses = new List<string> { "BOOKING" }
                }
            });

            var apiSettings = Options.Create(new ApiSettings
            {
                AmendBookingMemo = new AmendBookingMemoSettings
                {
                    SpecialRequestChange = new MemoSettings
                    {
                        Code = "AMD9",
                        Description = "Special request changes"
                    }
                }
            });

            _referenceDataServiceMock
                .Setup(x => x.GetAmendBookingSetting())
                .ReturnsAsync(new AmendBookingSetting());

            _fixture.Inject(atcomSettings);
            _fixture.Inject(apiSettings);

            _sut = _fixture.Freeze<BookingSpecialRequestService>();
        }

        [Fact]
        public async Task GetSpecialRequestsByCodes_ReturnTwoItems()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestGroups())
                .ReturnsAsync(new List<SpecialRequestsGroup>(){
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 1",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Request 1 from Group 1"
                            },
                            new SpecialRequest()
                            {
                                Code = "Request 2 from Group 1"
                            }
                        }
                    },
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 2",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Request 1 from Group 2"
                            },
                            new SpecialRequest()
                            {
                                Code = "Request 2 from Group 2"
                            }
                        }
                    }
                });

            var result = await _sut.GetSpecialRequestsByCodes(new List<string>() { "Request 2 from Group 1", "Request 2 from Group 2", "Invalid request code" });

            result.Count.Should().Be(2);
            result[0].Code.Should().Be("Request 2 from Group 1");
            result[1].Code.Should().Be("Request 2 from Group 2");
        }

        [Fact]
        public async Task GetSpecialRequestsByCodes_ReturnEmptyListIfNoSpecialRequestsInGroup()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestGroups())
                .ReturnsAsync(new List<SpecialRequestsGroup>(){
                    new SpecialRequestsGroup()
                });

            var result = await _sut.GetSpecialRequestsByCodes(new List<string>() { "Request 2 from Group 1" });

            result.Count.Should().Be(0);
        }

        [Fact]
        public async Task AddSpecialRequestsToBooking_Ok_ReturnBookingResponseWithSpecialRequests()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestGroups())
                .ReturnsAsync(new List<SpecialRequestsGroup>(){
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 1",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Code1Group1"
                            },
                            new SpecialRequest()
                            {
                                Code = "Code2Group1"
                            }
                        }
                    },
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 2",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Code1Group2"
                            },
                            new SpecialRequest()
                            {
                                Code = "Code2Group2"
                            }
                        }
                    }
                });

            BookingResponse response = new BookingResponse()
            {
                BookingReference = "12345"
            };

            BookingResponse result = await _sut.AddSpecialRequestsToBooking("Code1Group1,Code2Group2", response, "12345", "67890");

            result.SpecialRequests.Count().Should().Be(2);
            result.SpecialRequests[0].Code.Should().Be("Code1Group1");
            result.SpecialRequests[1].Code.Should().Be("Code2Group2");
            _bookingRepositoryMock.Verify(x => x.ModifyMemo(response.BookingReference, It.Is<IEnumerable<BookingMemo>>(y => y.Any(a => a.Code == "Code1Group1") && y.Any(a => a.Code == "Code2Group2"))));
        }

        [Fact]
        public async Task AddSpecialRequestsToBooking_Error()
        {
            _referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>(){
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 1",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Code1Group1"
                            },
                        }
                    },
               });

            BookingResponse response = new BookingResponse()
            {
                BookingReference = "12345"
            };

            _bookingRepositoryMock.Setup(x => x.ModifyMemo(response.BookingReference, It.IsAny<IEnumerable<BookingMemo>>())).Throws(new Exception());

            Func<Task> act = () => _sut.AddSpecialRequestsToBooking("Code1Group1", response, "12345", "123456");

            await act.Should().ThrowExactlyAsync<CommitBookingException>().Where(e => e.Message == "failed to commit booking");
        }

        [Fact]
        public async Task AmmendSpecialRequestsFromBooking_Delete_And_Add_Memo()
        {
            _referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>(){
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 1",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Code1Group2"
                            },
                            new SpecialRequest()
                            {
                                Code = "Code1Group1"
                            },
                        }
                    },
               });

            _referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestContradictoryGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>());

            BookingResponse response = new BookingResponse()
            {
                BookingReference = "12345",
                SpecialRequests = new[]
                {
                    new SpecialRequest()
                    {
                        Code = "Code1Group2",
                        GroupCode = "Group 1"
                    }
                },
                Memo = new List<Memo>()
                {
                    new Memo()
                    {
                        Code = "Code1Group2",
                        Key = "test"
                    }
                }
            };
            await _sut.AmmendSpecialRequestsFromBooking(new[] { "Code1Group1" }, response);

            _bookingRepositoryMock.Verify(x => x.ModifyMemo(response.BookingReference, It.Is<IEnumerable<BookingMemo>>(s => s.Any(m => m.Key == "test" && m.Code == "Code1Group2" && m.Delete == true))));
            _bookingRepositoryMock.Verify(x => x.ModifyMemo(response.BookingReference, It.Is<IEnumerable<BookingMemo>>(s => s.Any(m => m.Code == "Code1Group1" && m.Delete == false))));
        }

        [Fact]
        public async Task AmmendSpecialRequestsFromBooking_AddMemo()
        {
            _referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>(){
                    new SpecialRequestsGroup()
                    {
                        Code = "Group 1",
                        SpecialRequests = new List<SpecialRequest>()
                        {
                            new SpecialRequest()
                            {
                                Code = "Code1Group2"
                            },
                        }
                    },
               });

            _referenceDataServiceMock
               .Setup(x => x.GetSpecialRequestContradictoryGroups())
               .ReturnsAsync(new List<SpecialRequestsGroup>());

            BookingResponse response = new BookingResponse()
            {
                BookingReference = "12345",
                SpecialRequests = new SpecialRequest[] { }
            };
            await _sut.AmmendSpecialRequestsFromBooking(new[] { "Code1Group2" }, response);

            _bookingRepositoryMock.Verify(x => x.ModifyMemo(response.BookingReference, It.Is<IEnumerable<BookingMemo>>(s => s.Any(m => m.Code == "Code1Group2" && m.Delete == false))));
        }

        [Fact]
        public async Task EnshureAmmendSSr_CanAmend()
        {


            BookingResponse response = new BookingResponse()
            {
                AmendmentInfo = new AmendmentsInfo()
                {
                    SpecialRequest = true
                }
            };
            response = await _sut.EnsureAmmendSSr(response, false);

            response.AmendmentInfo.SpecialRequest.Should().BeTrue();
        }

        [Fact]
        public async Task EnsureCreateSpecialRequests_SpecialRequestsIsDisabled_ThrowException()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestSettings())
                .ReturnsAsync(new Domain.Data.Settings.SpecialRequestSettingsSitecore()
                {
                    IsSpecialRequestActiveString = "0",
                    IsEligibleToAddSSRForDC = "1",
                    IsEligibleToAddSSRForHBG = "1"
                });

            var accom = new BookingAccommodation()
            {
                IsExt = true
            };

            var apiException = await Assert.ThrowsAsync<ApiException>(() => _sut.EnsureCreateSpecialRequests(accom));

            Assert.Equal("API-ERR-230008", apiException.Code.Code);
            Assert.Equal("Adding ssr is disabled.", apiException.Code.Description);
        }

        [Fact]
        public async Task EnsureCreateSpecialRequests_SpecialRequestsIsEnabled_WithoutException()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestSettings())
                .ReturnsAsync(new Domain.Data.Settings.SpecialRequestSettingsSitecore()
                {
                    IsSpecialRequestActiveString = "1",
                    IsEligibleToAddSSRForDC = "1",
                    IsEligibleToAddSSRForHBG = "1"
                });

            var accom = new BookingAccommodation()
            {
                IsExt = true
            };

            var exceptionAsync = await Record.ExceptionAsync(() => _sut.EnsureCreateSpecialRequests(accom));

            Assert.Null(exceptionAsync);
        }

        [Fact]
        public async Task EnsureCreateSpecialRequests_IsNotEligibleToAddSSRForHBG_ThrowException()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestSettings())
                .ReturnsAsync(new Domain.Data.Settings.SpecialRequestSettingsSitecore()
                {
                    IsSpecialRequestActiveString = "1",
                    IsEligibleToAddSSRForDC = "1",
                    IsEligibleToAddSSRForHBG = "0"
                });

            var accom = new BookingAccommodation()
            {
                IsExt = true
            };

            var apiException = await Assert.ThrowsAsync<ApiException>(() => _sut.EnsureCreateSpecialRequests(accom));

            Assert.Equal("API-ERR-230006", apiException.Code.Code);
            Assert.Equal("Adding ssr is not allowed for HBG.", apiException.Code.Description);
        }

        [Fact]
        public async Task EnsureCreateSpecialRequests_IsEligibleToAddSSRForHBG_WithoutException()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestSettings())
                .ReturnsAsync(new Domain.Data.Settings.SpecialRequestSettingsSitecore()
                {
                    IsSpecialRequestActiveString = "1",
                    IsEligibleToAddSSRForDC = "1",
                    IsEligibleToAddSSRForHBG = "1"
                });

            var accom = new BookingAccommodation()
            {
                IsExt = true
            };

            var exceptionAsync = await Record.ExceptionAsync(() => _sut.EnsureCreateSpecialRequests(accom));

            Assert.Null(exceptionAsync);
        }

        [Fact]
        public async Task EnsureCreateSpecialRequests_IsNotEligibleToAddSSRForDC_ThrowException()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestSettings())
                .ReturnsAsync(new Domain.Data.Settings.SpecialRequestSettingsSitecore()
                {
                    IsSpecialRequestActiveString = "1",
                    IsEligibleToAddSSRForDC = "0",
                    IsEligibleToAddSSRForHBG = "1"
                });

            var accom = new BookingAccommodation()
            {
                IsExt = false
            };

            var apiException = await Assert.ThrowsAsync<ApiException>(() => _sut.EnsureCreateSpecialRequests(accom));

            Assert.Equal("API-ERR-230007", apiException.Code.Code);
            Assert.Equal("Adding ssr is not allowed for DC.", apiException.Code.Description);
        }

        [Fact]
        public async Task EnsureCreateSpecialRequests_IsEligibleToAddSSRForDC_WithoutException()
        {
            _referenceDataServiceMock
                .Setup(x => x.GetSpecialRequestSettings())
                .ReturnsAsync(new Domain.Data.Settings.SpecialRequestSettingsSitecore()
                {
                    IsSpecialRequestActiveString = "1",
                    IsEligibleToAddSSRForDC = "1",
                    IsEligibleToAddSSRForHBG = "0"
                });

            var accom = new BookingAccommodation()
            {
                IsExt = false
            };

            var exceptionAsync = await Record.ExceptionAsync(() => _sut.EnsureCreateSpecialRequests(accom));

            Assert.Null(exceptionAsync);
        }

        [Theory]
        [MemberData(nameof(EnsureAmendSSrTestCases))]
        public async Task EnsureAmendSsr_IsDisabledByCrm_Exception(
            BookingResponse bookingResponse,
            ExceptionCode exceptionCode)
        {
            Func<Task<BookingResponse>> act = async () => await _sut.EnsureAmmendSSr(bookingResponse, true);

            await act.Should().ThrowExactlyAsync<ApiException>().Where(x => x.Code.Code == exceptionCode.Code);
        }

        public static IEnumerable<object[]> EnsureAmendSSrTestCases()
        {
            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.SSRAmendAllowedOnyForActiveBookings }
                    }
                 },
                 ApiExceptionCodes.SSRAmendAllowedOnyForActiveBookings
            };

            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.SSRAmmendNotAllowedForHBG }
                    }
                 },
                 ApiExceptionCodes.SSRAmmendNotAllowedForHBG
            };

            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.SSRAmendNotAllowedForDC }
                    }
                 },
                 ApiExceptionCodes.SSRAmendNotAllowedForDC
            };

            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.SSRAmendDepartureDate }
                    }
                 },
                 ApiExceptionCodes.SSRAmendDepartureDate
            };

            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.SSRAmendIsDisabled }
                    }
                 },
                 ApiExceptionCodes.SSRAmendIsDisabled
            };

            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.AmendSpecialRequestDisabledByChangeCountLimit }
                    }
                 },
                 ApiExceptionCodes.AmendSpecialRequestDisabledByChangeCountLimit
            };

            yield return new object[]
            {
                new BookingResponse()
                {
                    AmendmentInfo = new AmendmentsInfo()
                    {
                        SpecialRequest = false,
                        AmendBookingStatus = new List<AmendBookingStatus>{ AmendBookingStatus.AmendMemoDisabled }
                    }
                 },
                 ApiExceptionCodes.AmendMemoDisabled
            };
        }
    }
}