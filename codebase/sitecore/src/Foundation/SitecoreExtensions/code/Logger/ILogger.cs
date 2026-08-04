using System;
using log4net;

namespace easyJet.Foundation.SitecoreExtensions.Logger
{
    public interface ILogger
    {
        ILog Logger { get; }

        void Debug(string message, Exception exception, object owner);

        void Debug(string message, Exception exception, Type ownerType);

        void Debug(string message, object owner);

        void Debug(string message, Type ownerType);

        void Error(string message, Exception exception, object owner);

        void Error(string message, Exception exception, Type ownerType);

        void Error(string message, object owner);

        void Error(string message, Type ownerType);

        void Fatal(string message, Exception exception, object owner);

        void Fatal(string message, Exception exception, Type ownerType);

        void Fatal(string message, object owner);

        void Fatal(string message, Type ownerType);

        void Info(string message, Exception exception, object owner);

        void Info(string message, Exception exception, Type ownerType);

        void Info(string message, object owner);

        void Info(string message, Type ownerType);

        void Warn(string message, Exception exception, object owner);

        void Warn(string message, Exception exception, Type ownerType);

        void Warn(string message, object owner);

        void Warn(string message, Type ownerType);
    }
}
