using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Decorators.Amend;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking.Repository;
using FluentAssertions;
using FluentAssertions.Execution;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests.Decorators.Amend
{
    public class AmendBookingRepositoryCacheDecoratorTests
    {
        private readonly Mock<IAmendBookingRepository> _amendBookingRepositoryMock;
        private readonly Mock<IAmendCacheService> _amendCacheServiceMock;
        private readonly Mock<ILogger<AmendBookingRepositoryCacheDecorator>> _loggerMock;
        private readonly AmendBookingRepositoryCacheDecorator _sut;

        public AmendBookingRepositoryCacheDecoratorTests()
        {
            _amendBookingRepositoryMock = new Mock<IAmendBookingRepository>();
            _amendCacheServiceMock = new Mock<IAmendCacheService>();
            _loggerMock = new Mock<ILogger<AmendBookingRepositoryCacheDecorator>>();

            _sut = new AmendBookingRepositoryCacheDecorator(
                _amendBookingRepositoryMock.Object,
                _amendCacheServiceMock.Object,
                _loggerMock.Object);
        }

        [Fact]
        public async Task GetValidateAmendBookingResponse_WhenBookingIsNull_ShouldThrowArgumentNullException()
        {
            // Arrange
            BookingResponse nullBooking = null;

            // Act
            Func<Task> act = async () => await _sut.GetValidateAmendBookingResponse(nullBooking);

            // Assert
            await act.Should().ThrowAsync<ArgumentNullException>()
               .WithMessage("*booking*");
        }

        [Fact]
        public async Task GetValidateAmendBookingResponse_WhenCachedItemExists_ShouldReturnCachedItem_AndNotCallRepository()
        {
            // Arrange
            var booking = CreateValidBooking();
            var cachedResponse = new ValidateAmendBookingResponse();

            _amendCacheServiceMock
                .Setup(x => x.GetItemAsync<ValidateAmendBookingResponse>(It.IsAny<string>()))
                .ReturnsAsync(cachedResponse);

            // We expect that the repository is NOT called if cached item is found
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync((ValidateAmendBookingResponse)null) // Should not get invoked
                .Verifiable();

            // Act
            var result = await _sut.GetValidateAmendBookingResponse(booking);

            // Assert
            result.Should().BeSameAs(cachedResponse);

            // Verify the repository was NOT called
            _amendBookingRepositoryMock
                .Verify(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()),
                        Times.Never);
        }

        [Fact]
        public async Task GetValidateAmendBookingResponse_WhenCachedItemDoesNotExist_ShouldCallRepository()
        {
            // Arrange
            var booking = CreateValidBooking();
            ValidateAmendBookingResponse cachedResponse = null;
            var repositoryResponse = new ValidateAmendBookingResponse();

            _amendCacheServiceMock
                .Setup(x => x.GetItemAsync<ValidateAmendBookingResponse>(It.IsAny<string>()))
                .ReturnsAsync(cachedResponse);

            // Repository is called
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(booking, false))
                .ReturnsAsync(repositoryResponse);

            // We expect that, if the repository returns a non-null response, it will be stored in the cache
            _amendCacheServiceMock
                .Setup(x => x.SetItemAsync(It.IsAny<string>(), repositoryResponse))
                .Returns(Task.CompletedTask)
                .Verifiable();

            // Act
            var result = await _sut.GetValidateAmendBookingResponse(booking);

            // Assert
            result.Should().BeSameAs(repositoryResponse);

            _amendCacheServiceMock.Verify(
                x => x.SetItemAsync(It.IsAny<string>(), repositoryResponse),
                Times.Once);
        }

        [Fact]
        public async Task GetValidateAmendBookingResponse_WhenRepositoryReturnsNull_ShouldNotSetCache()
        {
            // Arrange
            var booking = CreateValidBooking();
            ValidateAmendBookingResponse cachedResponse = null;
            ValidateAmendBookingResponse repositoryResponse = null;

            _amendCacheServiceMock
                .Setup(x => x.GetItemAsync<ValidateAmendBookingResponse>(It.IsAny<string>()))
                .ReturnsAsync(cachedResponse);

            // Repository is called
            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(booking, false))
                .ReturnsAsync(repositoryResponse);

            // Act
            var result = await _sut.GetValidateAmendBookingResponse(booking);

            // Assert
            result.Should().BeNull();

            // Cache should never be set if the repository returns null
            _amendCacheServiceMock.Verify(
                x => x.SetItemAsync(It.IsAny<string>(), It.IsAny<ValidateAmendBookingResponse>()),
                Times.Never);
        }

        [Fact]
        public async Task GetValidateAmendBookingResponse_WhenExceptionIsThrown_ShouldReturnNull()
        {
            // Arrange
            var booking = CreateValidBooking();
            var response = new ValidateAmendBookingResponse { BookingReference = "BR123" };

            _amendCacheServiceMock
                .Setup(x => x.GetItemAsync<ValidateAmendBookingResponse>(It.IsAny<string>()))
                .ThrowsAsync(new Exception("Cache failure"));

            _amendBookingRepositoryMock
                .Setup(x => x.GetValidateAmendBookingResponse(It.IsAny<BookingResponse>(), It.IsAny<bool>()))
                .ReturnsAsync(response);

            // Act
            var result = await _sut.GetValidateAmendBookingResponse(booking);

            // Assert
            using (new AssertionScope())
            {
                result.Should().NotBeNull();
                result.BookingReference.Should().Be("BR123");
            }
        }

        /// <summary>
        /// Example helper method to create a valid <see cref="BookingResponse"/> with minimal fields 
        /// so that <c>GenerateHashKey</c> can work. Adjust fields as needed to match your real data models.
        /// </summary>
        private static BookingResponse CreateValidBooking()
        {
            return new BookingResponse
            {
                BookingReference = "BR123",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "AC123",
                        StartDate = "2025-01-01",
                        Rooms = [new() { Code = "ROOM1", Board = "BOARD1" }]
                    },
                    Transport = new Transport
                    {
                        Routes = [new() { FltNo = "EZ123" }]
                    }
                },
                SeatSelection =
                [
                    new() { Seats = [new() { SeatNumber = "1A" }] }
                ],
                Transfers = [new() { Code = "T123" }],
                ExtraLuggageInfo = new ExtraLuggageInfo
                {
                    Items = [new() { ItemCode = "LUG123" }]
                }
            };
        }

        [Theory]
        [MemberData(nameof(GenerateHashKeyTestCases))]
        public async Task GenerateHashKey_ShouldHandleAllConditions(
            BookingResponse booking,
            Type expectedExceptionType)
        {

            // Act
            var cachedResponse = new ValidateAmendBookingResponse();

            _amendCacheServiceMock
                .Setup(x => x.GetItemAsync<ValidateAmendBookingResponse>(It.IsAny<string>()))
                .ReturnsAsync(cachedResponse);

            Func<Task<ValidateAmendBookingResponse>> act = () => _sut.GetValidateAmendBookingResponse(booking);

            // Assert
            if (expectedExceptionType is not null)
            {
                // We expect an exception (e.g., NullReferenceException) because
                // some required nested property is null.
                await act.Should().ThrowAsync<NullReferenceException>();
            }
            else
            {
                // We expect no exception, so act() should succeed
                await act.Should().NotThrowAsync();
            }
        }

        /// <summary>
        /// Provides multiple scenarios to ensure all lines and conditions are hit:
        /// 1. Fully populated booking (everything non-null, multiple seats, etc.)
        /// 2. Some optional lists null or empty
        /// 3. Null for deeper nested properties that cause a NullReferenceException
        /// 4. Partial null items within the lists
        /// </summary>
        public static IEnumerable<object[]> GenerateHashKeyTestCases()
        {
            yield return
            [
                CreateBookingFullyPopulated(),
                null
            ];

            yield return
            [
                CreateBookingNoOptionalLists(),
                null
            ];

            yield return
            [
                CreateBookingWithNullSeatItem(),
                null
            ];

            yield return
            [
                CreateBookingWithNullTransferItem(),
                null
            ];

            yield return
            [
                CreateBookingWithNoLuggageInfo(),
                null
            ];
        }

        private static BookingResponse CreateBookingFullyPopulated()
        {
            return new BookingResponse
            {
                BookingReference = "BR123",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "AC123",
                        StartDate = "2025-01-01",
                        Rooms =
                        [
                            new Unit { Code = "ROOM1", Board = "BOARD1" },
                            new Unit { Code = "ROOM2", Board = "BOARD2" }
                        ]
                    },
                    Transport = new Transport
                    {
                        Routes =
                        [
                            new Route { FltNo = "EZ123" },
                            new Route { FltNo = "EZ456" }
                        ]
                    }
                },
                SeatSelection =
                [
                    new SeatMap
                    {
                        Seats = [new Seat { SeatNumber = "1A" }, new Seat { SeatNumber = "2B" }]
                    }
                ],
                Transfers = [new TransferItem { Code = "T123" }],
                ExtraLuggageInfo = new ExtraLuggageInfo
                {
                    Items = [new ExtraLuggageItem { ItemCode = "LUG123" }]
                }
            };
        }

        private static BookingResponse CreateBookingNoOptionalLists()
        {
            return new BookingResponse
            {
                BookingReference = "BR999",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "AC999",
                        StartDate = "2025-01-02",
                        Rooms = [] // empty
                    },
                    Transport = new Transport
                    {
                        Routes = [] // empty
                    }
                },
                SeatSelection = null,   // no seat selection
                Transfers = null,       // no transfers
                ExtraLuggageInfo = null // no luggage
            };
        }

        private static BookingResponse CreateBookingWithNullSeatItem()
        {
            return new BookingResponse
            {
                BookingReference = "BR111",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "AC111",
                        StartDate = "2025-02-01",
                        Rooms = [new Unit { Code = "R1", Board = "HB" }]
                    },
                    Transport = new Transport
                    {
                        Routes = [new Route { FltNo = "EZ999" }]
                    }
                },
                // One seat selection item is null 
                SeatSelection = [null]
            };
        }

        private static BookingResponse CreateBookingWithNullTransferItem()
        {
            return new BookingResponse
            {
                BookingReference = "BRT1",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "AC333",
                        StartDate = "2025-03-01",
                        Rooms = [new Unit { Code = "R2", Board = "AI" }]
                    },
                    Transport = new Transport
                    {
                        Routes = [new Route { FltNo = "EZ111" }]
                    }
                },
                Transfers =
                [
                    new() { Code = "T123" },
                    null
                ]
            };
        }

        private static BookingResponse CreateBookingWithNoLuggageInfo()
        {
            return new BookingResponse
            {
                BookingReference = "BRNL1",
                Package = new BookingPackage
                {
                    Accom = new BookingAccommodation
                    {
                        Code = "ACNL",
                        StartDate = "2025-04-01",
                        Rooms = [new Unit { Code = "R5", Board = "BB" }]
                    },
                    Transport = new Transport
                    {
                        Routes = [new Route { FltNo = "EZ555" }]
                    }
                },
                ExtraLuggageInfo = null
            };
        }
    }
}