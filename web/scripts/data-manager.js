/**
 * 数据管理模块 - 负责加载和处理苏州园林CSV数据
 * @author SOLO Coding
 * @version 1.0.0
 */

class DataManager {
    constructor() {
        this.rawData = [];
        this.processedData = [];
        this.isLoaded = false;
        this.loadingCallbacks = [];
    }

    /**
     * 加载CSV数据
     * @param {string} csvPath - CSV文件路径
     * @returns {Promise<Array>} 处理后的数据数组
     */
    async loadCSV(csvPath = 'SuzhouGardenListFull.csv') {
        try {
            console.log('开始加载数据...');
            
            // 使用D3加载CSV数据
            this.rawData = await d3.csv(csvPath);
            console.log(`成功加载 ${this.rawData.length} 条园林数据`);
            
            // 处理数据
            this.processedData = this.processData(this.rawData);
            this.isLoaded = true;
            
            // 执行加载完成回调
            this.loadingCallbacks.forEach(callback => callback(this.processedData));
            this.loadingCallbacks = [];
            
            return this.processedData;
        } catch (error) {
            console.error('数据加载失败:', error);
            throw error;
        }
    }

    /**
     * 处理原始CSV数据
     * @param {Array} rawData - 原始数据
     * @returns {Array} 处理后的数据
     */
    processData(rawData) {
        return rawData.map((item, index) => {
            // 清理和标准化数据
            const processed = {
                id: index + 1,
                name: this.cleanString(item['名称']),
                district: this.cleanString(item['区县']),
                address: this.cleanString(item['地址']),
                constructionEra: this.cleanString(item['建造年代']),
                area: this.parseArea(item['面积（㎡）']),
                ownershipType: this.cleanString(item['权属性质']),
                managementUnit: this.cleanString(item['管理单位']),
                protectionStatus: this.cleanString(item['保护状况']),
                openStatus: this.cleanString(item['开放情况']),
                currentUse: this.cleanString(item['当前用途']),
                description: this.cleanString(item['描述']),
                longitude: this.parseCoordinate(item['经度']),
                latitude: this.parseCoordinate(item['纬度']),
                protectionLevel: this.standardizeProtectionLevel(item['文保单位级别']),
                worldHeritage: this.parseWorldHeritage(item['世界遗产']),
                batch: this.parseBatch(item['公布批次'])
            };

            // 添加派生字段
            processed.hasCoordinates = !!(processed.longitude && processed.latitude);
            processed.areaCategory = this.categorizeArea(processed.area);
            processed.eraCategory = this.categorizeEra(processed.constructionEra);
            
            return processed;
        }).filter(item => item.name); // 过滤掉名称为空的记录
    }

    /**
     * 清理字符串数据
     * @param {string} str - 原始字符串
     * @returns {string} 清理后的字符串
     */
    cleanString(str) {
        if (!str || str === 'null' || str === 'undefined') return '';
        return str.toString().trim();
    }

    /**
     * 解析面积数据
     * @param {string} areaStr - 面积字符串
     * @returns {number|null} 面积数值
     */
    parseArea(areaStr) {
        if (!areaStr || areaStr === 'null' || areaStr === 'undefined') return null;
        const cleaned = areaStr.toString().replace(/[^\d.]/g, '');
        const area = parseFloat(cleaned);
        return isNaN(area) ? null : area;
    }

    /**
     * 解析坐标数据
     * @param {string} coordStr - 坐标字符串
     * @returns {number|null} 坐标数值
     */
    parseCoordinate(coordStr) {
        if (!coordStr || coordStr === 'null' || coordStr === 'undefined') return null;
        const coord = parseFloat(coordStr);
        return isNaN(coord) ? null : coord;
    }

    /**
     * 标准化文保级别
     * @param {string} level - 原始级别
     * @returns {string} 标准化级别
     */
    standardizeProtectionLevel(level) {
        if (!level || level === 'null' || level === 'undefined') return '无';
        const cleaned = level.toString().trim();
        
        if (cleaned.includes('全国')) return '全国';
        if (cleaned.includes('省级')) return '省级';
        if (cleaned.includes('市级')) return '市级';
        if (cleaned.includes('县级')) return '县级';
        if (cleaned === '' || cleaned === '无') return '无';
        
        return cleaned;
    }

    /**
     * 解析世界遗产状态
     * @param {string} heritage - 世界遗产字符串
     * @returns {boolean} 是否为世界遗产
     */
    parseWorldHeritage(heritage) {
        if (!heritage) return false;
        const str = heritage.toString().toLowerCase().trim();
        return str === '是' || str === 'true' || str === '1' || str.includes('世界遗产');
    }

    /**
     * 解析公布批次
     * @param {string} batchStr - 批次字符串
     * @returns {number|null} 批次数字
     */
    parseBatch(batchStr) {
        if (!batchStr || batchStr === 'null' || batchStr === 'undefined') return null;
        const batch = parseInt(batchStr.toString().replace(/[^\d]/g, ''));
        return isNaN(batch) ? null : batch;
    }

    /**
     * 面积分类
     * @param {number} area - 面积
     * @returns {string} 面积类别
     */
    categorizeArea(area) {
        if (!area) return '未知';
        if (area < 1000) return '小型';
        if (area < 5000) return '中型';
        if (area < 20000) return '大型';
        return '超大型';
    }

    /**
     * 建造年代分类
     * @param {string} era - 建造年代
     * @returns {string} 年代类别
     */
    categorizeEra(era) {
        if (!era) return '未知';
        const eraStr = era.toLowerCase();
        
        if (eraStr.includes('明') || eraStr.includes('ming')) return '明代';
        if (eraStr.includes('清') || eraStr.includes('qing')) return '清代';
        if (eraStr.includes('民国') || eraStr.includes('republic')) return '民国';
        if (eraStr.includes('现代') || eraStr.includes('当代')) return '现代';
        
        // 尝试提取年份
        const yearMatch = era.match(/(\d{4})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            if (year < 1368) return '元代及以前';
            if (year < 1644) return '明代';
            if (year < 1912) return '清代';
            if (year < 1949) return '民国';
            return '现代';
        }
        
        return '未知';
    }

    /**
     * 获取统计数据
     * @returns {Object} 统计信息
     */
    getStatistics() {
        if (!this.isLoaded) return null;

        const stats = {
            total: this.processedData.length,
            worldHeritage: this.processedData.filter(d => d.worldHeritage).length,
            protectionLevels: {},
            districts: {},
            batches: {},
            eras: {},
            areas: {}
        };

        // 统计各维度数据
        this.processedData.forEach(item => {
            // 文保级别统计
            const level = item.protectionLevel || '无';
            stats.protectionLevels[level] = (stats.protectionLevels[level] || 0) + 1;

            // 地区统计
            const district = item.district || '未知';
            stats.districts[district] = (stats.districts[district] || 0) + 1;

            // 批次统计
            if (item.batch) {
                stats.batches[item.batch] = (stats.batches[item.batch] || 0) + 1;
            }

            // 年代统计
            const era = item.eraCategory || '未知';
            stats.eras[era] = (stats.eras[era] || 0) + 1;

            // 面积统计
            const areaCategory = item.areaCategory || '未知';
            stats.areas[areaCategory] = (stats.areas[areaCategory] || 0) + 1;
        });

        return stats;
    }

    /**
     * 根据条件筛选数据
     * @param {Object} filters - 筛选条件
     * @returns {Array} 筛选后的数据
     */
    filterData(filters = {}) {
        if (!this.isLoaded) return [];

        return this.processedData.filter(item => {
            // 文保级别筛选
            if (filters.protectionLevel && filters.protectionLevel !== 'all') {
                if (item.protectionLevel !== filters.protectionLevel) return false;
            }

            // 地区筛选
            if (filters.district && filters.district !== 'all') {
                if (item.district !== filters.district) return false;
            }

            // 批次筛选
            if (filters.batch && filters.batch !== 'all') {
                if (item.batch !== parseInt(filters.batch)) return false;
            }

            // 世界遗产筛选
            if (filters.heritage && filters.heritage !== 'all') {
                const isHeritage = filters.heritage === 'true';
                if (item.worldHeritage !== isHeritage) return false;
            }

            return true;
        });
    }

    /**
     * 获取唯一值列表
     * @param {string} field - 字段名
     * @returns {Array} 唯一值数组
     */
    getUniqueValues(field) {
        if (!this.isLoaded) return [];
        
        const values = this.processedData
            .map(item => item[field])
            .filter(value => value !== null && value !== undefined && value !== '')
            .filter((value, index, array) => array.indexOf(value) === index)
            .sort();
            
        return values;
    }

    /**
     * 注册数据加载完成回调
     * @param {Function} callback - 回调函数
     */
    onDataLoaded(callback) {
        if (this.isLoaded) {
            callback(this.processedData);
        } else {
            this.loadingCallbacks.push(callback);
        }
    }

    /**
     * 获取处理后的数据
     * @returns {Array} 处理后的数据数组
     */
    getData() {
        return this.processedData;
    }

    /**
     * 检查数据是否已加载
     * @returns {boolean} 是否已加载
     */
    isDataLoaded() {
        return this.isLoaded;
    }
}

// 创建全局数据管理器实例
window.dataManager = new DataManager();