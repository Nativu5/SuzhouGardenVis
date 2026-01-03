#!/usr/bin/env python3
"""
苏州园林图片统一命名和格式转换脚本

功能：
1. 统一图片命名格式：01.jpg, 02.jpg, 03.jpg...
2. 将所有PNG格式转换为JPG格式
3. 统一文件扩展名为小写 .jpg
4. 生成详细的处理报告

使用方法：
    python scripts/normalize_images.py [--dry-run] [--backup]

参数：
    --dry-run    仅预览操作，不实际修改文件
    --backup     在处理前备份原始文件到 backup/ 目录
    --quality N  JPG压缩质量 (1-100, 默认85)
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️  警告: 未安装 Pillow 库，将无法进行格式转换")
    print("   请运行: pip install Pillow")


class ImageNormalizer:
    """图片标准化处理器"""

    def __init__(self, base_dir: Path, dry_run: bool = False, backup: bool = False, quality: int = 85):
        self.base_dir = base_dir
        self.dry_run = dry_run
        self.backup = backup
        self.quality = quality
        self.stats = {
            'total_folders': 0,
            'total_images': 0,
            'renamed': 0,
            'converted': 0,
            'skipped': 0,
            'errors': 0
        }
        self.log_messages: List[str] = []

    def log(self, message: str, level: str = 'INFO'):
        """记录日志"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        log_entry = f"[{timestamp}] {level}: {message}"
        self.log_messages.append(log_entry)

        # 根据级别设置颜色
        colors = {
            'INFO': '\033[0m',      # 默认
            'SUCCESS': '\033[92m',  # 绿色
            'WARNING': '\033[93m',  # 黄色
            'ERROR': '\033[91m',    # 红色
            'DEBUG': '\033[94m'     # 蓝色
        }
        color = colors.get(level, colors['INFO'])
        reset = '\033[0m'

        print(f"{color}{log_entry}{reset}")

    def backup_folder(self, folder_path: Path) -> bool:
        """备份文件夹"""
        if not self.backup:
            return True

        backup_dir = self.base_dir.parent / 'backup' / 'images_backup' / datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_target = backup_dir / folder_path.name

        try:
            backup_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(folder_path, backup_target)
            self.log(f"已备份: {folder_path.name} -> {backup_target}", 'DEBUG')
            return True
        except Exception as e:
            self.log(f"备份失败: {folder_path.name} - {e}", 'ERROR')
            return False

    def convert_png_to_jpg(self, png_path: Path, jpg_path: Path) -> bool:
        """将PNG转换为JPG"""
        if not PIL_AVAILABLE:
            self.log(f"跳过转换（Pillow未安装）: {png_path.name}", 'WARNING')
            return False

        try:
            # 打开PNG图片
            img = Image.open(png_path)

            # 如果有透明通道，转换为RGB（白色背景）
            if img.mode in ('RGBA', 'LA', 'P'):
                # 创建白色背景
                background = Image.new('RGB', img.size, (255, 255, 255))
                # 如果是P模式，先转换为RGBA
                if img.mode == 'P':
                    img = img.convert('RGBA')
                # 粘贴图片到白色背景上
                if img.mode in ('RGBA', 'LA'):
                    background.paste(img, mask=img.split()[-1])  # 使用alpha通道作为蒙版
                else:
                    background.paste(img)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # 保存为JPG
            img.save(jpg_path, 'JPEG', quality=self.quality, optimize=True)
            return True

        except Exception as e:
            self.log(f"转换失败: {png_path.name} - {e}", 'ERROR')
            return False

    def normalize_folder(self, folder_path: Path) -> Dict:
        """标准化单个文件夹中的图片"""
        folder_stats = {
            'folder_name': folder_path.name,
            'images_found': 0,
            'images_processed': 0,
            'operations': []
        }

        # 获取所有图片文件
        image_extensions = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}
        image_files = [f for f in folder_path.iterdir()
                      if f.is_file() and f.suffix in image_extensions]

        # 按名称排序（保持原有顺序）
        image_files.sort(key=lambda x: x.name.lower())

        folder_stats['images_found'] = len(image_files)

        if len(image_files) == 0:
            self.log(f"跳过（无图片）: {folder_path.name}", 'WARNING')
            self.stats['skipped'] += 1
            return folder_stats

        # 备份（如果需要）
        if self.backup and not self.dry_run:
            if not self.backup_folder(folder_path):
                self.stats['errors'] += 1
                return folder_stats

        # 处理每个图片
        for index, old_file in enumerate(image_files, start=1):
            new_name = f"{index:02d}.jpg"
            new_file = folder_path / new_name

            operation = {
                'old_name': old_file.name,
                'new_name': new_name,
                'action': '',
                'success': False
            }

            try:
                if self.dry_run:
                    # 预览模式，只记录操作
                    if old_file.suffix.lower() == '.png':
                        operation['action'] = 'convert_and_rename'
                    elif old_file.name != new_name:
                        operation['action'] = 'rename'
                    else:
                        operation['action'] = 'keep'
                    operation['success'] = True

                else:
                    # 实际处理
                    if old_file.suffix.lower() == '.png':
                        # PNG转JPG
                        if self.convert_png_to_jpg(old_file, new_file):
                            old_file.unlink()  # 删除原PNG文件
                            operation['action'] = 'convert_and_rename'
                            operation['success'] = True
                            self.stats['converted'] += 1
                            self.stats['renamed'] += 1
                        else:
                            operation['action'] = 'convert_failed'
                            self.stats['errors'] += 1

                    elif old_file.name != new_name:
                        # 仅重命名
                        # 如果目标文件已存在，先重命名为临时文件
                        if new_file.exists() and new_file != old_file:
                            temp_file = folder_path / f"temp_{new_name}"
                            old_file.rename(temp_file)
                            temp_file.rename(new_file)
                        else:
                            old_file.rename(new_file)

                        operation['action'] = 'rename'
                        operation['success'] = True
                        self.stats['renamed'] += 1

                    else:
                        # 文件名已经正确
                        operation['action'] = 'keep'
                        operation['success'] = True

                if operation['success']:
                    folder_stats['images_processed'] += 1

            except Exception as e:
                operation['action'] = 'error'
                operation['error'] = str(e)
                self.log(f"处理失败: {folder_path.name}/{old_file.name} - {e}", 'ERROR')
                self.stats['errors'] += 1

            folder_stats['operations'].append(operation)

        return folder_stats

    def process_all(self) -> List[Dict]:
        """处理所有文件夹"""
        if not self.base_dir.exists():
            self.log(f"目录不存在: {self.base_dir}", 'ERROR')
            return []

        self.log("=" * 80, 'INFO')
        self.log("苏州园林图片标准化处理", 'INFO')
        self.log("=" * 80, 'INFO')
        self.log(f"处理目录: {self.base_dir}", 'INFO')
        self.log(f"模式: {'预览模式 (不修改文件)' if self.dry_run else '实际处理'}", 'INFO')
        self.log(f"备份: {'是' if self.backup else '否'}", 'INFO')
        self.log(f"JPG质量: {self.quality}", 'INFO')
        self.log("=" * 80, 'INFO')

        # 获取所有园林文件夹
        folders = sorted([d for d in self.base_dir.iterdir() if d.is_dir()])
        self.stats['total_folders'] = len(folders)

        self.log(f"\n找到 {len(folders)} 个园林文件夹\n", 'INFO')

        # 处理每个文件夹
        all_results = []
        for i, folder in enumerate(folders, 1):
            self.log(f"[{i}/{len(folders)}] 处理: {folder.name}", 'INFO')
            result = self.normalize_folder(folder)
            all_results.append(result)
            self.stats['total_images'] += result['images_found']

            # 显示处理结果
            if result['images_processed'] > 0:
                self.log(f"  ✓ 处理了 {result['images_processed']}/{result['images_found']} 张图片", 'SUCCESS')
            elif result['images_found'] == 0:
                self.log(f"  ⊘ 无图片", 'WARNING')

        return all_results

    def print_summary(self, results: List[Dict]):
        """打印处理摘要"""
        self.log("\n" + "=" * 80, 'INFO')
        self.log("处理摘要", 'INFO')
        self.log("=" * 80, 'INFO')
        self.log(f"处理的文件夹数: {self.stats['total_folders']}", 'INFO')
        self.log(f"找到的图片总数: {self.stats['total_images']}", 'INFO')
        self.log(f"重命名的图片: {self.stats['renamed']}", 'SUCCESS')
        self.log(f"转换的图片 (PNG→JPG): {self.stats['converted']}", 'SUCCESS')
        self.log(f"跳过的文件夹: {self.stats['skipped']}", 'WARNING')
        self.log(f"错误数量: {self.stats['errors']}", 'ERROR' if self.stats['errors'] > 0 else 'INFO')

        if self.dry_run:
            self.log("\n⚠️  这是预览模式，没有实际修改任何文件", 'WARNING')
            self.log("   移除 --dry-run 参数以执行实际操作", 'WARNING')

    def save_report(self, results: List[Dict], output_path: Path):
        """保存详细报告"""
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("苏州园林图片标准化处理报告\n")
                f.write("=" * 80 + "\n\n")
                f.write(f"处理时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"处理目录: {self.base_dir}\n")
                f.write(f"处理模式: {'预览模式' if self.dry_run else '实际处理'}\n\n")

                f.write("汇总统计:\n")
                f.write("-" * 80 + "\n")
                for key, value in self.stats.items():
                    f.write(f"{key}: {value}\n")
                f.write("\n")

                f.write("详细操作列表:\n")
                f.write("-" * 80 + "\n\n")

                for result in results:
                    f.write(f"文件夹: {result['folder_name']}\n")
                    f.write(f"  找到图片: {result['images_found']} 张\n")
                    f.write(f"  处理图片: {result['images_processed']} 张\n")

                    if result['operations']:
                        f.write(f"  操作详情:\n")
                        for op in result['operations']:
                            if op['action'] == 'keep':
                                continue  # 跳过未修改的文件
                            f.write(f"    {op['old_name']} -> {op['new_name']} [{op['action']}]\n")
                    f.write("\n")

                f.write("\n处理日志:\n")
                f.write("-" * 80 + "\n")
                for msg in self.log_messages:
                    f.write(msg + "\n")

            self.log(f"\n详细报告已保存到: {output_path}", 'SUCCESS')

        except Exception as e:
            self.log(f"保存报告失败: {e}", 'ERROR')


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='苏州园林图片统一命名和格式转换脚本',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 预览操作（不修改文件）
  python scripts/normalize_images.py --dry-run

  # 实际处理（带备份）
  python scripts/normalize_images.py --backup

  # 实际处理（不备份，高质量）
  python scripts/normalize_images.py --quality 95
        """
    )

    parser.add_argument('--dry-run', action='store_true',
                       help='仅预览操作，不实际修改文件')
    parser.add_argument('--backup', action='store_true',
                       help='在处理前备份原始文件')
    parser.add_argument('--quality', type=int, default=85, choices=range(1, 101),
                       help='JPG压缩质量 (1-100, 默认85)', metavar='N')
    parser.add_argument('--dir', type=str, default='public/dataset/images',
                       help='图片目录路径（默认: public/dataset/images）')

    args = parser.parse_args()

    # 检查Pillow库
    if not PIL_AVAILABLE and not args.dry_run:
        print("\n❌ 错误: 未安装 Pillow 库，无法进行格式转换")
        print("   请运行: pip install Pillow\n")
        sys.exit(1)

    # 确定项目根目录
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    images_dir = project_root / args.dir

    # 确认操作
    if not args.dry_run:
        print("\n⚠️  警告: 此操作将修改图片文件！")
        if args.backup:
            print("   已启用备份功能，原始文件将被保存。")
        else:
            print("   未启用备份功能，建议先运行 --dry-run 预览。")

        response = input("\n是否继续？(y/N): ")
        if response.lower() != 'y':
            print("操作已取消。")
            sys.exit(0)

    # 执行处理
    normalizer = ImageNormalizer(
        base_dir=images_dir,
        dry_run=args.dry_run,
        backup=args.backup,
        quality=args.quality
    )

    results = normalizer.process_all()
    normalizer.print_summary(results)

    # 保存报告
    report_dir = project_root / 'logs'
    report_dir.mkdir(exist_ok=True)
    report_file = report_dir / f"image_normalization_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    normalizer.save_report(results, report_file)

    print("\n✅ 处理完成！")


if __name__ == '__main__':
    main()
