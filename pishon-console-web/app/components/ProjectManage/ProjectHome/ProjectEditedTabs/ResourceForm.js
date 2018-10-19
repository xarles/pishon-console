/**
 * @author 戎晓伟
 * @description  Resource信息设置
 */

import React, { PropTypes, Component } from 'react'
import { Table, Button, Input, Switch, Icon, Modal, message } from 'antd'
import { FormattedMessage } from 'react-intl'
import { intlMessage } from '@/app/i18n'
import { fromJS } from 'immutable'
// 导入样式
import styles from '../res/styles/index.less'

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
    this.NomalTableWidth = [
      '10%',
      '12%',
      '10%',
      '12%',
      '10%',
      '8%',
      '15%',
      '15%'
    ]
    this.SelectTableWidth = ['29%', '8%', '8%', '18%', '15%', '9%']
    this.initParams = {
      pageNum: 1,
      pageSize: 5
    }
  }
  componentWillMount () {
    // 初始化查询
    this.handleSearch(this.initParams, true)
    // 查询 encodeTypeList
    const { getEncodeTypeList, basic } = this.props
    getEncodeTypeList({projectId: basic && basic.id || 0})
  }
  /**
   * @param key 传入一个key type:[Object String]  默认:空
   * @returns 返回一个随机字符串
   */
  handleRandom = key =>
    `${Math.random()
      .toString(32)
      .substr(3, 8)}${key || ''}`;
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
    const { setResource, resource, encodes, setEncodes } = this.props
    // 删除 resource
    const newResource = fromJS(resource).delete(`_${key}`)
    // 删除 resource对应的脱敏配置
    const newEncodes = encodes && fromJS(encodes).delete(`${key}`)
    // 存储到redux
    setResource(newResource.toJS())
    encodes && setEncodes(newEncodes.toJS())
  };
  /**
   * @param key [object String] 已选用户对应的key值
   * @description 根据key值开启或关闭权限
   */
  handleSwitchChange = (value, key) => {
    const { setResource, resource } = this.props
    // 修改权限
    const newResource = fromJS(resource).setIn(
      [`_${key}`, 'fullpull_enable_flag'],
      value
    )
    // 存储到redux
    setResource(newResource.toJS())
  };
  /**
   * @param record [object Object]  Resource数据
   * @description 添加Resource数据到redux里面
   */
  handleAddResource = (e, record) => {
    let newDataSource = {}
    const { setResource, resource } = this.props
    // 添加 _ 防止浏览器自动排序
    newDataSource[`_${record['id']}`] = { ...record }
    // 将生成的数据存储到redux中
    resource
      ? setResource({ ...newDataSource, ...resource })
      : setResource(newDataSource)
  };
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
    const { onSearchEncode } = this.props
    const tableId = record.id
    // 查询 encode
    onSearchEncode({ tableId: tableId })
    // 存储tid 及 单行数据
    this.setState({ tid: `${tableId}`, encodeRecord: record })
    this.handleEncodeVisble(true)
  };
  /**
   * @description 提交脱敏配置数据
   */
  handleEncodeSubmit = () => {
    const { setEncodes } = this.props
    const { encodeSourceList, tid } = this.state
    const encodes = encodeSourceList && encodeSourceList[`${tid}`]
    const flag = encodes
      ? Object.values(encodes).some(item => !item.encodeType)
      : false
    // 过滤
    if (flag) {
      message.error('脱敏规则为必选项')
      return false
    }
    // 存储数据
    setEncodes(encodeSourceList)
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
   * @description table resource render
   */
  renderResource = width => (text, record, index) => (
    <div
      title={`${record.ds_type} / ${record.ds_name} / ${record.schema_name} / ${
        record.table_name
      }`}
      style={this.props.tableWidthStyle(width)}
      className={styles.ellipsis}
    >
      {`${record.ds_type} / ${record.ds_name} / ${record.schema_name} / ${
        record.table_name
      }`}
    </div>
  );

  /**
   * @description selectTable的 option render
   */
  renderOperating = (text, record, index) => (
    <div>
      {this.props.isUserRole ? (<FormattedMessage id="app.common.add" defaultMessage="添加" />) : (
        <a onClick={e => this.handleAddResource(e, record)}>
          <FormattedMessage id="app.common.add" defaultMessage="添加" />
        </a>
      )}
    </div>
  );
  /**
   * @description table的 option render
   */
  renderSelectOperating = (text, record, index) => (
    <div>
      {this.props.isUserRole ? (<FormattedMessage id="app.common.delete" defaultMessage="删除" />) : (
      <a onClick={e => this.handleDelResource(e, record.id)}>
        <FormattedMessage id="app.common.delete" defaultMessage="删除" />
      </a>
      )}
      <span className="ant-divider" />
      {this.props.isUserRole ? (<FormattedMessage
        id="app.components.projectManage.projectHome.tabs.resource.projectEncodesConfig"
        defaultMessage="项目级脱敏"
      />) : (
        <a onClick={e => this.handleEncodeSearch(e, record)}>
          <FormattedMessage
            id="app.components.projectManage.projectHome.tabs.resource.projectEncodesConfig"
            defaultMessage="项目级脱敏"
          />
        </a>
      )}

    </div>
  );
  /**
   *@description selectTable的 Permission render
   */
  renderPermission = width => (text, record, index) => (
    <div style={this.props.tableWidthStyle(width)}>
      <Switch
        checkedChildren={<Icon type="check" />}
        unCheckedChildren={<Icon type="cross" />}
        size="small"
        defaultChecked={!!text}
        onChange={value => this.handleSwitchChange(Number(value), record.id)}
        disabled={this.props.isUserRole}
      />
    </div>
  );
  render () {
    const {
      locale,
      resource,
      encodes,
      resourceList,
      selectedTableScrollY,
      encodeList,
      encodeTypeList,
      errorFlag
    } = this.props
    const { modalkey, visble, tid, encodeRecord } = this.state
    const localeMessage = intlMessage(locale)
    const placeholder = this.handlePlaceholder(localeMessage)
    const columns = [
      {
        title: 'DsType',
        width: this.NomalTableWidth[0],
        dataIndex: 'ds_type',
        key: 'ds_type',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[0]))
      },
      {
        title: 'DsName',
        width: this.NomalTableWidth[1],
        dataIndex: 'ds_name',
        key: 'ds_name',
        // 自定义过滤显隐
        ...this.filterVisible('dataName'),
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
        dataIndex: 'schema_name',
        key: 'schema_name',
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
        dataIndex: 'table_name',
        key: 'table_name',
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
          <FormattedMessage id="app.common.status" defaultMessage="状态" />
        ),
        width: this.NomalTableWidth[4],
        dataIndex: 'status',
        key: 'status',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[4]))
      },
      {
        title: (
          <FormattedMessage id="app.common.version" defaultMessage="版本" />
        ),
        width: this.NomalTableWidth[5],
        dataIndex: 'version',
        key: 'version',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[5]))
      },
      {
        title: (
          <FormattedMessage id="app.common.description" defaultMessage="描述" />
        ),
        width: this.NomalTableWidth[6],
        dataIndex: 'description',
        key: 'description',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[6]))
      },
      {
        title: (
          <FormattedMessage
            id="app.common.createTime"
            defaultMessage="创建时间"
          />
        ),
        width: this.NomalTableWidth[7],
        dataIndex: 'create_time',
        key: 'create_time',
        render: this.renderComponent(this.renderNomal(this.NomalTableWidth[7]))
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
          <FormattedMessage id="app.common.status" defaultMessage="状态" />
        ),
        width: this.SelectTableWidth[1],
        dataIndex: 'status',
        key: 'status',
        render: this.renderComponent(this.renderNomal(this.SelectTableWidth[1]))
      },
      {
        title: (
          <FormattedMessage id="app.common.version" defaultMessage="版本" />
        ),
        width: this.SelectTableWidth[2],
        dataIndex: 'version',
        key: 'version',
        render: this.renderComponent(this.renderNomal(this.SelectTableWidth[2]))
      },
      {
        title: (
          <FormattedMessage id="app.common.description" defaultMessage="描述" />
        ),
        width: this.SelectTableWidth[3],
        dataIndex: 'description',
        key: 'description',
        render: this.renderComponent(this.renderNomal(this.SelectTableWidth[3]))
      },
      {
        title: (
          <FormattedMessage
            id="app.common.createTime"
            defaultMessage="创建时间"
          />
        ),
        width: this.SelectTableWidth[4],
        dataIndex: 'create_time',
        key: 'create_time',
        render: this.renderComponent(this.renderNomal(this.SelectTableWidth[4]))
      },
      {
        title: (
          <FormattedMessage
            id="app.components.projectManage.projectHome.tabs.resource.permissions"
            defaultMessage="全量权限"
          />
        ),
        width: this.SelectTableWidth[5],
        dataIndex: 'fullpull_enable_flag',
        key: 'fullpull_enable_flag',
        render: this.renderComponent(
          this.renderPermission(this.SelectTableWidth[5])
        )
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
        <div className={styles.table}>
          <Table
            size="small"
            rowKey={record => record.id}
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
            rowKey={record => record.id}
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
                `${encodeRecord.ds_type} / ${encodeRecord.ds_name} / ${
                  encodeRecord.schema_name
                } / ${encodeRecord.table_name}`}
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
  errorFlag: PropTypes.string,
  setResource: PropTypes.func,
  setEncodes: PropTypes.func,
  resourceList: PropTypes.object,
  resourceParams: PropTypes.object,
  onSetParams: PropTypes.func,
  onSearchList: PropTypes.func,
  onSearchEncode: PropTypes.func,
  getEncodeTypeList: PropTypes.func
}
