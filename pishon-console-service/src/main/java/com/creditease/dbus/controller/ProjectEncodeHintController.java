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
import com.creditease.dbus.domain.model.ProjectEncodeHint;
import com.creditease.dbus.service.ProjectEncodeHintService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * Created by mal on 2018/3/21.
 */
@RestController
@RequestMapping("/projectEncodeHint")
public class ProjectEncodeHintController extends BaseController {

    @Autowired
    private ProjectEncodeHintService service;

    @PostMapping("/insertAll")
    public ResultEntity insertAll(@RequestBody List<ProjectEncodeHint> projectEncodeHints) {
        service.insertAll(projectEncodeHints);
        return resultEntityBuilder().build();
    }

    @PostMapping("/insert")
    public ResultEntity insert(@RequestBody ProjectEncodeHint projectEncodeHint) {
        int cnt = service.insert(projectEncodeHint);
        return resultEntityBuilder().payload(cnt).build();
    }

    @GetMapping("/select-by-project-id/{id}")
    public ResultEntity selectByProjectId(@PathVariable int id) {
        return resultEntityBuilder().payload(service.selectByProjectId(id)).build();
    }

    @PostMapping("/updateAll")
    public ResultEntity updateAll(@RequestBody List<ProjectEncodeHint> projectEncodeHints) {
        service.updateAll(projectEncodeHints);
        return resultEntityBuilder().build();
    }

    @GetMapping("/delete-by-project-id/{id}")
    public ResultEntity deleteByProjectId(@PathVariable int id) {
        return resultEntityBuilder().payload(service.deleteByProjectId(id)).build();
    }

    @GetMapping("/select-by-pid-tid")
    public ResultEntity selectByPidAndTid(@RequestParam Integer projectId,
                                          @RequestParam Integer tableId){
        if(projectId == null || tableId==null){
            return resultEntityBuilder().status(MessageCode.TABLE_ID_EMPTY_OR_PROJECT_ID_EMPTY)
                    .build();
        }
        List<Map<String, Object>> encodeHints = service.selectByPidAndTid(projectId,tableId);
        return resultEntityBuilder().payload(encodeHints).build();
    }

}
