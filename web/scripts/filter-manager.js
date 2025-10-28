/**
 * 筛选管理模块 - 实现数据筛选功能
 * @author SOLO Coding
 * @version 1.0.0
 */

class FilterManager {
    constructor() {
        this.currentFilters = {
            protectionLevel: 'all',
            district: 'all',
            batch: 'all',
            heritage: 'all'
        };
        this.originalData = [];
        this.filteredData = [];
        this.filterElements = {};
        
        this.initializeFilterElements();
        this.setupEventListeners();
    }

    /**
     * 初始化筛选器元素
     */
    initializeFilterElements() {
        this.filterElements = {
            protectionLevel: document.getElementById('protection-level-filter'),
            district: document.getElementById('district-filter'),
            batch: document.getElementById('batch-filter'),
            heritage: document.getElementById('heritage-filter'),
            resetButton: document.getElementById('reset-filters')
        };

        // 检查元素是否存在
        Object.keys(this.filterElements).forEach(key => {
            if (!this.filterElements[key]) {
                console.warn(`筛选器元素未找到: ${key}`);
            }
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 文保级别筛选器
        if (this.filterElements.protectionLevel) {
            this.filterElements.protectionLevel.addEventListener('change', (event) => {
                this.updateFilter('protectionLevel', event.target.value);
            });
        }

        // 地区筛选器
        if (this.filterElements.district) {
            this.filterElements.district.addEventListener('change', (event) => {
                this.updateFilter('district', event.target.value);
            });
        }

        // 批次筛选器
        if (this.filterElements.batch) {
            this.filterElements.batch.addEventListener('change', (event) => {
                this.updateFilter('batch', event.target.value);
            });
        }

        // 世界遗产筛选器
        if (this.filterElements.heritage) {
            this.filterElements.heritage.addEventListener('change', (event) => {
                this.updateFilter('heritage', event.target.value);
            });
        }

        // 重置按钮
        if (this.filterElements.resetButton) {
            this.filterElements.resetButton.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // 监听数据加载完成事件
        document.addEventListener('dataLoaded', (event) => {
            this.initializeWithData(event.detail.data);
        });
    }

    /**
     * 使用数据初始化筛选器
     * @param {Array} data - 数据数组
     */
    initializeWithData(data) {
        this.originalData = data;
        this.filteredData = [...data];
        
        // 填充地区筛选器选项
        this.populateDistrictFilter(data);
        
        // 初始化筛选器状态
        this.applyFilters();
    }

    /**
     * 填充地区筛选器选项
     * @param {Array} data - 数据数组
     */
    populateDistrictFilter(data) {
        if (!this.filterElements.district) return;

        // 获取所有唯一地区
        const districts = [...new Set(data.map(d => d.district).filter(d => d))]
            .sort();

        // 清空现有选项（保留"全部地区"选项）
        const districtFilter = this.filterElements.district;
        while (districtFilter.children.length > 1) {
            districtFilter.removeChild(districtFilter.lastChild);
        }

        // 添加地区选项
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtFilter.appendChild(option);
        });
    }

    /**
     * 更新筛选器
     * @param {string} filterType - 筛选器类型
     * @param {string} value - 筛选值
     */
    updateFilter(filterType, value) {
        this.currentFilters[filterType] = value;
        this.applyFilters();
        
        // 触发筛选事件
        this.dispatchFilterEvent();
        
        // 记录筛选操作
        console.log(`筛选器更新: ${filterType} = ${value}`);
    }

    /**
     * 应用所有筛选器
     */
    applyFilters() {
        if (!this.originalData.length) return;

        this.filteredData = this.originalData.filter(item => {
            return this.passesAllFilters(item);
        });

        // 更新筛选结果显示
        this.updateFilterResultsDisplay();
        
        console.log(`筛选结果: ${this.filteredData.length}/${this.originalData.length} 个园林`);
    }

    /**
     * 检查数据项是否通过所有筛选器
     * @param {Object} item - 数据项
     * @returns {boolean} 是否通过筛选
     */
    passesAllFilters(item) {
        // 文保级别筛选
        if (this.currentFilters.protectionLevel !== 'all') {
            const itemLevel = item.protectionLevel || '无';
            if (itemLevel !== this.currentFilters.protectionLevel) {
                return false;
            }
        }

        // 地区筛选
        if (this.currentFilters.district !== 'all') {
            if (item.district !== this.currentFilters.district) {
                return false;
            }
        }

        // 批次筛选
        if (this.currentFilters.batch !== 'all') {
            const filterBatch = parseInt(this.currentFilters.batch);
            if (item.batch !== filterBatch) {
                return false;
            }
        }

        // 世界遗产筛选
        if (this.currentFilters.heritage !== 'all') {
            const isHeritage = this.currentFilters.heritage === 'true';
            if (item.worldHeritage !== isHeritage) {
                return false;
            }
        }

        return true;
    }

    /**
     * 更新筛选结果显示
     */
    updateFilterResultsDisplay() {
        // 更新统计面板
        this.updateStatsPanel();
        
        // 显示筛选状态
        this.showFilterStatus();
    }

    /**
     * 更新统计面板
     */
    updateStatsPanel() {
        const stats = this.calculateFilteredStats();
        
        // 更新各个统计数字
        const totalElement = document.getElementById('total-gardens');
        const heritageElement = document.getElementById('world-heritage');
        const nationalElement = document.getElementById('national-level');
        const provincialElement = document.getElementById('provincial-level');
        const municipalElement = document.getElementById('municipal-level');

        if (totalElement) totalElement.textContent = stats.total;
        if (heritageElement) heritageElement.textContent = stats.worldHeritage;
        if (nationalElement) nationalElement.textContent = stats.national;
        if (provincialElement) provincialElement.textContent = stats.provincial;
        if (municipalElement) municipalElement.textContent = stats.municipal;

        // 添加筛选状态样式
        const isFiltered = this.isAnyFilterActive();
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.toggle('filtered', isFiltered);
        });
    }

    /**
     * 计算筛选后的统计数据
     * @returns {Object} 统计数据
     */
    calculateFilteredStats() {
        return {
            total: this.filteredData.length,
            worldHeritage: this.filteredData.filter(d => d.worldHeritage).length,
            national: this.filteredData.filter(d => d.protectionLevel === '全国').length,
            provincial: this.filteredData.filter(d => d.protectionLevel === '省级').length,
            municipal: this.filteredData.filter(d => d.protectionLevel === '市级').length
        };
    }

    /**
     * 显示筛选状态
     */
    showFilterStatus() {
        const isFiltered = this.isAnyFilterActive();
        
        if (isFiltered) {
            this.showFilterIndicator();
        } else {
            this.hideFilterIndicator();
        }
    }

    /**
     * 显示筛选指示器
     */
    showFilterIndicator() {
        let indicator = document.querySelector('.filter-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'filter-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: #ff7f50;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                z-index: 1000;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                animation: slideIn 0.3s ease-out;
            `;
            document.body.appendChild(indicator);
        }

        const activeFilters = this.getActiveFiltersText();
        indicator.innerHTML = `
            <i class="filter-icon">🔍</i>
            <span>筛选中: ${activeFilters}</span>
            <button onclick="window.filterManager.resetFilters()" 
                    style="background:none;border:none;color:white;margin-left:8px;cursor:pointer;font-size:14px;">×</button>
        `;
    }

    /**
     * 隐藏筛选指示器
     */
    hideFilterIndicator() {
        const indicator = document.querySelector('.filter-indicator');
        if (indicator) {
            indicator.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }
    }

    /**
     * 获取活跃筛选器文本
     * @returns {string} 筛选器描述文本
     */
    getActiveFiltersText() {
        const activeFilters = [];
        
        if (this.currentFilters.protectionLevel !== 'all') {
            activeFilters.push(`级别:${this.currentFilters.protectionLevel}`);
        }
        
        if (this.currentFilters.district !== 'all') {
            activeFilters.push(`地区:${this.currentFilters.district}`);
        }
        
        if (this.currentFilters.batch !== 'all') {
            activeFilters.push(`批次:第${this.currentFilters.batch}批`);
        }
        
        if (this.currentFilters.heritage !== 'all') {
            const heritageText = this.currentFilters.heritage === 'true' ? '世界遗产' : '非世界遗产';
            activeFilters.push(heritageText);
        }

        return activeFilters.join(', ') || '无';
    }

    /**
     * 检查是否有任何筛选器处于活跃状态
     * @returns {boolean} 是否有活跃筛选器
     */
    isAnyFilterActive() {
        return Object.values(this.currentFilters).some(value => value !== 'all');
    }

    /**
     * 重置所有筛选器
     */
    resetFilters() {
        // 重置筛选器状态
        this.currentFilters = {
            protectionLevel: 'all',
            district: 'all',
            batch: 'all',
            heritage: 'all'
        };

        // 重置UI元素
        Object.keys(this.filterElements).forEach(key => {
            if (key !== 'resetButton' && this.filterElements[key]) {
                this.filterElements[key].value = 'all';
            }
        });

        // 应用重置后的筛选器
        this.applyFilters();
        
        // 触发重置事件
        this.dispatchResetEvent();
        
        // 隐藏筛选指示器
        this.hideFilterIndicator();
        
        console.log('筛选器已重置');
    }

    /**
     * 触发筛选事件
     */
    dispatchFilterEvent() {
        const event = new CustomEvent('dataFiltered', {
            detail: {
                filteredData: this.filteredData,
                filters: { ...this.currentFilters },
                stats: this.calculateFilteredStats()
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 触发重置事件
     */
    dispatchResetEvent() {
        const event = new CustomEvent('filtersReset', {
            detail: {
                originalData: this.originalData,
                filters: { ...this.currentFilters }
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取当前筛选的数据
     * @returns {Array} 筛选后的数据
     */
    getFilteredData() {
        return this.filteredData;
    }

    /**
     * 获取当前筛选器状态
     * @returns {Object} 筛选器状态
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * 设置筛选器值（程序化设置）
     * @param {Object} filters - 筛选器配置
     */
    setFilters(filters) {
        Object.keys(filters).forEach(key => {
            if (this.currentFilters.hasOwnProperty(key)) {
                this.currentFilters[key] = filters[key];
                
                // 更新对应的UI元素
                if (this.filterElements[key]) {
                    this.filterElements[key].value = filters[key];
                }
            }
        });

        this.applyFilters();
        this.dispatchFilterEvent();
    }

    /**
     * 添加高级筛选功能
     * @param {Function} customFilter - 自定义筛选函数
     */
    addCustomFilter(customFilter) {
        if (typeof customFilter !== 'function') {
            console.error('自定义筛选器必须是一个函数');
            return;
        }

        this.filteredData = this.filteredData.filter(customFilter);
        this.updateFilterResultsDisplay();
        this.dispatchFilterEvent();
    }

    /**
     * 获取筛选统计信息
     * @returns {Object} 筛选统计
     */
    getFilterStats() {
        return {
            total: this.originalData.length,
            filtered: this.filteredData.length,
            percentage: this.originalData.length > 0 ? 
                Math.round((this.filteredData.length / this.originalData.length) * 100) : 0,
            activeFilters: this.getActiveFiltersText(),
            isFiltered: this.isAnyFilterActive()
        };
    }

    /**
     * 导出筛选结果
     * @param {string} format - 导出格式 ('json' | 'csv')
     * @returns {string} 导出数据
     */
    exportFilteredData(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.filteredData, null, 2);
        } else if (format === 'csv') {
            if (this.filteredData.length === 0) return '';
            
            const headers = Object.keys(this.filteredData[0]);
            const csvContent = [
                headers.join(','),
                ...this.filteredData.map(row => 
                    headers.map(header => `"${row[header] || ''}"`).join(',')
                )
            ].join('\n');
            
            return csvContent;
        }
        
        throw new Error('不支持的导出格式');
    }

    /**
     * 销毁筛选管理器
     */
    destroy() {
        // 移除事件监听器
        Object.keys(this.filterElements).forEach(key => {
            if (this.filterElements[key] && this.filterElements[key].removeEventListener) {
                // 这里需要保存原始的事件处理器引用才能正确移除
                // 简化处理：直接清空
                this.filterElements[key].onchange = null;
                this.filterElements[key].onclick = null;
            }
        });

        // 清理数据
        this.originalData = [];
        this.filteredData = [];
        this.currentFilters = {};
        
        // 隐藏筛选指示器
        this.hideFilterIndicator();
    }
}

// 添加CSS动画样式
const filterStyle = document.createElement('style');
filterStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .stat-card.filtered {
        border-left: 4px solid #ff7f50;
        background: linear-gradient(135deg, #fff 0%, #fff8f5 100%);
    }
    
    .filter-indicator .filter-icon {
        margin-right: 4px;
    }
`;
document.head.appendChild(filterStyle);

// 创建全局筛选管理器实例
window.filterManager = new FilterManager();