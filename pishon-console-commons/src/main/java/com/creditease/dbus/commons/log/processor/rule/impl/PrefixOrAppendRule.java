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

package com.creditease.dbus.commons.log.processor.rule.impl;

import com.creditease.dbus.commons.Constants;
import com.creditease.dbus.commons.log.processor.parse.ParseResult;
import com.creditease.dbus.commons.log.processor.parse.ParseRuleGrammar;
import com.creditease.dbus.commons.log.processor.parse.RuleGrammar;
import com.creditease.dbus.commons.log.processor.rule.IRule;
import org.apache.commons.lang3.StringUtils;

import java.util.LinkedList;
import java.util.List;

public class PrefixOrAppendRule implements IRule {

    public List<String> transform(List<String> data, List<RuleGrammar> grammar, Rules ruleType) throws Exception{
        List<String> ret = new LinkedList<>(data);
        List<ParseResult> prList = ParseRuleGrammar.parse(grammar, data.size(), ruleType);
        for (ParseResult pr : prList) {
            for (int col : pr.getScope()) {
                if (col >= data.size()) continue;
                String value = data.get(col);
                ret.remove(col);
                if (StringUtils.equals(pr.getOperate(), Constants.PREFIX_OR_APPEND_BEFORE)) {
                    ret.add(col, StringUtils.join(pr.getParamter(), value));
                } else {
                    ret.add(col, StringUtils.join(value, pr.getParamter()));
                }
            }
        }
        //返回结果
        return ret;
    }

    public static void main(String[] args) {
        System.out.println(StringUtils.join("aa", "bb"));
        System.out.println(StringUtils.join("bb", "aa"));
    }
}
