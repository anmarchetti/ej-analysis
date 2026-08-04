DECLARE @SQL NVARCHAR(max)
DECLARE @Tablename VARCHAR(50)
    
SET @Tablename='[sc.holidays_Web].[dbo].[VisitGeoIpData]'
SET @SQL=N'DELETE FROM ' +@Tablename

exec (@SQL)