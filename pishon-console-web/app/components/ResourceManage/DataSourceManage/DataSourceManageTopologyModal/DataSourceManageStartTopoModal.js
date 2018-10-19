import React, { PropTypes, Component } from 'react'
import { Modal, Form, Select, Input, Button, message,Table } from 'antd'
import { FormattedMessage } from 'react-intl'
import OperatingButton from '@/app/components/common/OperatingButton'

// 导入样式
import styles from '../res/styles/index.less'
import Request from "@/app/utils/request";

const FormItem = Form.Item
const Option = Select.Option
const TextArea = Input.TextArea

@Form.create()
export default class DataSourceManageStartTopoModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      // 用于筛选下拉列表选项
      version: null,
      type: null,
      loading: false,
    }
  }

  componentWillMount = () => {
    const {record, dataSource} = this.props
    const dsName = dataSource.name || ''
    const topoName = record.topologyName || ''
    const initialType = topoName.substr(dsName.length + 1).replace(/-/g, '_')
    this.setState({
      type: initialType
    })
  }

  handleVersionChange = value => {
    this.setState({version: value})
    this.props.form.setFieldsValue({minorVersion: null})
  }

  handleTypeChange = value => {
    this.setState({type: value})
    this.props.form.setFieldsValue({minorVersion: null})
  }

  handleStart = () => {
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.props.form.setFieldsValue({log: null})
        const {topoJarStartApi} = this.props
        const {jarInfos} = this.props
        const jar = jarInfos.filter(jar => jar.version === values.version && jar.type === values.type && jar.minorVersion === values.minorVersion)[0]

        this.setState({loading: true})
        Request(topoJarStartApi, {
          data: {
            dsName: values.dsName,
            jarPath: jar.path,
            jarName: jar.fileName,
            topologyType: values.type.replace('_', '-')
          },
          method: 'post'
        })
          .then(res => {
            this.setState({loading: false})
            if (res && res.status === 0) {
              message.success(res.message)
              this.props.form.setFieldsValue({log: res.payload})
            } else {
              message.warn(res.message)
            }
          })
          .catch(error => {
            this.setState({loading: false})
            error.response && error.response.data && error.response.data.message
              ? message.error(error.response.data.message)
              : message.error(error.message)
          })
      }
    })
  }

  render () {
    const {loading} = this.state
    const {key, visible, record, dataSource, onClose} = this.props
    const {jarInfos} = this.props
    const { getFieldDecorator } = this.props.form
    const {version, type} = this.state
    const versionList = Array.from(new Set(jarInfos.map(jar => jar.version)))
    const typeList = Array.from(new Set(jarInfos.filter(jar => jar.version === version).map(jar => jar.type)))
    const minorVersionList = Array.from(new Set(jarInfos.filter(jar => jar.version === version && jar.type === type).map(jar => jar.minorVersion)))
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
    const tailItemLayout = {
      wrapperCol: {
        xs: { offset: 5, span: 19 },
        sm: { offset: 6, span: 12 }
      }
    }

    return (
      <div className={styles.table}>
        <Modal
          key={key}
          className="top-modal"
          visible={visible}
          maskClosable={false}
          width={1000}
          title={`Start Topology --- ${record.topologyName}`}
          onCancel={onClose}
          footer={[<Button type="primary" onClick={onClose}> 返 回 </Button>]}
        >
          <Form autoComplete="off"
            className="data-source-start-topo-form"
          >
            <FormItem label="数据源名称" {...formItemLayout}>
              {getFieldDecorator('dsName', {
                initialValue: dataSource.name,
              })(<Input disabled={true} size="large" type="text" />)}
            </FormItem>

            <FormItem
              label={"Type"} {...formItemLayout}
            >
              {getFieldDecorator('type', {
                initialValue: type,
                rules: [
                  {
                    required: true,
                    message: 'type不能为空'
                  }
                ]
              })(
                <Select
                  showSearch
                  disabled={true}
                  optionFilterProp='children'
                  className={styles.select}
                  placeholder="Select type"
                  onChange={this.handleTypeChange}
                >
                  {typeList.map(type => (
                    <Option value={type} key={type}>{type}</Option>
                  ))}
                </Select>
              )}
            </FormItem>

            <FormItem
              label={"Version"} {...formItemLayout}
            >
              {getFieldDecorator('version', {
                initialValue:null,
                rules: [
                  {
                    required: true,
                    message: 'version不能为空'
                  }
                ]
              })(
                <Select
                  showSearch
                  optionFilterProp='children'
                  className={styles.select}
                  placeholder="Select version"
                  onChange={this.handleVersionChange}
                >
                  {versionList.map(version => (
                    <Option value={version} key={version}>{version}</Option>
                  ))}
                </Select>
              )}
            </FormItem>

            <FormItem
              label={"Minor Version"} {...formItemLayout}
            >
              {getFieldDecorator('minorVersion', {
                initialValue: null,
                rules: [
                  {
                    required: true,
                    message: 'minor version不能为空'
                  }
                ]
              })(
                <Select
                  showSearch
                  optionFilterProp='children'
                  className={styles.select}
                  placeholder="Select minor version"
                >
                  {minorVersionList.map(minorVersion => (
                    <Option value={minorVersion} key={minorVersion}>{minorVersion}</Option>
                  ))}
                </Select>
              )}
            </FormItem>

            <FormItem label="启动说明" {...formItemLayout}>
              {getFieldDecorator('desc', {
                initialValue: null,
              })(<Input size="large" type="text" />)}
            </FormItem>
            <FormItem label="Log" {...formItemLayout}>
              {getFieldDecorator('log', {
                initialValue: null,
              })(<TextArea wrap='off' readOnly autosize={{minRows:10,maxRows:20}}/>)}

            </FormItem>
            <FormItem {...tailItemLayout}>
              <Button type="primary" loading={loading} onClick={this.handleStart}>启动</Button>
            </FormItem>

          </Form>
        </Modal>
      </div>
    )
  }
}

DataSourceManageStartTopoModal.propTypes = {
}
