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

import com.creditease.dbus.domain.mapper.TableVersionMapper;
import com.creditease.dbus.domain.model.TableVersion;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 对应表t_meta_version
 * Created by xiancangao on 2018/05/16.
 */
@Service
public class TableVersionService {

    @Autowired
    private TableVersionMapper tableVersionMapper;

    public TableVersion getById(Integer id) {
        return tableVersionMapper.selectByPrimaryKey(id);
    }

    public List<TableVersion> getVersionListByTableId(Integer tableId) {
        return tableVersionMapper.getVersionListByTableId(tableId);
    }

    public int update(TableVersion tableVersion) {
        return tableVersionMapper.updateByPrimaryKey(tableVersion);
    }
}
