import React, { PropTypes, Component } from 'react'
import { Tooltip, Form, Popconfirm, Select, Input, message,Table ,Tag } from 'antd'
import { FormattedMessage } from 'react-intl'
import OperatingButton from '@/app/components/common/OperatingButton'

// 导入样式
import styles from './res/styles/index.less'
import Request from "@/app/utils/request";

const FormItem = Form.Item
const Option = Select.Option

export default class DataTableManageGrid extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }
    this.tableWidth = [
      '5%',
      '16%',
      '10%',
      '10%',
      '8%',
      '10%',
      '10%',
      '200px'
    ]
  }

  /**
   * @param render 传入一个render
   * @returns render 返回一个新的render
   * @description 统一处理render函数
   */
  renderComponent = render => (text, record, index) =>
    render(text, record, index);

  /**
   * @description 默认的render
   */
  renderNomal = (text, record, index) => (
    <Tooltip title={text}>
      <div className={styles.ellipsis}>
        {text}
      </div>
    </Tooltip>
  )

  renderTableName = (text, record, index) => {
    text = `${record.dsName}.${record.schemaName}.${record.tableName}`
    let namespace = '';
    if (record.tableName === record.physicalTableRegex) {
      namespace = record.dsType + "." + record.dsName + "." + record.schemaName + "." + record.tableName +
        "." + record.version + "." + "0" + "." + "0";
    }
    else {
      namespace = record.dsType + "." + record.dsName + "." + record.schemaName + "." + record.tableName +
        "." + record.version + "." + "0" + "." + record.physicalTableRegex;
    }
    const title = <div>tableName：{record.tableName}<br/>
      tableNameAlias：{record.tableName}<br/>
      physicalTableRegex: {record.physicalTableRegex}<br/>
      outputTopic：{record.outputTopic}<br/>
      namespace: {namespace}<br/>
    </div>
    return (
      <Tooltip title={title}>
        <div className={styles.ellipsis}>
          {text}
        </div>
      </Tooltip>
    )
  }

  renderStatus =(text, record, index) => {
    const {verChangeNoticeFlg} = record
    let color = '#fff'
    switch (text) {
      case 'ok':
        text = 'running'
        if (verChangeNoticeFlg) color = 'orange'
        else color = 'green'
        break
      case 'abort':
        text = 'stopped'
        color = 'red'
        break
      case 'waiting':
        color = 'blue'
        break
      case 'inactive':
        color = '#929292'
        break
      default:
    }
    const clickAble = color === 'orange'
    return (<div title={text} className={styles.ellipsis}>
      <Tag color={color} style={{cursor: clickAble ? undefined : 'auto'}}>
        <span
          style={{textDecoration: clickAble ? 'underline' : undefined}}
          onClick={e => clickAble && this.handleClearOk(record)}
        >
          {text}
        </span>
      </Tag>
    </div>)
  }

  renderVersion = (text, record, index) => {
    const {onOpenVersionModal} = this.props
    const content = record.verChangeHistory ?
      `${record.version}<<${record.verChangeHistory}` : `${record.version}`
    return (
      <div title={content} className={styles.ellipsis}>
        <a
          href='javascript:void(0)'
          onClick={() => onOpenVersionModal(record)}
        >
          {content}
        </a>
      </div>
    )
  }
  /**
   * @description option render
   */
  renderOperating = (text, record, index) => {
    const {onCheckDataLine,onOpenSourceInsightModal,onMount, onModify,onOpenZKModal} = this.props
    const dsType = record.dsType
    const isMysqlOrOracle = dsType === 'mysql' || dsType === 'oracle'
    let menus
    if (isMysqlOrOracle) {
      menus = [
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.start"
            defaultMessage="启动"
          />,
          icon: 'right',
          onClick: () => this.handleStart(record),
          confirmText: 'start ?'
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.stop"
            defaultMessage="停止"
          />,
          icon: 'pause',
          onClick: () => this.handleStop(record),
          confirmText: 'stop ?'
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.active"
            defaultMessage="激活"
          />,
          icon: 'poweroff',
          onClick: () => this.handleActiveInactive(record, 'abort'),
          confirmText: 'active ?'
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.inactive"
            defaultMessage="禁用"
          />,
          icon: 'poweroff',
          onClick: () => this.handleActiveInactive(record, 'inactive'),
          confirmText: 'inactive ?'
        },
        {
          isDivider: true
        },
        {
          text: <FormattedMessage
            id="app.common.modify"
            defaultMessage="修改"
          />,
          icon: 'edit',
          onClick: () => onModify(record)
        },
        {
          text: <FormattedMessage
            id="app.common.delete"
            defaultMessage="删除"
          />,
          icon: 'delete',
          onClick: () => this.handleDelete(record),
          confirmText: '确认删除？'
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.sourceEncode"
            defaultMessage="源端脱敏"
          />,
          icon: 'lock',
          onClick: () => this.handleEncode(record)
        },
        {
          isDivider: true
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.originalFullpull"
            defaultMessage="阻塞式拉全量"
          />,
          icon: 'export',
          onClick: () => this.handleFullPull(record),
          confirmText: '确认拉全量？'
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.sourceInsight"
            defaultMessage="探索源端分片列"
          />,
          icon: 'bars',
          onClick: () => onOpenSourceInsightModal(record)
        },
        {
          text: <FormattedMessage
            id="app.components.resourceManage.dataTable.checkDataLine"
            defaultMessage="检查数据线"
          />,
          icon: 'check-circle-o',
          onClick: () => onCheckDataLine(record)
        },
      ]
      return (
        <div>
          <OperatingButton disabled={record.status === 'inactive'} icon="export" onClick={() => this.handleIndependentFullPull(record)}>
            <FormattedMessage
              id="app.components.resourceManage.dataTable.independentFullPull"
              defaultMessage="独立拉全量"
            />
          </OperatingButton>
          <OperatingButton icon="eye-o" onClick={() => onOpenZKModal(record)}>
            <FormattedMessage
              id="app.components.resourceManage.dataTable.readZk"
              defaultMessage="查看全量拉取状态"
            />
          </OperatingButton>
          <OperatingButton icon="fork" onClick={() => onMount(record)}>
            <FormattedMessage
              id="app.components.resourceManage.dataSource.viewMountProject"
              defaultMessage="查看已挂载项目"
            />
          </OperatingButton>
          <OperatingButton icon="ellipsis" menus={menus} />
        </div>
      )
    } else {
      menus = [
        {
          text: 'Start',
          icon: 'right',
          onClick: () => this.handleStart(record),
          confirmText: 'start ?'
        },
        {
          text: 'Stop',
          icon: 'pause',
          onClick: () => this.handleStop(record),
          confirmText: 'stop ?'
        },
        {
          text: 'Active',
          icon: 'poweroff',
          onClick: () => this.handleActiveInactive(record, 'abort'),
          confirmText: 'active ?'
        },
        {
          text: 'Inactive',
          icon: 'poweroff',
          onClick: () => this.handleActiveInactive(record, 'inactive'),
          confirmText: 'inactive ?'
        },
        {
          isDivider: true
        },
        {
          text: '修改',
          icon: 'edit',
          onClick: () => onModify(record)
        },
        {
          text: '删除',
          icon: 'delete',
          onClick: () => this.handleDelete(record),
          confirmText: '确认删除？'
        },
        {
          isDivider: true
        },
        {
          text: '检查数据线',
          icon: 'check-circle-o',
          onClick: () => onCheckDataLine(record)
        },
      ]
      return (
        <div>
          <OperatingButton icon="setting" onClick={() => this.handleRule(record)}>
            <FormattedMessage id="app.common.configRule" defaultMessage="规则配置" />
          </OperatingButton>
          <OperatingButton icon="fork" onClick={() => onMount(record)}>
            <FormattedMessage id="app.common.mountProject" defaultMessage="已挂载项目" />
          </OperatingButton>
          <OperatingButton icon="ellipsis" menus={menus} />
        </div>
      )
    }
  }

  handleClearOk = record => {
    const {updateApi, onRequest} = this.props
    onRequest({
      api: updateApi,
      data: {
        id: record.id,
        verChangeNoticeFlg: 0
      },
      method: 'post'
    })
  }

  handleEncode = record => {
    const {onOpenEncodeModal} = this.props
    onOpenEncodeModal(record)
  }

  handleRule = record => {
    const {onRule} = this.props
    onRule(record)
  }

  handleIndependentFullPull = record => {
    const {onOpenIndependentFullPullModal} = this.props
    onOpenIndependentFullPullModal(record)
  }

  handleFullPull = record => {
    const {startApi, onRequest} = this.props
    onRequest({
      api: `${startApi}/${record.id}`,
      data: {
        id: record.id,
        version: record.version,
        type: "load-data"
      },
      method: 'post'
    })
  }

  handleStart = record => {
    const {startApi, onRequest} = this.props
    onRequest({
      api: `${startApi}/${record.id}`,
      data: {
        id: record.id,
        version: record.version,
        type: "no-load-data"
      },
      method: 'post'
    })
  }

  handleStop = record => {
    const {stopApi, onRequest} = this.props
    onRequest({
      api: `${stopApi}/${record.id}`,
      method: 'get'
    })
  }

  handleActiveInactive = (record, newStatus) => {
    const {updateApi, onRequest} = this.props
    onRequest({
      api: updateApi,
      data: {
        id: record.id,
        status: newStatus
      },
      method: 'post'
    })
  }

  handleDelete = record => {
    const {deleteApi, onRequest} = this.props
    onRequest({
      api: `${deleteApi}/${record.id}`,
      method: 'get'
    })
  }

  render () {
    const {
      dataTableList,
      onPagination,
      onShowSizeChange,
      onSelectionChange,
      selectedRowKeys
    } = this.props
    const { loading, loaded } = dataTableList
    const { total, pageSize, pageNum, list } = dataTableList.result
    const dataTable = dataTableList.result && dataTableList.result.list
    const columns = [
      {
        title: 'ID',
        width: this.tableWidth[0],
        dataIndex: 'id',
        key: 'id',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: (
          <FormattedMessage
            id="app.components.resourceManage.dataTableName"
            defaultMessage="表名"
          />
        ),
        width: this.tableWidth[1],
        dataIndex: 'tableName',
        key: 'tableName',
        render: this.renderComponent(this.renderTableName)
      },
      {
        title: (
          <FormattedMessage
            id="app.components.resourceManage.dataTableNameRegex"
            defaultMessage="表名正则"
          />
        ),
        width: this.tableWidth[6],
        dataIndex: 'physicalTableRegex',
        key: 'physicalTableRegex',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: (
          <FormattedMessage
            id="app.components.resourceManage.dataTableNameAlias"
            defaultMessage="表别名"
          />
        ),
        width: this.tableWidth[2],
        dataIndex: 'tableNameAlias',
        key: 'tableNameAlias',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: (
          <FormattedMessage
            id="app.common.description"
            defaultMessage="描述"
          />
        ),
        width: this.tableWidth[2],
        dataIndex: 'description',
        key: 'description',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: (
          <FormattedMessage
            id="app.common.status"
            defaultMessage="状态"
          />
        ),
        width: this.tableWidth[3],
        dataIndex: 'status',
        key: 'status',
        render: this.renderComponent(this.renderStatus)
      },
      {
        title: (
          <FormattedMessage
            id="app.common.version"
            defaultMessage="版本"
          />
        ),
        width: this.tableWidth[4],
        dataIndex: 'version',
        key: 'version',
        render: this.renderComponent(this.renderVersion)
      },
      {
        title: (
          <FormattedMessage
            id="app.common.updateTime"
            defaultMessage="更新时间"
          />
        ),
        width: this.tableWidth[5],
        dataIndex: 'createTime',
        key: 'createTime',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: (
          <FormattedMessage
            id="app.common.operate"
            defaultMessage="操作"
          />
        ),
        width: this.tableWidth[7],
        key: 'operate',
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
          rowKey={record => record.id}
          dataSource={dataTable}
          columns={columns}
          pagination={pagination}
          rowSelection={{
            onChange: onSelectionChange,
            selectedRowKeys: selectedRowKeys
          }}
        />
      </div>
    )
  }
}

DataTableManageGrid.propTypes = {
}
