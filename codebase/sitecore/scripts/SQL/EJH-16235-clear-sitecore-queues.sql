DELETE from [sc.Holidays_Master].[dbo].[EventQueue] where Created < DATEADD(HOUR, -8, GETDATE());
DELETE from [sc.Holidays_Core].[dbo].[EventQueue] where Created < DATEADD(HOUR, -8, GETDATE());
DELETE from [sc.Holidays_Web].[dbo].[EventQueue] where Created < DATEADD(HOUR, -8, GETDATE());

DELETE from [sc.Holidays_Master].[dbo].[History] where Created < DATEADD(HOUR, -12, GETDATE());
DELETE from [sc.Holidays_Core].[dbo].[History]where Created < DATEADD(HOUR, -12, GETDATE());
DELETE from [sc.Holidays_Web].[dbo].[History] where Created < DATEADD(HOUR, -12, GETDATE());

DELETE from [sc.Holidays_Master].[dbo].[PublishQueue] where Date < DATEADD(HOUR, -12, GETDATE());
DELETE from [sc.Holidays_Core].[dbo].[PublishQueue] where Date < DATEADD(HOUR, -12, GETDATE());
DELETE from [sc.Holidays_Web].[dbo].[PublishQueue] where Date < DATEADD(HOUR, -12, GETDATE());