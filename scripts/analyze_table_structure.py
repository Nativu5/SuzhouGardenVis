#!/usr/bin/env python3
"""
分析 archived/ylml_details.json 文件中每个对象的 content_html 字段中的表格结构
"""

import json
import hashlib
import re
from collections import defaultdict
from bs4 import BeautifulSoup


def detect_value_type(text):
    """检测文本的数据类型"""
    if not text or not text.strip():
        return "empty"
    
    text = text.strip()
    
    # 检测数字
    if re.match(r'^\d+$', text):
        return "integer"
    if re.match(r'^\d+\.\d+$', text):
        return "float"
    
    # 检测日期格式
    if re.match(r'\d{4}-\d{1,2}-\d{1,2}', text):
        return "date"
    if re.match(r'\d{4}年\d{1,2}月\d{1,2}日', text):
        return "date"
    
    # 检测是否包含特殊符号（可能是选择框或标记）
    if '√' in text or '□' in text or '■' in text:
        return "checkbox"
    
    # 默认为文本
    return "text"


def extract_table_headers(table):
    """提取表格的字段位置信息（不包含具体内容）"""
    headers = []
    
    # 尝试从第一行提取表头结构
    first_row = table.find('tr')
    if first_row:
        cells = first_row.find_all(['th', 'td'])
        for i, cell in enumerate(cells):
            # 只记录字段位置，不记录具体内容
            headers.append(f"field_{i+1}")
    
    return headers


def analyze_table_structure(table):
    """分析单个表格的结构"""
    rows = table.find_all('tr')
    if not rows:
        return None
    
    # 计算行数
    row_count = len(rows)
    
    # 计算列数（取最大列数）
    col_count = 0
    for row in rows:
        cells = row.find_all(['th', 'td'])
        # 考虑colspan属性
        current_cols = 0
        for cell in cells:
            colspan = int(cell.get('colspan', 1))
            current_cols += colspan
        col_count = max(col_count, current_cols)
    
    # 提取字段名称
    headers = extract_table_headers(table)
    
    # 分析数据类型（从前几行的数据中推断）
    field_types = []
    sample_rows = rows[1:min(4, len(rows))]  # 取前3行数据进行类型分析
    
    for col_idx in range(col_count):
        col_types = []
        for row in sample_rows:
            cells = row.find_all(['th', 'td'])
            if col_idx < len(cells):
                text = cells[col_idx].get_text(strip=True)
                col_types.append(detect_value_type(text))
        
        # 确定该列的主要类型
        if col_types:
            type_counts = defaultdict(int)
            for t in col_types:
                type_counts[t] += 1
            main_type = max(type_counts.items(), key=lambda x: x[1])[0]
            field_types.append(main_type)
        else:
            field_types.append("unknown")
    
    return {
        'row_count': row_count,
        'col_count': col_count,
        'headers': headers,
        'field_types': field_types
    }


def create_structure_id(structure):
    """为表格结构创建唯一标识"""
    # 只使用行列数和字段数量创建哈希值，忽略具体内容
    key_data = f"{structure['row_count']}_{structure['col_count']}_{len(structure['headers'])}"
    return hashlib.md5(key_data.encode('utf-8')).hexdigest()[:8]


def analyze_json_file(file_path):
    """分析JSON文件中的所有表格结构"""
    print(f"开始读取文件: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"文件包含 {len(data)} 个对象")
    
    structure_stats = defaultdict(lambda: {
        'count': 0,
        'structure': None,
        'examples': [],
        'html_files': []  # 新增：记录对应的HTML文件名
    })
    
    total_tables = 0
    processed_items = 0
    
    for item in data:
        processed_items += 1
        if processed_items % 10 == 0:
            print(f"已处理 {processed_items}/{len(data)} 个对象")
            
        if 'content_html' not in item or not item['content_html']:
            continue
        
        # 获取对应的HTML文件名
        html_filename = f"{item['name']}.html"
        
        # 解析HTML
        soup = BeautifulSoup(item['content_html'], 'html.parser')
        tables = soup.find_all('table')
        
        for table in tables:
            total_tables += 1
            structure = analyze_table_structure(table)
            
            if structure:
                struct_id = create_structure_id(structure)
                structure_stats[struct_id]['count'] += 1
                structure_stats[struct_id]['structure'] = structure
                
                # 保存示例（最多保存3个）
                if len(structure_stats[struct_id]['examples']) < 3:
                    structure_stats[struct_id]['examples'].append(item['name'])
                
                # 记录HTML文件名（避免重复）
                if html_filename not in structure_stats[struct_id]['html_files']:
                    structure_stats[struct_id]['html_files'].append(html_filename)
    
    print(f"处理完成，共找到 {total_tables} 个表格")
    return structure_stats, total_tables


def generate_report(structure_stats, total_tables):
    """生成分析报告"""
    report = {
        'summary': {
            'total_tables': total_tables,
            'unique_structures': len(structure_stats),
            'analysis_date': '2024-12-31'
        },
        'structures': []
    }
    
    # 按出现频率排序
    sorted_structures = sorted(
        structure_stats.items(), 
        key=lambda x: x[1]['count'], 
        reverse=True
    )
    
    for struct_id, stats in sorted_structures:
        structure = stats['structure']
        
        # 创建字段信息
        fields = []
        for i, header in enumerate(structure['headers']):
            field_type = structure['field_types'][i] if i < len(structure['field_types']) else 'unknown'
            fields.append({
                'position': i + 1,
                'type': field_type
            })
        
        structure_info = {
            'structure_id': struct_id,
            'count': stats['count'],
            'percentage': round(stats['count'] / total_tables * 100, 2),
            'dimensions': {
                'rows': structure['row_count'],
                'columns': structure['col_count']
            },
            'fields': fields,
            'examples': stats['examples'],
            'html_files': stats['html_files']  # 新增：对应的HTML文件列表
        }
        
        report['structures'].append(structure_info)
    
    return report


def main():
    """主函数"""
    input_file = 'archived/ylml_details.json'
    output_file = 'table_structure_analysis.json'
    
    print(f"正在分析文件: {input_file}")
    
    try:
        structure_stats, total_tables = analyze_json_file(input_file)
        report = generate_report(structure_stats, total_tables)
        
        # 保存报告
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"分析完成！")
        print(f"总表格数: {total_tables}")
        print(f"唯一结构数: {len(structure_stats)}")
        print(f"报告已保存到: {output_file}")
        
        # 打印简要统计
        print("\n结构统计:")
        for struct_id, stats in sorted(structure_stats.items(), key=lambda x: x[1]['count'], reverse=True):
            structure = stats['structure']
            print(f"  结构 {struct_id}: {stats['count']}次 ({structure['row_count']}行×{structure['col_count']}列)")
    
    except FileNotFoundError:
        print(f"错误: 找不到文件 {input_file}")
    except Exception as e:
        print(f"分析过程中出现错误: {e}")


if __name__ == "__main__":
    main()