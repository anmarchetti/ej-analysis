using System;
using easyJet.Foundation.SitecoreExtensions.Switchers;
using log4net;
using Sitecore.Diagnostics;

namespace easyJet.Foundation.SitecoreExtensions.Logger
{
    public abstract class BaseLogger : ILogger
    {
        public ILog Logger { get; }

        protected BaseLogger(ILog log)
        {
            Logger = log;
        }

        protected BaseLogger(string loggerName)
        {
            Logger = LoggerFactory.GetLogger(loggerName);
        }

        public void Debug(string message, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Debug(AddTypeToMessage(owner.GetType(), message));
            }
            else
            {
                Debug(message, owner.GetType());
            }
        }

        public void Debug(string message, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Debug(AddTypeToMessage(ownerType, message));
            }
            else
            {
                Logger.Debug(AddTypeToMessage(ownerType, message));
            }
        }

        public void Debug(string message, Exception exception, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Debug(AddTypeToMessage(owner.GetType(), message), exception);
            }
            else
            {
                Debug(message, exception, owner?.GetType());
            }
        }

        public void Debug(string message, Exception exception, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Debug(AddTypeToMessage(ownerType, message), exception);
            }
            else
            {
                Logger.Debug(AddTypeToMessage(ownerType, message), exception);
            }
        }

        public void Info(string message, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Info(AddTypeToMessage(owner.GetType(), message));
            }
            else
            {
                Info(message, owner.GetType());
            }
        }

        public void Info(string message, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Info(AddTypeToMessage(ownerType, message));
            }
            else
            {
                Logger.Info(AddTypeToMessage(ownerType, message));
            }
        }

        public void Info(string message, Exception exception, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Info(AddTypeToMessage(owner.GetType(), message), exception);
            }
            else
            {
                Info(message, exception, owner.GetType());
            }
        }

        public void Info(string message, Exception exception, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Info(AddTypeToMessage(ownerType, message), exception);
            }
            else
            {
                Logger.Info(AddTypeToMessage(ownerType, message), exception);
            }
        }

        public void Warn(string message, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Warn(AddTypeToMessage(owner.GetType(), message));
            }
            else
            {
                Warn(message, owner.GetType());
            }
        }

        public void Warn(string message, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Warn(AddTypeToMessage(ownerType, message));
            }
            else
            {
                Logger.Warn(AddTypeToMessage(ownerType, message));
            }
        }

        public void Warn(string message, Exception exception, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Warn(AddTypeToMessage(owner.GetType(), message), exception);
            }
            else
            {
                Warn(message, exception, owner.GetType());
            }
        }

        public void Warn(string message, Exception exception, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Warn(AddTypeToMessage(ownerType, message), exception);
            }
            else
            {
                Logger.Warn(AddTypeToMessage(ownerType, message), exception);
            }
        }

        public void Error(string message, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Error(AddTypeToMessage(owner.GetType(), message));
            }
            else
            {
                Error(message, owner.GetType());
            }
        }

        public void Error(string message, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Error(AddTypeToMessage(ownerType, message));
            }
            else
            {
                Logger.Error(AddTypeToMessage(ownerType, message));
            }
        }

        public void Error(string message, Exception exception, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Error(AddTypeToMessage(owner.GetType(), message), exception);
            }
            else
            {
                Error(message, exception, owner.GetType());
            }
        }

        public void Error(string message, Exception exception, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Error(AddTypeToMessage(ownerType, message), exception);
            }
            else
            {
                Logger.Error(AddTypeToMessage(ownerType, message), exception);
            }
        }

        public void Fatal(string message, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Fatal(AddTypeToMessage(owner.GetType(), message));
            }
            else
            {
                Fatal(message, owner.GetType());
            }
        }

        public void Fatal(string message, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Fatal(AddTypeToMessage(ownerType, message));
            }
            else
            {
                Logger.Fatal(AddTypeToMessage(ownerType, message));
            }
        }

        public void Fatal(string message, Exception exception, object owner)
        {
            Assert.ArgumentNotNull(owner, nameof(owner));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Fatal(AddTypeToMessage(owner.GetType(), message), exception);
            }
            else
            {
                Fatal(message, exception, owner.GetType());
            }
        }

        public void Fatal(string message, Exception exception, Type ownerType)
        {
            Assert.ArgumentNotNull(ownerType, nameof(ownerType));
            if (LogSwitcher.CurrentValue != null)
            {
                LogSwitcher.CurrentValue.Logger.Fatal(AddTypeToMessage(ownerType, message), exception);
            }
            else
            {
                Logger.Fatal(AddTypeToMessage(ownerType, message), exception);
            }
        }

        private string AddTypeToMessage(Type type, string message)
        {
            return type == null ? message : $"{type}: {message}";
        }
    }
}