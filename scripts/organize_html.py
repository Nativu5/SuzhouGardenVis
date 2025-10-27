#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
整理HTML文件按公布批次分类
"""

import csv
import os
import shutil
from pathlib import Path

def organize_html_files():
    # 项目根目录
    project_root = Path("/home/leo/Workspace/SuzhouGardenVis")
    csv_file = project_root / "dataset" / "SuzhouGardenList.csv"
    html_dir = project_root / "html"
    
    # 读取CSV文件，建立园林名称到公布批次的映射
    garden_to_batch = {}
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # 跳过标题行
        
        for row in reader:
            if len(row) >= 2:
                batch = row[0].strip()
                name = row[1].strip()
                garden_to_batch[name] = batch
    
    print(f"从CSV文件中读取了 {len(garden_to_batch)} 个园林信息")
    
    # 统计移动的文件数量
    moved_count = {1: 0, 2: 0, 3: 0, 4: 0}
    not_found = []
    
    # 遍历html目录中的所有HTML文件
    for html_file in html_dir.glob("*.html"):
        garden_name = html_file.stem  # 获取不带扩展名的文件名
        
        if garden_name in garden_to_batch:
            batch = garden_to_batch[garden_name]
            target_dir = html_dir / batch
            target_file = target_dir / html_file.name
            
            # 移动文件
            try:
                shutil.move(str(html_file), str(target_file))
                moved_count[int(batch)] += 1
                print(f"移动 {garden_name}.html 到批次 {batch}")
            except Exception as e:
                print(f"移动文件 {html_file.name} 时出错: {e}")
        else:
            not_found.append(garden_name)
            print(f"警告: 在CSV中未找到园林 '{garden_name}' 的批次信息")
    
    # 输出统计信息
    print("\n=== 移动统计 ===")
    for batch in [1, 2, 3, 4]:
        print(f"批次 {batch}: {moved_count[batch]} 个文件")
    
    if not_found:
        print(f"\n未找到批次信息的文件 ({len(not_found)} 个):")
        for name in not_found:
            print(f"  - {name}.html")
    
    print(f"\n总计移动了 {sum(moved_count.values())} 个文件")

if __name__ == "__main__":
    organize_html_files()