/*-
 * <<
 * DBus
 * ==
 * Copyright (C) 2016 - 2018 Bridata
 * ==
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * >>
 */

package com.creditease.dbus.service.table;

import com.creditease.dbus.commons.SupportedMysqlDataType;
import com.creditease.dbus.commons.SupportedOraDataType;
import com.creditease.dbus.enums.DbusDatasourceType;
import com.creditease.dbus.domain.model.DataTable;
import com.creditease.dbus.domain.model.DataSource;
import com.creditease.dbus.domain.model.TableMeta;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.*;

public abstract class TableFetcher {
    private DataSource ds;
    private Connection conn;

    private Logger logger = LoggerFactory.getLogger(getClass());

    public TableFetcher(DataSource ds) {
        this.ds = ds;
    }

    public abstract String buildQuery(Object... args);
    public abstract String fillParameters(PreparedStatement statement, Map<String, Object> params) throws Exception;
    public abstract String buildTableFieldQuery(Object... args);
    public abstract String fillTableParameters(PreparedStatement statement, Map<String, Object> params) throws Exception;

    public List<DataTable> fetchTable(Map<String, Object> params) throws Exception {
        try {
            PreparedStatement statement = conn.prepareStatement(buildQuery(params));
            fillParameters(statement, params);
            ResultSet resultSet = statement.executeQuery();
            if(ds.getDsType().equals("mysql")){
                return buildResultMySQL(resultSet);
            }else{
                return buildResultOracle(resultSet);
            }
        } finally {
            if (!conn.isClosed()) {
                conn.close();
            }
        }
    }

    /**
     *
     * @param params
     * @return table所有字段
     * @throws Exception
     */
    public List<List<TableMeta>> fetchTableField(Map<String, Object> params, List<Map<String, Object>> paramsList) throws Exception {
        PreparedStatement statement = conn.prepareStatement(buildTableFieldQuery(params));
        fillTableParameters(statement, params);
        ResultSet resultSet = statement.executeQuery();
        List<String> tableNames = new ArrayList<>();
        for (Map<String, Object> map : paramsList) {
            tableNames.add(String.valueOf(map.get("tableName")));
        }
        List<List<TableMeta>> ret;
        if(ds.getDsType().equals("mysql")){
            ret = tableFieldMysql(tableNames, resultSet);
        }else{
            ret = tableFieldOracle(tableNames, resultSet);
        }
        resultSet.close();
        statement.close();
        conn.close();
        return ret;
    }

    public static TableFetcher getFetcher(DataSource ds) throws Exception {
        TableFetcher fetcher;
        DbusDatasourceType dsType = DbusDatasourceType.parse(ds.getDsType());
        switch (dsType) {
            case MYSQL:
                Class.forName("com.mysql.jdbc.Driver");
                fetcher = new MySqlTableFetcher(ds);
                break;
            case ORACLE:
                Class.forName("oracle.jdbc.driver.OracleDriver");
                fetcher = new OracleTableFetcher(ds);
                break;
            default:
                throw new IllegalArgumentException();
        }
        Connection conn = DriverManager.getConnection(ds.getMasterUrl(), ds.getDbusUser(), ds.getDbusPwd());
        fetcher.setConnection(conn);
        return fetcher;
    }

    protected void setConnection(Connection conn) {
        this.conn = conn;
    }

    protected List<DataTable> buildResultMySQL(ResultSet rs) throws SQLException {
        List<DataTable> list = new ArrayList<>();
        DataTable table;
        while (rs.next()) {
            table = new DataTable();
            table.setTableName(rs.getString("TABLE_NAME"));
            table.setPhysicalTableRegex(rs.getString("TABLE_NAME"));
            table.setVerId(null);
            table.setStatus("ok");
            table.setCreateTime(new java.util.Date());
            list.add(table);
        }
        return list;
    }

    /**
     * @param tableNames
     * @param rs
     * @return table所有字段
     * @throws SQLException
     */
    protected List<List<TableMeta>> tableFieldMysql(List<String> tableNames, ResultSet rs) throws SQLException {
        Map<String, List<TableMeta>> tableToMeta = new HashMap<>();
        for (String tableName : tableNames) {
            tableToMeta.put(tableName, new ArrayList<>());
        }
        while (rs.next()) {
            TableMeta tableMeta = new TableMeta();
            tableMeta.setColumnName(rs.getString("COLUMN_NAME"));
            tableMeta.setDataType(rs.getString("DATA_TYPE"));
            if (!SupportedMysqlDataType.isSupported(rs.getString("DATA_TYPE")))
                if (tableToMeta.containsKey(rs.getString("TABLE_NAME")))
                    tableToMeta.get(rs.getString("TABLE_NAME")).add(tableMeta);
        }
        List<List<TableMeta>> ret = new ArrayList<>();
        for (String tableName : tableNames) {
            ret.add(tableToMeta.get(tableName));
        }
        return ret;
    }


    /**
     * 判断是否不兼容
     */
    protected boolean isIncompatibleCol(String str)
    {
        if("Anydata".equals(str)||"Anytype".equals(str)||"XMLType".equals(str))
        {
            return true;
        }
        return false;
    }
    /**
     * @param tableNames
     * @param rs
     * @return table所有字段
     * @throws SQLException
     */
    protected List<List<TableMeta>> tableFieldOracle(List<String> tableNames, ResultSet rs) throws SQLException {
        Map<String, List<TableMeta>> tableToMeta = new HashMap<>();
        for (String tableName : tableNames) {
            tableToMeta.put(tableName, new ArrayList<>());
        }
        while (rs.next()) {
            TableMeta tableMeta = new TableMeta();
            tableMeta.setColumnName(rs.getString("COLUMN_NAME"));
            tableMeta.setDataType(rs.getString("DATA_TYPE"));
            if (isIncompatibleCol(rs.getString("DATA_TYPE")))
                tableMeta.setIncompatibleColumn(rs.getString("COLUMN_NAME") + "/" + rs.getString("DATA_TYPE"));
            if (!SupportedOraDataType.isSupported(rs.getString("DATA_TYPE")))
                if (tableToMeta.containsKey(rs.getString("TABLE_NAME")))
                    tableToMeta.get(rs.getString("TABLE_NAME")).add(tableMeta);
        }
        List<List<TableMeta>> ret = new ArrayList<>();
        for (String tableName : tableNames) {
            ret.add(tableToMeta.get(tableName));
        }
        return ret;
    }

    protected List<DataTable> buildResultOracle(ResultSet rs) throws SQLException {
        List<DataTable> list = new ArrayList<>();
        DataTable table;
        while (rs.next()) {
            table = new DataTable();
            table.setTableName(rs.getString("TABLE_NAME"));
            table.setPhysicalTableRegex(rs.getString("TABLE_NAME"));
            table.setVerId(null);
            table.setStatus("ok");
            table.setCreateTime(new java.util.Date());
            list.add(table);
        }
        return list;
    }

    public List<Map<String, Object>> fetchTableColumn(Map<String, Object> params) throws Exception {
        try {

            String sql = params.get("sql").toString();

            if(StringUtils.containsIgnoreCase(sql,"DDL_TIME")) {
                sql += " order by DDL_TIME desc";
            } else if(StringUtils.containsIgnoreCase(sql,"SEQNO")) {
                sql += " order by SEQNO desc";
            } else if(StringUtils.containsIgnoreCase(sql,"CREATE_TIME")) {
                sql += " order by CREATE_TIME desc";
            } else if(StringUtils.containsIgnoreCase(sql,"SERNO")) {
                sql += " order by SERNO desc";
            } else if(StringUtils.containsIgnoreCase(sql,"ID")) {
                sql += " order by ID desc";
            }

            if (StringUtils.equalsIgnoreCase(params.get("dsType").toString(), "oracle")) {
                sql = "select * from ("+ sql +") where rownum <= 100";
            } else if (StringUtils.equalsIgnoreCase(params.get("dsType").toString(), "mysql")) {
                sql = sql + " limit 100";
            }

            logger.info("查询源库的SQL语句为: {}", sql);

            PreparedStatement statement = conn.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery();
            List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
            ResultSetMetaData md = resultSet.getMetaData(); //获得结果集结构信息,元数据
            int columnCount = md.getColumnCount();   //获得列数
            boolean flag = false; //判断表格是否为空
            while (resultSet.next()) {
                flag = true;
                Map<String, Object> rowData = new LinkedHashMap<>();
                for (int i = 1; i <= columnCount; i++) {
                    if (md.getColumnName(i).indexOf("TIME") != -1 && params.get("dsType").toString().equals("oracle")) {
                        if (sql.indexOf("HEARTBEAT") != -1) {
                            rowData.put(md.getColumnName(i), resultSet.getObject(i));
                        } else {
                            rowData.put(md.getColumnName(i), resultSet.getTimestamp(md.getColumnName(i)));
                        }
                    } else {
                        rowData.put(md.getColumnName(i), resultSet.getObject(i));
                    }
                }
                list.add(rowData);
            }
            resultSet.close();
            statement.close();
            //表为空，取不到结果集结构，所以将sql语句中的列名取出
            if (!(flag)) {
                String columns = sql.substring(sql.indexOf("select") + 6, sql.indexOf("from"));
                String[] column = columns.split(",");
                Map<String, Object> rowName = new HashMap<String, Object>();
                for (int j = 0; j < column.length; j++) {
                    rowName.put(column[j], null);
                }
                list.add(rowName);
            }
            return list;

        } finally {
            if (!conn.isClosed()) {
                conn.close();
            }
        }
    }

    public List<Map<String, Object>> fetchTableColumnsInformation(DataTable tableInformation) throws SQLException {
        try {
            String sql = "";
            if (tableInformation.getDsType().equals("oracle")) {
                sql = "select COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE from ALL_TAB_COLUMNS where OWNER= '" + tableInformation.getSchemaName() +
                        "' and TABLE_NAME='" + tableInformation.getTableName() + "'";
            } else if (tableInformation.getDsType().equals("mysql")) {
                sql = " SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH DATA_LENGTH, NUMERIC_PRECISION DATA_PRECISION, NUMERIC_SCALE DATA_SCALE FROM information_schema.`COLUMNS` t_col " +
                        " WHERE t_col.TABLE_SCHEMA = '" + tableInformation.getSchemaName() +
                        "' AND t_col.TABLE_NAME = '" + tableInformation.getTableName() + "'";
            }

            PreparedStatement statement = conn.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery();
            List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();
            ResultSetMetaData md = resultSet.getMetaData(); //获得结果集结构信息,元数据
            int columnCount = md.getColumnCount();   //获得列数
            boolean flag = false; //判断表格是否为空
            while (resultSet.next()) {
                flag = true;
                Map<String, Object> rowData = new LinkedHashMap();
                for (int i = 1; i <= columnCount; i++) {
                    rowData.put(md.getColumnLabel(i), resultSet.getObject(i));
                }
                list.add(rowData);
            }
            resultSet.close();
            statement.close();
            for(Map<String, Object> column: list) {
                Object dataType = column.get("DATA_TYPE");
                Object dataLength = column.get("DATA_LENGTH");
                Object dataPrecision = column.get("DATA_PRECISION");
                Object dataScale = column.get("DATA_SCALE");

                if(dataLength != null) {
                    column.put("DATA_TYPE", dataType.toString()+"("+ dataLength.toString() +")");
                } else if(dataPrecision!=null || dataScale!=null) {
                    if(dataPrecision == null) dataPrecision = "";
                    if(dataScale == null) dataScale = "";
                    column.put("DATA_TYPE", dataType.toString()+"("+ dataPrecision.toString() +","+dataScale.toString() +")");
                }
            }
            //在DATA_TYPE中添加是否主键
            fetchTableColumnsPrimaryKey(tableInformation, list);

            return list;
        } finally {
            if (!conn.isClosed()) {
                conn.close();
            }
        }
    }

    private void fetchTableColumnsPrimaryKey(DataTable tableInformation, List<Map<String, Object>> columnsInfomation) throws SQLException  {
        try {
            String sql = "";
            if (tableInformation.getDsType().equals("oracle")) {
                sql = "select COLUMN_NAME from all_cons_columns cu, all_constraints au where cu.constraint_name = au.constraint_name and au.constraint_type = 'P' and cu.table_name='"+ tableInformation.getTableName() +"'";
            } else if (tableInformation.getDsType().equals("mysql")) {
                sql = "select COLUMN_NAME from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='"+tableInformation.getTableName()+"' and COLUMN_KEY='PRI'";
            }

            PreparedStatement statement = conn.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery();

            for(Map<String, Object> column: columnsInfomation) {
                column.put("IS_PRIMARY", "NO");
            }
            while (resultSet.next()) {
                for(Map<String, Object> column: columnsInfomation) {
                    if(column.get("COLUMN_NAME").toString().equals(resultSet.getString("COLUMN_NAME"))) {
                        column.put("IS_PRIMARY", "YES");
                        break;
                    }
                }
            }
            resultSet.close();
            statement.close();
        } finally {
            if (!conn.isClosed()) {
                conn.close();
            }
        }
    }

    private int findString(String string, String strings[]) {
        //全部为大写字母
        string = string.toUpperCase();

        for (int i = 0; i < strings.length; i++) {
            if (string.equals(strings[i])) return i;
        }
        return -1;
    }

    public List<List<String>> doSqlRule(String sql, List<List<String>> data) {
        int maxColumn = getMaxColumn(data);
        createSqlTable(maxColumn);
        insertSqlData(data, maxColumn);
        List<List<String>> result = executeSqlRule(sql, data);
        return result;
    }

    private int getMaxColumn(List<List<String>> data) {
        int result = 0;
        for (List<String> list : data) {
            result = Math.max(result, list.size());
        }
        return result;
    }

    private void createSqlTable(int maxColumn) {
        StringBuilder sb = new StringBuilder("c1 varchar(512)");
        for(int i=2;i<=maxColumn;i++) {
            sb.append(",c");
            sb.append(i);
            sb.append(" varchar(512)");
        }
        String sql="create temporary table temp ("+sb.toString()+")DEFAULT CHARSET=utf8;";
        try {
            PreparedStatement statement = conn.prepareStatement(sql);
            statement.execute();
        } catch (SQLException e) {
            LoggerFactory.getLogger(getClass()).warn("Execute create failed");
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
        }
    }

    private void insertSqlData(List<List<String>> data,int maxColumn) {
        Statement statement = null;
        try {
            statement = conn.createStatement();
        } catch (SQLException e) {
            e.printStackTrace();
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
        }
        StringBuilder sb = new StringBuilder();
        for(List<String> list: data) {
            sb.setLength(0);
            for(int i=1;i<=maxColumn;i++) {
                sb.append('\'');
                if(i<=list.size() && list.get(i-1)!=null){
                    sb.append(list.get(i-1));
                }
                sb.append('\'');
                sb.append(',');
            }
            sb.deleteCharAt(sb.length()-1);
            try {
                statement.addBatch("insert into temp values("+sb.toString()+");");
            } catch (SQLException e) {
                e.printStackTrace();
                try {
                    if (conn != null) {
                        conn.close();
                    }
                } catch (SQLException e1) {
                    e1.printStackTrace();
                }
            }
        }
        try {
            statement.executeBatch();
        } catch (SQLException e) {
            LoggerFactory.getLogger(getClass()).warn("Execute insert failed");
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
        }
    }

    private List<List<String>> executeSqlRule(String sql, List<List<String>> data) {
        try {
            PreparedStatement statement = conn.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery();
            ResultSetMetaData metaData = resultSet.getMetaData();

            List<List<String>> result = new ArrayList<>();
            while (resultSet.next()) {
                List<String> list = new ArrayList<>();
                for(int i=1;i<=metaData.getColumnCount();i++) {
                    list.add(resultSet.getString(i));
                }
                result.add(list);
            }
            return result;
        } catch (SQLException e) {
            LoggerFactory.getLogger(getClass()).warn("Execute custom sql command failed");
            try {
                if (conn != null) {
                    conn.close();
                }
            } catch (SQLException e1) {
                e1.printStackTrace();
            }
            return null;
        }
    }

    /**
     * @return oracle数据源的表信息
     * @throws Exception
     */
    public List<DataTable> listTable() throws Exception {
        try {
            String sql = "select * from DBUS_TABLES";
            PreparedStatement statement = conn.prepareStatement(sql);
            ResultSet resultSet = statement.executeQuery();
            return buildResult(resultSet);
        } finally {
            if (!conn.isClosed()) {
                conn.close();
            }
        }
    }

    /**
     * @return 构造listTable的返回信息，表中包含SchemaName和TableName
     * @throws SQLException
     */

    protected List<DataTable> buildResult(ResultSet rs) throws SQLException {
        List<DataTable> list = new ArrayList<>();
        DataTable table;
        while (rs.next()) {
            table = new DataTable();
            table.setSchemaName(rs.getString("OWNER"));
            table.setTableName(rs.getString("TABLE_NAME"));
            list.add(table);
        }
        return list;
    }

    /**
     * 将新的表的信息插入到源端
     * @throws Exception
     */
    public int insertTable(Map<String, Object> params) throws Exception {
        try {
            PreparedStatement statement = conn.prepareStatement(buildQuery(params));
            fillParameters(statement, params);
            int i = statement.executeUpdate();
            return i;
        } finally {
            if (!conn.isClosed()) {
                conn.close();
            }
        }
    }
}
