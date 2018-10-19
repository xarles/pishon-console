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

import com.creditease.dbus.commons.log.processor.parse.ParseResult;
import com.creditease.dbus.commons.log.processor.parse.ParseRuleGrammar;
import com.creditease.dbus.commons.log.processor.parse.RuleGrammar;
import com.creditease.dbus.commons.log.processor.rule.IRule;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegexExtractRule implements IRule {

    public List<String> transform(List<String> data, List<RuleGrammar> grammar, Rules ruleType) throws Exception{
        List<String> ret = new LinkedList<>(data);
        List<ParseResult> prList = ParseRuleGrammar.parse(grammar, data.size(), ruleType);
        for (ParseResult pr : prList) {
            for (int col : pr.getScope()) {
                String value;
                if (col >= data.size()) {
                    value = "";
                } else {
                    value = data.get(col);
                    ret.remove(col);
                }
                Matcher matcher = Pattern.compile(pr.getParamter()).matcher(value);
                List<String> extractRet =  new ArrayList<>();
                if (matcher.find()) {
                    for (int i = 1; i <= matcher.groupCount(); i++) {
                        extractRet.add(matcher.group(i));
                    }
                    ret.addAll(col, extractRet);
                }
            }
        }
        return ret;
    }

    public static void main(String[] args) {
        String value = "2017年11月zl1313546";
        Matcher matcher = Pattern.compile("(\\d{4}年\\d{1,2}月)([a-z]+)\\d*").matcher(value);
        List<String> extractRet =  new ArrayList<>();

        if (matcher.find()) {
            System.out.println(matcher.group(1));
            System.out.println(matcher.group(2));
        }

        if (matcher.matches()) {
            for (int i=0; i<=matcher.groupCount(); i++) {
                extractRet.add(matcher.group(i));
            }

        }
        System.out.println(extractRet);
    }
}
