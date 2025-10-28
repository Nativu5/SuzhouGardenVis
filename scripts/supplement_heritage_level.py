#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
苏州园林文保单位级别补充脚本
根据全国重点文物保护单位名单对SuzhouGardenList.csv进行补充
"""

import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
import re
import os

def haversine(lon1, lat1, lon2, lat2):
    """
    计算两个经纬度点之间的距离（单位：公里）
    使用Haversine公式
    """
    # 将十进制度数转化为弧度
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine公式
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # 地球平均半径，单位为公里
    return c * r

def match_by_name(garden_name, heritage_df):
    """
    通过名称匹配全国重点文物保护单位
    """
    # 精确匹配
    exact_match = heritage_df[heritage_df['名称'] == garden_name]
    if not exact_match.empty:
        return True, "全国"
    
    # 模糊匹配（去除常见后缀）
    garden_name_clean = re.sub(r'(园|庄|亭|堂|寺|塔|楼|阁|轩|斋|居|室|舫|榭|廊|桥|池|湖|山|石|峰|洞|泉|井|台|坛|祠|庙|观|院|馆|所|厅|房|屋|宅|府|第|里|巷|街|路|道|桥|门|城|墙|关|口|渡|码头|市场|广场|公园|花园|别墅|山庄|度假村|酒店|宾馆|饭店|餐厅|茶楼|会所|俱乐部|中心|基地|园区|景区|风景区|旅游区|保护区|遗址|故居|纪念馆|博物馆|展览馆|文化馆|图书馆|档案馆|研究所|学校|大学|学院|医院|诊所|银行|商店|超市|市场|工厂|公司|企业|机关|政府|委员会|办公室|部门|局|处|科|股|组|队|站|所|中心|基地|园区|景区|风景区|旅游区|保护区)$', '', garden_name)
    
    fuzzy_matches = heritage_df[heritage_df['名称'].str.contains(garden_name_clean, na=False)]
    if not fuzzy_matches.empty:
        return True, "全国"
    
    return False, None

def match_by_location(garden_lon, garden_lat, heritage_df, threshold_km=1.0):
    """
    通过经纬度匹配全国重点文物保护单位
    """
    if pd.isna(garden_lon) or pd.isna(garden_lat):
        return False, None
    
    # 计算与所有文保单位的距离
    distances = []
    for _, row in heritage_df.iterrows():
        if pd.notna(row['经度']) and pd.notna(row['纬度']):
            distance = haversine(garden_lon, garden_lat, row['经度'], row['纬度'])
            distances.append(distance)
        else:
            distances.append(float('inf'))
    
    min_distance = min(distances)
    if min_distance <= threshold_km:
        return True, "全国（地点推测）"
    
    return False, None

def search_in_description(description):
    """
    在描述中搜索文物保护单位相关关键字
    """
    if pd.isna(description):
        return None
    
    # 定义文物保护单位级别关键字
    patterns = {
        "全国重点文物保护单位": "全国",
        "国家重点文物保护单位": "全国", 
        "省级文物保护单位": "省级",
        "市级文物保护单位": "市级",
        "县级文物保护单位": "县级",
        "区级文物保护单位": "区级",
        "文物保护单位": "文物保护单位"
    }
    
    for pattern, level in patterns.items():
        if pattern in description:
            return level
    
    return None

def supplement_heritage_level(suzhou_csv_path, heritage_csv_path, output_csv_path):
    """
    主函数：补充文保单位级别
    """
    print("正在读取数据文件...")
    
    # 读取苏州园林数据
    try:
        suzhou_df = pd.read_csv(suzhou_csv_path, encoding='utf-8')
    except UnicodeDecodeError:
        suzhou_df = pd.read_csv(suzhou_csv_path, encoding='gbk')
    
    # 读取全国重点文物保护单位数据
    try:
        heritage_df = pd.read_csv(heritage_csv_path, encoding='utf-8')
    except UnicodeDecodeError:
        heritage_df = pd.read_csv(heritage_csv_path, encoding='gbk')
    
    print(f"苏州园林数据：{len(suzhou_df)} 条记录")
    print(f"全国重点文物保护单位数据：{len(heritage_df)} 条记录")
    
    # 添加文保单位级别列
    suzhou_df['文保单位级别'] = None
    
    # 统计匹配结果
    name_matches = 0
    location_matches = 0
    description_matches = 0
    no_matches = 0
    
    print("\n开始匹配处理...")
    
    for idx, row in suzhou_df.iterrows():
        garden_name = row['名称']
        garden_lon = row['经度']
        garden_lat = row['纬度']
        description = row['描述']
        
        print(f"处理第 {idx+1}/{len(suzhou_df)} 个：{garden_name}")
        
        # 1. 名称匹配
        name_matched, name_level = match_by_name(garden_name, heritage_df)
        if name_matched:
            suzhou_df.at[idx, '文保单位级别'] = name_level
            name_matches += 1
            print(f"  ✓ 名称匹配成功：{name_level}")
            continue
        
        # 2. 经纬度匹配
        location_matched, location_level = match_by_location(garden_lon, garden_lat, heritage_df)
        if location_matched:
            suzhou_df.at[idx, '文保单位级别'] = location_level
            location_matches += 1
            print(f"  ✓ 地点匹配成功：{location_level}")
            continue
        
        # 3. 描述关键字搜索
        desc_level = search_in_description(description)
        if desc_level:
            suzhou_df.at[idx, '文保单位级别'] = desc_level
            description_matches += 1
            print(f"  ✓ 描述匹配成功：{desc_level}")
            continue
        
        # 未匹配到
        no_matches += 1
        print(f"  ✗ 未找到匹配")
    
    # 保存结果
    print(f"\n正在保存结果到：{output_csv_path}")
    suzhou_df.to_csv(output_csv_path, index=False, encoding='utf-8-sig')
    
    # 输出统计结果
    print("\n=== 匹配统计结果 ===")
    print(f"名称匹配：{name_matches} 条")
    print(f"地点匹配：{location_matches} 条")
    print(f"描述匹配：{description_matches} 条")
    print(f"未匹配：{no_matches} 条")
    print(f"总计：{len(suzhou_df)} 条")
    
    # 显示各级别统计
    print("\n=== 文保单位级别统计 ===")
    level_counts = suzhou_df['文保单位级别'].value_counts()
    for level, count in level_counts.items():
        print(f"{level}：{count} 条")
    
    print(f"\n处理完成！结果已保存到：{output_csv_path}")

if __name__ == "__main__":
    # 文件路径
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    suzhou_csv = os.path.join(base_dir, "dataset", "SuzhouGardenList.csv")
    heritage_csv = os.path.join(base_dir, "dataset", "全国重点文物保护单位名单.csv")
    output_csv = os.path.join(base_dir, "dataset", "SuzhouGardenList_补充文保级别.csv")
    
    # 检查文件是否存在
    if not os.path.exists(suzhou_csv):
        print(f"错误：找不到文件 {suzhou_csv}")
        exit(1)
    
    if not os.path.exists(heritage_csv):
        print(f"错误：找不到文件 {heritage_csv}")
        exit(1)
    
    # 执行补充处理
    supplement_heritage_level(suzhou_csv, heritage_csv, output_csv)