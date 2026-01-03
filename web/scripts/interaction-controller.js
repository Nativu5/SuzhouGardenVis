/**
 * 交互控制模块 - 处理图表间联动交互
 * @author SOLO Coding
 * @version 1.0.0
 */

class InteractionController {
    constructor() {
        this.selectedElements = new Map();
        this.highlightedData = null;
        this.isInteractionEnabled = true;
        this.eventListeners = [];
        
        this.initializeEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 监听图表元素点击事件
        document.addEventListener('chartElementClick', (event) => {
            if (this.isInteractionEnabled) {
                this.handleChartElementClick(event.detail);
            }
        });

        // 监听数据筛选事件
        document.addEventListener('dataFiltered', (event) => {
            this.handleDataFiltered(event.detail);
        });

        // 监听窗口大小变化，重新调整图表
        window.addEventListener('resize', this.debounce(() => {
            this.handleWindowResize();
        }, 300));

        // 监听键盘事件
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardEvent(event);
        });
    }

    /**
     * 处理图表元素点击事件
     * @param {Object} detail - 事件详情
     */
    handleChartElementClick(detail) {
        const { chartType, data, element } = detail;
        
        console.log(`图表元素被点击: ${chartType}`, data);

        // 更新选中状态
        this.updateSelection(chartType, data, element);

        // 执行联动交互
        this.performCrossChartInteraction(chartType, data);

        // 更新筛选器状态
        this.updateFilterState(chartType, data);

        // 触发自定义事件
        this.dispatchInteractionEvent('elementSelected', {
            chartType,
            data,
            selectedElements: this.selectedElements
        });
    }

    /**
     * 更新选中状态
     * @param {string} chartType - 图表类型
     * @param {Object} data - 数据对象
     * @param {Element} element - DOM元素
     */
    updateSelection(chartType, data, element) {
        // 清除之前的选中状态
        this.clearPreviousSelection(chartType);

        // 设置新的选中状态
        this.selectedElements.set(chartType, { data, element });

        // 添加视觉反馈
        d3.select(element)
            .classed('selected', true)
            .style('stroke', '#1f4e79')
            .style('stroke-width', '3px');
    }

    /**
     * 清除之前的选中状态
     * @param {string} currentChartType - 当前图表类型
     */
    clearPreviousSelection(currentChartType) {
        if (this.selectedElements.has(currentChartType)) {
            const previous = this.selectedElements.get(currentChartType);
            d3.select(previous.element)
                .classed('selected', false)
                .style('stroke', null)
                .style('stroke-width', null);
        }
    }

    /**
     * 执行跨图表交互
     * @param {string} sourceChartType - 源图表类型
     * @param {Object} sourceData - 源数据
     */
    performCrossChartInteraction(sourceChartType, sourceData) {
        // 根据源图表类型确定交互逻辑
        switch (sourceChartType) {
            case 'protectionLevel':
                this.highlightByProtectionLevel(sourceData.level);
                break;
            case 'district':
                this.highlightByDistrict(sourceData.district);
                break;
            case 'batch':
                this.highlightByBatch(sourceData.batchNum || sourceData.batch);
                break;
            case 'heritage':
                this.highlightByHeritage(sourceData.type === '世界遗产');
                break;
            case 'era':
                this.highlightByEra(sourceData.era);
                break;
            case 'area':
                this.highlightByArea(sourceData.areaCategory);
                break;
        }
    }

    /**
     * 根据文保级别高亮相关数据
     * @param {string} level - 文保级别
     */
    highlightByProtectionLevel(level) {
        const relatedData = window.dataManager.filterData({ protectionLevel: level });
        this.highlightRelatedElements(relatedData, 'protectionLevel', level);
        this.updateStatsPanelHighlight(relatedData);
    }

    /**
     * 根据地区高亮相关数据
     * @param {string} district - 地区
     */
    highlightByDistrict(district) {
        const relatedData = window.dataManager.filterData({ district: district });
        this.highlightRelatedElements(relatedData, 'district', district);
        this.updateStatsPanelHighlight(relatedData);
    }

    /**
     * 根据批次高亮相关数据
     * @param {number} batch - 批次
     */
    highlightByBatch(batch) {
        const batchNum = typeof batch === 'string' ? parseInt(batch.replace(/\D/g, '')) : batch;
        const relatedData = window.dataManager.filterData({ batch: batchNum.toString() });
        this.highlightRelatedElements(relatedData, 'batch', batch);
        this.updateStatsPanelHighlight(relatedData);
    }

    /**
     * 根据世界遗产状态高亮相关数据
     * @param {boolean} isHeritage - 是否为世界遗产
     */
    highlightByHeritage(isHeritage) {
        const relatedData = window.dataManager.filterData({ heritage: isHeritage.toString() });
        this.highlightRelatedElements(relatedData, 'heritage', isHeritage ? '世界遗产' : '非世界遗产');
        this.updateStatsPanelHighlight(relatedData);
    }

    /**
     * 根据年代高亮相关数据
     * @param {string} era - 年代
     */
    highlightByEra(era) {
        const relatedData = window.dataManager.getData().filter(d => d.eraCategory === era);
        this.highlightRelatedElements(relatedData, 'era', era);
        this.updateStatsPanelHighlight(relatedData);
    }

    /**
     * 根据面积类别高亮相关数据
     * @param {string} areaCategory - 面积类别
     */
    highlightByArea(areaCategory) {
        const relatedData = window.dataManager.getData().filter(d => d.areaCategory === areaCategory);
        this.highlightRelatedElements(relatedData, 'area', areaCategory);
        this.updateStatsPanelHighlight(relatedData);
    }

    /**
     * 高亮相关元素
     * @param {Array} relatedData - 相关数据
     * @param {string} sourceType - 源类型
     * @param {*} sourceValue - 源值
     */
    highlightRelatedElements(relatedData, sourceType, sourceValue) {
        this.highlightedData = relatedData;

        // 在所有图表中高亮相关元素
        Object.keys(window.chartManager.charts).forEach(chartType => {
            if (chartType !== sourceType) {
                this.highlightElementsInChart(chartType, relatedData);
            }
        });

        // 显示高亮信息
        this.showHighlightInfo(sourceType, sourceValue, relatedData.length);
    }

    /**
     * 在特定图表中高亮元素
     * @param {string} chartType - 图表类型
     * @param {Array} data - 要高亮的数据
     */
    highlightElementsInChart(chartType, data) {
        const chart = window.chartManager.getChart(chartType);
        if (!chart || !chart.svg) return;

        // 先重置所有元素
        chart.svg.selectAll('.bar, .dot, path')
            .style('opacity', 0.3)
            .classed('highlighted', false);

        // 根据图表类型高亮相应元素
        switch (chartType) {
            case 'protectionLevel':
                this.highlightProtectionLevelElements(chart, data);
                break;
            case 'district':
                this.highlightDistrictElements(chart, data);
                break;
            case 'batch':
                this.highlightBatchElements(chart, data);
                break;
            case 'heritage':
                this.highlightHeritageElements(chart, data);
                break;
            case 'era':
                this.highlightEraElements(chart, data);
                break;
            case 'area':
                this.highlightAreaElements(chart, data);
                break;
        }
    }

    /**
     * 高亮文保级别图表元素
     * @param {Object} chart - 图表对象
     * @param {Array} data - 数据
     */
    highlightProtectionLevelElements(chart, data) {
        const levelCounts = d3.rollup(data, v => v.length, d => d.protectionLevel || '无');
        
        chart.svg.selectAll('.bar')
            .style('opacity', d => levelCounts.has(d.level) ? 1 : 0.3)
            .classed('highlighted', d => levelCounts.has(d.level));
    }

    /**
     * 高亮地区图表元素
     * @param {Object} chart - 图表对象
     * @param {Array} data - 数据
     */
    highlightDistrictElements(chart, data) {
        const districtCounts = d3.rollup(data, v => v.length, d => d.district || '未知');
        
        chart.svg.selectAll('.bar')
            .style('opacity', d => districtCounts.has(d.district) ? 1 : 0.3)
            .classed('highlighted', d => districtCounts.has(d.district));
    }

    /**
     * 高亮批次图表元素
     * @param {Object} chart - 图表对象
     * @param {Array} data - 数据
     */
    highlightBatchElements(chart, data) {
        const batchCounts = d3.rollup(data.filter(d => d.batch), v => v.length, d => d.batch);
        
        chart.svg.selectAll('path')
            .style('opacity', d => batchCounts.has(d.data.batchNum) ? 1 : 0.3)
            .classed('highlighted', d => batchCounts.has(d.data.batchNum));
    }

    /**
     * 高亮世界遗产图表元素
     * @param {Object} chart - 图表对象
     * @param {Array} data - 数据
     */
    highlightHeritageElements(chart, data) {
        const heritageCount = data.filter(d => d.worldHeritage).length;
        const nonHeritageCount = data.filter(d => !d.worldHeritage).length;
        
        chart.svg.selectAll('.bar')
            .style('opacity', d => {
                if (d.type === '世界遗产' && heritageCount > 0) return 1;
                if (d.type === '非世界遗产' && nonHeritageCount > 0) return 1;
                return 0.3;
            })
            .classed('highlighted', d => {
                if (d.type === '世界遗产' && heritageCount > 0) return true;
                if (d.type === '非世界遗产' && nonHeritageCount > 0) return true;
                return false;
            });
    }

    /**
     * 高亮年代图表元素
     * @param {Object} chart - 图表对象
     * @param {Array} data - 数据
     */
    highlightEraElements(chart, data) {
        const eraSet = new Set(data.map(d => d.eraCategory || '未知'));
        
        chart.svg.selectAll('.era-segment')
            .style('opacity', d => eraSet.has(d.data.era) ? 1 : 0.15)
            .classed('highlighted', d => eraSet.has(d.data.era));
    }

    /**
     * 高亮面积图表元素
     * @param {Object} chart - 图表对象
     * @param {Array} data - 数据
     */
    highlightAreaElements(chart, data) {
        const dataIds = new Set(data.map(d => d.id));
        
        chart.svg.selectAll('.dot')
            .style('opacity', d => dataIds.has(d.id) ? 1 : 0.3)
            .classed('highlighted', d => dataIds.has(d.id));
    }

    /**
     * 更新统计面板高亮
     * @param {Array} data - 高亮数据
     */
    updateStatsPanelHighlight(data) {
        const stats = {
            total: data.length,
            worldHeritage: data.filter(d => d.worldHeritage).length,
            national: data.filter(d => d.protectionLevel === '全国').length,
            provincial: data.filter(d => d.protectionLevel === '省级').length,
            municipal: data.filter(d => d.protectionLevel === '市级').length
        };

        // 更新统计卡片
        d3.select('#total-gardens').text(stats.total);
        d3.select('#world-heritage').text(stats.worldHeritage);
        d3.select('#national-level').text(stats.national);
        d3.select('#provincial-level').text(stats.provincial);
        d3.select('#municipal-level').text(stats.municipal);

        // 添加高亮效果
        d3.selectAll('.stat-card')
            .classed('highlighted', true)
            .style('background-color', '#e3f2fd');
    }

    /**
     * 显示高亮信息
     * @param {string} type - 类型
     * @param {*} value - 值
     * @param {number} count - 数量
     */
    showHighlightInfo(type, value, count) {
        const infoPanel = d3.select('body').select('.highlight-info');
        
        if (infoPanel.empty()) {
            const info = d3.select('body').append('div')
                .attr('class', 'highlight-info')
                .style('position', 'fixed')
                .style('top', '10px')
                .style('right', '10px')
                .style('background', 'rgba(31, 78, 121, 0.9)')
                .style('color', 'white')
                .style('padding', '10px 15px')
                .style('border-radius', '6px')
                .style('font-size', '14px')
                .style('z-index', '1001')
                .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
                .style('opacity', '0');

            info.transition()
                .duration(300)
                .style('opacity', '1');
        }

        d3.select('.highlight-info')
            .html(`
                <div><strong>当前选择:</strong> ${this.getDisplayName(type, value)}</div>
                <div><strong>相关园林:</strong> ${count} 个</div>
                <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">点击其他区域清除高亮</div>
            `);

        // 5秒后自动隐藏
        setTimeout(() => {
            this.hideHighlightInfo();
        }, 5000);
    }

    /**
     * 获取显示名称
     * @param {string} type - 类型
     * @param {*} value - 值
     * @returns {string} 显示名称
     */
    getDisplayName(type, value) {
        const typeNames = {
            protectionLevel: '文保级别',
            district: '地区',
            batch: '公布批次',
            heritage: '世界遗产',
            era: '建造年代',
            area: '面积类别'
        };

        return `${typeNames[type] || type}: ${value}`;
    }

    /**
     * 隐藏高亮信息
     */
    hideHighlightInfo() {
        const info = d3.select('.highlight-info');
        if (!info.empty()) {
            info.transition()
                .duration(300)
                .style('opacity', '0')
                .on('end', function() {
                    d3.select(this).remove();
                });
        }
    }

    /**
     * 处理数据筛选事件
     * @param {Object} detail - 筛选详情
     */
    handleDataFiltered(detail) {
        const { filteredData, filters } = detail;
        
        // 清除之前的高亮
        this.clearAllHighlights();
        
        // 更新图表数据
        window.chartManager.updateCharts(filteredData);
        
        // 更新统计面板
        this.updateStatsPanelHighlight(filteredData);
    }

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        if (window.dataManager.isDataLoaded()) {
            const currentData = this.highlightedData || window.dataManager.getData();
            window.chartManager.updateCharts(currentData);
        }
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyboardEvent(event) {
        switch (event.key) {
            case 'Escape':
                this.clearAllHighlights();
                this.hideHighlightInfo();
                break;
            case 'r':
            case 'R':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.resetAllInteractions();
                }
                break;
        }
    }

    /**
     * 更新筛选器状态
     * @param {string} chartType - 图表类型
     * @param {Object} data - 数据
     */
    updateFilterState(chartType, data) {
        // 根据图表类型更新对应的筛选器
        switch (chartType) {
            case 'protectionLevel':
                d3.select('#protection-level-filter').property('value', data.level);
                break;
            case 'district':
                d3.select('#district-filter').property('value', data.district);
                break;
            case 'batch':
                const batchValue = typeof data.batch === 'string' ? 
                    data.batch.replace(/\D/g, '') : data.batchNum;
                d3.select('#batch-filter').property('value', batchValue);
                break;
            case 'heritage':
                const heritageValue = data.type === '世界遗产' ? 'true' : 'false';
                d3.select('#heritage-filter').property('value', heritageValue);
                break;
        }
    }

    /**
     * 清除所有高亮
     */
    clearAllHighlights() {
        // 清除图表高亮
        window.chartManager.clearHighlights();
        
        // 清除选中状态
        this.selectedElements.clear();
        
        // 重置统计面板
        this.resetStatsPanel();
        
        // 重置所有图表元素样式
        Object.keys(window.chartManager.charts).forEach(chartType => {
            const chart = window.chartManager.getChart(chartType);
            if (chart && chart.svg) {
                chart.svg.selectAll('.bar, .dot, path')
                    .style('opacity', 1)
                    .classed('highlighted', false)
                    .classed('selected', false)
                    .style('stroke', null)
                    .style('stroke-width', null);
            }
        });

        this.highlightedData = null;
        this.hideHighlightInfo();
    }

    /**
     * 重置统计面板
     */
    resetStatsPanel() {
        if (window.dataManager.isDataLoaded()) {
            const stats = window.dataManager.getStatistics();
            
            d3.select('#total-gardens').text(stats.total);
            d3.select('#world-heritage').text(stats.worldHeritage);
            d3.select('#national-level').text(stats.protectionLevels['全国'] || 0);
            d3.select('#provincial-level').text(stats.protectionLevels['省级'] || 0);
            d3.select('#municipal-level').text(stats.protectionLevels['市级'] || 0);
        }

        d3.selectAll('.stat-card')
            .classed('highlighted', false)
            .style('background-color', null);
    }

    /**
     * 重置所有交互
     */
    resetAllInteractions() {
        this.clearAllHighlights();
        
        // 重置筛选器
        if (window.filterManager) {
            window.filterManager.resetFilters();
        }
        
        // 重新加载原始数据
        if (window.dataManager.isDataLoaded()) {
            const originalData = window.dataManager.getData();
            window.chartManager.updateCharts(originalData);
            this.updateStatsPanelHighlight(originalData);
        }
    }

    /**
     * 启用/禁用交互
     * @param {boolean} enabled - 是否启用
     */
    setInteractionEnabled(enabled) {
        this.isInteractionEnabled = enabled;
        
        if (!enabled) {
            this.clearAllHighlights();
        }
    }

    /**
     * 触发自定义交互事件
     * @param {string} eventType - 事件类型
     * @param {Object} detail - 事件详情
     */
    dispatchInteractionEvent(eventType, detail) {
        const event = new CustomEvent(`interaction${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`, {
            detail: detail
        });
        document.dispatchEvent(event);
    }

    /**
     * 防抖函数
     * @param {Function} func - 要防抖的函数
     * @param {number} wait - 等待时间
     * @returns {Function} 防抖后的函数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 销毁交互控制器
     */
    destroy() {
        // 移除事件监听器
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        
        this.clearAllHighlights();
        this.hideHighlightInfo();
        this.selectedElements.clear();
    }
}

// 创建全局交互控制器实例
window.interactionController = new InteractionController();
