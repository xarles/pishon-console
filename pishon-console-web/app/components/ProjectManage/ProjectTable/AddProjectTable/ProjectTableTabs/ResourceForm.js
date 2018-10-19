/**
 * @author 戎晓伟
 * @description  Resource信息设置
 */

import React, { PropTypes, Component } from 'react'
import { Table, Input, Modal, Select, Form, message, Icon } from 'antd'
import { FormattedMessage } from 'react-intl'
import { intlMessage } from '@/app/i18n'
import { fromJS } from 'immutable'
import Request from '@/app/utils/request'
// API
import { GET_TABLE_PROJECT_TOPO_API } from '@/app/containers/ProjectManage/api'
const FormItem = Form.Item
const Option = Select.Option
// 导入样式
import styles from '../../res/styles/index.less'

import EncodeConfig from './Resource/EncodeConfig'

export default class ResourceForm extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataNameVisible: false,
      schemaNameVisible: false,
      tableNameVisible: false,
      modalkey: '00000000000000000000',
      visble: false,
      tid: '',
      encodeSourceList: null,
      encodeRecord: null
    }
    this.NomalTableWidth = ['15%', '15%', '15%', '15%', '10%', '20%', '10%']
    this.SelectTableWidth = ['50%', '10%', '25%', '15%']
    this.initParams = {
      pageNum: 1,
      pageSize: 5
    }
  }
  componentWillMount () {
    const {
      projectId,
      onSetSink,
      sinkList,
      topicList,
      modalStatus
    } = this.props
    this.handleInitSearch(projectId)
    // 查询 encodeTypeList
    const { onGetEncodeTypeList } = this.props
    onGetEncodeTypeList({projectId})
    if (modalStatus === 'create') {
      // 新建初始化存储sink
      const sinkListArray = Object.values(sinkList.result)
      const topicListArray = Object.values(topicList.result)
      onSetSink({
        projectId,
        outputType: 'ums1.3',
        sinkId: sinkListArray[0] && sinkListArray[0].id,
        outputTopic: topicListArray[0] && topicListArray[0][0]
      })
    }
  }
  /**
   * 初始化查询
   */
  handleInitSearch = projectId => {
    const API = GET_TABLE_PROJECT_TOPO_API
    const { topology, onSetTopology } = this.props
    Request(API, { params: { projectId }, method: 'get' })
      .then(res => {
        if (res && res.status === 0) {
          const topoId =
            (topology && `${topology.topoId}`) ||
            (res.payload[0] && res.payload[0].topoId)
          // 初始化查询
          topoId &&
            this.handleSearch({ ...this.initParams, projectId, topoId }, true)
          // 存储TopoID
          topoId && onSetTopology({ topoId })
        } else {
          message.warn(res.message)
        }
      })
      .catch(error => {
        error.response.data && error.response.data.message
          ? message.error(error.response.data.message)
          : message.error(error.message)
      })
  };
  /**
   * @param key 传入一个key type:[Object String]  默认:空
   * @returns 返回一个随机字符串
   */
  handleRandom = key =>
    `${Math.random()
      .toString(32)
      .substr(3, 8)}${key || ''}`;
  /**
   * @param state [object String] 过滤弹出框 state
   * @description 控制自定义过滤弹出框的显示和隐藏
   */
  filterVisible = state => {
    const { resourceParams } = this.props
    return {
      filterDropdownVisible: this.state[`${state}Visible`],
      onFilterDropdownVisibleChange: visible => {
        let filterDropdownVisible = {}
        filterDropdownVisible[`${state}Visible`] = visible
        this.setState(filterDropdownVisible)
      },
      filterIcon: (
        <Icon
          type="filter"
          style={{ color: resourceParams && resourceParams[state] ? '#00c1de' : '#aaa' }}
        />
      )
    }
  };
  /**
   * @param params {key|value}
   * @description 过滤查询 如果value值为空或null删掉此参数并查询
   */
  handleFilterSearch = params => {
    const { resourceParams } = this.props
    const value = Object.values(params)[0]
    const key = Object.keys(params)[0]
    const newparams = fromJS(resourceParams).delete(key)
    // 关闭过滤框
    let filterDropdownVisible = {}
    filterDropdownVisible[`${key}Visible`] = false
    this.setState(filterDropdownVisible)

    this.handleSearch(
      value || value !== ''
        ? { ...resourceParams, ...params }
        : { ...newparams.toJS() },
      true
    )
  };
  /**
   * @param params 查询的参数 type:[Object Object]
   * @param boolean 是否将参数缓存起来 type:[Object Boolean]
   * @description 查询用户列表
   */
  handleSearch = (params, boolean) => {
    const { onSearchList, onSetParams } = this.props
    // 获取Resource列表
    onSearchList(params)
    if (boolean || boolean === undefined) {
      // 存储参数
      onSetParams(params)
    }
  };
  /**
   * @param page  传入的跳转页码  type:[Object Number]
   * @description table分页
   */
  handlePagination = page => {
    const { resourceParams } = this.props
    this.handleSearch({ ...resourceParams, pageNum: page }, true)
  };
  /**
   * @param key [object String] 已选用户对应的key值
   * @description 根据key值删除存储在redux中的Resource
   */
  handleDelResource = (e, key) => {
    e.preventDefault()
    const { onSetResource, resource, encodes, onSetEncodes } = this.props
    // 删除 resource
    const newResource = fromJS(resource).delete(`_${key}`)
    // 删除 resource对应的脱敏配置
    const newEncodes = encodes && fromJS(encodes).delete(`${key}`)
    // 存储到redux
    onSetResource(newResource.toJS())
    encodes && onSetEncodes(newEncodes.toJS())
  };
  /**
   * @param record [object Object]  Resource数据
   * @description 添加Resource数据到redux里面
   */
  handleAddResource = (e, record) => {
    let newDataSource = {}
    const { onSetResource, resource } = this.props
    // 添加 _ 防止浏览器自动排序
    newDataSource[`_${record['tableId']}`] = { ...record }
    // 将生成的数据存储到redux中
    resource
      ? onSetResource({ ...newDataSource, ...resource })
      : onSetResource(newDataSource)
  };
  /**
   * @deprecated input placeholder
   */
  handlePlaceholder = fun => id =>
    fun({
      id: 'app.common.mini.search.placeholder',
      valus: {
        name: fun({ id })
      }
    });
  /**
   * @param visble [object Boolean]  脱敏配置弹出层显示与关闭
   */
  handleEncodeVisble = visble => {
    this.setState({ visble })
  };
  /**
   * @param record [object Object]  单行数据
   * @description 根据ID查询脱敏配置表
   */
  handleEncodeSearch = (e, record) => {
    e.preventDefault()
    const { onSearchEncode, projectId } = this.props
    const tableId = record.projectTableId || record.tableId
    // 查询 encode
    onSearchEncode({ tableId: tableId, projectId: projectId })
    // 存储tid 及 单行数据
    this.setState({ tid: `${tableId}`, encodeRecord: record })
    this.handleEncodeVisble(true)
  };
  /**
   * @description 提交脱敏配置数据
   */
  handleEncodeSubmit = () => {
    const { onSetEncodes } = this.props
    const { encodeSourceList, tid } = this.state
    const encodes = encodeSourceList && encodeSourceList[`${tid}`]
    const encodeOutputColumns = encodes && encodes.encodeOutputColumns
    const flag = encodeOutputColumns
      ? Object.values(encodeOutputColumns).some(item => String(item.encodeSource) === '2' && !item.encodeType)
      : true
    // 过滤
    if (flag) {
      message.error('脱敏项不能为空且脱敏规则为必选项')
      return false
    }
    const filteredEncodeOutputColumns = {}
    for(let key in encodeOutputColumns) {
      // 1代表源端删除了该列，所以此处只保留不是1的列
      if (encodeOutputColumns[key].schemaChangeFlag !== 1) {
        filteredEncodeOutputColumns[key] = {
          ...encodeOutputColumns[key],
          //起个别名，用于后台bean
          fieldType: encodeOutputColumns[key].dataType,
          schemaChangeFlag: 0,
          schemaChangeComment: ''
        }
      }
    }
    encodes.encodeOutputColumns = filteredEncodeOutputColumns
    this.handleEncodeChange(encodeSourceList)
    // 存储数据
    onSetEncodes(encodeSourceList)
    // 关闭弹出层
    this.handleEncodeCancel()
  };
  /**
   * @description 关闭弹窗
   */
  handleEncodeCancel = () => {
    // 关闭弹出层
    this.handleEncodeVisble(false)
    // 清空数据
    this.setState({ modalkey: this.handleRandom('encode') })
  };
  /**
   * @description topo change 查询resource
   */
  handleTopoChange = topoId => {
    const {
      resourceParams,
      onSetTopology,
      onSetResource,
      onSetEncodes
    } = this.props
    onSetTopology({ topoId })
    // 清空resource
    onSetResource(null)
    // 清空encodes
    onSetEncodes(null)
    this.handleSearch({ ...resourceParams, topoId }, true)
  };
  /**
   * @description 父层存储encode
   */
  handleEncodeChange = encodeSourceList => {
    this.setState({ encodeSourceList })
  };
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
  renderNomal = width => (text, record, index) => (
    <div
      title={text}
      style={this.props.tableWidthStyle(width)}
      className={styles.ellipsis}
    >
      {text}
    </div>
  );
  /**
   * @description ifFullpull render
   */
  renderFullPull = width => (text, record, index) => (
    <div style={this.props.tableWidthStyle(width)} className={styles.ellipsis}>
      {`${Boolean(text)}`}
    </div>
  );
  /**
   * @description table resource render
   */
  renderResource = width => (text, record, index) => (
    <div
      title={`${record.dsType} / ${record.dsName} / ${record.schemaName} / ${
        record.tableName
      }`}
      style={this.props.tableWidthStyle(width)}
      className={styles.ellipsis}
    >
      {`${record.dsType} / ${record.dsName} / ${record.schemaName} / ${
        record.tableName
      }`}
    </div>
  );

  /**
   * @description selectTable的 option render
   */
  renderOperating = (text, record, index) => {
    const { modalStatus } = this.props
    return (
      <div>
        <a
          onClick={e => this.handleAddResource(e, record)}
          disabled={modalStatus === 'modify'}
        >
          <FormattedMessage id="app.common.add" defaultMessage="添加" />
        </a>
      </div>
    )
  };
  /**
   * @description table的 option render
   */
  renderSelectOperating = (text, record, index) => {
    const { modalStatus } = this.props
    return (
      <div>
        <a
          onClick={e => this.handleDelResource(e, record.tableId)}
          disabled={modalStatus === 'modify'}
        >
          <FormattedMessage id="app.common.delete" defaultMessage="删除" />
        </a>
        <span className="ant-divider" />
        <a onClick={e => this.handleEncodeSearch(e, record)}>
          <FormattedMessage
            id="app.components.projectManage.projectHome.tabs.resource.encodesConfig"
            defaultMessage="脱敏配置"
          />
        </a>
      </div>
    )
  };
  render () {
    const {
      locale,
      resource,
      encodes,
      resourceList,
      selectedTableScrollY,
      encodeList,
      encodeTypeList,
      errorFlag,
      projectToposList,
      topology,
      modalStatus
    } = this.props
    const { modalkey, visble, tid, encodeRecord } = this.state
    const formItemLayout = {
      labelCol: {
        sm: { span: 18 }
      },
      wrapperCol: {
        sm: { span: 6 }
      }
    }
    const topoArray = Object.values(projectToposList.result)
    const localeMessage = intlMessage(locale)
    const placeholder = this.handlePlaceholder(localeMessage)
    const columns = [
      {
        title: 'DsType',
        width: this.NomalTableWidth[0],
        dataIndex: 'dsType',
        key: 'dsType',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[0]))
      },
      {
        title: 'DsName',
        width: this.NomalTableWidth[1],
        dataIndex: 'dsName',
        key: 'dsName',
        // 自定义过滤显隐
        ...this.filterVisible('dsName'),
        filterDropdown: (
          <div className={styles.filterDropdown}>
            <Input
              placeholder={placeholder('DsName')}
              onPressEnter={e =>
                this.handleFilterSearch({
                  dsName: e.target.value
                })
              }
            />
          </div>
        ),
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[1]))
      },
      {
        title: 'Schema',
        width: this.NomalTableWidth[2],
        dataIndex: 'schemaName',
        key: 'schemaName',
        // 自定义过滤显隐
        ...this.filterVisible('schemaName'),
        filterDropdown: (
          <div className={styles.filterDropdown}>
            <Input
              placeholder={placeholder('shemaName')}
              onPressEnter={e =>
                this.handleFilterSearch({
                  schemaName: e.target.value
                })
              }
            />
          </div>
        ),
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[2]))
      },
      {
        title: 'TableName',
        width: this.NomalTableWidth[3],
        dataIndex: 'tableName',
        key: 'tableName',
        // 自定义过滤显隐
        ...this.filterVisible('tableName'),
        filterDropdown: (
          <div className={styles.filterDropdown}>
            <Input
              placeholder={placeholder('tableName')}
              onPressEnter={e =>
                this.handleFilterSearch({
                  tableName: e.target.value
                })
              }
            />
          </div>
        ),
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[3]))
      },
      {
        title: (
          <FormattedMessage
            id="app.components.projectManage.projectHome.tabs.resource.permissions"
            defaultMessage="拉取权限"
          />
        ),
        width: this.NomalTableWidth[4],
        dataIndex: 'ifFullpull',
        key: 'ifFullpull',
        render: this.renderComponent(
          this.renderFullPull(this.NomalTableWidth[4])
        )
      },
      {
        title: (
          <FormattedMessage id="app.common.description" defaultMessage="描述" />
        ),
        width: this.NomalTableWidth[5],
        dataIndex: 'description',
        key: 'description',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[6]))
      },
      {
        title: (
          <FormattedMessage id="app.common.operate" defaultMessage="操作" />
        ),
        render: this.renderComponent(this.renderOperating)
      }
    ]
    const slectColumns = [
      {
        title: 'Resource',
        width: this.SelectTableWidth[0],
        key: 'Resource',
        render: this.renderComponent(
          this.renderResource(this.SelectTableWidth[0])
        )
      },
      {
        title: (
          <FormattedMessage
            id="app.components.projectManage.projectHome.tabs.resource.permissions"
            defaultMessage="拉取权限"
          />
        ),
        width: this.NomalTableWidth[4],
        dataIndex: 'ifFullpull',
        key: 'ifFullpull',
        render: this.renderComponent(
          this.renderFullPull(this.NomalTableWidth[4])
        )
      },
      {
        title: (
          <FormattedMessage id="app.common.description" defaultMessage="描述" />
        ),
        width: this.SelectTableWidth[2],
        dataIndex: 'description',
        key: 'description',
        render: this.renderComponent(this.renderNomal(this.SelectTableWidth[3]))
      },
      {
        title: (
          <FormattedMessage id="app.common.operate" defaultMessage="操作" />
        ),
        render: this.renderComponent(this.renderSelectOperating)
      }
    ]
    const { loading, result } = resourceList
    const dataSource = result && result.list
    const selectDataSource = resource ? Object.values(resource) : []
    const pagination = {
      showQuickJumper: true,
      current: (result && result.pageNum) || 1,
      pageSize: (result && result.pageSize) || 10,
      total: result && result.total,
      onChange: this.handlePagination
    }
    return (
      <div className={styles.tableLayout}>
        <Form>
          <FormItem
            {...formItemLayout}
            label="选择Topology"
            style={{ marginBottom: '8px' }}
          >
            <Select
              showSearch
              optionFilterProp='children'
              value={
                (topology && `${topology.topoId}`) ||
                (topoArray && topoArray[0] && `${topoArray[0].topoId}`) ||
                '暂无数据可选'
              }
              onChange={value => this.handleTopoChange(value)}
              disabled={modalStatus === 'modify'}
            >
              {topoArray.length > 0 &&
                topoArray.map(item => (
                  <Option value={`${item.topoId}`} key={`${item.topoId}`}>
                    {item.topoName}
                  </Option>
                ))}
            </Select>
          </FormItem>
        </Form>
        <div className={styles.table}>
          <Table
            size="small"
            rowKey={record => record.tableId}
            dataSource={dataSource}
            columns={columns}
            pagination={pagination}
            loading={loading}
          />
        </div>
        <div className={styles.table}>
          <h3
            className={
              dataSource && dataSource.length > 0
                ? styles.title
                : styles.titleNomal
            }
          >
            <FormattedMessage
              id="app.components.checkbox.selected"
              defaultMessage="已选Resource"
              values={{ value: 'Resource' }}
            />
            ：<span
              className={`${styles.info} ${errorFlag === 'resourceForm' &&
                styles.error}`}
            >
              （项目Resource为必选项，不能为空）
            </span>
          </h3>
          <Table
            size="small"
            rowKey={record => `${record.tableId}`}
            dataSource={selectDataSource}
            columns={slectColumns}
            pagination={false}
            scroll={{ y: selectedTableScrollY }}
          />
        </div>
        <Modal
          visible={visble}
          className="small-modal modal-min-height"
          style={{ top: 60 }}
          title={
            <span>
              <FormattedMessage
                id="app.components.projectManage.projectHome.tabs.resource.encodesConfig"
                defaultMessage="脱敏配置"
              />（
              {encodeRecord &&
                `${encodeRecord.dsType} / ${encodeRecord.dsName} / ${
                  encodeRecord.schemaName
                } / ${encodeRecord.tableName}`}
              ）
            </span>
          }
          key={modalkey}
          onOk={this.handleEncodeSubmit}
          onCancel={this.handleEncodeCancel}
          width="1000px"
        >
          <EncodeConfig
            locale={locale}
            tid={tid}
            encodes={encodes}
            encodeList={encodeList}
            encodeTypeList={encodeTypeList}
            onChange={this.handleEncodeChange}
          />
        </Modal>
      </div>
    )
  }
}

ResourceForm.propTypes = {
  locale: PropTypes.any,
  projectId: PropTypes.string,
  modalStatus: PropTypes.string,
  projectToposList: PropTypes.object,
  topology: PropTypes.object,
  tableWidthStyle: PropTypes.func,
  selectedTableScrollY: PropTypes.number,
  // 本地存储
  resource: PropTypes.object,
  // 本地存储
  encodes: PropTypes.object,
  // 异步获取
  encodeList: PropTypes.object,
  // 异步获取
  encodeTypeList: PropTypes.object,
  sinkList: PropTypes.object,
  topicList: PropTypes.object,
  errorFlag: PropTypes.string,
  onSetResource: PropTypes.func,
  onSetEncodes: PropTypes.func,
  resourceList: PropTypes.object,
  resourceParams: PropTypes.object,
  onSetParams: PropTypes.func,
  onSearchList: PropTypes.func,
  onSearchEncode: PropTypes.func,
  onGetEncodeTypeList: PropTypes.func,
  onSetTopology: PropTypes.func,
  onSetSink: PropTypes.func
}
