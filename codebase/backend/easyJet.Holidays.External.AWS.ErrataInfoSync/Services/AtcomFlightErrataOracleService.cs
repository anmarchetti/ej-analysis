using easyJet.Holidays.External.AWS.ErrataInfoSync.Interfaces;
using easyJet.Holidays.External.AWS.ErrataInfoSync.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace easyJet.Holidays.External.AWS.ErrataInfoSync.Services;

/// <inheritdoc cref="IAtcomErrataOracleService" />
public class AtcomFlightErrataOracleService : IAtcomErrataOracleService
{
    private readonly ILogger<AtcomFlightErrataOracleService> _logger;
    private readonly AtcomDbSettings _atcomDbSettings;

    private DataTable _dataTable;

    private const string FlightErrataSqlQuery = @"SELECT
                                                        usr.cd   AS attribute_cd                 ,
                                                        usr.NAME AS attribute_name               ,
                                                        er.trans_errata_id                       ,
                                                        an.eff_dt                                ,
                                                        pt2.pt_cd AS DeparturePoint              ,
                                                        pt2.NAME  AS DeparturePointName          ,
                                                        pt2.pt_tp AS DeparturePointType          ,
                                                        pt.pt_cd  AS ArrivalPoint                ,
                                                        pt.NAME   AS ArrivalPointName            ,
                                                        pt.pt_tp  AS ArrivalPointType            ,
                                                        an.att_note_text                         ,
                                                        an.st_dt                                 ,
                                                        an.end_dt                                ,
                                                        ll.lang_cd                               ,
                                                        REPLACE(nt.text, ',', '') AS text        ,
                                                        erl.flt_no                AS FlightNumber,
                                                        er.st_dt                  AS DEP_FROM_DT ,
                                                        er.end_dt                 AS DEP_TO_DT   ,
                                                        er.bk_from_dt                            ,
                                                        er.bk_to_dt                              ,
                                                        --erl.CAR_ID,
                                                        offn.cd AS CarrierCode,
                                                        er.inv_tp             ,
                                                        er.mon                ,
                                                        er.tue                ,
                                                        er.wed                ,
                                                        er.thu                ,
                                                        er.fri                ,
                                                        er.sat                ,
                                                        er.sun                ,
                                                        er.dir_mth            ,
                                                        th.cd AS TransCode
                                                FROM
                                                        ar_transporterrata er
                                                LEFT JOIN
                                                        ar_transporterratalist erl
                                                ON
                                                        erl.trans_errata_id = er.trans_errata_id
                                                LEFT JOIN
                                                        ar_point pt
                                                ON
                                                        pt.pt_id = er.arr_pt_id
                                                LEFT JOIN
                                                        ar_linkattribute al
                                                ON
                                                        al.link_id = er.trans_errata_id
                                                LEFT JOIN
                                                        ar_attributenote an
                                                ON
                                                        an.link_att_id = al.link_att_id
                                                LEFT JOIN
                                                        ar_note nt
                                                ON
                                                        nt.att_note_id = an.att_note_id
                                                LEFT JOIN
                                                        ar_usercodes usr
                                                ON
                                                        usr.user_cd_id = al.att_cd_id
                                                LEFT JOIN
                                                        ar_point pt2
                                                ON
                                                        er.dep_pt_id = pt2.pt_id
                                                LEFT JOIN
                                                        ar_transhead th
                                                ON
                                                        th.trans_head_head_id = er.trans_head_head_id
                                                LEFT JOIN
                                                        ar_officename offn
                                                ON
                                                        offn.off_name_id = erl.car_id
                                                LEFT JOIN
                                                        ar_languagelocale ll
                                                ON
                                                        nt.lang_locale_id = ll.lang_locale_id";

    /// <summary>
    /// standard ctor
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="atcomDbOptions"></param>
    public AtcomFlightErrataOracleService(ILogger<AtcomFlightErrataOracleService> logger, IOptions<AtcomDbSettings> atcomDbOptions)
    {
        _logger = logger;

        ArgumentNullException.ThrowIfNull(atcomDbOptions);
        _atcomDbSettings = atcomDbOptions.Value;
    }


    /// <inheritdoc />
    public DataTable GetAtcomDataTable()
    {
        if (_dataTable != null)
            return _dataTable;

        using OracleConnection con = new OracleConnection(_atcomDbSettings.ConnectionString);
        using OracleCommand cmd = new OracleCommand();
        try
        {
            con.Open();
            cmd.BindByName = true;
            cmd.Connection = con;
            cmd.CommandText = FlightErrataSqlQuery;

            _logger.LogInformation("Connection to FlightErrata database is opened");

            DataTable dt = new DataTable();
            dt.Load(cmd.ExecuteReader());

            _logger.LogInformation("Connection to database is closed");

            _dataTable = dt;

            return dt;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while trying to get Errata from DB");

            //if we throw exception, devops guys will receive email with error and can find out the reason
            throw new InvalidOperationException("Failed to get data from Atcom", ex);
        }
    }
}