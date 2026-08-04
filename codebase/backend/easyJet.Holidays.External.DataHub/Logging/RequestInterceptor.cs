using easyJet.Holidays.Api.Domain.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.ServiceModel;
using System.ServiceModel.Channels;
using System.ServiceModel.Dispatcher;
using System.Xml;

namespace easyJet.Holidays.External.DataHub.Logging
{
    /// <summary>
    /// RequestInterceptor for datahub atcom requests and responses
    /// </summary>
    public class RequestInterceptor : IClientMessageInspector
    {
        /// <summary>
        /// atcom settings
        /// </summary>
        private readonly AtcomSettings _atcomSettings;

        /// <summary>
        /// logger
        /// </summary>
        public ILogger<RequestInterceptor> Logger { get; }

        /// <summary>
        /// RequestInterceptor for datahub atcom requests and responses ctor
        /// </summary>
        /// <param name="atcomSettings"></param>
        /// <param name="logger"></param>
        public RequestInterceptor(IOptions<AtcomSettings> atcomSettings, ILogger<RequestInterceptor> logger)
        {
            ArgumentNullException.ThrowIfNull(atcomSettings);
            _atcomSettings = atcomSettings.Value;
            Logger = logger;
        }

        /// <summary>
        /// This allows us to log the response before parsing it
        /// </summary>
        /// <param name="reply"></param>
        /// <param name="correlationState"></param>
        public void AfterReceiveReply(ref Message reply, object correlationState)
        {
            ArgumentNullException.ThrowIfNull(reply);
            using var buffer = reply.CreateBufferedCopy(int.MaxValue);
            var document = GetDocument(buffer.CreateMessage());
            Logger.Log(LogLevel.Debug, "Response {Response}", document.InnerXml);

            reply = buffer.CreateMessage();
        }

        /// <summary>
        /// This is required in order to clear the headers before sending the request
        /// </summary>
        /// <param name="request"></param>
        /// <param name="channel"></param>
        /// <returns>null</returns>
        public object BeforeSendRequest(ref Message request, IClientChannel channel)
        {
            ArgumentNullException.ThrowIfNull(request);
            //clean headers in order to atcom request work
            request.Headers.Clear();
            using var buffer = request.CreateBufferedCopy(int.MaxValue);
            var document = GetDocument(buffer.CreateMessage());
            Logger.Log(LogLevel.Information, "Request to {Host} {BaseUrl} {Request}", _atcomSettings.DataHub.Host, _atcomSettings.DataHub.BaseUrl, document.InnerXml);

            request = buffer.CreateMessage();
            return null!;
        }

        /// <summary>
        /// Returns document message as xml document
        /// </summary>
        /// <param name="request"></param>
        /// <returns>XmlDocument</returns>
        private static XmlDocument GetDocument(Message request)
        {
            var document = new XmlDocument();
            using var memoryStream = new MemoryStream();

            // write request to memory stream
            using var writer = XmlWriter.Create(memoryStream);
            request.WriteMessage(writer);
            writer.Flush();
            memoryStream.Position = 0;

            // load memory stream into a document
            document.Load(memoryStream);

            return document;
        }
    }
}
