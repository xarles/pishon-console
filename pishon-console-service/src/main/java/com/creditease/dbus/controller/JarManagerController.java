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

import java.util.List;
import java.util.Map;

import com.creditease.dbus.base.BaseController;
import com.creditease.dbus.base.ResultEntity;
import com.creditease.dbus.constant.MessageCode;
import com.creditease.dbus.domain.model.EncodePlugins;
import com.creditease.dbus.service.JarManagerService;
import com.github.pagehelper.PageInfo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;


/**
 * Created by mal on 2018/4/19.
 */
@RestController
@RequestMapping("/jars")
public class JarManagerController extends BaseController {

    @Autowired
    private JarManagerService service;

    @PostMapping("/uploads/{version}/{type}/{category}")
    public ResultEntity uploads(@PathVariable String version,
                                @PathVariable String type,
                                @PathVariable String category,
                                MultipartFile jarFile) {
        int ret = service.uploads(category, version, type, jarFile);
        return resultEntityBuilder().payload(ret).build();
    }

    @GetMapping("/delete/{version}/{type}/{minorVersion}/{fileName}/{category}")
    public ResultEntity delete(@PathVariable String version,
                               @PathVariable String type,
                               @PathVariable String minorVersion,
                               @PathVariable String fileName,
                               @PathVariable String category) {
        int ret = service.delete(category, version, type, minorVersion, fileName);
        return resultEntityBuilder().payload(ret).build();
    }

    @GetMapping("/versions/{category}")
    public ResultEntity queryVersion(@PathVariable String category) throws Exception {
        return resultEntityBuilder().payload(service.queryVersion(category)).build();
    }

    @GetMapping("/types")
    public ResultEntity queryType(String category,
                                  String version) throws Exception {
        return resultEntityBuilder().payload(service.queryType(category, version)).build();
    }

    @GetMapping("/infos")
    public ResultEntity queryJarInfos(String category, String version, String type) throws Exception {
        return resultEntityBuilder().payload(service.queryJarInfos(category, version, type)).build();
    }

    @PostMapping("/batch-delete")
    public ResultEntity batchDelete(@RequestBody List<Map<String, String>> records) {
        return resultEntityBuilder().payload(service.batchDelete(records)).build();
    }

    @PostMapping("/uploads-encode-plugin/{name}/{projectId}")
    public ResultEntity uploadsEncodePlugin(@PathVariable String name,
                                            @PathVariable Integer projectId,
                                            @RequestParam MultipartFile jarFile) {

        try {
            int status = service.uploadsEncodePlugin(name, projectId, jarFile);
            return resultEntityBuilder().status(status).build();
        } catch (Exception e) {
            logger.error("Error encountered while uploadsEncodePlugin .", e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    @GetMapping("/search-encode-plugin")
    public ResultEntity searchEncodePlugin(int pageNum, int pageSize) {
        PageInfo<EncodePlugins> page = service.searchEncodePlugin(pageNum, pageSize);
        return resultEntityBuilder().payload(page).build();
    }

    @GetMapping(path = "/delete-encode-plugin/{id}")
    public ResultEntity deleteEncodePlugin(@PathVariable Integer id) {
        try{
            int i = service.deleteEncodePlugin(id);
            if (i > 0) {
                return resultEntityBuilder().status(MessageCode.PLUGIN_IS_USING).build();
            }
            return resultEntityBuilder().payload(i).build();
        }catch (Exception e){
            logger.error("Error encountered while uploadsEncodePlugin .",e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

    @PostMapping("/uploads-keytab")
    public ResultEntity uploadsKeytab(@RequestParam Integer projectId, @RequestParam String principal,
                                      @RequestParam MultipartFile jarFile) {
        try {
            int status = service.uploadsKeytab(projectId, principal, jarFile);
            return resultEntityBuilder().status(status).build();
        } catch (Exception e) {
            logger.error("Error encountered while uploadsEncodePlugin .", e);
            return resultEntityBuilder().status(MessageCode.EXCEPTION).build();
        }
    }

}
