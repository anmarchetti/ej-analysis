using easyJet.Holidays.Api.Domain.Extensions;

namespace easyJet.Holidays.Api.Domain.Utils.Http
{
    public class TimeoutHandler : DelegatingHandler
    {
        /// <summary>
        /// Gets or sets default timeout value if it's not defined.
        /// Default value of timeout is 100 seconds in .net lib
        /// </summary>
        public TimeSpan DefaultTimeout { get; set; } = TimeSpan.FromSeconds(100);

        protected async override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            using (var cts = GetCancellationTokenSource(request, cancellationToken))
            {
                try
                {
                    return await base.SendAsync(request, cts?.Token ?? cancellationToken);
                }
                catch (OperationCanceledException ex) when (!cancellationToken.IsCancellationRequested)
                {
                    throw new TimeoutException(string.Format("Timeout error: {0}", request.RequestUri), ex);
                }
            }
        }

        /// <summary>
        /// Create cancellation source based on request timeout setting
        /// </summary>
        /// <param name="request">Request instance</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Cancellation token source</returns>
        private CancellationTokenSource GetCancellationTokenSource(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var timeout = request.GetTimeout() ?? DefaultTimeout;
            if (timeout == Timeout.InfiniteTimeSpan)
            {
                // No need to create a CTS if there's no timeout
                return null;
            }
            else
            {
                var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(timeout);
                return cts;
            }
        }
    }
}
