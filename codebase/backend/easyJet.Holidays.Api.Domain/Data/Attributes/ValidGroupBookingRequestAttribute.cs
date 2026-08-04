using easyJet.Holidays.Api.Domain.Data.Booking;
using System.ComponentModel.DataAnnotations;

namespace easyJet.Holidays.Api.Domain.Data.Attributes;

[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public class ValidGroupBookingRequestAttribute : ValidationAttribute
{
    private const int MinChildAge = 2;
    private const int MaxChildAge = 15;
    private const int MinimumPassengersAmount = 9;

    protected override ValidationResult IsValid(object value, ValidationContext validationContext)
    {
        var request = value as GroupBookingRequest;

        if (request is null) // cannot be triggered in tests, since FromBody does this check. added mostly to prevent warnings
        {
            return new ValidationResult("Request should not be null");
        }

        if (request.TotalPassengers is null)
        {
            return new ValidationResult($"Field {nameof(request.TotalPassengers)} is required.");
        }

        if (request.Rooms is null)
        {
            return new ValidationResult($"Field {nameof(request.Rooms)} is required.");
        }

        if (!request.Rooms.Any())
        {
            return new ValidationResult($"Field {nameof(request.Rooms)} should contain at least 1 room.");
        }

        if (request.NumberOfRooms > 0 && request.Rooms.Count != request.NumberOfRooms)
        {
            return new ValidationResult(
                $"Field {nameof(request.Rooms)} should contain rooms count, equal to one, specified for {nameof(request.NumberOfRooms)}, when exact number of rooms is specified.");
        }

        var roomAdultsCount = request.Rooms.Sum(x => x.Adults);
        var roomChildrenCount = request.Rooms.Sum(x => x.Children);
        var roomInfantsCount = request.Rooms.Sum(x => x.Infants);

        var totalPassengersCount = request.TotalPassengers.Adults + request.TotalPassengers.Children +
                                   request.TotalPassengers.Infants;

        if (roomAdultsCount != request.TotalPassengers.Adults)
        {
            return new ValidationResult(
                $"Total {nameof(request.TotalPassengers.Adults)} count in field {nameof(request.TotalPassengers.Adults)} should correspond to total number, specified across {nameof(request.Rooms)} field.");
        }

        if (roomChildrenCount != request.TotalPassengers.Children)
        {
            return new ValidationResult(
                $"Total {nameof(request.TotalPassengers.Children)} count in field {nameof(request.TotalPassengers.Children)} should correspond to total number, specified across {nameof(request.Rooms)} field.");
        }

        if (roomInfantsCount != request.TotalPassengers.Infants)
        {
            return new ValidationResult(
                $"Total {nameof(request.TotalPassengers.Infants)} count in field {nameof(request.TotalPassengers.Infants)} should correspond to total number, specified across {nameof(request.Rooms)} field.");
        }

        if (totalPassengersCount < MinimumPassengersAmount)
        {
            return new ValidationResult(
                $"the total passengers amount should be at least {MinimumPassengersAmount}.");
        }

        foreach (var room in request.Rooms)
        {
            if (room.Infants > room.Adults)
            {
                return new ValidationResult(
                    "Each room should contain at least as many Adults, as Infants number specified for it.");
            }

            if (room.ChildAges.Count != room.Children)
            {
                return new ValidationResult("Specified number of ages should be equal to number of children.");
            }

            if (room.ChildAges.Any(age => age > MaxChildAge || age < MinChildAge))
            {
                return new ValidationResult($"Children could have ages only between {MinChildAge} and {MaxChildAge}.");
            }

        }

        return ValidationResult.Success;
    }
}