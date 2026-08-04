using System;

namespace easyJet.Foundation.AmazonS3.Reports.Service
{
    public interface IHotelReportService
    {
        void Success(string atcomCode, string imageName, string message = null);

        void Warn(string atcomCode, string imageName, string message, Exception exc = null);

        void Error(string atcomCode, string imageName, string message, Exception exc = null);

        void Deleted(string atcomCode, string imageName, string message = null);
    }
}