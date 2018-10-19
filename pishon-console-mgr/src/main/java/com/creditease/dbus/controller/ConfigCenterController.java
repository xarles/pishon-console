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

package com.creditease.dbus.controller;

import com.creditease.dbus.annotation.AdminPrivilege;
import com.creditease.dbus.base.BaseController;
import com.creditease.dbus.base.ResultEntity;
import com.creditease.dbus.constant.MessageCode;
import com.creditease.dbus.service.ConfigCenterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;


/**
 * Created by xiancangao on 2018/05/31
 */
@RestController
@RequestMapping("/configCenter")
@AdminPrivilege
public class ConfigCenterController extends BaseController {
    @Autowired
    private ConfigCenterService configCenterService;

    /**
     * 修改 globalConf 配置
     *
     * @param map
     * @return
     */
    @PostMapping(path = "updateGlobalConf", consumes = "application/json")
    public ResultEntity updateGlobalConf(@RequestBody LinkedHashMap<String, String> map) {
        try {
            Integer result = configCenterService.updateGlobalConf(map);
            return resultEntityBuilder().status(result).build();
        } catch (Exception e) {
            logger.error("Exception encountered while send updateGlobalConf with param ( map:{})}", map, e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    /**
     * 修改 MgrDB 配置
     *
     * @param map
     * @return
     */
    @PostMapping(path = "updateMgrDB", consumes = "application/json")
    public ResultEntity updateMgrDB(@RequestBody Map<String, String> map) {
        try {
            Integer result = configCenterService.updateMgrDB(map);
            if (result != null) {
                return resultEntityBuilder().status(result).build();
            }
            return resultEntityBuilder().build();
        } catch (Exception e) {
            logger.error("Exception encountered while send updateMgrDB with param ( map:{})}", map, e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    /**
     * 获取基础配置,包括zk,kafka,mgrDB地址
     *
     * @return
     */
    @GetMapping("/getBasicConf")
    public ResultEntity getBasicConf() {
        try {
            return configCenterService.getBasicConf();
        } catch (Exception e) {
            logger.error("Exception encountered while getBasicConf ", e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    /**
     * web初始化
     *
     * @param map
     * @return
     */
    @PostMapping(path = "/updateBasicConf", consumes = "application/json")
    public ResultEntity updateBasicConf(@RequestBody LinkedHashMap<String, String> map) {
        try {
            int i = configCenterService.updateBasicConf(map);
            return resultEntityBuilder().status(i).build();
        } catch (Exception e) {
            logger.error("Exception encountered while updateBasicConf ", e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    /**
     * 根据勾选web部分初始化
     *
     * @param map
     * @return
     */
    @PostMapping(path = "/updateBasicConfByOption", consumes = "application/json")
    public ResultEntity updateBasicConfByOption(@RequestBody LinkedHashMap<String, String> map, String options) {
        try {
            int i = configCenterService.updateBasicConfByOption(map, options);
            return resultEntityBuilder().status(i).build();
        } catch (Exception e) {
            logger.error("Exception encountered while updateBasicConfByOption ", e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    /**
     * 环境是否已经初始化过,根据zookeeper有无/DBus节点判断
     *
     * @return
     */
    @GetMapping(path = "/isInitialized")
    public ResultEntity isInitialized() {
        try {
            return resultEntityBuilder().payload(configCenterService.isInitialized()).build();
        } catch (Exception e) {
            logger.error("Exception encountered while isInitialized ", e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

}
