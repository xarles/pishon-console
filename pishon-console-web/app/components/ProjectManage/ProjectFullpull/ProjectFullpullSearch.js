/**
 * @author Hongchun Yin
 * @description  全量拉取历史列表
 */

import React, { PropTypes, Component } from 'react'
import { Form, Select, Input, Button, Row, Col } from 'antd'
import { FormattedMessage } from 'react-intl'
import { fromJS } from 'immutable'
// 导入样式
import styles from './res/styles/index.less'

const FormItem = Form.Item
const Option = Select.Option

@Form.create()
export default class ProjectFullpullSearch extends Component {
  /**
   * 校验并查询
   */
  handleSearch = e => {
    const { validateFields } = this.props.form
    const { onSearch, fullpullParams } = this.props
    // 校验并查询
    validateFields((err, value) => {
      if (!err) {
        if (value.projectName==='请选择Project') {
          value.projectName=null;
        }
        onSearch({ ...fullpullParams, ...value }, true)
      }
    })
  }

  render () {
    const { getFieldDecorator } = this.props.form
    const {query} = this.props
    const {dataSourceList, projectList} = this.props
    const project = projectList ? [{projectName: '请选择Project'}, ...projectList] : [{projectName: '请选择Project'}]
    const dataSource = dataSourceList ? [{dsName: '请选择DataSource'}, ...dataSourceList.map(ds => ({dsName:ds.dsName} ))] : [{dsName: '请选择DataSource'}]

    return (
      <div className="form-search">
        <Form autoComplete="off" layout="inline" className={styles.searchForm} onKeyUp={e => e.keyCode === 13 && this.handleSearch()}>
          <Row>
            <Col span={6} className={styles.formLeft}>
              <FormItem
                label={
                  <FormattedMessage
                    id="app.common.table.project"
                    defaultMessage="项目"
                  />
                }
              >
                {getFieldDecorator('projectName', {
                  initialValue: query.projectName ? query.projectName : project[1] ? `${project[1].projectName}` : `${project[0].projectName}`
                })(
                  <Select
                    showSearch
                    optionFilterProp='children'
                    className={styles.select}
                    placeholder="Select Project"
                  >
                    {project.map(item => (
                      <Option value={`${item.projectName}`} key={`${item.projectName ? item.projectName: 'projectName'}`}>
                        {item.projectName}
                      </Option>
                    ))}
                  </Select>
                )}
              </FormItem>
            </Col>
            <Col span={18} className={styles.formRight}>
              <FormItem>
                {getFieldDecorator('dsName', {
                  initialValue: query.dsName
                })(
                  <Select
                    showSearch
                    optionFilterProp='children'
                    className={styles.select}
                    placeholder="select a data source"
                  >
                    {dataSource.map(item => (
                      <Option value={`${item.dsName}`} key={`${item.dsName ? item.dsName : 'dsName'}`}>
                        {item.dsName}
                      </Option>
                    ))}
                  </Select>
                )}
              </FormItem>
              <FormItem>
                {getFieldDecorator('schemaName', {
                  initialValue: query.schemaName
                })(<Input className={styles.input} placeholder="schemaName" />)}
              </FormItem>
              <FormItem>
                {getFieldDecorator('tableName', {
                  initialValue: query.tableName
                })(<Input className={styles.input} placeholder="tableName" />)}
              </FormItem>
              <FormItem>
                <Button
                  type="primary"
                  icon="search"
                  onClick={this.handleSearch}
                >
                  <FormattedMessage
                    id="app.common.search"
                    defaultMessage="查询"
                  />
                </Button>
              </FormItem>
            </Col>
          </Row>
        </Form>
      </div>
    )
  }
}

ProjectFullpullSearch.propTypes = {
  form: PropTypes.object,
  local: PropTypes.any,
  fullpullParams: PropTypes.object,
  onSearch: PropTypes.func
}
