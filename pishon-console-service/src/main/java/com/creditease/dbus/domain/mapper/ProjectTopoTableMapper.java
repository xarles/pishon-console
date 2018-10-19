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

package com.creditease.dbus.domain.mapper;

import com.creditease.dbus.domain.model.ProjectTopoTable;
import com.creditease.dbus.domain.model.ProjectTopology;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface ProjectTopoTableMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(ProjectTopoTable record);

    ProjectTopoTable selectByPrimaryKey(Integer id);

    List<ProjectTopoTable> selectAll();

    int updateByPrimaryKey(ProjectTopoTable record);

    List<Map<String,Object>> getProjectNames();

    List<Map<String,Object>> getTopologyNames(@Param("projectId") Integer projectId);

    List<Map<String,Object>> getDSNames(@Param("projectId") Integer projectId);

    List<Map<String,Object>> searchTable(Map<String, Object> params);

    Map<String,Object>  selectByTableId(@Param("projectTableId") Integer tableId);

    List<String> selectNameByTopic(Map<String, Object> params);

    List<Map<String,Object>> getProjectTopologies(@Param("projectId") Integer projectId);

    List<Map<String,Object>> getExistedTopicsByProjectId(@Param("projectId") Long projectId);

    ProjectTopoTable selectByPIdTopoIdTableId(@Param("projectId") int projectId,
                                              @Param("topoId") int topoId,
                                              @Param("tableId") int tableId);

    int countByDsId(Integer dsId);

    int countBySchemaId(Integer schemaId);

    int countByTableId(Integer tableId);

	int deleteByProjectId(Integer projectId);

    List<ProjectTopoTable>  selectBySourceTableId(@Param("tableId") Integer tableId);
}
