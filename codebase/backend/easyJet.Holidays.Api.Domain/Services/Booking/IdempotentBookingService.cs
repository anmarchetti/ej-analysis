using easyJet.Holidays.Api.Common.Exceptions;
using easyJet.Holidays.Api.Domain.Data.AmendBooking;
using easyJet.Holidays.Api.Domain.Data.Booking;
using easyJet.Holidays.Api.Domain.Exceptions;
using easyJet.Holidays.Api.Domain.Interfaces.AmendBooking;
using easyJet.Holidays.Api.Domain.Interfaces.Booking;
using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("easyJet.Holidays.Api.Domain.Tests")]
namespace easyJet.Holidays.Api.Domain.Services.Booking
{
    /// <summary>
    /// Booking idempotency service
    /// </summary>
    public class IdempotentBookingService : IIdempotentBookingService
    {
        private readonly IBookingCreateService _bookingService;
        private readonly IBookingFetchService _bookingFetchService;
        private readonly IAmendBookingService _amendBookingService;
        private readonly ILogger<IdempotentBookingService> _logger;
        private readonly IBookingTransactionsService _transactionService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ApiSettings _apiSettings;
        private readonly EnvironmentBehaviourSettings _envSettings;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="bookingService"></param>
        /// <param name="bookingFetchService"></param>
        /// <param name="transactionService"></param>
        /// <param name="logger"></param>
        /// <param name="httpContextAccessor"></param>
        /// <param name="apiSettings"></param>
        /// <param name="envSettings"></param>
        /// <param name="amendBookingService"></param>
        public IdempotentBookingService(
            IBookingCreateService bookingService,
            IBookingFetchService bookingFetchService,
            IBookingTransactionsService transactionService,
            ILogger<IdempotentBookingService> logger,
            IHttpContextAccessor httpContextAccessor,
            IAmendBookingService amendBookingService,
            IOptions<ApiSettings> apiSettings,
            IOptions<EnvironmentBehaviourSettings> envSettings
            )
        {
            _apiSettings = apiSettings.Value ?? throw new ArgumentNullException(nameof(apiSettings));

            _bookingService = bookingService;
            _bookingFetchService = bookingFetchService;
            _logger = logger;
            _transactionService = transactionService;
            _httpContextAccessor = httpContextAccessor;
            _amendBookingService = amendBookingService;
            _envSettings = envSettings.Value ?? throw new ArgumentNullException(nameof(envSettings));
        }

        /// <inheritdoc />
        public async Task<BookingResponse> CreateBooking(BookingRequest request, string idempotencyKey)
        {
            return await Process(
                idempotencyKey,
                () => _bookingService.Create(request),
                transaction =>
                {
                    var getRequest = CreateGetBookingRequest(request, transaction);
                    return _bookingFetchService.Get(getRequest);
                }
            );
        }

        /// <summary>
        /// Process amend booking
        /// </summary>
        /// <param name="request"></param>
        /// <param name="idempotencyKey"></param>
        /// <returns></returns>
        public async Task<BookingResponse> AmendBooking(AmendBookingRequest request, string idempotencyKey)
        {

            return await Process(
                idempotencyKey,
                () => _amendBookingService.AmendBooking(request),
                transaction => _bookingFetchService.Get(new GetBookingRequest
                {
                    BookingReference = transaction.BookingReference,
                    LastName = request.LastName,
                    Date = request.Date
                }));
        }

        /// <inheritdoc />
        public async Task<BookingResponse> PayRemainingBalance(PayRemainingBalanceRequest request, string idempotencyKey)
        {
            return await Process(
                idempotencyKey,
                () => _bookingService.PayRemainingBalance(request),
                transaction =>
                {
                    return _bookingFetchService.Get(new GetBookingRequest
                    {
                        BookingReference = transaction.BookingReference,
                        LastName = request.LastName,
                        Date = request.Date
                    });
                }
            );
        }

        /// <summary>
        /// Create <see cref="GetBookingRequest"/> based on request and transaction
        /// Use booking reference from transaction because of security reasons
        /// </summary>
        /// <param name="request"></param>
        /// <param name="transaction"></param>
        /// <returns></returns>
        private GetBookingRequest CreateGetBookingRequest(BookingRequest request, BookingTransaction transaction)
        {
            var leadGuestLastName = request.Guests?.FirstOrDefault(x => x.IsLead)?.LastName;
            var outboundRoute = BookingFetchService.GetOutboundRoute(request.Offer.Transport);
            var date = outboundRoute.DepDate.Value.Date;

            return new GetBookingRequest
            {
                BookingReference = transaction.BookingReference,
                LastName = leadGuestLastName,
                Date = date
            };
        }

        /// <summary>
        /// Process transaction using idempotency key
        /// </summary>
        /// <param name="idempotencyKey">Idempotency key</param>
        /// <param name="process">Transaction body</param>
        /// <param name="getResult">Function to get transcation result</param>
        /// <returns>Transaction result</returns>
        private async Task<BookingResponse> Process(string idempotencyKey, Func<Task<BookingResponse>> process, Func<BookingTransaction, Task<BookingResponse>> getResult)
        {
            try
            {
                var useIdempotencyKey = !string.IsNullOrWhiteSpace(idempotencyKey);

                if (!useIdempotencyKey)
                {
                    // No key, regular process
                    return await process();
                }

                var transaction = await _transactionService.Get(idempotencyKey);
                if (transaction == null)
                {
                    if (_envSettings.AllowBookingWithoutIdempotencyKey)
                    {
                        _logger.LogInformation("Booking without idempotency key is allowed. Just do commit");
                        // key present, but no dynamo and we allowing to work without a key - regular process
                        return await process();
                    }

                    _logger.LogInformation("Creating new transaction for key: {Key}", idempotencyKey);
                    transaction = await _transactionService.Create(idempotencyKey);
                }

                return await ProcessTransaction(transaction, process, getResult);
            }
            catch (Exception ex)
            {
                if (ex is PaymentAuthorisationRequiredException || ex is ApiException)
                {
                    throw;
                }

                // handle any other non-api exceptions here (e.g. AWS errors)
                throw new ApiException(ApiExceptionCodes.BookingCommitError, $"Unexpected error", null, ex);
            }
        }

        /// <summary>
        /// Transaction handler depending on transaction state:
        /// - NEW or PAYMENT_AUTH_REQUIRED: start transaction
        /// - FAILED: throw error
        /// - COMPLETED: return result(booking)
        /// - IN_PROGRESS: wait for status change
        /// </summary>
        /// <param name="transaction">Transaction</param>
        /// <param name="process">Function to do actual work(transaction body)</param>
        /// <param name="getResult">Function to get result</param>
        /// <returns></returns>
        private async Task<BookingResponse> ProcessTransaction(BookingTransaction transaction, Func<Task<BookingResponse>> process, Func<BookingTransaction, Task<BookingResponse>> getResult)
        {
            _logger.LogInformation("Processing transaction: {Id} with status: {State}", transaction.Id, transaction.State);

            var state = transaction.GetState();
            var idempotencyKey = transaction.Id;

            // 1. New Booking or Payment Auth required
            if (state == BookingTransactionState.NEW || state == BookingTransactionState.PAYMENT_AUTH_REQUIRED)
            {
                // It wasn't started, we should start commit process
                try
                {
                    await _transactionService.Start(idempotencyKey);

                    var booking = await process();
                    await _transactionService.Complete(idempotencyKey, booking.BookingReference);
                    return booking;
                }
                catch (PaymentAuthorisationRequiredException)
                {
                    // Expected error (authorization required from payment service)
                    await _transactionService.PaymentAuthRequired(idempotencyKey);
                    throw;
                }
                catch (Exception ex)
                {
                    await _transactionService.Fail(idempotencyKey, ex, _httpContextAccessor?.HttpContext?.TraceIdentifier);
                    throw;
                }
            }

            // 2. Failed - throw error
            if (state == BookingTransactionState.FAILED)
            {
                // It was completed, but failed. Return error 
                throw new ApiException(ApiExceptionCodes.BookingCommitError, transaction.InnerErrors, transaction.Exception);
            }

            // 3. Completed - return booking by reference
            if (state == BookingTransactionState.COMPLETED)
            {
                // It was completed, need to return result
                return await getResult(transaction);
            }

            // 4. Started - waiting for status change
            if (state == BookingTransactionState.IN_PROGRESS)
            {
                return await OnInProgress(
                    transaction,
                    t => ProcessTransaction(t, process, getResult)
                );
            }

            // Unknown status
            throw new ApiException(ApiExceptionCodes.BookingCommitIdempotentStatusError, null, $"Unknown transaction status: {transaction.State}");
        }

        /// <summary>
        /// Handler for "in progress" state.
        /// Monitores transaction state waiting for non-inprogress state (uses configurable timeout)
        /// </summary>
        /// <param name="transaction">Transaction to monitore</param>
        /// <param name="onEnd">Callback on status change</param>
        /// <returns>Response</returns>
        private async Task<BookingResponse> OnInProgress(BookingTransaction transaction,
            Func<BookingTransaction, Task<BookingResponse>> onEnd)
        {
            var state = transaction.GetState();
            var idempotencyKey = transaction.Id;

            using (var cancellationToken = new CancellationTokenSource(TimeSpan.FromMilliseconds(_apiSettings.IdempotentBooking.TimeoutMilliSeconds)))
            {
                // Do until state is not one of final: completed/failed/unknown

                _logger.LogInformation("Waiting for transaction update. Cancellation timeout: {Timeout}, delay: {Delay}",
                    _apiSettings.IdempotentBooking.TimeoutMilliSeconds, _apiSettings.IdempotentBooking.DelayMilliSeconds);

                while (!cancellationToken.IsCancellationRequested && !StateIsCompleted(state))
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(_apiSettings.IdempotentBooking.DelayMilliSeconds));
                    if (!cancellationToken.IsCancellationRequested) // double check it because it could be cancelled while we were waiting
                    {
                        transaction = await _transactionService.Get(idempotencyKey);
                        state = transaction.GetState();
                        _logger.LogInformation("Got transaction update. Id: {Id}, state: {State}", transaction.Id, transaction.State);
                    }
                }
            }

            // Now if state is "completed"(done/failed/unknown) we need to run process once again, otherwise throw timeout error
            if (!StateIsCompleted(state))
            {
                throw new ApiException(ApiExceptionCodes.BookingCommitIdempotentTimeoutError, null, "Timeout exception: cannot get transaction state");
            }
            else
            {

                return await onEnd(transaction);
            }
        }

        private bool StateIsCompleted(BookingTransactionState state)
        {
            return state == BookingTransactionState.COMPLETED
                || state == BookingTransactionState.FAILED
                || state == BookingTransactionState.UNKNOWN;
        }
    }
}
