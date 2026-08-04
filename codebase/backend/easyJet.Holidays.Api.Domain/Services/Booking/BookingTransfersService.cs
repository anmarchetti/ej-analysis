#nullable enable
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking.Repository;

namespace easyJet.Holidays.Api.Domain.Services.Booking;

/// <inheritdoc/>
public sealed class BookingTransfersService(IBookingTransfersRepository bookingTransfersRepository,
    IBookingFetchService bookingFetchService)
    : IBookingTransfersService
{
    /// <inheritdoc/>
    public async ValueTask<TransferDetailsResponse?> GetTransferDetailsFor(GetBookingRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        
        // Validate booking credentials - will throw ApiException if credentials do not match
        await bookingFetchService.Get(request);

        return await GetTransferDetailsByBookingReference(request.BookingReference, cancellationToken);
    }

    private async ValueTask<TransferDetailsResponse?> GetTransferDetailsByBookingReference(string bookingReference,
        CancellationToken cancellationToken)
    {
        var transferDetails = await bookingTransfersRepository.GetTransferDetails(bookingReference, cancellationToken);

        if (transferDetails is null)
        {
            return null;
        }

        return MapToTransferDetailsResponse(transferDetails);
    }

    private static TransferDetailsResponse MapToTransferDetailsResponse(TransferDetailsPayload payload)
    {
        return new TransferDetailsResponse
        {
            BookingReference = payload.BookingReference,
            InboundTransferDetails = MapToTransferDirection(payload.Inbound),
            OutboundTransferDetails = MapToTransferDirection(payload.Outbound)
        };
    }

    private static TransferDirection? MapToTransferDirection(TransferDirectionPayload? direction)
    {
        if (direction == null)
        {
            return null;
        }

        return new TransferDirection
        {
            TransferType = MapTransferType(direction.TransferType),
            Airport = direction.Airport,
            PickupTime = direction.PickupTime?.UtcDateTime,
            PickupDate = direction.PickupTime?.UtcDateTime.Date,
            DropoffTime = direction.DropoffTime?.UtcDateTime,
            DropoffDate = direction.DropoffTime?.UtcDateTime.Date,
            TransferMinutes = direction.TransferMinutes ?? 0,
            PickupLocation = MapPickupLocation(direction),
            PickupLocationInstructions = NullIfWhiteSpace(direction.Instructions),
            PickupLocationName = FirstNonEmpty(direction.PickupLocationDescription, direction.DeskName,
                direction.DeskDescription),
            Vehicle = new Vehicle
            {
                VehicleRegistration = direction.VehicleRego,
                VehicleDriverName = direction.VehicleDriver,
                VehicleDriverPhone = NullIfWhiteSpace(direction.DriverContact),
                VehicleType = NullIfWhiteSpace(direction.VehicleType),
                VehicleColour = NullIfWhiteSpace(direction.VehicleColor),
                Provider = direction.ProviderName
            },
            What3WordsLocation = NullIfWhiteSpace(direction.WhatThreeWords)
        };
    }

    private static LocationPoint? MapPickupLocation(TransferDirectionPayload direction)
    {
        var latitude = direction.DeskLatitude ?? direction.PickupLatitude;
        var longitude = direction.DeskLongitude ?? direction.PickupLongitude;

        if (latitude is null || longitude is null)
        {
            return null;
        }

        return new LocationPoint
        {
            Latitude = latitude.Value,
            Longitude = longitude.Value
        };
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    internal static TransferItemType MapTransferType(string? transferType)
    {
        if (string.IsNullOrWhiteSpace(transferType))
        {
            return TransferItemType.Unknown;
        }

        var normalized = transferType.Replace("_", string.Empty, StringComparison.InvariantCultureIgnoreCase)
            .Replace("-", string.Empty, StringComparison.InvariantCultureIgnoreCase)
            .Replace(" ", string.Empty, StringComparison.InvariantCultureIgnoreCase)
            .ToUpperInvariant();

        return normalized switch
        {
            "PRIVATE" => TransferItemType.Private,
            "SHARED" => TransferItemType.Shared,
            "NOTRANSFER" => TransferItemType.NoTransfer,
            _ => TransferItemType.Unknown
        };
    }
}