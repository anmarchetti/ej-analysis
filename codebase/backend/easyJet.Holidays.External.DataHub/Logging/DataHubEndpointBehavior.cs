using System.ServiceModel.Channels;
using System.ServiceModel.Description;
using System.ServiceModel.Dispatcher;

namespace easyJet.Holidays.External.DataHub.Logging
{
    /// <summary>
    /// Implementing IEndpointBehavior for adding custom interceptor
    /// </summary>
    public class DataHubEndpointBehavior : IEndpointBehavior
    {
        /// <summary>
        /// Message inspector required to intercept messages
        /// </summary>
        public RequestInterceptor MessageInspector { get; }

        /// <summary>
        /// ctor
        /// </summary>
        /// <param name="messageInspector"></param>
        public DataHubEndpointBehavior(RequestInterceptor messageInspector)
        {
            MessageInspector = messageInspector;
        }

        public void AddBindingParameters(ServiceEndpoint endpoint, BindingParameterCollection bindingParameters)
        {
        }

        public void ApplyClientBehavior(ServiceEndpoint endpoint, ClientRuntime clientRuntime)
        {
            clientRuntime.ClientMessageInspectors.Add(MessageInspector);
        }

        public void ApplyDispatchBehavior(ServiceEndpoint endpoint, EndpointDispatcher endpointDispatcher)
        {
        }

        public void Validate(ServiceEndpoint endpoint)
        {
        }
    }
}
