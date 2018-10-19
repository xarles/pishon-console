/**
 * @author 戎晓伟
 * @description  基本信息设置
 */

import React, { PropTypes, Component } from 'react'
import { Modal, Table } from 'antd'
import { FormattedMessage } from 'react-intl'
import { intlMessage } from '@/app/i18n'
import OperatingButton from '@/app/components/common/OperatingButton'

// 导入样式
import styles from './res/styles/index.less'

export default class UserProject extends Component {
  constructor (props) {
    super(props)
    this.tableWidth = ['15%', '15%', '15%', '15%', '15%', '15%', '10%']
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
    <div title={text} className={styles.ellipsis}>
      {text}
    </div>
  );
  /**
   * @description table PhoneNum render
   */
  renderFlag = (text, record, index) => (
    <div style={{textAlign: 'center'}}>
      {text ? '√' : '×'}
    </div>
  );
  /**
   * @description table option render
   */
  renderOperating = (text, record, index) => (
    <div>
      <OperatingButton
        onClick={() => this.props.onModifyProject(record.id)}
      >
        调整项目用户
      </OperatingButton>
    </div>
  );
  render () {
    const { userProject, visibal, onCloseModal } = this.props
    const { loading, result } = userProject
    const dataSource = Object.values(result) || []
    const columns = [
      {
        title: '项目',
        width: this.tableWidth[0],
        dataIndex: 'projectName',
        key: 'projectName',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: '项目角色类型',
        width: this.tableWidth[1],
        dataIndex: 'userLevel',
        key: 'userLevel',
        render: this.renderComponent(this.renderNomal)
      },
      {
        title: '接收表结构变更报警',
        width: this.tableWidth[2],
        dataIndex: 'schemaChangeNotifyFlag',
        key: 'schemaChangeNotifyFlag',
        render: this.renderComponent(this.renderFlag)
      },
      {
        title: '接收主备同步报警',
        width: this.tableWidth[3],
        dataIndex: 'slaveSyncDelayNotifyFlag',
        key: 'slaveSyncDelayNotifyFlag',
        render: this.renderComponent(this.renderFlag)
      },
      {
        title: '接收拉全量报警',
        width: this.tableWidth[4],
        dataIndex: 'fullpullNotifyFlag',
        key: 'fullpullNotifyFlag',
        render: this.renderComponent(this.renderFlag)
      },
      {
        title: '接收Topo延时报警',
        width: this.tableWidth[5],
        dataIndex: 'dataDelayNotifyFlag',
        key: 'dataDelayNotifyFlag',
        render: this.renderComponent(this.renderFlag)
      },
      {
        title: (
          <FormattedMessage id="app.common.operate" defaultMessage="操作" />
        ),
        width: this.tableWidth[6],
        render: this.renderComponent(this.renderOperating)
      }
    ]
    return (
      <Modal
        className="modal-min-height"
        visible={visibal}
        maskClosable
        width={'1000px'}
        style={{ top: 60 }}
        title={'用户拥有的项目'}
        onCancel={() => onCloseModal(false)}
        footer={null}
      >
        <Table
          size="small"
          rowKey={record => record.id}
          dataSource={dataSource}
          columns={columns}
          pagination={false}
          loading={loading}
        />
      </Modal>
    )
  }
}

UserProject.propTypes = {
  locale: PropTypes.any,
  userProject: PropTypes.object,
  visibal: PropTypes.bool,
  onCloseModal: PropTypes.func,
  onModifyProject: PropTypes.func
}
