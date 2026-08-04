using easyJet.Holidays.Api.Domain.Data.DynamoDB.FreeNights;
using easyJet.Holidays.Api.Domain.Interfaces.FreeNights;
using easyJet.Holidays.External.AWS.FreeNightsDataSync.Interfaces;

namespace easyJet.Holidays.External.AWS.FreeNightsDataSync.Services;

/// <inheritdoc cref="IFreeNightsSyncService"/>
public class FreeNightsSyncService : IFreeNightsSyncService
{
    private readonly IFreeNightsService _freeNightsService;
    private readonly IFreeNightsRepository _freeNightsRepository;

    /// <summary>
    /// standard ctor
    /// </summary>
    public FreeNightsSyncService(IFreeNightsService freeNightsService, IFreeNightsRepository freeNightsRepository)
    {
        _freeNightsService = freeNightsService;
        _freeNightsRepository = freeNightsRepository;
    }

    /// <inheritdoc />>
    public async Task Sync()
    {
        //delete old data from dynamoDb table
        await _freeNightsService.DeleteAll();

        //get free nights data from Eskel
        var freeNights = await _freeNightsRepository.GetAll();

        if (freeNights is null or [])
        {
            throw new InvalidOperationException("Free nights info from Eskel is empty or null");
        }

        //delete broken items from Eskel system
        freeNights = freeNights.Where(night => night.TravelStartDate.HasValue && night.TravelEndDate.HasValue &&
                                               night.CurrentStay.HasValue && night.CurrentFree.HasValue &&
                                               !string.IsNullOrWhiteSpace(night.AccommodationCode) &&
                                               !string.IsNullOrWhiteSpace(night.AccommodationName) &&
                                               !string.IsNullOrWhiteSpace(night.RoomCode)).ToArray();

        //group by AccommodationCode
        var freeNightsByAtcomCodes = freeNights.GroupBy(body => body.AccommodationCode)
            .Where(group => !string.IsNullOrEmpty(group.Key))
            .Select(group => new AccomFreeNights()
            {
                AccommodationCode = group.Key,
                AccommodationName = group.FirstOrDefault()?.AccommodationName,
                AvailableFreeNights = group.Select(Map).ToList()
            }).ToList();

        //save free nights data into dynamoDb
        await _freeNightsService.Put(freeNightsByAtcomCodes);
    }

    private static FreeNight Map(Models.FreeNight freeNightModel)
    {
        return new FreeNight()
        {
            RoomCode = freeNightModel.RoomCode,
            CurrentFree = freeNightModel.CurrentFree.GetValueOrDefault(),
            CurrentStay = freeNightModel.CurrentStay.GetValueOrDefault(),
            //Format dates due to issue with DateTime serialization in AWS SDK
            //see https://aws.amazon.com/ru/blogs/developer/datetime-serialization-changes-in-the-aws-sdk-for-net-and-awspowershell-modules/
            TravelStartDate = new DateTime(freeNightModel.TravelStartDate.GetValueOrDefault().Ticks, DateTimeKind.Utc),
            TravelEndDate = new DateTime(freeNightModel.TravelEndDate.GetValueOrDefault().Ticks, DateTimeKind.Utc),
            MinStay = freeNightModel.MinStay ?? 1
        };
    }
}