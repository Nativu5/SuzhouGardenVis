/**
 * 主控制模块 - 协调各模块工作和初始化系统
 * @author SOLO Coding
 * @version 1.0.0
 */

class MainController {
    constructor() {
        this.dataManager = null;
        this.chartManager = null;
        this.interactionController = null;
        this.filterManager = null;
        
        this.isInitialized = false;
        this.loadingElement = null;
        this.errorElement = null;
        
        this.init();
    }

    /**
     * 初始化系统
     */
    async init() {
        try {
            console.log('🚀 苏州园林数据可视化系统启动中...');
            
            // 显示加载状态
            this.showLoading();
            
            // 等待DOM完全加载
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // 初始化各个模块
            await this.initializeModules();
            
            // 加载数据
            await this.loadData();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 初始化图表
            await this.initializeCharts();
            
            // 隐藏加载状态
            this.hideLoading();
            
            // 标记为已初始化
            this.isInitialized = true;
            
            console.log('✅ 系统初始化完成');
            
            // 触发初始化完成事件
            this.dispatchInitializedEvent();
            
        } catch (error) {
            console.error('❌ 系统初始化失败:', error);
            this.showError('系统初始化失败: ' + error.message);
        }
    }

    /**
     * 初始化各个模块
     */
    async initializeModules() {
        console.log('📦 初始化模块...');
        
        // 检查依赖模块是否存在
        this.checkDependencies();
        
        // 初始化数据管理器
        if (typeof DataManager !== 'undefined') {
            this.dataManager = window.dataManager || new DataManager();
            window.dataManager = this.dataManager;
            console.log('✓ 数据管理模块已初始化');
        } else {
            throw new Error('DataManager 模块未找到');
        }
        
        // 初始化图表管理器
        if (typeof ChartManager !== 'undefined') {
            this.chartManager = window.chartManager || new ChartManager();
            window.chartManager = this.chartManager;
            console.log('✓ 图表管理模块已初始化');
        } else {
            throw new Error('ChartManager 模块未找到');
        }
        
        // 初始化交互控制器
        if (typeof InteractionController !== 'undefined') {
            this.interactionController = window.interactionController || new InteractionController();
            window.interactionController = this.interactionController;
            console.log('✓ 交互控制模块已初始化');
        } else {
            throw new Error('InteractionController 模块未找到');
        }
        
        // 筛选管理器已经通过全局变量初始化
        if (typeof window.filterManager !== 'undefined') {
            this.filterManager = window.filterManager;
            console.log('✓ 筛选管理模块已初始化');
        } else {
            throw new Error('FilterManager 模块未找到');
        }
    }

    /**
     * 检查依赖
     */
    checkDependencies() {
        const dependencies = [
            { name: 'D3.js', check: () => typeof d3 !== 'undefined' },
            { name: 'DataManager', check: () => typeof DataManager !== 'undefined' },
            { name: 'ChartManager', check: () => typeof ChartManager !== 'undefined' },
            { name: 'InteractionController', check: () => typeof InteractionController !== 'undefined' }
        ];

        const missing = dependencies.filter(dep => !dep.check());
        
        if (missing.length > 0) {
            const missingNames = missing.map(dep => dep.name).join(', ');
            throw new Error(`缺少依赖: ${missingNames}`);
        }
        
        console.log('✓ 所有依赖检查通过');
    }

    /**
     * 加载数据
     */
    async loadData() {
        console.log('📊 加载数据...');
        
        try {
            // 使用相对路径加载CSV数据
            const csvPath = 'SuzhouGardenListFull.csv';
            await this.dataManager.loadCSV(csvPath);
            
            const data = this.dataManager.getData();
            console.log(`✓ 数据加载完成，共 ${data.length} 条记录`);
            
            // 触发数据加载完成事件
            const event = new CustomEvent('dataLoaded', {
                detail: { data: data }
            });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('数据加载失败:', error);
            throw new Error(`数据加载失败: ${error.message}`);
        }
    }

    /**
     * 初始化图表
     */
    async initializeCharts() {
        console.log('📈 初始化图表...');
        
        try {
            const data = this.dataManager.getData();
            
            // 初始化所有图表
            await this.chartManager.initializeAllCharts(data);
            
            console.log('✓ 所有图表初始化完成');
            
        } catch (error) {
            console.error('图表初始化失败:', error);
            throw new Error(`图表初始化失败: ${error.message}`);
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        console.log('🔗 设置事件监听器...');
        
        // 监听数据筛选事件
        document.addEventListener('dataFiltered', (event) => {
            this.handleDataFiltered(event.detail);
        });
        
        // 监听筛选器重置事件
        document.addEventListener('filtersReset', (event) => {
            this.handleFiltersReset(event.detail);
        });
        
        // 监听图表交互事件
        document.addEventListener('chartInteraction', (event) => {
            this.handleChartInteraction(event.detail);
        });
        
        // 监听窗口大小变化
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleWindowResize();
            }, 250);
        });
        
        // 监听键盘事件
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardEvents(event);
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        console.log('✓ 事件监听器设置完成');
    }

    /**
     * 处理数据筛选事件
     * @param {Object} detail - 事件详情
     */
    handleDataFiltered(detail) {
        const { filteredData, filters, stats } = detail;
        
        console.log('🔍 数据筛选更新:', {
            总数: stats.total,
            筛选器: filters
        });
        
        // 更新图表数据
        if (this.chartManager) {
            this.chartManager.updateChartsWithFilteredData(filteredData);
        }
        
        // 更新交互状态
        if (this.interactionController) {
            this.interactionController.updateWithFilteredData(filteredData);
        }
    }

    /**
     * 处理筛选器重置事件
     * @param {Object} detail - 事件详情
     */
    handleFiltersReset(detail) {
        const { originalData } = detail;
        
        console.log('🔄 筛选器已重置');
        
        // 重置图表数据
        if (this.chartManager) {
            this.chartManager.updateChartsWithFilteredData(originalData);
        }
        
        // 重置交互状态
        if (this.interactionController) {
            this.interactionController.resetInteractions();
        }
    }

    /**
     * 处理图表交互事件
     * @param {Object} detail - 事件详情
     */
    handleChartInteraction(detail) {
        console.log('🎯 图表交互:', detail);
        
        // 这里可以添加额外的交互逻辑
        // 比如记录用户行为、更新URL参数等
    }

    /**
     * 处理窗口大小变化
     */
    handleWindowResize() {
        console.log('📐 窗口大小变化，重新调整图表');
        
        if (this.chartManager && this.isInitialized) {
            this.chartManager.resizeAllCharts();
        }
    }

    /**
     * 处理键盘事件
     * @param {KeyboardEvent} event - 键盘事件
     */
    handleKeyboardEvents(event) {
        // Ctrl/Cmd + R: 刷新数据
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            this.refreshData();
        }
        
        // Escape: 清除所有选择
        if (event.key === 'Escape') {
            if (this.interactionController) {
                this.interactionController.clearAllHighlights();
            }
        }
        
        // F11: 切换全屏模式
        if (event.key === 'F11') {
            event.preventDefault();
            this.toggleFullscreen();
        }
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('📱 页面隐藏，暂停动画');
            // 可以在这里暂停动画或减少更新频率
        } else {
            console.log('📱 页面显示，恢复动画');
            // 恢复动画或更新频率
        }
    }

    /**
     * 刷新数据
     */
    async refreshData() {
        console.log('🔄 刷新数据...');
        
        try {
            this.showLoading('正在刷新数据...');
            
            // 重新加载数据
            await this.loadData();
            
            // 重新初始化图表
            await this.initializeCharts();
            
            // 重置筛选器
            if (this.filterManager) {
                this.filterManager.resetFilters();
            }
            
            this.hideLoading();
            
            console.log('✅ 数据刷新完成');
            
        } catch (error) {
            console.error('❌ 数据刷新失败:', error);
            this.showError('数据刷新失败: ' + error.message);
        }
    }

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('无法进入全屏模式:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    /**
     * 显示加载状态
     * @param {string} message - 加载消息
     */
    showLoading(message = '正在加载...') {
        // 移除现有的加载元素
        this.hideLoading();
        
        this.loadingElement = document.createElement('div');
        this.loadingElement.className = 'loading-overlay';
        this.loadingElement.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        // 添加样式
        this.loadingElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
        `;
        
        document.body.appendChild(this.loadingElement);
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        if (this.loadingElement && this.loadingElement.parentNode) {
            this.loadingElement.parentNode.removeChild(this.loadingElement);
            this.loadingElement = null;
        }
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误消息
     */
    showError(message) {
        this.hideLoading();
        
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'error-overlay';
        this.errorElement.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-title">系统错误</div>
                <div class="error-message">${message}</div>
                <button class="error-retry" onclick="location.reload()">重新加载</button>
            </div>
        `;
        
        // 添加样式
        this.errorElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            text-align: center;
        `;
        
        document.body.appendChild(this.errorElement);
    }

    /**
     * 触发初始化完成事件
     */
    dispatchInitializedEvent() {
        const event = new CustomEvent('systemInitialized', {
            detail: {
                timestamp: new Date().toISOString(),
                modules: {
                    dataManager: !!this.dataManager,
                    chartManager: !!this.chartManager,
                    interactionController: !!this.interactionController,
                    filterManager: !!this.filterManager
                }
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * 获取系统状态
     * @returns {Object} 系统状态信息
     */
    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            modules: {
                dataManager: {
                    loaded: !!this.dataManager,
                    dataCount: this.dataManager ? this.dataManager.getData().length : 0
                },
                chartManager: {
                    loaded: !!this.chartManager,
                    chartsCount: this.chartManager ? Object.keys(this.chartManager.charts || {}).length : 0
                },
                interactionController: {
                    loaded: !!this.interactionController
                },
                filterManager: {
                    loaded: !!this.filterManager,
                    activeFilters: this.filterManager ? this.filterManager.getCurrentFilters() : {}
                }
            },
            performance: {
                loadTime: this.loadTime || 0,
                memoryUsage: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
                } : null
            }
        };
    }

    /**
     * 销毁系统
     */
    destroy() {
        console.log('🗑️ 销毁系统...');
        
        // 销毁各个模块
        if (this.filterManager && typeof this.filterManager.destroy === 'function') {
            this.filterManager.destroy();
        }
        
        if (this.interactionController && typeof this.interactionController.destroy === 'function') {
            this.interactionController.destroy();
        }
        
        if (this.chartManager && typeof this.chartManager.destroy === 'function') {
            this.chartManager.destroy();
        }
        
        if (this.dataManager && typeof this.dataManager.destroy === 'function') {
            this.dataManager.destroy();
        }
        
        // 清理DOM元素
        this.hideLoading();
        if (this.errorElement && this.errorElement.parentNode) {
            this.errorElement.parentNode.removeChild(this.errorElement);
        }
        
        // 重置状态
        this.isInitialized = false;
        
        console.log('✅ 系统销毁完成');
    }
}

// 添加加载和错误样式
const mainStyle = document.createElement('style');
mainStyle.textContent = `
    .loading-content {
        text-align: center;
        color: white;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    .loading-text {
        font-size: 16px;
        font-weight: 500;
    }
    
    .error-content {
        max-width: 400px;
        padding: 40px;
        background: rgba(30, 41, 59, 0.9);
        border-radius: 12px;
        border: 1px solid rgba(248, 113, 113, 0.3);
    }
    
    .error-icon {
        font-size: 48px;
        margin-bottom: 20px;
    }
    
    .error-title {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #f87171;
    }
    
    .error-message {
        font-size: 14px;
        margin-bottom: 24px;
        color: #cbd5e1;
        line-height: 1.5;
    }
    
    .error-retry {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .error-retry:hover {
        background: #2563eb;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(mainStyle);

// 创建全局主控制器实例并自动初始化
window.mainController = new MainController();

// 导出调试函数到全局作用域
window.getSystemStatus = () => window.mainController.getSystemStatus();
window.refreshData = () => window.mainController.refreshData();

console.log('🎉 苏州园林数据可视化系统已启动！');
console.log('💡 调试提示:');
console.log('  - 使用 getSystemStatus() 查看系统状态');
console.log('  - 使用 refreshData() 刷新数据');
console.log('  - 按 Escape 清除所有选择');
console.log('  - 按 Ctrl+R 刷新数据');
console.log('  - 按 F11 切换全屏模式');
