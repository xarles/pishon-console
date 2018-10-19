/**
 * @author 戎晓伟
 * @description redux->reducer
 */

import { fromJS } from 'immutable'

// 导入types
import {
  UPDATE_GLOBAL_CONF
} from '../action/types'

const initialState = fromJS({
  updateGlobalConfResult: {
    loading: false,
    loaded: false,
    result: {}
  }
})

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_GLOBAL_CONF.LOAD:
      return state.setIn(['updateGlobalConfResult','loading'],true)
    case UPDATE_GLOBAL_CONF.SUCCESS:
      return state
        .setIn(['updateGlobalConfResult', 'loading'], false)
        .setIn(['updateGlobalConfResult', 'loaded'], true)
        .setIn(['updateGlobalConfResult', 'result'], action.result)
    case UPDATE_GLOBAL_CONF.FAIL:
      return state
        .setIn(['updateGlobalConfResult', 'loading'], false)
        .setIn(['updateGlobalConfResult', 'loaded'], true)
        .setIn(['updateGlobalConfResult', 'result'], action.result)
    default:
      return state
  }
}
