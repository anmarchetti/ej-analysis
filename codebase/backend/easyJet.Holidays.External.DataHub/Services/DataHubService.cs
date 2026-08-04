using easyJet.Holidays.Api.Domain.Data.SharedServices.DataHub;
using easyJet.Holidays.Api.Domain.Extensions;
using easyJet.Holidays.Api.Domain.Settings;
using easyJet.Holidays.External.DataHub.Interfaces;
using easyJet.Holidays.External.DataHub.SoapReference;
using Microsoft.Extensions.Options;

namespace easyJet.Holidays.External.DataHub.Services;

/// <inheritdoc/>
public class DataHubService : IDataHubService
{
    private const string DefaultSeatsPriority = "500";
    private const string DefaultBagsPriority = "500";
    private const string DefaultFlightsPriority = "1";
    private readonly DataHubSoap _client;
    private readonly AtcomSettings _atcomSettings;

    /// <summary>
    /// ctor
    /// </summary>
    /// <param name="client"></param>
    /// <param name="atcomSettings"></param>
    public DataHubService(DataHubSoap client, IOptions<AtcomSettings> atcomSettings)
    {
        _client = client;
        _atcomSettings = atcomSettings?.Value ?? throw new ArgumentNullException(nameof(atcomSettings));
    }


    /// <inheritdoc/>
    public async Task<DatahubSyncResponse> SynchronizeFlights(DatahubSyncRequest? request)
    {
        ValidateRequest(request);
        FilterReservations(request!);

        var result = await _client.SynchronisePnrAsync(BuildFlightsRequest(request!));

         ValidateResponse(result);

        return BuildFlightResponse(result, request!.Reservations.ToList());
    }

    /// <inheritdoc/>
    public async Task<DatahubSyncResponse> SynchronizeSeats(DatahubSyncRequest? request)
    {
        ValidateRequest(request);

        FilterReservations(request!);

        var result = await _client.SynchronisePnrAsync(BuildItemsRequest(request!, DefaultSeatsPriority, RequestData_HubReservationsRes_IdSource.EFSC));

        ValidateResponse(result);

        return BuildItemsResponse(result, request!.Reservations.ToList());
    }

    /// <inheritdoc />
    public async Task<DatahubSyncResponse> SynchronizeBags(DatahubSyncRequest? request)
    {
        ValidateRequest(request);
        FilterReservations(request!);

        var result = await _client.SynchronisePnrAsync(BuildItemsRequest(request!, DefaultBagsPriority, RequestData_HubReservationsRes_IdSource.EFAC));

        ValidateResponse(result);

        return BuildItemsResponse(result, request!.Reservations.ToList());
    }

    private static void ValidateResponse(SynchronisePnrResponse result)
    {
        if (!string.IsNullOrEmpty(result.Response?.Data_Hub?.Err_Num))
            throw new ArgumentException(result.Response?.Data_Hub?.Err_Text);
    }

    private static void ValidateRequest(DatahubSyncRequest? request)
    {
        if (request is null || request.Reservations.IsNullOrEmpty())
            throw new ArgumentNullException(nameof(request));
    }

    private static void FilterReservations(DatahubSyncRequest request)
    {
        request.Reservations = request.Reservations.DistinctBy(item => item.ReservationId).ToList();
    }

    /// <inheritdoc/>
    public async Task<ReservationDataResponse> GetReservationData(DatahubFetchRequest request)
    {
        if (request is null || string.IsNullOrEmpty(request.ReservationId))
            throw new ArgumentNullException(nameof(request));

        return await _client.ReservationDataAsync(BuildReservationDataRequest(request));
    }

    private ReservationDataRequest BuildReservationDataRequest(DatahubFetchRequest datahubFetchRequest)
    {
        var dataHub = new Data_Hub_ReqType()
        {
            Res_Id = datahubFetchRequest.ReservationId,
            Req_Tp = Data_Hub_ReqTypeReq_Tp.Fetch_Version,
            User_Cd = _atcomSettings.UserCode
        };

        if (datahubFetchRequest.Version != "-1")
        {
            dataHub.Ver_Num = datahubFetchRequest.Version;
        }

        var request = new Request()
        {
            Data_Hub = dataHub,
            Control = new BaseTypeControl()
            {
                Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub,
                Msg_Sub_Tp = BaseTypeControlMsg_Sub_Tp.Reservation_Data
            }
        };

        return new ReservationDataRequest(request);
    }

    private static SynchronisePnrRequest BuildFlightsRequest(DatahubSyncRequest request)
    {
        Request20 request20 = BuildRequest20Flights(request, DefaultFlightsPriority, RequestData_HubPnrsPnrSource.EFTC);

        return new SynchronisePnrRequest { Request = request20 };
    }

    private static SynchronisePnrRequest BuildItemsRequest(DatahubSyncRequest request, string priority, RequestData_HubReservationsRes_IdSource source)
    {
        Request20 request20 = BuildRequest20Items(request, priority, source);
        return new SynchronisePnrRequest { Request = request20 };
    }

    private static Request20 BuildRequest20Flights(DatahubSyncRequest request, string defaultPriority, RequestData_HubPnrsPnrSource source)
    {
        var pnrs = request.Reservations.Select(reservation => new RequestData_HubPnrsPnr
        {
            Value = reservation.ReservationId,
            Priority = reservation.Priority ?? request.Priority ?? defaultPriority,
            Source = source,
            SourceSpecified = true
        }).ToArray();

        RequestData_HubPnrs reservationsRequest = new()
        {
            Pnr = pnrs
        };

        var request20 = new Request20()
        {
            Control = new BaseTypeControl()
            {
                Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub,
                Msg_Sub_Tp = BaseTypeControlMsg_Sub_Tp.Synchronise_Pnr,
                Xsd_Ver = "1.0.0"
            },
            Data_Hub = new RequestData_Hub17() { Item = reservationsRequest }
        };
        return request20;
    }

    private static Request20 BuildRequest20Items(DatahubSyncRequest request, string defaultPriority, RequestData_HubReservationsRes_IdSource source) 
    {
        var reservations = request.Reservations.Select(reservation => new RequestData_HubReservationsRes_Id
        {
            Value = reservation.ReservationId,
            Priority = reservation.Priority ?? request.Priority ?? defaultPriority,
            Source = source,
            SourceSpecified = true
        }).ToArray();

        RequestData_HubReservations reservationsRequest = new()
        {
            Res_Id = reservations
        };

        var request20 = new Request20()
        {
            Control = new BaseTypeControl()
            {
                Msg_Tp = BaseTypeControlMsg_Tp.Data_Hub,
                Msg_Sub_Tp = BaseTypeControlMsg_Sub_Tp.Synchronise_Pnr,
                Xsd_Ver = "1.0.0"
            },
            Data_Hub = new RequestData_Hub17() { Item = reservationsRequest }
        };
        return request20;
    }

    private static DatahubSyncResponse BuildItemsResponse(SynchronisePnrResponse response, List<ReservationRequest> reservations)
    {
        var responseItems = response.Response?.Data_Hub?.Item as ResponseData_HubReservations;

        if (responseItems is null or { Res_Id: [] })
            return BuildErrorResponse(reservations);

        var cast = responseItems.Res_Id.Select(
            item => new SyncUnit(TranslateStatus(item.Status), item.Err_Num, item.Err_Text)
        ).ToList();

        var result = new Dictionary<string, SyncAttempt>();

        BuildResultSet(reservations, cast, result);

        return new() { Results = result };
    }

    private static DatahubSyncResponse BuildFlightResponse(SynchronisePnrResponse response, List<ReservationRequest> reservations)
    {
        var responseItems = response.Response?.Data_Hub?.Item as ResponseData_HubPnrs;

        if (responseItems is null or { Pnr: [] })
            return BuildErrorResponse(reservations);

        var cast = responseItems.Pnr.Select(
            item => new SyncUnit(TranslateStatus(item.Status), item.Err_Num, item.Err_Text)
        ).ToList();

        var result = new Dictionary<string, SyncAttempt>();

        BuildResultSet(reservations, cast, result);

        return new() { Results = result };
    }

    private static void BuildResultSet(List<ReservationRequest> reservations, List<SyncUnit> cast, Dictionary<string, SyncAttempt> result)
    {
        for (int i = 0; i < cast.Count; i++)
        {
            var input = reservations[i];
            var output = cast[i];

            var attempt = new SyncAttempt
            {
                Status = output.Status,
                ErrorCode = output.ErrorNumber,
                ErrorMessage = output.ErrorText
            };

            result.Add(
                input.ReservationId,
                attempt
            );
        }
    }

    private sealed record SyncUnit(SyncStatus Status, string ErrorNumber, string ErrorText);

    private static DatahubSyncResponse BuildErrorResponse(List<ReservationRequest> reservations)
    {
        var errorResult =
            reservations.ToDictionary(
                res => res.ReservationId,
                _ => new SyncAttempt { Status = SyncStatus.Error, ErrorCode = null, ErrorMessage = null }
            );
        return new() { Results = errorResult };
    }

    private static SyncStatus TranslateStatus<T>(T outputStatus) where T: Enum
    {
        return outputStatus switch
        {
            ResponseData_HubReservationsRes_IdStatus.QUEUED => SyncStatus.Queued,
            ResponseData_HubReservationsRes_IdStatus.ERROR => SyncStatus.Error,
            ResponseData_HubPnrsPnrStatus.QUEUED => SyncStatus.Queued,
            ResponseData_HubPnrsPnrStatus.ERROR => SyncStatus.Error,
            _ => throw new ArgumentOutOfRangeException(nameof(outputStatus), outputStatus, null)
        };
    }
}