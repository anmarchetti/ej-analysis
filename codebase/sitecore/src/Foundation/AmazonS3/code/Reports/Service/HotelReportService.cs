using System;
using easyJet.Foundation.AmazonS3.Logging;
using easyJet.Foundation.AmazonS3.Reports.Models;
using easyJet.Foundation.AmazonS3.Reports.Repositories;
using easyJet.Foundation.DependencyInjection;
using easyJet.Foundation.DependencyInjection.Attributes;

namespace easyJet.Foundation.AmazonS3.Reports.Service
{
    [Service(typeof(IHotelReportService), Lifetime = Lifetime.Singleton)]
    public class HotelReportService : IHotelReportService
    {
        private readonly IAmazonS3Logger logger;
        private readonly IHotelImageReportRepository repository;

        public HotelReportService(IHotelImageReportRepository repository, IAmazonS3Logger logger)
        {
            this.repository = repository;
            this.logger = logger;
        }

        public void Success(string atcomCode, string imageName, string message = null)
        {
            logger.Info(GetLogMessage(atcomCode, imageName, message, Status.Success), this);
            TryExecute(() => repository.Add(CreateRecord(atcomCode, imageName, message, Status.Success)));
        }

        public void Warn(string atcomCode, string imageName, string message, Exception exc = null)
        {
            logger.Warn(GetLogMessage(atcomCode, imageName, message, Status.Warn), exc, this);
            TryExecute(() => repository.Add(CreateRecord(atcomCode, imageName, message, Status.Warn)));
        }

        public void Error(string atcomCode, string imageName, string message, Exception exc = null)
        {
            logger.Error(GetLogMessage(atcomCode, imageName, message, Status.Error), exc, this);
            TryExecute(() => repository.Add(CreateRecord(atcomCode, imageName, message, Status.Error)));
        }

        public void Deleted(string atcomCode, string imageName, string message = null)
        {
            logger.Info(GetLogMessage(atcomCode, imageName, message, Status.Deleted), this);
            TryExecute(() => repository.Add(CreateRecord(atcomCode, imageName, message, Status.Deleted)));
        }

        private void TryExecute(Action action)
        {
            try
            {
                action.Invoke();
            }
            catch (Exception e)
            {
                logger.Error("An unexpected exception occurred!", e, this);
            }
        }

        private HotelImageStatusRecord CreateRecord(string atcomCode, string imageName, string message, Status status)
        {
            return new HotelImageStatusRecord()
            {
                DateTime = DateTime.UtcNow,
                HotelCode = atcomCode,
                ImageName = imageName,
                Message = message,
                Status = status
            };
        }

        private string GetLogMessage(string atcomCode, string imageName, string message, Status status)
        {
            message = string.IsNullOrWhiteSpace(message) ? "Image was processed successfully" : message;
            return $"{message}. Hotel code: {atcomCode}. Image name: {imageName}. Status: {status.ToString()}";
        }
    }
}