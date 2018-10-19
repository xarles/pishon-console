import React, { PropTypes, Component } from 'react'
import { Modal, Form, Select, Input, Button, message,Table } from 'antd'
import { FormattedMessage } from 'react-intl'
import OperatingButton from '@/app/components/common/OperatingButton'

// 导入样式
import styles from './res/styles/index.less'
import Request from "@/app/utils/request";

const FormItem = Form.Item
const Option = Select.Option
const TextArea = Input.TextArea

@Form.create()
export default class DataTableManageModifyModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
    }
  }

  handleSubmit = () => {
    const {updateApi} = this.props
    const {onClose, onRequest} = this.props
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        onRequest({
          api: updateApi,
          data: {
            ...values,
            createTime: undefined
          },
          method: 'post',
          callback: onClose,
        })
      }
    })
  }

  render () {
    const { getFieldDecorator } = this.props.form
    const {key, visible, tableInfo, onClose} = this.props
    const formItemLayout = {
      labelCol: {
        xs: { span: 5 },
        sm: { span: 6 }
      },
      wrapperCol: {
        xs: { span: 19 },
        sm: { span: 12 }
      }
    }
    return (
      <div className={styles.table}>
        <Modal
          className="top-modal"
          key={key}
          visible={visible}
          maskClosable={false}
          width={1000}
          title={'修改表信息'}
          onCancel={onClose}
          onOk={this.handleSubmit}
        >
          <Form autoComplete="off" onKeyUp={e => {
            e.keyCode === 13 && this.handleSubmit()
          }} className="data-source-modify-form">
            <FormItem label="ID" {...formItemLayout}>
              {getFieldDecorator('id', {
                initialValue: tableInfo.id,
              })(<Input disabled={true} size="large" type="text" />)}
            </FormItem>
            <FormItem label="dsName" {...formItemLayout}>
              {getFieldDecorator('dsName', {
                initialValue: tableInfo.dsName,
              })(<Input disabled={true} size="large" type="text" />)}
            </FormItem>
            <FormItem label="schemaName" {...formItemLayout}>
              {getFieldDecorator('schemaName', {
                initialValue: tableInfo.schemaName,
              })(<Input disabled={true} size="large" type="text" />)}
            </FormItem>
            <FormItem label="tableName" {...formItemLayout}>
              {getFieldDecorator('tableName', {
                initialValue: tableInfo.tableName,
              })(<Input disabled={true} size="large" type="text" />)}
            </FormItem>
            <FormItem label="PTRegex" {...formItemLayout}>
              {getFieldDecorator('physicalTableRegex', {
                initialValue:tableInfo.physicalTableRegex,
              })(<Input size="large" type="text" />)}
            </FormItem>
            <FormItem label="Alias" {...formItemLayout}>
              {getFieldDecorator('tableNameAlias', {
                initialValue:tableInfo.tableNameAlias,
              })(<Input size="large" type="text" />)}
            </FormItem>
            <FormItem label="description" {...formItemLayout}>
              {getFieldDecorator('description', {
                initialValue: tableInfo.description,
              })(<Input size="large" type="text" />)}
            </FormItem>

            <FormItem
              label={"beforeUpdate"} {...formItemLayout}
            >
              {getFieldDecorator('outputBeforeUpdateFlg', {
                initialValue:`${tableInfo.outputBeforeUpdateFlg}`
              })(
                <Select
                  showSearch
                  optionFilterProp='children'
                  className={styles.select}
                  placeholder="Select status"
                >
                  <Option value="1" key="1">Yes</Option>
                  <Option value="0" key="0">No</Option>
                </Select>
              )}
            </FormItem>
            <FormItem label="split_col" {...formItemLayout}>
              {getFieldDecorator('fullpullCol', {
                initialValue: tableInfo.fullpullCol,
              })(<Input size="large" type="text" />)}
            </FormItem>
            <FormItem label="split_shard_size" {...formItemLayout}>
              {getFieldDecorator('fullpullSplitShardSize', {
                initialValue: tableInfo.fullpullSplitShardSize,
              })(<Input size="large" type="text" />)}
            </FormItem>
            <FormItem label="split_style" {...formItemLayout}>
              {getFieldDecorator('fullpullSplitStyle', {
                initialValue: tableInfo.fullpullSplitStyle,
              })(<Input size="large" type="text" />)}
            </FormItem>
          </Form>
        </Modal>
      </div>
    )
  }
}

DataTableManageModifyModal.propTypes = {
}
