/**
 * @author 戎晓伟
 * @description  Sink信息设置
 */

import React, { PropTypes, Component } from 'react'
import {Popconfirm, Tooltip, Table, message,Tag } from 'antd'
import { FormattedMessage } from 'react-intl'
import Request, {getUserInfo} from '@/app/utils/request'
import OperatingButton from '@/app/components/common/OperatingButton'
// API
import {

} from '@/app/containers/ProjectManage/api'

// 导入样式
import styles from './res/styles/index.less'

export default class ProjectTableGrid extends Component {

  /**
   * @param key 传入一个key type:[Object String]  默认:空
   * @returns 返回一个随机字符串
   */
  handleRandom = key =>
    `${Math.random()
      .toString(32)
      .substr(3, 8)}${key || ''}`;
  /**
   * @param status 请求的操作
   * @param record 单行的数据
   */
  handRequest=(status, record) => {
    const {tableParams, onSearch} = this.props
    let Api = null
    let newParams = null
    switch (status) {
      case 'delect':
        Api = ''
        break
      case 'start':
        Api = ''
        break
      case 'stop':
        Api = ''
        break
      case 'delect':
        Api = ''
        break
      default:
        return
    }
    Request(Api, { data: newParams, method: 'post' })
        .then(res => {
          if (res && res.status === 0) {
            // 重新查询Table列表
            onSearch && onSearch(tableParams)
          } else {
            message.warn(res.message)
          }
        })
        .catch(error => {
          error.response.data && error.response.data.message
            ? message.error(error.response.data.message)
            : message.error(error.message)
        })
  }

  handleViewFullPullHistory = (record) => {
    const {onViewFullPullHistory} = this.props
    onViewFullPullHistory(record)
  }
  // table render
  /**
   * @param render 传入一个render
   * @returns render 返回一个新的render
   * @description 统一处理render函数
   */
  renderComponent = render => (text, record, index) =>
    render(text, record, index);

  /**
   * @description table默认的render
   */
  renderNomal = (text, record, index) => (
    <Tooltip title={text}>
      <div className={styles.ellipsis}>
        {text}
      </div>
    </Tooltip>
  )

  renderSchemaChangeFlag = (text, record, index) => {
    let color
    switch (text) {
      case 1:
        color = 'red'
        break
      default:
        color = 'green'
    }
    text = text ? 'Y' : 'N'
    return (<div title={text} className={styles.ellipsis}>
      <Tag color={color} style={{cursor: 'auto'}}>
        {text}
      </Tag>
    </div>)
  }

  renderTopoStatus = (text, record, index) => {
    let color
    switch (text) {
      case 'new':
        color = 'blue'
        break
      case 'changed':
        color = 'orange'
        break
      case 'running':
        color = 'green'
        break
      case 'stopped':
        color = 'red'
        break
      default:
        color = '#929292'
    }
    return (<div title={text} className={styles.ellipsis}>
      <Tag color={color} style={{cursor: 'auto'}}>
        {text}
      </Tag>
    </div>)
  }

  renderStatus =(text, record, index) => {
    let color
    switch (text) {
      case 'starting':
        color = 'blue'
        break
      case 'running':
        color = 'green'
        break
      case 'changed':
        color = 'orange'
        break
      case 'stopped':
        color = 'red'
        break
      default:
        color = '#929292'
    }
    return (<div title={text} className={styles.ellipsis}>
      <Tag color={color} style={{cursor: 'auto'}}>
        {text}
      </Tag>
    </div>)
  }

  /**
   * @description selectTable的 option render
   */
  renderOperating = (text, record, index) => {
    const userInfo = getUserInfo()
    const {onStart, onStop, onDelete, onReload, onInitialLoad} = this.props
    const menus = [
      {
        text: <FormattedMessage
          id="app.components.projectManage.projectTable.fullpull"
          defaultMessage="拉全量"
        />,
        icon: 'exception',
        disabled : userInfo.roleType !== 'admin' && record.ifFullpull !== 1,
        onClick: () => onInitialLoad(record)
      },
      {
        text: <FormattedMessage
          id="app.components.projectManage.projectTable.active"
          defaultMessage="生效"
        />,
        icon: 'check',
        onClick: () => onReload(record),
        confirmText: '确认生效？'
      },
      {
        text: <FormattedMessage
          id="app.common.delete"
          defaultMessage="删除"
        />,
        icon: 'delete',
        onClick: () => onDelete(record),
        confirmText: '确认删除？'
      }
    ]
    return (
      <div>
        {record.status !== 'running' ? (
          <OperatingButton disabled={record.topoStatus === 'new' || record.topoStatus === 'stopped'} icon="caret-right" onClick={() => onStart(record)}>
            <FormattedMessage
              id="app.components.resourceManage.dataTable.start"
              defaultMessage="启动"
            />
          </OperatingButton>
        ) : (
          <Popconfirm title={'确定停止？'} onConfirm={() => onStop(record)} okText="Yes" cancelText="No">
            <OperatingButton icon="pause">
              <FormattedMessage
                id="app.components.resourceManage.dataTable.stop"
                defaultMessage="停止"
              />
            </OperatingButton>
          </Popconfirm>
        )}
        <OperatingButton icon="edit" onClick={() => this.props.onModifyTable(record.tableId, record.projectId, record)}>
          <FormattedMessage id="app.common.modify" defaultMessage="修改" />
        </OperatingButton>
        <OperatingButton disabled={userInfo.roleType !== 'admin' && record.ifFullpull !== 1} icon="switcher" onClick={() => this.handleViewFullPullHistory(record)}>
          <FormattedMessage
            id="app.components.projectManage.projectTable.viewFullpullHistory"
            defaultMessage="查看拉全量历史"
          />
        </OperatingButton>
        <OperatingButton icon="ellipsis" menus={menus} />
      </div>
    )
  };
  render () {
    const {
      tableWidth,
      tableList,
      onPagination,
      onShowSizeChange
    } = this.props
    const { loading, loaded } = tableList
    const { total, pageSize, pageNum, list } = tableList.result
    const dataSource = list || []
    // ID 所属项目 是否投产 数据源类型 数据源名称 Schema TableName Status Version Description CreateTime 拉全量  脱敏要求 操作

    const columns = [
      {
        title: <FormattedMessage
          id="app.components.resourceManage.dataSourceType"
          defaultMessage="数据源类型"
        />,
        width: tableWidth[0],
        dataIndex: 'dsType',
        key: 'dsType',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.resourceManage.dataSourceName"
          defaultMessage="数据源名称"
        />,
        width: tableWidth[1],
        dataIndex: 'dsName',
        key: 'dsName',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.resourceManage.dataSchemaName"
          defaultMessage="Schema名称"
        />,
        width: tableWidth[2],
        dataIndex: 'schemaName',
        key: 'schemaName',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.resourceManage.dataTableName"
          defaultMessage="表名"
        />,
        width: tableWidth[3],
        dataIndex: 'tableName',
        key: 'tableName',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.topoName"
          defaultMessage="拓扑名称"
        />,
        width: tableWidth[4],
        dataIndex: 'topoName',
        key: 'topoName',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.inputTopic"
          defaultMessage="输入Topic"
        />,
        width: tableWidth[5],
        dataIndex: 'inputTopic',
        key: 'inputTopic',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.outputTopic"
          defaultMessage="输出Topic"
        />,
        width: tableWidth[6],
        dataIndex: 'outputTopic',
        key: 'outputTopic',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.outputFormat"
          defaultMessage="输出格式"
        />,
        width: tableWidth[8],
        dataIndex: 'outputType',
        key: 'outputType',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.topoStatus"
          defaultMessage="拓扑状态"
        />,
        width: tableWidth[4],
        dataIndex: 'topoStatus',
        key: 'topoStatus',
        render: this.renderComponent(this.renderTopoStatus)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.tableStatus"
          defaultMessage="表状态"
        />,
        width: tableWidth[7],
        dataIndex: 'status',
        key: 'status',
        render: this.renderComponent(this.renderStatus)
      },
      {
        title: <FormattedMessage
          id="app.components.projectManage.projectTable.schemaChange"
          defaultMessage="Schema是否变更"
        />,
        width: '12%',
        dataIndex: 'schemaChangeFlag',
        key: 'schemaChangeFlag',
        render: this.renderComponent(this.renderSchemaChangeFlag)
      },
      {
        title: <FormattedMessage
          id="app.common.user.backup"
          defaultMessage="备注"
        />,
        width: tableWidth[9],
        dataIndex: 'description',
        key: 'description',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: (
          <FormattedMessage id="app.common.operate" defaultMessage="操作" />
        ),
        width: tableWidth[10],
        render: this.renderComponent(this.renderOperating)
      }
    ]
    const pagination = {
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      current: pageNum || 1,
      pageSize: pageSize || 10,
      total: total,
      onChange: onPagination,
      onShowSizeChange: onShowSizeChange
    }
    return (
      <div className={styles.table}>
        <Table
          rowKey={record => `${record.tableId}`}
          dataSource={dataSource}
          columns={columns}
          pagination={pagination}
          loading={loading}
        />
      </div>
    )
  }
}

ProjectTableGrid.propTypes = {
  tableWidth: PropTypes.array,
  locale: PropTypes.any,
  tableList: PropTypes.object,
  tableParams: PropTypes.object,
  onPagination: PropTypes.func,
  onShowSizeChange: PropTypes.func,
  onSearch: PropTypes.func,
  onModifyTable: PropTypes.func
}
