using AutoFixture;
using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.DataHub.Services;
using easyJet.Holidays.External.DataHub.SoapReference;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;

namespace easyJet.Holidays.External.DataHub.Tests
{
    public class DataHubServiceTests
    {
        private readonly Mock<DataHubSoap> _client = new();
        private readonly Mock<IOptions<AtcomSettings>> _atcomSettingsMock = new();
        private readonly AtcomSettings _atcomSettings;
        private readonly IFixture _fixture;
        DataHubService _sut;

        public DataHubServiceTests()
        {
            _fixture = new Fixture();
            
            // Setup AtcomSettings mock
            _atcomSettings = new AtcomSettings
            {
                UserCode = "TestUser123",
                TimeoutMilliSeconds = 30000,
                IgnoreAllErrors = false,
                ErrorCodesToIgnore = new[] { "ERROR001", "ERROR002" }
            };
            
            _atcomSettingsMock.Setup(x => x.Value).Returns(_atcomSettings);
            
            _sut = new DataHubService(_client.Object, _atcomSettingsMock.Object);
        }

        [Fact]
        public async Task SynchronizePnr_Success()
        {
            var references = new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            };

            var response = new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Control = new BaseTypeControl
                    {
                        Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub
                    },
                    Data_Hub = new ResponseData_Hub18
                    {
                        Item = new ResponseData_HubReservations
                        {
                            Res_Id = [new ResponseData_HubReservationsRes_Id { Value = "123" }]
                        },
                        Num_Res_Queued = "1"
                    }
                }
            };
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            var result = await _sut.SynchronizeSeats(references);

            result.Results.Values.Count(val => val.Status == SyncStatus.Queued).Should().Be(1);
        }

        [Fact]
        public async Task SynchronizePnr_ResponseHasErrors_Throw()
        {
            var references = new DatahubSyncRequest { Reservations = [new() { ReservationId = "some id" }] };
            var response = new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Data_Hub = new ResponseData_Hub18
                    {
                        Err_Num = "100",
                        Err_Text = "Error_text",
                        Num_Res_Queued = "1"
                    }
                }
            };

            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            await Assert.ThrowsAsync<ArgumentException>(() => _sut.SynchronizeSeats(references));
        }

        [Fact]
        public async Task SynchronizeBags_ResponseHasErrors_Throw()
        {
            var references = new DatahubSyncRequest { Reservations = [new() { ReservationId = "some id" }] };
            var response = new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Data_Hub = new ResponseData_Hub18
                    {
                        Err_Num = "100",
                        Err_Text = "Error_text",
                        Num_Res_Queued = "1"
                    }
                }
            };

            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            await Assert.ThrowsAsync<ArgumentException>(() => _sut.SynchronizeBags(references));
        }

        [Fact]
        public async Task SynchronizeSeats_refsAreNull_Throw()
        {
            var references = new DatahubSyncRequest();

            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeSeats(references));
        }

        [Theory]
        [MemberData(nameof(SyncBadResponseTestData))]
        public async Task SynchronizeSeats_badResponse_Throw(SynchronisePnrResponse response)
        {
            var references = _fixture.Create<DatahubSyncRequest>();
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);


            await Assert.ThrowsAsync<ArgumentException>(() => _sut.SynchronizeSeats(references));
        }

        [Fact]
        public async Task SynchronizeBags_refsAreNull_Throw()
        {
            var references = new DatahubSyncRequest();

            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeBags(references));
        }

        [Theory]
        [MemberData(nameof(SyncBadResponseTestData))]
        public async Task SynchronizeBags_badResponse_Throw(SynchronisePnrResponse response)
        {
            var references = _fixture.Create<DatahubSyncRequest>();
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);


            await Assert.ThrowsAsync<ArgumentException>(() => _sut.SynchronizeBags(references));
        }


        [Theory]
        [MemberData(nameof(SyncBadResponseTestData))]
        public async Task SynchronizeFlights_badResponse_Throw(SynchronisePnrResponse response)
        {
            var references = _fixture.Create<DatahubSyncRequest>();
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);


            await Assert.ThrowsAsync<ArgumentException>(() => _sut.SynchronizeFlights(references));
        }

        [Fact]
        public async Task SynchronizeFlightPnr_Success()
        {
            var references = new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            };

            var response = new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Control = new BaseTypeControl
                    {
                        Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub
                    },
                    Data_Hub = new ResponseData_Hub18
                    {
                        Item = new ResponseData_HubPnrs
                        {
                            Pnr = [new ResponseData_HubPnrsPnr { Value = "123" }]
                        },
                        Num_Res_Queued = "1"
                    }
                }
            };
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            var result = await _sut.SynchronizeFlights(references);

            result.Results.Values.Count(val => val.Status == SyncStatus.Queued).Should().Be(1);
        }

        [Fact]
        public async Task SynchronizeFlightPnr_ResponseHasErrors_Throw()
        {
            var references = new DatahubSyncRequest { Reservations = [new() { ReservationId = "some id" }] };
            var response = new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Data_Hub = new ResponseData_Hub18
                    {
                        Err_Num = "100",
                        Err_Text = "Error_text",
                        Num_Res_Queued = "1"
                    }
                }
            };

            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            await Assert.ThrowsAsync<ArgumentException>(() => _sut.SynchronizeFlights(references));
        }

        [Fact]
        public async Task SynchronizeFlights_pnrsAreNull_Throw()
        {
            var references = new DatahubSyncRequest();

            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeFlights(references));
        }

        [Fact]
        public async Task SynchronizeFlights_requestNull_Throw()
        {
            DatahubSyncRequest request = null;

            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeFlights(request!));
        }

        [Fact]
        public async Task SynchronizeSeats_requestNull_Throw()
        {
            DatahubSyncRequest request = null;

            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeSeats(request!));
        }

        [Fact]
        public async Task SynchronizeSeats_refsAreEmpty_Throw()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeSeats(new DatahubSyncRequest { Reservations = [] }));
        }

        [Fact]
        public async Task SynchronizeBags_requestNull_Throw()
        {
            DatahubSyncRequest request = null;

            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeBags(request!));
        }

        [Fact]
        public async Task SynchronizeBags_refsAreEmpty_Throw()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeBags(new DatahubSyncRequest { Reservations = [] }));
        }

        [Fact]
        public async Task SynchronizeFlights_pnrsAreEmpty_Throw()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.SynchronizeFlights(new DatahubSyncRequest { Reservations = [] }));
        }

        [Theory]
        [MemberData(nameof(SyncTestData))]
        public async Task SynchronizeFlightPnr_ExpectedResponses(DatahubSyncRequest request, SynchronisePnrResponse response, DatahubSyncResponse expected)
        {
            // Arrange
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            // Act
            var result = await _sut.SynchronizeFlights(request);

            // Assert
            result.Results.Values.Count(val => val.Status == SyncStatus.Queued).Should().Be(
                expected.Results.Values.Count(val => val.Status == SyncStatus.Queued));
        }

        [Theory]
        [MemberData(nameof(SyncSeatsTestData))]
        public async Task SynchronizeSeats_ExpectedResponses(DatahubSyncRequest request, SynchronisePnrResponse response, DatahubSyncResponse expected)
        {
            // Arrange
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            // Act
            var result = await _sut.SynchronizeSeats(request);

            // Assert
            result.Results.Values.Count(val => val.Status == SyncStatus.Queued).Should().Be(
                expected.Results.Values.Count(val => val.Status == SyncStatus.Queued));
        }

        [Theory]
        [MemberData(nameof(SyncSeatsTestData))]
        public async Task SynchronizeBags_ExpectedResponses(DatahubSyncRequest request, SynchronisePnrResponse response, DatahubSyncResponse expected)
        {
            // Arrange
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            // Act
            var result = await _sut.SynchronizeBags(request);

            // Assert
            result.Results.Values.Count(val => val.Status == SyncStatus.Queued).Should().Be(
                expected.Results.Values.Count(val => val.Status == SyncStatus.Queued));
        }

        [Fact]
        public async Task GetReservationData_Success()
        {
            // Arrange
            var request = new DatahubFetchRequest
            {
                ReservationId = "reservation123",
                Version = "1"
            };

            var expectedResponse = _fixture.Create<ReservationDataResponse>();

            _client.Setup(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()))
                .ReturnsAsync(expectedResponse);

            // Act
            var result = await _sut.GetReservationData(request);

            // Assert
            result.Should().BeEquivalentTo(expectedResponse);
            _client.Verify(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()), Times.Once);
        }

        [Fact]
        public async Task GetReservationData_RequestIsNull_ThrowsArgumentNullException()
        {
            // Arrange
            DatahubFetchRequest request = null;

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.GetReservationData(request!));
            _client.Verify(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()), Times.Never);
        }

        [Fact]
        public async Task GetReservationData_ReservationIdIsEmpty_ThrowsArgumentNullException()
        {
            // Arrange
            var request = new DatahubFetchRequest
            {
                ReservationId = string.Empty,
                Version = "1"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.GetReservationData(request));
            _client.Verify(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()), Times.Never);
        }

        [Fact]
        public async Task GetReservationData_ReservationIdIsNull_ThrowsArgumentNullException()
        {
            // Arrange
            var request = new DatahubFetchRequest
            {
                ReservationId = null,
                Version = "1"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentNullException>(() => _sut.GetReservationData(request));
            _client.Verify(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()), Times.Never);
        }

        [Fact]
        public async Task GetReservationData_BuildsRequestCorrectly()
        {
            // Arrange
            var request = new DatahubFetchRequest
            {
                ReservationId = "reservation123",
                Version = "1"
            };

            ReservationDataRequest capturedRequest = null;
            var expectedResponse = _fixture.Create<ReservationDataResponse>();

            _client.Setup(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()))
                .Callback<ReservationDataRequest>(req => capturedRequest = req)
                .ReturnsAsync(expectedResponse);

            // Act
            await _sut.GetReservationData(request);

            // Assert
            capturedRequest.Should().NotBeNull();
            capturedRequest?.Request.Data_Hub.Res_Id.Should().Be(request.ReservationId);
            capturedRequest?.Request.Data_Hub.Ver_Num.Should().Be(request.Version);
            capturedRequest?.Request.Data_Hub.User_Cd.Should().Be(_atcomSettings.UserCode); // Verify UserCode from settings
            capturedRequest?.Request.Data_Hub.Req_Tp.Should().Be(Data_Hub_ReqTypeReq_Tp.Fetch_Version);
            capturedRequest?.Request.Control.Msg_Tp.Should().Be(BaseTypeControlMsg_Tp.Data_Hub);
            capturedRequest?.Request.Control.Msg_Sub_Tp.Should().Be(BaseTypeControlMsg_Sub_Tp.Reservation_Data);
        }

        public static IEnumerable<object[]> SyncBadResponseTestData()
        {
            yield return new object[] {
                new SynchronisePnrResponse{ Response = new Response20 { Data_Hub = new ResponseData_Hub18 { Err_Num = "123" } } }
            };
        }

        [Fact]
        public async Task SynchronizeBagsPnr_Success()
        {
            var references = new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            };

            var response = new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Control = new BaseTypeControl
                    {
                        Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub
                    },
                    Data_Hub = new ResponseData_Hub18
                    {
                        Item = new ResponseData_HubReservations
                        {
                            Res_Id = [new ResponseData_HubReservationsRes_Id { Value = "123" }]
                        },
                        Num_Res_Queued = "1"
                    }
                }
            };
            _client.Setup(x => x.SynchronisePnrAsync(It.IsAny<SynchronisePnrRequest>())).ReturnsAsync(response);

            var result = await _sut.SynchronizeBags(references);

            result.Results.Values.Count(val => val.Status == SyncStatus.Queued).Should().Be(1);
        }
        
        [Fact]
        public async Task GetReservationData_WhenVersionIsMinusOne_DoesNotSetVerNum()
        {
            // Arrange
            var atcomSettings = new AtcomSettings { UserCode = "TestUser" };
            var mockClient = new Mock<DataHubSoap>();
            var service = new DataHubService(mockClient.Object, Options.Create(atcomSettings));
    
            var request = new DatahubFetchRequest
            {
                ReservationId = "ABC123",
                Version = "-1"
            };

            ReservationDataRequest capturedRequest = null;
            mockClient.Setup(x => x.ReservationDataAsync(It.IsAny<ReservationDataRequest>()))
                .Callback<ReservationDataRequest>(req => capturedRequest = req)
                .ReturnsAsync(new ReservationDataResponse());

            // Act
            await service.GetReservationData(request);

            // Assert
            Assert.NotNull(capturedRequest?.Request?.Data_Hub);
            Assert.Null(capturedRequest.Request.Data_Hub.Ver_Num);
        }


        public static IEnumerable<object[]> SyncTestData()
        {
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Control = new BaseTypeControl
                    {
                        Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub
                    },
                    Data_Hub = new ResponseData_Hub18
                    {
                        Item = new ResponseData_HubPnrs
                        {
                            Pnr = [new ResponseData_HubPnrsPnr { Value = "123" }]
                        },
                        Num_Res_Queued = "1"
                    }
                }
            },
            new DatahubSyncResponse
            {
                Results = new()
                {
                    {
                        "some id",
                        new(){Status = SyncStatus.Queued, ErrorCode = null, ErrorMessage = null}
                    }
                }
            }
            };

            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse(),
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse { Response = new() },
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse { Response = new Response20 { Data_Hub = new ResponseData_Hub18() } },
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },

            new SynchronisePnrResponse { Response = new Response20 { Data_Hub = new ResponseData_Hub18{ Err_Num = "" } } },
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
        }

        public static IEnumerable<object[]> SyncSeatsTestData()
        {
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse
            {
                Response = new Response20
                {
                    Control = new BaseTypeControl
                    {
                        Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub
                    },
                    Data_Hub = new ResponseData_Hub18
                    {
                        Item = new ResponseData_HubReservations
                        {
                            Res_Id = [new ResponseData_HubReservationsRes_Id { Value = "123" }]
                        },
                        Num_Res_Queued = "1"
                    }
                }
            },
            new DatahubSyncResponse
            {
                Results = new()
                {
                    {
                        "some id",
                        new SyncAttempt(){Status = SyncStatus.Queued, ErrorCode = null, ErrorMessage = null}
                    }
                }
            }
            };

            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse(),
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse { Response = new() },
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },
            new SynchronisePnrResponse { Response = new Response20 { Data_Hub = new ResponseData_Hub18() } },
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
            yield return new object[] {
            new DatahubSyncRequest
            {
                Reservations = [new ReservationRequest { ReservationId = "some id" }]
            },

            new SynchronisePnrResponse { Response = new Response20 { Data_Hub = new ResponseData_Hub18{ Err_Num = "" } } },
            new DatahubSyncResponse
            {
                Results = new()
            }
            };
        }
    }
}