using easyJet.Holidays.Api.Domain.Data.PackageOffers;
using easyJet.Holidays.Api.Domain.Settings;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;

namespace easyJet.Holidays.Api.Domain.Tests
{
    public class BaseSearchRequestTests
    {
        [Theory]
        [MemberData(nameof(BaseSearchRequestTestsData.Map_InvalidRequest), MemberType = typeof(BaseSearchRequestTestsData))]
        public void Validate_Should_Complain_OneachError(BaseSearchRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, new BaseSearchRequestTestsServiceProvider(), new Dictionary<object, object>()));

            // Assert
            actual.Select(v => v.ErrorMessage).Any(m => m == "Total number of guests should not exceed 5.").Should().BeTrue();
            actual.Select(v => v.ErrorMessage).Any(m => m == "Number of infants should not exceed 4.").Should().BeTrue();
            actual.Select(v => v.ErrorMessage).Any(m => m == "Number of infants per adult should not exceed 3.").Should().BeTrue();
            actual.Select(v => v.ErrorMessage).Any(m => m == "Number of children per adult should not exceed 2.").Should().BeTrue();

        }

        [Theory]
        [MemberData(nameof(BaseSearchRequestTestsData.Map_ZerosRequest), MemberType = typeof(BaseSearchRequestTestsData))]
        public void Validate_ZerosAndNegatives_OneachError(string because, BaseSearchRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, new BaseSearchRequestTestsServiceProvider(), new Dictionary<object, object>()));

            // Assert
            var errorMessages = actual.Select(v => v.ErrorMessage);
            errorMessages.Any(m => m == "At least one adult should be presented in room.").Should().BeTrue(because);
            errorMessages.Any(m => m == "Number of Children should be non-negative.").Should().BeTrue(because);
            errorMessages.Any(m => m == "Number of Infants should be non-negative.").Should().BeTrue(because);
        }

        [Theory]
        [MemberData(nameof(BaseSearchRequestTestsData.Map_OneTimeSlotIsEmptyRequest), MemberType = typeof(BaseSearchRequestTestsData))]
        public void Validate_OneTimeSlotIsEmpty_ReturnError(string because, BaseSearchRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, new BaseSearchRequestTestsServiceProvider(), new Dictionary<object, object>()));

            // Assert
            var errorMessages = actual.Select(v => v.ErrorMessage);
            errorMessages.Any(m => m == "One time slot of the OutboundTimeSlots values is empty").Should().BeTrue(because);
            errorMessages.Any(m => m == "One time slot of the InboundTimeSlots values is empty").Should().BeTrue(because);
        }

        [Theory]
        [MemberData(nameof(BaseSearchRequestTestsData.Map_OneTimeSlotIsLowRegisterRequest), MemberType = typeof(BaseSearchRequestTestsData))]
        public void Validate_OneTimeSlotIsLowRegister_ReturnError(string because, BaseSearchRequest request)
        {
            // Act
            var actual = request.Validate(new System.ComponentModel.DataAnnotations.ValidationContext(request, new BaseSearchRequestTestsServiceProvider(), new Dictionary<object, object>()));

            // Assert
            var errorMessages = actual.Select(v => v.ErrorMessage);
            errorMessages.Any(m => m == "One time slot of the InboundTimeSlots values is in low register").Should().BeTrue(because);
            errorMessages.Any(m => m == "One time slot of the OutboundTimeSlots values is in low register").Should().BeTrue(because);
        }
    }

    public class BaseSearchRequestTestsData
    {
        public static IEnumerable<object[]> Map_InvalidRequest =>
            new List<object[]>
            {
                new object[] {
                    new BaseSearchRequest()
                    {
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation {
                                Adults = 2,
                                Children = 5,
                                Infants = 7
                            }
                        },
                    }
                },
                // The same but 2 rooms
                new object[] {
                    new BaseSearchRequest()
                    {
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation {
                                Adults = 1,
                                Children = 4,
                                Infants = 6
                            },
                            new RoomAllocation {
                                Adults = 1,
                                Children = 1,
                                Infants = 1
                            }
                        },
                    }
                }
            };


        public static IEnumerable<object[]> Map_ZerosRequest =>
            new List<object[]>
            {
                new object[] {
                    "One invalid room",
                    new BaseSearchRequest()
                    {
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation {
                                Adults = 0,
                                Children = -1,
                                Infants = -2
                            },
                        },

                    },
                },
                new object[] {
                    "First room is valid, 2nd is invalid",
                    new BaseSearchRequest()
                    {
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation {
                                Adults = 0,
                            },
                            new RoomAllocation {
                                Adults = 0,
                                Children = -1,
                                Infants = -2
                            }
                        },
                    },
                }
            };

        public static IEnumerable<object[]> Map_OneTimeSlotIsEmptyRequest =>
            new List<object[]>
            {
                new object[] {
                    "One time slot is empty",
                    new BaseSearchRequest()
                    {
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation {
                                Adults = 2,
                                Children = 1,
                                Infants = 0
                            },
                        },
                        OutboundTimeSlots = "A,,C",
                        InboundTimeSlots = "A,,C"
                    },
                }
            };

        public static IEnumerable<object[]> Map_OneTimeSlotIsLowRegisterRequest =>
            new List<object[]>
            {
                new object[] {
                    "One time slot is in low register",
                    new BaseSearchRequest()
                    {
                        Room = new List<RoomAllocation>() {
                            new RoomAllocation {
                                Adults = 2,
                                Children = 1,
                                Infants = 0
                            },
                        },
                        OutboundTimeSlots = "A,b,C",
                        InboundTimeSlots = "A,b,C"
                    },
                }
            };
    }


    public class BaseSearchRequestTestsServiceProvider : IServiceProvider
    {
        public object GetService(Type serviceType)
        {
            if (serviceType == typeof(IOptions<SearchSettings>))
            {
                return new BaseSearchRequestTestsServiceOptionsSearchSettings();
            }

            return null;
        }
    }


    public class BaseSearchRequestTestsServiceOptionsSearchSettings : IOptions<SearchSettings>
    {
        public SearchSettings Value => new SearchSettings()
        {
            MaxNumberOfGuests = 5,
            MaxNumberOfInfants = 4,
            MaxNumberOfInfantsPerAdult = 3,
            MaxNumberOfChildrenPerAdult = 2
        };
    }
}
