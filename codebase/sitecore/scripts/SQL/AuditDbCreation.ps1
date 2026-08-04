$adminUserId = "antonio"
$adminPassword = "Qwerty_0"
$dataSource = "ej-holidays-sitecore-ci-deployment.cnnn3qp70v4l.eu-west-1.rds.amazonaws.com"
$db = "SCAuditTrail"
$dbUserId = "audittrailuser"
$dbUserPassword = "SIF-Default"

$initialConStr = "Data Source=$dataSource;User ID=$adminUserId;Password=$adminPassword"
$auditConStr = "Data Source=$dataSource;Initial Catalog=$db;User ID=$adminUserId;Password=$adminPassword"

$createDbCmdText = "CREATE DATABASE [$db]
            ALTER DATABASE [$db] SET COMPATIBILITY_LEVEL = 100
            ALTER DATABASE [$db] SET ANSI_NULL_DEFAULT OFF 
            ALTER DATABASE [$db] SET ANSI_NULLS OFF 
            ALTER DATABASE [$db] SET ANSI_PADDING OFF 
            ALTER DATABASE [$db] SET ANSI_WARNINGS OFF 
            ALTER DATABASE [$db] SET ARITHABORT OFF 
            ALTER DATABASE [$db] SET AUTO_CLOSE OFF 
            ALTER DATABASE [$db] SET AUTO_CREATE_STATISTICS ON 
            ALTER DATABASE [$db] SET AUTO_SHRINK OFF 
            ALTER DATABASE [$db] SET AUTO_UPDATE_STATISTICS ON 
            ALTER DATABASE [$db] SET CURSOR_CLOSE_ON_COMMIT OFF 
            ALTER DATABASE [$db] SET CURSOR_DEFAULT  GLOBAL 
            ALTER DATABASE [$db] SET CONCAT_NULL_YIELDS_NULL OFF 
            ALTER DATABASE [$db] SET NUMERIC_ROUNDABORT OFF 
            ALTER DATABASE [$db] SET QUOTED_IDENTIFIER OFF 
            ALTER DATABASE [$db] SET RECURSIVE_TRIGGERS OFF 
            ALTER DATABASE [$db] SET  DISABLE_BROKER 
            ALTER DATABASE [$db] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
            ALTER DATABASE [$db] SET DATE_CORRELATION_OPTIMIZATION OFF 
            ALTER DATABASE [$db] SET PARAMETERIZATION SIMPLE 
            ALTER DATABASE [$db] SET  READ_WRITE 
            ALTER DATABASE [$db] SET RECOVERY SIMPLE 
            ALTER DATABASE [$db] SET  MULTI_USER 
            ALTER DATABASE [$db] SET PAGE_VERIFY CHECKSUM  
            ALTER DATABASE [$db] SET containment = partial   
            "

$createUserCmdText = "USE [$db]
                      CREATE USER $dbUserId
                      WITH PASSWORD='$dbUserPassword'"

$setPermissionsCmdText = "USE [$db]  
EXEC sp_addrolemember N'db_datareader', N'$dbUserId'
EXEC sp_addrolemember N'db_datawriter', N'$dbUserId'
IF NOT EXISTS (SELECT name FROM sys.filegroups WHERE is_default=1 AND name = N'PRIMARY') ALTER DATABASE [$db] MODIFY FILEGROUP [PRIMARY] DEFAULT"

$createTableCmdText = "USE [$db]
IF OBJECT_ID('dbo.Logs', 'U') IS NOT NULL DROP TABLE dbo.Logs
CREATE TABLE [dbo].[Logs](
 [ID] [int] IDENTITY(1,1) NOT NULL,
 [Date] [datetime] NOT NULL,
 [Thread] [varchar](255) NOT NULL,
 [Level] [varchar](20) NOT NULL,
 [Logger] [varchar](255) NOT NULL,
 [Message] [varchar](4000) NOT NULL,
 [Exception] [varchar](2000) NULL,
 [SCUser] [varchar](255) NULL,
 [SCAction] [varchar](255) NULL,
 [SCItemPath] [varchar](255) NULL,
 [SCLanguage] [varchar](100) NULL,
 [SCVersion] [varchar](100) NULL,
 [SCItemId] [varchar](38) NULL,
 [SiteName] [varchar](255) NULL,
 [SCMisc] [varchar](255) NULL
) ON [PRIMARY]"

	
function ExecQuery 
{ 
    param ($conStr, $cmdText) 
   
    # Determine if parameters were correctly populated. 
    if (!$conStr -or !$cmdText) 
    { 
        # One or more parameters didn't contain values. 
        write-Host "ExecNonQuery function called with no connection string and/or command text." 
    } 
    else 
    { 
        write-Host "Creating SQL Connection..." 
        # Instantiate new SqlConnection object. 
        $Connection = New-Object System.Data.SQLClient.SQLConnection 
         
        # Set the SqlConnection object's connection string to the passed value. 
        $Connection.ConnectionString = $conStr 
         
        # Perform database operations in try-catch-finally block since database operations often fail. 
        try 
        { 
            write-Host "Opening SQL Connection..." 
            # Open the connection to the database. 
            $Connection.Open() 
             
            write-Host "Creating SQL Command..." 
            # Instantiate a SqlCommand object. 
            $Command = New-Object System.Data.SQLClient.SQLCommand 
            # Set the SqlCommand's connection to the SqlConnection object above. 
            $Command.Connection = $Connection 
            # Set the SqlCommand's command text to the query value passed in. 
            $Command.CommandText = $cmdText 
             
            write-Host "Executing SQL Command..."   
            # Note, to see a result back here, ExecuteNonQuery has been changed to ExecuteScalar
            write-host $Command.ExecuteScalar() 
        } 
        catch [System.Data.SqlClient.SqlException] 
        { 
            # A SqlException occurred. According to documentation, this happens when a command is executed against a locked row. 
            write-Error "SqlException: $($_.Exception.Message)"
        } 
        catch 
        { 
            # An generic error occurred somewhere in the try area. 
            write-Host "$($_.Exception.Message). An error occurred while attempting to open the database connection and execute a command." 
        } 
        finally { 
            # Determine if the connection was opened. 
            if ($Connection.State -eq "Open") 
            { 
                write-Host "Closing Connection..." 
                # Close the currently open connection. 
                $Connection.Close() 
            } 
        } 
    } 
} 

ExecQuery -conStr $initialConStr -cmdText $createDbCmdText 
ExecQuery -conStr $auditConStr   -cmdText $createUserCmdText 
ExecQuery -conStr $auditConStr   -cmdText $setPermissionsCmdText
ExecQuery -conStr $auditConStr   -cmdText $createTableCmdText