/**
 * 图表管理器 - 负责创建和管理所有数据可视化图表
 */
class ChartManager {
    constructor() {
        this.charts = {};
        this.data = null;
        this.margins = { top: 20, right: 30, bottom: 40, left: 50 };
        this.colorSchemes = {
            primary: ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'],
            protection: {
                '全国': '#e74c3c',
                '省级': '#f39c12', 
                '市级': '#3498db',
                '县级': '#2ecc71',
                '无': '#95a5a6'
            },
            heritage: {
                '世界文化遗产': '#8e44ad',
                '全国重点文物保护单位': '#e74c3c',
                '省级文物保护单位': '#f39c12',
                '市级文物保护单位': '#3498db',
                '县级文物保护单位': '#2ecc71',
                '一般不可移动文物': '#95a5a6',
                '未定级': '#bdc3c7'
            }
        };
    }

    /**
     * 初始化所有图表
     * @param {Array} data - 数据数组
     */
    async initializeAllCharts(data) {
        this.data = data;
        
        // 创建各个图表
        this.createProtectionLevelChart(data);
        this.createDistrictProtectionChart(data);
        this.createBatchChart(data);
        this.createHeritageChart(data);
        this.createEraChart(data);
        this.createAreaChart(data);
    }

    /**
     * 初始化所有图表（保持向后兼容）
     * @param {Array} data - 数据数组
     */
    initializeCharts(data) {
        return this.initializeAllCharts(data);
    }

    /**
     * 创建文保级别分布饼图
     * @param {Array} data - 数据数组
     */
    createProtectionLevelChart(data) {
        const containerId = '#protection-level-chart';
        const container = d3.select(containerId);
        container.selectAll('*').remove();

        // 统计数据
        const protectionCounts = d3.rollup(data, v => v.length, d => d.protectionLevel || '未定级');
        const chartData = Array.from(protectionCounts, ([level, count]) => ({ level, count }));

        // 设置尺寸
        const containerRect = container.node().getBoundingClientRect();
        const width = Math.min(containerRect.width, 400);
        const height = 300;
        const radius = Math.min(width, height) / 2 - 20;

        // 创建SVG
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width/2},${height/2})`);

        // 创建饼图布局
        const pie = d3.pie()
            .value(d => d.count)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const labelArc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius * 0.6);

        // 创建扇形
        const arcs = g.selectAll('.arc')
            .data(pie(chartData))
            .enter().append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => this.colorSchemes.protection[d.data.level] || '#95a5a6')
            .style('cursor', 'pointer')
            .transition()
            .duration(800)
            .attrTween('d', function(d) {
                const interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
                return function(t) {
                    return arc(interpolate(t));
                };
            });

        // 添加标签
        arcs.append('text')
            .attr('transform', d => `translate(${labelArc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(d => d.data.count > 0 ? d.data.count : '');

        // 添加图例
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 120}, 20)`);

        const legendItems = legend.selectAll('.legend-item')
            .data(chartData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);

        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => this.colorSchemes.protection[d.level] || '#95a5a6');

        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .style('font-size', '12px')
            .text(d => `${d.level} (${d.count})`);

        // 添加交互
        this.addTooltip(arcs.select('path'), d => `${d.data.level}: ${d.data.count}个园林`);
        this.addClickHandler(arcs.select('path'), 'protection');

        this.charts.protection = { svg, data: chartData, type: 'pie' };
    }

    /**
     * 创建出版批次折线图
     * @param {Array} data - 数据数组
     */
    createBatchChart(data) {
        const containerId = '#batch-chart';
        const container = d3.select(containerId);
        container.selectAll('*').remove();

        // 统计数据 - 按出版批次分组
        const batchCounts = d3.rollup(data, v => v.length, d => d.batch || '未知');
        const chartData = Array.from(batchCounts, ([batch, count]) => ({ batch, count }))
            .sort((a, b) => {
                // 尝试按数字排序，如果不是数字则按字符串排序
                const aNum = parseInt(a.batch);
                const bNum = parseInt(b.batch);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return a.batch.localeCompare(b.batch);
            });

        // 设置尺寸
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - this.margins.left - this.margins.right;
        const height = 300 - this.margins.top - this.margins.bottom;

        // 创建SVG
        const svg = container.append('svg')
            .attr('width', width + this.margins.left + this.margins.right)
            .attr('height', height + this.margins.top + this.margins.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // 创建比例尺
        const xScale = d3.scaleBand()
            .domain(chartData.map(d => d.batch))
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.count)])
            .range([height, 0]);

        // 创建坐标轴
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '11px')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px');

        // 添加网格线
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''))
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // 创建折线路径数据
        const line = d3.line()
            .x(d => xScale(d.batch) + xScale.bandwidth() / 2)
            .y(d => yScale(d.count))
            .curve(d3.curveMonotoneX);

        // 绘制折线
        const path = g.append('path')
            .datum(chartData)
            .attr('class', 'line')
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 3)
            .attr('d', line);

        // 添加折线动画
        const totalLength = path.node().getTotalLength();
        path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1500)
            .attr('stroke-dashoffset', 0);

        // 添加数据点
        const circles = g.selectAll('.dot')
            .data(chartData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.batch) + xScale.bandwidth() / 2)
            .attr('cy', d => yScale(d.count))
            .attr('r', 0)
            .attr('fill', '#e74c3c')
            .style('cursor', 'pointer');

        // 添加数据点动画
        circles.transition()
            .duration(800)
            .delay((d, i) => i * 100 + 500)
            .attr('r', 5);

        // 添加数值标签
        g.selectAll('.dot-label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'dot-label')
            .attr('x', d => xScale(d.batch) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.count) - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('opacity', 0)
            .text(d => d.count)
            .transition()
            .duration(500)
            .delay((d, i) => i * 100 + 800)
            .style('opacity', 1);

        // 添加交互
        this.addTooltip(circles, d => `第${d.batch}批: ${d.count}个园林`);
        this.addClickHandler(circles, 'batch');

        this.charts.batch = { svg, data: chartData, type: 'line' };
    }

    /**
     * 创建文物保护单位级别分布图
     * @param {Array} data - 数据数组
     */
    createHeritageChart(data) {
        const containerId = '#heritage-chart';
        const container = d3.select(containerId);
        container.selectAll('*').remove();

        // 统计数据
        const heritageCounts = d3.rollup(data, v => v.length, d => d.protectionLevel || '未定级');
        const chartData = Array.from(heritageCounts, ([level, count]) => ({ level, count }))
            .sort((a, b) => b.count - a.count);

        // 设置尺寸
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - this.margins.left - this.margins.right;
        const height = 300 - this.margins.top - this.margins.bottom;

        // 创建SVG
        const svg = container.append('svg')
            .attr('width', width + this.margins.left + this.margins.right)
            .attr('height', height + this.margins.top + this.margins.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // 创建比例尺
        const xScale = d3.scaleBand()
            .domain(chartData.map(d => d.level))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.count)])
            .range([height, 0]);

        // 创建坐标轴
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '10px')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px');

        // 添加网格线
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''));

        // 创建柱状图
        const bars = g.selectAll('.bar')
            .data(chartData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.level))
            .attr('width', xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', d => this.colorSchemes.protection[d.level] || '#95a5a6')
            .style('cursor', 'pointer');

        // 添加动画
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.count))
            .attr('height', d => height - yScale(d.count));

        // 添加数值标签
        g.selectAll('.bar-label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d.level) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.count) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.count);

        // 添加交互
        this.addTooltip(bars, d => `${d.level}: ${d.count}个园林`);
        this.addClickHandler(bars, 'heritage');

        this.charts.heritage = { svg, data: chartData, type: 'bar' };
    }

    /**
     * 创建历史年代分布图
     * @param {Array} data - 数据数组
     */
    createEraChart(data) {
        const containerId = '#era-chart';
        const container = d3.select(containerId);
        container.selectAll('*').remove();

        // 统计数据
        const eraCounts = d3.rollup(data, v => v.length, d => d.eraCategory || '未知');
        const chartData = Array.from(eraCounts, ([era, count]) => ({ era, count }))
            .sort((a, b) => {
                // 定义朝代顺序
                const eraOrder = ['春秋', '战国', '秦', '汉', '三国', '晋', '南北朝', '隋', '唐', '五代', '宋', '元', '明', '清', '民国', '现代', '未知'];
                const aIndex = eraOrder.indexOf(a.era);
                const bIndex = eraOrder.indexOf(b.era);
                if (aIndex === -1 && bIndex === -1) return a.era.localeCompare(b.era);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });

        // 设置尺寸
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - this.margins.left - this.margins.right;
        const height = 300 - this.margins.top - this.margins.bottom;

        // 创建SVG
        const svg = container.append('svg')
            .attr('width', width + this.margins.left + this.margins.right)
            .attr('height', height + this.margins.top + this.margins.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // 创建比例尺
        const xScale = d3.scaleBand()
            .domain(chartData.map(d => d.era))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.count)])
            .range([height, 0]);

        // 创建坐标轴
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '11px')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px');

        // 添加网格线
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''));

        // 创建柱状图
        const bars = g.selectAll('.bar')
            .data(chartData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.era))
            .attr('width', xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', (d, i) => this.colorSchemes.primary[i % this.colorSchemes.primary.length])
            .style('cursor', 'pointer');

        // 添加动画
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.count))
            .attr('height', d => height - yScale(d.count));

        // 添加数值标签
        g.selectAll('.bar-label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d.era) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.count) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.count);

        // 添加交互
        this.addTooltip(bars, d => `${d.era}: ${d.count}个园林`);
        this.addClickHandler(bars, 'era');

        this.charts.era = { svg, data: chartData, type: 'bar' };
    }

    /**
     * 创建园林面积分布柱状图
     * @param {Array} data - 数据数组
     */
    createAreaChart(data) {
        const containerId = '#area-chart';
        const container = d3.select(containerId);
        container.selectAll('*').remove();

        // 过滤有效面积数据并分组
        const validData = data.filter(d => d.area && !isNaN(parseFloat(d.area)));
        const areaRanges = [
            { label: '0-1000㎡', min: 0, max: 1000 },
            { label: '1000-5000㎡', min: 1000, max: 5000 },
            { label: '5000-20000㎡', min: 5000, max: 20000 },
            { label: '>20000㎡', min: 20000, max: Infinity }
        ];

        const chartData = areaRanges.map(range => {
            const count = validData.filter(d => {
                const area = parseFloat(d.area);
                return area >= range.min && area < range.max;
            }).length;
            return { range: range.label, count };
        });

        // 设置尺寸
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - this.margins.left - this.margins.right;
        const height = 300 - this.margins.top - this.margins.bottom;

        // 创建SVG
        const svg = container.append('svg')
            .attr('width', width + this.margins.left + this.margins.right)
            .attr('height', height + this.margins.top + this.margins.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // 创建比例尺
        const xScale = d3.scaleBand()
            .domain(chartData.map(d => d.range))
            .range([0, width])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.count)])
            .range([height, 0]);

        // 创建坐标轴
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '12px');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px');

        // 添加网格线
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale).tickSize(-width).tickFormat(''));

        // 创建柱状图
        const bars = g.selectAll('.bar')
            .data(chartData)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.range))
            .attr('width', xScale.bandwidth())
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', (d, i) => this.colorSchemes.primary[i % this.colorSchemes.primary.length])
            .style('cursor', 'pointer');

        // 添加动画
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.count))
            .attr('height', d => height - yScale(d.count));

        // 添加数值标签
        g.selectAll('.bar-label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d.range) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.count) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.count);

        // 添加交互
        this.addTooltip(bars, d => `${d.range}: ${d.count}个园林`);
        this.addClickHandler(bars, 'area');

        this.charts.area = { svg, data: chartData, type: 'bar' };
    }

    /**
     * 创建各行政区文保级别分布横向堆叠柱状图
     * @param {Array} data - 数据数组
     */
    createDistrictProtectionChart(data) {
        const containerId = '#district-protection-chart';
        const container = d3.select(containerId);
        
        // 检查容器是否存在
        if (!container.node()) {
            console.error('District protection chart container not found:', containerId);
            return;
        }
        
        container.selectAll('*').remove();

        // 统计各行政区的文保级别分布
        const districtData = d3.rollup(data, 
            v => d3.rollup(v, vv => vv.length, d => d.protectionLevel || '未定级'),
            d => d.district || '未知'
        );

        // 获取所有文保级别
        const protectionLevels = ['全国', '省级', '市级', '县级', '无'];
        
        // 转换数据格式
        const chartData = Array.from(districtData, ([district, protectionMap]) => {
            const item = { district };
            let total = 0;
            protectionLevels.forEach(level => {
                item[level] = protectionMap.get(level) || 0;
                total += item[level];
            });
            item.total = total;
            return item;
        }).sort((a, b) => b.total - a.total).slice(0, 10); // 只显示前10个地区

        // 设置尺寸
        const containerRect = container.node().getBoundingClientRect();
        const width = containerRect.width - this.margins.left - this.margins.right - 80; // 为总数标签预留空间
        const height = 400 - this.margins.top - this.margins.bottom;

        // 创建SVG
        const svg = container.append('svg')
            .attr('width', width + this.margins.left + this.margins.right + 80)
            .attr('height', height + this.margins.top + this.margins.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // 创建比例尺
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(chartData, d => d.total)])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(chartData.map(d => d.district))
            .range([0, height])
            .padding(0.2);

        // 创建堆叠数据
        const stack = d3.stack()
            .keys(protectionLevels);

        const stackedData = stack(chartData);

        // 创建坐标轴
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('font-size', '12px');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px');

        // 添加网格线
        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisBottom(xScale).tickSize(-height).tickFormat(''))
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // 创建堆叠柱状图
        const layers = g.selectAll('.layer')
            .data(stackedData)
            .enter().append('g')
            .attr('class', 'layer')
            .attr('fill', d => this.colorSchemes.protection[d.key]);

        const bars = layers.selectAll('rect')
            .data(d => d)
            .enter().append('rect')
            .attr('y', d => yScale(d.data.district))
            .attr('height', yScale.bandwidth())
            .attr('x', 0)
            .attr('width', 0)
            .style('cursor', 'pointer');

        // 添加动画
        bars.transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr('x', d => xScale(d[0]))
            .attr('width', d => xScale(d[1]) - xScale(d[0]));

        // 添加总数标签
        g.selectAll('.total-label')
            .data(chartData)
            .enter().append('text')
            .attr('class', 'total-label')
            .attr('x', d => xScale(d.total) + 10)
            .attr('y', d => yScale(d.district) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => `${d.total}个`);

        // 添加图例
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width + this.margins.left + 20}, ${this.margins.top})`);

        const legendItems = legend.selectAll('.legend-item')
            .data(protectionLevels)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);

        legendItems.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', d => this.colorSchemes.protection[d]);

        legendItems.append('text')
            .attr('x', 25)
            .attr('y', 9)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(d => d);

        // 添加交互
        this.addTooltip(bars, d => {
            const level = d3.select(d.target.parentNode).datum().key;
            const count = d.data[level];
            return `${d.data.district} - ${level}: ${count}个园林`;
        });

        this.charts.districtProtection = { svg, data: chartData, type: 'stackedBar' };
    }

    /**
     * 添加工具提示
     * @param {d3.Selection} selection - D3选择集
     * @param {Function} contentFn - 内容生成函数
     */
    addTooltip(selection, contentFn) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('padding', '10px')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('border-radius', '5px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        selection
            .on('mouseover', function(event, d) {
                tooltip.transition().duration(200).style('opacity', 1);
                tooltip.html(contentFn(d))
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition().duration(200).style('opacity', 0);
            });
    }

    /**
     * 添加点击处理器
     * @param {d3.Selection} selection - D3选择集
     * @param {string} chartType - 图表类型
     */
    addClickHandler(selection, chartType) {
        selection.on('click', function(event, d) {
            // 这里可以添加点击事件处理逻辑
            console.log(`Clicked on ${chartType}:`, d);
        });
    }

    /**
     * 更新图表数据
     * @param {Array} newData - 新数据
     */
    updateCharts(newData) {
        this.data = newData;
        // 重新初始化所有图表
        this.initializeAllCharts(newData);
    }

    /**
     * 高亮显示元素
     * @param {string} chartType - 图表类型
     * @param {string} value - 要高亮的值
     */
    highlightElements(chartType, value) {
        const chart = this.charts[chartType];
        if (chart && chart.svg) {
            chart.svg.selectAll('.bar, path, .arc path')
                .style('opacity', d => {
                    const dataValue = d.data ? d.data[Object.keys(d.data)[0]] : d[Object.keys(d)[0]];
                    return dataValue === value ? 1 : 0.3;
                });
        }
    }

    /**
     * 清除高亮
     */
    clearHighlights() {
        Object.values(this.charts).forEach(chart => {
            if (chart.svg) {
                chart.svg.selectAll('.bar, path, .arc path')
                    .style('opacity', 1);
            }
        });
    }

    /**
     * 获取图表实例
     * @param {string} chartType - 图表类型
     * @returns {Object} 图表实例
     */
    getChart(chartType) {
        return this.charts[chartType];
    }
}

window.chartManager = new ChartManager();