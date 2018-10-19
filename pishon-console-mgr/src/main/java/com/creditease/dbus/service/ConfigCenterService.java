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

package com.creditease.dbus.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.serializer.SerializerFeature;
import com.creditease.dbus.base.ResultEntity;
import com.creditease.dbus.base.com.creditease.dbus.utils.RequestSender;
import com.creditease.dbus.commons.Constants;
import com.creditease.dbus.commons.IZkService;
import com.creditease.dbus.constant.KeeperConstants;
import com.creditease.dbus.constant.MessageCode;
import com.creditease.dbus.constant.ServiceNames;
import com.creditease.dbus.domain.model.EncodePlugins;
import com.creditease.dbus.domain.model.Sink;
import com.creditease.dbus.domain.model.User;
import com.creditease.dbus.utils.ConfUtils;
import com.creditease.dbus.utils.DBusUtils;
import com.creditease.dbus.utils.HttpClientUtils;
import com.jcraft.jsch.ChannelExec;
import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.text.MessageFormat;
import java.util.*;

import static com.creditease.dbus.constant.KeeperConstants.*;

/**
 * Created by xiancangao on 2018/05/31
 */
@Service
public class ConfigCenterService {

    @Autowired
    private IZkService zkService;

    @Autowired
    private Environment env;

    @Autowired
    private RequestSender sender;

    @Autowired
    private ToolSetService toolSetService;

    private Logger logger = LoggerFactory.getLogger(getClass());

    public Integer updateGlobalConf(LinkedHashMap<String, String> map) throws Exception {
        //1.bootstrapServers检测
        String bootstrapServers = map.get(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS);
        String[] split = bootstrapServers.split(",");
        for (String s : split) {
            String[] hostPort = s.split(":");
            if (hostPort == null || hostPort.length != 2) {
                return MessageCode.KAFKA_BOOTSTRAP_SERVERS_IS_WRONG;
            }
            boolean b = urlTest(hostPort[0], Integer.parseInt(hostPort[1]));
            if (!b) {
                return MessageCode.KAFKA_BOOTSTRAP_SERVERS_IS_WRONG;
            }
        }
        //2.Grafana检测
        String monitURL = map.get(GLOBAL_CONF_KEY_MONITOR_URL);
        if (!urlTest(monitURL)) {
            return MessageCode.MONITOR_URL_IS_WRONG;
        }

        //3.storm检测
        String host = map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_HOST);
        int port = Integer.parseInt(map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_PORT));
        String user = map.get(GLOBAL_CONF_KEY_STORM_SSH_USER);
        String path = map.get(GLOBAL_CONF_KEY_STORM_HOME_PATH);
        String pubKeyPath = env.getProperty("pubKeyPath");
        String s = exeCmdErrorStream(user, host, port, pubKeyPath, "cd " + path);
        if (s == null) {
            return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
        }
        if (StringUtils.isNotBlank(s)) {
            return MessageCode.STORM_HOME_PATH_ERROR;
        }
        String stormUI = map.get(GLOBAL_CONF_KEY_STORM_REST_API);
        if (!urlTest(stormUI+"/nimbus/summary")) {
            return MessageCode.STORM_UI_ERROR;
        }
        //4.Influxdb检测
        String influxdbUrl = map.get(GLOBAL_CONF_KEY_INFLUXDB_URL);
        String url = influxdbUrl + "/query?q=show+databases" + "&db=_internal";
        if (!"200".equals(HttpClientUtils.httpGet(url))) {
            return MessageCode.INFLUXDB_URL_ERROR;
        }
        //5.心跳检测
        String[] hosts = map.get("heartbeat.host").split(",");
        int heartport = Integer.parseInt(map.get("heartbeat.port"));
        String heartuser = map.get("heartbeat.user");
        String heartpath = map.get("heartbeat.jar.path");
        for (String hearthost : hosts) {
            String res = exeCmdErrorStream(heartuser, hearthost, heartport, pubKeyPath, "cd " + heartpath);
            if (res == null) {
                return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
            }
            if (StringUtils.isNotBlank(s)) {
                return MessageCode.HEARTBEAT_JAR_PATH_ERROR;
            }
        }
        map.remove("grafanaToken");
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : map.entrySet()) {
            sb.append(entry.getKey()).append("=").append(entry.getValue()).append("\n");
        }
        zkService.setData(Constants.GLOBAL_PROPERTIES_ROOT, sb.toString().getBytes(UTF8));
        return 0;
    }

    public Integer updateMgrDB(Map<String, String> map) throws Exception {
        Connection connection = null;
        try {
            String content = map.get("content");
            map.clear();
            String[] split = content.split("\n");
            for (String s : split) {
                String replace = s.replace("\r", "");
                String[] pro = replace.split("=", 2);
                if (pro != null && pro.length == 2) {
                    map.put(pro[0], pro[1]);
                }
            }
            logger.info(map.toString());
            String driverClassName = map.get("driverClassName");
            String url = map.get("url");
            String username = map.get("username");
            String password = map.get("password");
            Class.forName(driverClassName);
            connection = DriverManager.getConnection(url, username, password);

            zkService.setData(MGR_DB_CONF, content.getBytes(UTF8));
            return null;
        } catch (SQLException e) {
            logger.error(e.getMessage(), e);
            return MessageCode.DBUS_MGR_DB_FAIL_WHEN_CONNECT;
        } finally {
            if (connection != null) {
                connection.close();
            }
        }
    }

    public ResultEntity getBasicConf() {
        return sender.get(ServiceNames.KEEPER_SERVICE, "/toolSet/getMgrDBMsg").getBody();
    }

    public int updateBasicConf(LinkedHashMap<String, String> map) throws Exception {
        if (isInitialized()) {
            return MessageCode.DBUS_ENVIRONMENT_IS_ALREADY_INIT;
        }
        Boolean initialized = isInitialized();

        //1 检测配置数据是否正确
        int initRes = checkInitData(map);
        if (initRes != 0) {
            return initRes;
        }

        //2.初始化zk节点
        int zkRes = initZKNodes(map);
        if (zkRes != 0) {
            return zkRes;
        }
        logger.info("2.zookeeper节点初始化完成。");

        //3.初始化心跳
        int heartRes = initHeartBeat(map, initialized);
        if (heartRes != 0) {
            return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
        }
        logger.info("3.heartbeat初始化完成。");

        //4.初始化mgr数据库
        ResponseEntity<ResultEntity> res = sender.get(ServiceNames.KEEPER_SERVICE, "/toolSet/initMgrSql");
        if (res.getBody().getStatus() != 0) {
            return MessageCode.DBUS_MGR_INIT_ERROR;
        }
        logger.info("4.mgr数据库初始化完成。");

        //5.模板sink添加
        String bootstrapServers = map.get(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS);
        String bootstrapServersVersion = map.get(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS_VERSION);
        Sink sink = new Sink();
        sink.setSinkName("example");
        sink.setSinkDesc("i'm example");
        sink.setSinkType(bootstrapServersVersion);
        sink.setUrl(bootstrapServers);
        sink.setUpdateTime(new Date());
        sink.setIsGlobal((byte) 0);//默认0:false,1:true
        res = sender.post(ServiceNames.KEEPER_SERVICE, "/sinks/exampleSink", sink);
        if (res.getBody().getStatus() != 0) {
            return MessageCode.CREATE_DEFAULT_SINK_ERROR;
        }
        logger.info("5.添加模板sink初始化完成。");

        //6.超级管理员添加
        User u = new User();
        u.setRoleType("admin");
        u.setStatus("active");
        u.setUserName("超级管理员");
        u.setPassword(DBusUtils.md5("12345678"));
        u.setEmail("admin");
        u.setPhoneNum("13000000000");
        u.setUpdateTime(new Date());
        res = sender.post(ServiceNames.KEEPER_SERVICE, "/users/create", u);
        if (res.getBody().getStatus() != 0) {
            return MessageCode.CREATE_SUPER_USER_ERROR;
        }
        logger.info("6.添加超级管理员初始化完成。");

        //7.初始化storm程序包 storm.root.path
        if (initStormJars(map, initialized) != 0) {
            return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
        }
        logger.info("7.storm程序包初始化完成。");

        //8.Grafana初始化
        String monitURL = map.get(GLOBAL_CONF_KEY_MONITOR_URL);
        String grafanaToken = map.get("grafanaToken");
        String influxdbUrl = map.get(GLOBAL_CONF_KEY_INFLUXDB_URL);
        initGrafana(monitURL, influxdbUrl, grafanaToken);
        logger.info("8.Grafana初始化完成。");

        //9.Influxdb初始化
        if (initInfluxdb(influxdbUrl) != 0) {
            return MessageCode.INFLUXDB_URL_ERROR;
        }
        logger.info("9.Influxdb初始化完成。");

        //10.初始化脱敏
        if (initEncode() != 0) {
            return MessageCode.ENCODE_PLUGIN_INIT_ERROR;
        }
        logger.info("10.脱敏插件初始化完成。");
        if (zkService.isExists("/DBusInit")) {
            zkService.deleteNode("/DBusInit");
        }
        //11.初始化报警配置
        initAlarm(map);
        logger.info("11.报警配置初始化完成。");
        return 0;
    }

    public int updateBasicConfByOption(LinkedHashMap<String, String> map, String options) throws Exception {
        Integer res = updateGlobalConf(map);
        if (res != 0) {
            return res;
        }
        List<String> optionList = Arrays.asList(options.split("-"));
        if (optionList.contains("grafana")) {
            String monitURL = map.get(GLOBAL_CONF_KEY_MONITOR_URL);
            String grafanaToken = map.get("grafanaToken");
            String influxdbUrl = map.get(GLOBAL_CONF_KEY_INFLUXDB_URL);
            initGrafana(monitURL, influxdbUrl, grafanaToken);
            logger.info("grafana初始化完成。");
        }
        if (optionList.contains("influxdb")) {
            String influxdbUrl = map.get(GLOBAL_CONF_KEY_INFLUXDB_URL);
            if (initInfluxdb(influxdbUrl) != 0) {
                return MessageCode.INFLUXDB_URL_ERROR;
            }
            logger.info("influxdb初始化完成。");
        }
        if (optionList.contains("storm")) {
            if (initStormJars(map, false) != 0) {
                return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
            }
            logger.info("storm程序包初始化完成。");
        }
        if (optionList.contains("heartBeat")) {
            int heartRes = initHeartBeat(map, false);
            if (heartRes != 0) {
                return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
            }
            logger.info("heartbeat程序包初始化完成。");
        }
        if(!isInitialized()){
            int zkRes = initZKNodes(map);
            if (zkRes != 0) {
                return zkRes;
            }
            logger.info("zookeeper节点初始化完成。");
        }
        return 0;
    }

    public Boolean isInitialized() throws Exception {
        return zkService.isExists(Constants.DBUS_ROOT);
    }

    /**
     * 1
     *
     * @param map
     * @return
     */
    private int checkInitData(LinkedHashMap<String, String> map) {
        //1.bootstrapServers检测
        String bootstrapServers = map.get(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS);
        String[] split = bootstrapServers.split(",");
        for (String s : split) {
            String[] hostPort = s.split(":");
            if (hostPort == null || hostPort.length != 2) {
                return MessageCode.KAFKA_BOOTSTRAP_SERVERS_IS_WRONG;
            }
            boolean b = urlTest(hostPort[0], Integer.parseInt(hostPort[1]));
            if (!b) {
                return MessageCode.KAFKA_BOOTSTRAP_SERVERS_IS_WRONG;
            }
            logger.info("1.1.bootstrapServers，url：{}测试通过", bootstrapServers);
        }
        //2.Grafana检测
        String monitURL = map.get(GLOBAL_CONF_KEY_MONITOR_URL);
        if (!urlTest(monitURL)) {
            return MessageCode.MONITOR_URL_IS_WRONG;
        }
        String grafanaToken = map.get("grafanaToken");
        grafanaToken = "Bearer " + grafanaToken;
        Integer code = HttpClientUtils.httpGetWithAuthorization(monitURL, grafanaToken);
        if (code == 401) {
            return MessageCode.GRAFANATOKEN_IS_ERROR;
        }
        logger.info("1.2.grafana_url，url：{}测试通过", monitURL);

        //3.storm检测
        String host = map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_HOST);
        int port = Integer.parseInt(map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_PORT));
        String user = map.get(GLOBAL_CONF_KEY_STORM_SSH_USER);
        String path = map.get(GLOBAL_CONF_KEY_STORM_HOME_PATH);
        String pubKeyPath = env.getProperty("pubKeyPath");
        String s = exeCmdErrorStream(user, host, port, pubKeyPath, "cd " + path);
        if (s == null) {
            return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
        }
        if (StringUtils.isNotBlank(s)) {
            return MessageCode.STORM_HOME_PATH_ERROR;
        }
        String stormUI = map.get(GLOBAL_CONF_KEY_STORM_REST_API);
        if (!urlTest(stormUI+"/nimbus/summary")) {
            return MessageCode.STORM_UI_ERROR;
        }
        logger.info("1.3.storm免密配置测试通过,host:{},port:{},user:{}", host, port, user);
        //4.Influxdb检测
        String influxdbUrl = map.get(GLOBAL_CONF_KEY_INFLUXDB_URL);
        String url = influxdbUrl + "/query?q=show+databases" + "&db=_internal";
        if (!"200".equals(HttpClientUtils.httpGet(url))) {
            return MessageCode.INFLUXDB_URL_ERROR;
        }
        logger.info("1.4.influxdbUrl测试通过,influxdbUrl:{}", influxdbUrl);
        //5.心跳检测
        String[] hosts = map.get("heartbeat.host").split(",");
        int heartport = Integer.parseInt(map.get("heartbeat.port"));
        String heartuser = map.get("heartbeat.user");
        String heartpath = map.get("heartbeat.jar.path");
        for (String hearthost : hosts) {
            String res = exeCmdErrorStream(heartuser, hearthost, heartport, pubKeyPath, "cd " + heartpath);
            if (res == null) {
                return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
            }
            if (StringUtils.isNotBlank(s)) {
                return MessageCode.HEARTBEAT_JAR_PATH_ERROR;
            }
        }
        return 0;
    }

    /**
     * 2
     *
     * @param map
     * @return
     * @throws Exception
     */
    private int initZKNodes(LinkedHashMap<String, String> map) throws Exception {
        try {
            //初始化global.properties节点
            LinkedHashMap<String, String> linkedHashMap = new LinkedHashMap<String, String>();
            linkedHashMap.put(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS, map.get(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS));
            linkedHashMap.put(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS_VERSION, map.get(GLOBAL_CONF_KEY_BOOTSTRAP_SERVERS_VERSION));
            linkedHashMap.put(GLOBAL_CONF_KEY_MONITOR_URL, map.get(GLOBAL_CONF_KEY_MONITOR_URL));
            linkedHashMap.put(GLOBAL_CONF_KEY_STORM_NIMBUS_HOST, map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_HOST));
            linkedHashMap.put(GLOBAL_CONF_KEY_STORM_NIMBUS_PORT, map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_PORT));
            linkedHashMap.put(GLOBAL_CONF_KEY_STORM_SSH_USER, map.get(GLOBAL_CONF_KEY_STORM_SSH_USER));
            linkedHashMap.put(GLOBAL_CONF_KEY_STORM_HOME_PATH, map.get(GLOBAL_CONF_KEY_STORM_HOME_PATH));
            linkedHashMap.put(GLOBAL_CONF_KEY_STORM_REST_API, map.get(GLOBAL_CONF_KEY_STORM_REST_API));
            linkedHashMap.put(GLOBAL_CONF_KEY_INFLUXDB_URL, map.get(GLOBAL_CONF_KEY_INFLUXDB_URL));
            linkedHashMap.put("zk.url", env.getProperty("zk.str"));
            linkedHashMap.put("heartbeat.host", map.get("heartbeat.host"));
            linkedHashMap.put("heartbeat.port", map.get("heartbeat.port"));
            linkedHashMap.put("heartbeat.user", map.get("heartbeat.user"));
            linkedHashMap.put("heartbeat.jar.path", map.get("heartbeat.jar.path"));

            String homePath = map.get(GLOBAL_CONF_KEY_STORM_HOME_PATH);
            linkedHashMap.put("dbus.jars.base.path", homePath + "/dbus_jars");
            linkedHashMap.put("dbus.router.jars.base.path", homePath + "/dbus_router_jars");
            linkedHashMap.put("dbus.encode.plugins.jars.base.path", homePath + "/dbus_encoder_plugins_jars");
            if (!zkService.isExists(Constants.DBUS_ROOT)) {
                zkService.createNode(Constants.DBUS_ROOT, null);
            }
            if (!zkService.isExists(Constants.COMMON_ROOT)) {
                zkService.createNode(Constants.COMMON_ROOT, null);
            }
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> entry : linkedHashMap.entrySet()) {
                sb.append(entry.getKey()).append("=").append(entry.getValue()).append("\n");
            }
            if (zkService.isExists(Constants.GLOBAL_PROPERTIES_ROOT)) {
                zkService.setData(Constants.GLOBAL_PROPERTIES_ROOT, sb.toString().getBytes(UTF8));
            } else {
                zkService.createNode(Constants.GLOBAL_PROPERTIES_ROOT, sb.toString().getBytes(UTF8));
            }
            //初始化其他节点数据
            toolSetService.initConfig(null);
            return 0;
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return MessageCode.INIT_ZOOKEEPER_ERROR;
        }
    }

    /**
     * 3
     *
     * @param map
     * @param initialized
     * @return
     */
    private int initHeartBeat(LinkedHashMap<String, String> map, boolean initialized) {
        try {
            //上传并启动心跳程序
            String[] hosts = map.get("heartbeat.host").split(",");
            int port = Integer.parseInt(map.get("heartbeat.port"));
            String user = map.get("heartbeat.user");
            String path = map.get("heartbeat.jar.path");
            String heartPath = path + "/dbus-heartbeat-0.5.0";
            String heartZipPath = path + "/dbus-heartbeat-0.5.0.zip";
            String pubKeyPath = env.getProperty("pubKeyPath");
            for (String host : hosts) {
                if (initialized) {
                    String cmd = "kill -s TERM $(jps -l | grep 'heartbeat' | awk '{print $1}')";
                    logger.info("cmd:{}", cmd);
                    if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
                        return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
                    }
                    cmd = MessageFormat.format(" rm -rf {0};rm -rf {1}", heartPath, heartZipPath);
                    logger.info("cmd:{}", cmd);
                    if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
                        return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
                    }
                }
                //6.1.新建目录
                String cmd = MessageFormat.format(" mkdir -pv {0}", path);
                logger.info("cmd:{}", cmd);
                if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
                    return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
                }
                //6.2.上传压缩包
                if (uploadFile(user, host, port, pubKeyPath, ConfUtils.getParentPath() + "/dbus-heartbeat-0.5.0.zip", path) != 0) {
                    return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
                }
                //6.3.解压压缩包
                cmd = MessageFormat.format("cd {0};unzip -oq dbus-heartbeat-0.5.0.zip", path);
                logger.info("cmd:{}", cmd);
                if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
                    return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
                }
                //6.4启动心跳
                cmd = MessageFormat.format("cd {0}; nohup ./heartbeat.sh >/dev/null 2>&1 & ", path + "/dbus-heartbeat-0.5.0");
                logger.info("cmd:{}", cmd);
                if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
                    return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
                }
            }
            return 0;
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return MessageCode.HEARTBEAT_SSH_SECRET_CONFIGURATION_ERROR;
        }
    }

    /**
     * 7
     *
     * @param map
     * @param initialized
     * @return
     */
    private int initStormJars(LinkedHashMap<String, String> map, Boolean initialized) {
        String host = map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_HOST);
        int port = Integer.parseInt(map.get(GLOBAL_CONF_KEY_STORM_NIMBUS_PORT));
        String user = map.get(GLOBAL_CONF_KEY_STORM_SSH_USER);
        String pubKeyPath = env.getProperty("pubKeyPath");
        String homePath = map.get(GLOBAL_CONF_KEY_STORM_HOME_PATH);
        String jarsPath = homePath + "/dbus_jars";
        String routerJarsPath = homePath + "/dbus_router_jars";
        String encodePluginsPath = homePath + "/dbus_encoder_plugins_jars";
        String baseJarsPath = homePath + "/base_jars.zip";
        if (initialized) {
            String cmd = MessageFormat.format("rm -rf {0}; rm -rf {1}; rm -rf {2};rm -rf {3}",
                    jarsPath, routerJarsPath, encodePluginsPath, baseJarsPath);
            logger.info("cmd:{}", cmd);
            if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
                return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
            }
        }
        //7.1.新建目录
        String cmd = MessageFormat.format(" mkdir -pv {0}", homePath);
        logger.info("cmd:{}", cmd);
        if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
            return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
        }
        //7.2.上传压缩包
        if (uploadFile(user, host, port, pubKeyPath, ConfUtils.getParentPath() + "/base_jars.zip", homePath) != 0) {
            return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
        }
        //7.3.解压压缩包
        cmd = MessageFormat.format(" cd {0}; unzip -oq base_jars.zip", homePath);
        logger.info("cmd:{}", cmd);
        if (null == exeCmd(user, host, port, pubKeyPath, cmd)) {
            return MessageCode.STORM_SSH_SECRET_CONFIGURATION_ERROR;
        }
        return 0;
    }

    /**
     * 8
     *
     * @param grafanaurl
     * @param influxdbUrl
     * @param grafanaToken
     * @return
     * @throws Exception
     */
    private int initGrafana(String grafanaurl, String influxdbUrl, String grafanaToken) throws Exception {
        //新建data source
        grafanaToken = "Bearer " + grafanaToken;
        String url = grafanaurl + "/api/datasources";
        String json = "{\"name\":\"inDB\",\"type\":\"influxdb\",\"url\":\"" + influxdbUrl + "\",\"access\":\"direct\",\"jsonData\":{},\"database\":\"dbus_stat_db\",\"user\":\"dbus\",\"password\":\"dbus!@#123\"}";
        HttpClientUtils.httpPostWithAuthorization(url, grafanaToken, json);

        //导入Grafana Dashboard
        url = grafanaurl + "/api/dashboards/import";
        byte[] bytes = ConfUtils.toByteArray("init/grafana_schema.json");
        HttpClientUtils.httpPostWithAuthorization(url, grafanaToken, new String(bytes, KeeperConstants.UTF8));
        bytes = ConfUtils.toByteArray("init/grafana_table.json");
        HttpClientUtils.httpPostWithAuthorization(url, grafanaToken, new String(bytes, KeeperConstants.UTF8));
        bytes = ConfUtils.toByteArray("init/Heartbeat_log_filebeat.json");
        HttpClientUtils.httpPostWithAuthorization(url, grafanaToken, new String(bytes, KeeperConstants.UTF8));
        bytes = ConfUtils.toByteArray("init/Heartbeat_log_flume.json");
        HttpClientUtils.httpPostWithAuthorization(url, grafanaToken, new String(bytes, KeeperConstants.UTF8));
        bytes = ConfUtils.toByteArray("init/Heartbeat_log_logstash.json");
        HttpClientUtils.httpPostWithAuthorization(url, grafanaToken, new String(bytes, KeeperConstants.UTF8));
        return 0;
    }

    /**
     * 9
     *
     * @param influxdbUrl
     * @return
     */
    private int initInfluxdb(String influxdbUrl) {
        String head = influxdbUrl + "/query?q=";
        String tail = "&db=_internal";
        String result = HttpClientUtils.httpGet(head + "create+database+dbus_stat_db" + tail);
        logger.info(head + "create+database+test" + tail);
        if (!"200".equals(result)) {
            return MessageCode.INFLUXDB_URL_ERROR;
        }
        tail = "&db=_test";
        result = HttpClientUtils.httpGet(head + "CREATE+USER+%22dbus%22+WITH+PASSWORD+%27dbus!%40%23123%27" + tail);
        logger.info(head + "CREATE+USER+%22dbus1%22+WITH+PASSWORD+%27password%27" + tail);
        if (!"200".equals(result)) {
            return MessageCode.INFLUXDB_URL_ERROR;
        }
        result = HttpClientUtils.httpGet(head + "ALTER+RETENTION+POLICY+autogen+ON+dbus_stat_db+DURATION+15d" + tail);
        logger.info(head + "ALTER+RETENTION+POLICY+autogen+ON+dbus_stat_db+DURATION+15d" + tail);
        if (!"200".equals(result)) {
            return MessageCode.INFLUXDB_URL_ERROR;
        }
        return 0;
    }

    /**
     * 10
     *
     * @return
     * @throws Exception
     */
    private int initEncode() throws Exception {
        Properties global = zkService.getProperties(Constants.GLOBAL_PROPERTIES_ROOT);
        String basePath = global.getProperty("dbus.encode.plugins.jars.base.path");
        String path = basePath + "/0/20180809_155150/encoder-plugins-0.5.0.jar";
        EncodePlugins encodePlugin = new EncodePlugins();
        encodePlugin.setName("encoder-plugins-0.5.0.jar");
        encodePlugin.setPath(path);
        encodePlugin.setProjectId(0);
        encodePlugin.setStatus(KeeperConstants.ACTIVE);
        encodePlugin.setEncoders("md5,default-value,murmur3,regex,replace");
        ResponseEntity<ResultEntity> post = sender.post(ServiceNames.KEEPER_SERVICE, "encode-plugins/create", encodePlugin);
        if (post.getBody().getStatus() != 0) {
            return MessageCode.ENCODE_PLUGIN_INIT_ERROR;
        }
        return 0;
    }

    /**
     * 11
     *
     * @param map
     * @throws Exception
     */
    private void initAlarm(LinkedHashMap<String, String> map) throws Exception {
        //heartbeat_config.json
        byte[] data = zkService.getData(Constants.HEARTBEAT_CONFIG_JSON);
        JSONObject json = JSONObject.parseObject(new String(data, UTF8));
        if(StringUtils.isNotBlank(map.get("alarmSendEmail"))){
            json.put("alarmSendEmail", map.get("alarmSendEmail"));
        }
        if(StringUtils.isNotBlank(map.get("alarmMailSMTPAddress"))){
            json.put("alarmMailSMTPAddress", map.get("alarmMailSMTPAddress"));
        }
        if(StringUtils.isNotBlank(map.get("alarmMailSMTPPort"))){
            json.put("alarmMailSMTPPort", map.get("alarmMailSMTPPort"));
        }
        if(StringUtils.isNotBlank(map.get("alarmMailUser"))){
            json.put("alarmMailUser", map.get("alarmMailUser"));
        }
        if(StringUtils.isNotBlank(map.get("alarmMailPass"))){
            json.put("alarmMailPass", map.get("alarmMailPass"));
        }
        //格式化jsonjson
        String format = this.formatJsonString(JSON.toJSONString(json, SerializerFeature.WriteMapNullValue));
        zkService.setData(Constants.HEARTBEAT_CONFIG_JSON, format.getBytes(UTF8));
    }


    /**
     * 递归删除给定路径的zk结点
     */
    private void deleteNodeRecursively(String path) throws Exception {
        List<String> children = null;
        children = zkService.getChildren(path);
        if (children.size() > 0) {
            for (String child : children) {
                String childPath = null;
                if (path.equals("/")) {
                    childPath = path + child;
                } else {
                    childPath = path + "/" + child;
                }
                deleteNodeRecursively(childPath);
            }
        }
        zkService.deleteNode(path);
        logger.info("deleting zkNode......." + path);
    }


    public boolean urlTest(String url) {
        boolean result = false;
        HttpURLConnection conn = null;
        try {
            URL url_ = new URL(url);
            conn = (HttpURLConnection) url_.openConnection();
            int code = conn.getResponseCode();
            if (code == 200) {
                result = true;
            }
        } catch (Exception e) {
            logger.error("url连通性测试异常.errorMessage:{},url{}", e.getMessage(), url, e);
        } finally {
            if (conn == null) {
                conn.disconnect();
            }
        }
        return result;
    }

    public boolean urlTest(String host, int port) {
        boolean result = false;
        Socket socket = null;
        try {
            socket = new Socket();
            socket.connect(new InetSocketAddress(host, port));
            socket.close();
            result = true;
        } catch (IOException e) {
            logger.error("连通性测试异常.errorMessage:{};host:{},port:{}", e.getMessage(), host, port, e);
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    logger.error(e.getMessage(), e);
                }
            }
        }
        return result;
    }

    /**
     * json 字符串格式化
     *
     * @param s
     * @return
     */
    public String formatJsonString(String s) {
        int level = 0;
        //存放格式化的json字符串
        StringBuffer jsonForMatStr = new StringBuffer();
        for (int index = 0; index < s.length(); index++)//将字符串中的字符逐个按行输出
        {
            //获取s中的每个字符
            char c = s.charAt(index);

            //level大于0并且jsonForMatStr中的最后一个字符为\n,jsonForMatStr加入\t
            if (level > 0 && '\n' == jsonForMatStr.charAt(jsonForMatStr.length() - 1)) {
                jsonForMatStr.append(getLevelStr(level));
            }
            //遇到"{"和"["要增加空格和换行，遇到"}"和"]"要减少空格，以对应，遇到","要换行
            switch (c) {
                case '{':
                case '[':
                    jsonForMatStr.append(c + "\n");
                    level++;
                    break;
                case ',':
                    jsonForMatStr.append(c + "\n");
                    break;
                case '}':
                case ']':
                    jsonForMatStr.append("\n");
                    level--;
                    jsonForMatStr.append(getLevelStr(level));
                    jsonForMatStr.append(c);
                    break;
                default:
                    jsonForMatStr.append(c);
                    break;
            }
        }
        return jsonForMatStr.toString();
    }

    private String getLevelStr(int level) {
        StringBuffer levelStr = new StringBuffer();
        for (int levelI = 0; levelI < level; levelI++) {
            levelStr.append("\t");
        }
        return levelStr.toString();
    }

    public String exeCmd(String user, String host, int port, String pubKeyPath, String command) {
        Session session = null;
        ChannelExec channel = null;
        try {
            JSch jsch = new JSch();
            jsch.addIdentity(pubKeyPath);

            session = jsch.getSession(user, host, port);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();
            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(command);

            BufferedReader in = new BufferedReader(new InputStreamReader(channel.getInputStream()));
            channel.connect();
            String msg;
            StringBuilder sb = new StringBuilder();
            while ((msg = in.readLine()) != null) {
                sb.append(msg).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return null;
        } finally {
            if (channel != null) {
                channel.disconnect();
            }
            if (session != null) {
                session.disconnect();
            }
        }
    }

    public String exeCmdErrorStream(String user, String host, int port, String pubKeyPath, String command) {
        Session session = null;
        ChannelExec channel = null;
        try {
            JSch jsch = new JSch();
            jsch.addIdentity(pubKeyPath);

            session = jsch.getSession(user, host, port);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect();
            channel = (ChannelExec) session.openChannel("exec");
            channel.setCommand(command);

            BufferedReader in = new BufferedReader(new InputStreamReader(channel.getErrStream()));
            channel.connect();
            String msg;
            StringBuilder sb = new StringBuilder();
            while ((msg = in.readLine()) != null) {
                sb.append(msg).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return null;
        } finally {
            if (channel != null) {
                channel.disconnect();
            }
            if (session != null) {
                session.disconnect();
            }
        }
    }

    public int uploadFile(String user, String host, int port, String pubKeyPath, String pathFrom, String pathTo) {
        Session session = null;
        ChannelSftp sftp = null;
        InputStream in = null;
        try {
            JSch jsch = new JSch();
            jsch.addIdentity(pubKeyPath);

            session = jsch.getSession(user, host, port);
            session.setConfig("StrictHostKeyChecking", "no");
            session.connect(30000);

            sftp = (ChannelSftp) session.openChannel("sftp");
            sftp.connect(1000);
            sftp.cd(pathTo);
            pathFrom = pathFrom.replace("\\", "/");
            File file = new File(pathFrom);
            in = new FileInputStream(file);
            sftp.put(in, file.getName());
            return 0;
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return -1;
        } finally {
            try {
                if (session != null) {
                    session.disconnect();
                }
                if (sftp != null) {
                    sftp.disconnect();
                }
                if (in != null) {
                    in.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {

    }
}
