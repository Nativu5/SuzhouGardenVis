(() => {
    const csvPath = 'SuzhouGardenListFull.csv';
    const tooltip = d3.select('#tooltip');

    const protectionScoreMap = {
        '完好': 4.5,
        '好': 4,
        '较好': 3.6,
        '一般': 3,
        '中等': 3,
        '较差': 2,
        '破损': 1.5,
        '待修缮': 1.5,
        '未知': 3
    };

    const openScoreMap = {
        '开放': 1,
        '部分开放': 0.65,
        '不开放': 0.05,
        '关闭': 0.05,
        '未知': 0.3
    };

    const colorOwnership = d3.scaleOrdinal(d3.schemeTableau10);

    function clean(str) {
        return (str || '').toString().trim();
    }

    function normalizeOwnership(str) {
        const v = clean(str);
        if (!v) return '未标明';
        if (v.includes('国有')) return '国有';
        if (v.includes('集体')) return '集体';
        if (v.includes('民营') || v.includes('私') || v.includes('个人')) return '民营/私有';
        if (v.includes('股份') || v.includes('混合')) return '混合/股份';
        return v;
    }

    function normalizeOpen(str) {
        const v = clean(str);
        if (!v) return '未知';
        if (v.includes('不') || v.includes('未对外') || v.includes('未开放') || v.includes('关闭')) return '不开放';
        if (v.includes('预约')) return '部分开放';
        if (v.includes('部分')) return '部分开放';
        if (v.includes('开放')) return '开放';
        return '未知';
    }

    function scoreProtection(status, level) {
        const base = protectionScoreMap[status] || protectionScoreMap['未知'];
        const levelStr = clean(level);
        let bonus = 0;
        if (levelStr.includes('全国')) bonus = 0.8;
        else if (levelStr.includes('省')) bonus = 0.6;
        else if (levelStr.includes('市')) bonus = 0.4;
        else if (levelStr.includes('县')) bonus = 0.2;
        return Math.min(5, base + bonus);
    }

    function scoreOpen(openStatus) {
        return openScoreMap[openStatus] ?? openScoreMap['未知'];
    }

    function isHighLevel(level) {
        const v = clean(level);
        return v.includes('全国') || v.includes('省');
    }

    function aggregateMatrix(data, minCount, metricKey) {
        const grouped = new Map();
        data.forEach(d => {
            const key = `${d.district}|||${d.ownership}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    district: d.district,
                    ownership: d.ownership,
                    count: 0,
                    protectionSum: 0,
                    openSum: 0,
                    highCount: 0
                });
            }
            const agg = grouped.get(key);
            agg.count += 1;
            agg.protectionSum += d.protectionScore;
            agg.openSum += d.openScore;
            if (d.isHighLevel) agg.highCount += 1;
        });

        return Array.from(grouped.values())
            .filter(d => d.count >= minCount)
            .map(d => ({
                ...d,
                protectionAvg: d.protectionSum / d.count,
                openAvg: d.openSum / d.count,
                highShare: d.highCount / d.count,
                metricValue: metricKey === 'open' ? d.openSum / d.count :
                    metricKey === 'highShare' ? (d.highCount / d.count) :
                    d.protectionSum / d.count
            }));
    }

    function renderMatrix(matrixData, districts, ownerships, metricKey) {
        const container = d3.select('#matrix-chart');
        container.selectAll('*').remove();

        const { width: containerWidth, height: containerHeight } = container.node().getBoundingClientRect();
        const margin = { top: 20, right: 80, bottom: 60, left: 120 };
        const width = Math.max(500, containerWidth - margin.left - margin.right);
        const height = Math.max(320, Math.min(600, 30 * districts.length));

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(ownerships).range([0, width]).padding(0.05);
        const y = d3.scaleBand().domain(districts).range([0, height]).padding(0.05);

        const metricExtent = d3.extent(matrixData, d => d.metricValue);
        const color = d3.scaleSequential()
            .domain(metricExtent[0] === metricExtent[1] ? [metricExtent[0] || 0, (metricExtent[1] || 0) + 0.1] : metricExtent)
            .interpolator(metricKey === 'open' ? d3.interpolateYlGn : d3.interpolateBlues);

        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('font-size', '12px');

        g.append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('font-size', '12px');

        const cells = g.selectAll('.cell')
            .data(matrixData, d => `${d.district}-${d.ownership}`)
            .enter()
            .append('g')
            .attr('class', 'cell')
            .attr('transform', d => `translate(${x(d.ownership)},${y(d.district)})`);

        cells.append('rect')
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', d => color(d.metricValue))
            .attr('stroke', '#f1f3f5')
            .attr('stroke-width', 1);

        const maxOpen = d3.max(matrixData, d => d.openAvg) || 1;
        const radius = d3.scaleSqrt()
            .domain([0, maxOpen])
            .range([0, Math.min(x.bandwidth(), y.bandwidth()) / 2 - 6]);

        cells.append('circle')
            .attr('cx', x.bandwidth() / 2)
            .attr('cy', y.bandwidth() / 2)
            .attr('r', d => radius(d.openAvg))
            .attr('fill', '#1f4e79')
            .attr('fill-opacity', 0.45)
            .attr('stroke', 'none')
            .attr('stroke-width', 0);

        cells.append('text')
            .attr('x', x.bandwidth() - 6)
            .attr('y', y.bandwidth() - 6)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', 'ideographic')
            .style('font-size', '10px')
            .style('fill', '#2c3e50')
            .text(d => d.count);

        cells.on('mouseover', (event, d) => {
            tooltip
                .html(`
                    <div><strong>${d.district} · ${d.ownership}</strong></div>
                    <div>样本数：${d.count}</div>
                    <div>平均保护评分：${d.protectionAvg.toFixed(2)}</div>
                    <div>开放程度：${(d.openAvg * 100).toFixed(0)}%</div>
                    <div>高等级占比：${(d.highShare * 100).toFixed(1)}%</div>
                `)
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 12}px`)
                .classed('visible', true);
        }).on('mouseout', () => tooltip.classed('visible', false));

        drawLegend(svg, color, metricKey, width, margin);
    }

    function drawLegend(svg, color, metricKey, innerWidth, margin) {
        const legendWidth = 180;
        const legendHeight = 10;
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left + innerWidth - legendWidth}, ${margin.top})`);

        const gradientId = `legend-gradient-${metricKey}`;
        const defs = svg.append('defs');
        const linear = defs.append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('x2', '100%');
        const stops = d3.range(0, 1.01, 0.1);
        stops.forEach(t => {
            linear.append('stop')
                .attr('offset', `${t * 100}%`)
                .attr('stop-color', color(color.domain()[0] + t * (color.domain()[1] - color.domain()[0])));
        });

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', `url(#${gradientId})`)
            .attr('rx', 4)
            .attr('ry', 4);

        const axisScale = d3.scaleLinear()
            .domain(color.domain())
            .range([0, legendWidth]);

        const axis = d3.axisBottom(axisScale).ticks(4).tickSize(4);

        legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(axis)
            .selectAll('text')
            .style('font-size', '10px');

        const labelMap = {
            protection: '平均保护评分',
            open: '开放程度（均值）',
            highShare: '高等级占比'
        };

        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -6)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text(labelMap[metricKey] || '指标');
    }

    function renderSankey(data) {
        const container = d3.select('#sankey-chart');
        container.selectAll('*').remove();

        const { width: containerWidth, height: containerHeight } = container.node().getBoundingClientRect();
        const margin = { top: 10, right: 40, bottom: 10, left: 10 };
        const width = Math.max(640, containerWidth - margin.left - margin.right);
        const height = 420;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const ownerships = Array.from(new Set(data.map(d => d.ownership)));
        colorOwnership.domain(ownerships);

        const openStates = ['开放', '部分开放', '不开放', '未知'];
        const districts = Array.from(new Set(data.map(d => d.district))).sort();

        const nodes = [];
        const nodeId = new Map();
        function addNode(name, group) {
            const id = nodes.length;
            nodeId.set(`${group}:${name}`, id);
            nodes.push({ name, group });
            return id;
        }

        districts.forEach(d => addNode(d, 'district'));
        ownerships.forEach(o => addNode(o, 'ownership'));
        openStates.forEach(o => addNode(o, 'open'));

        const links = [];
        const addLink = (sourceKey, targetKey, value, ownershipLabel) => {
            if (value <= 0) return;
            links.push({
                source: nodeId.get(sourceKey),
                target: nodeId.get(targetKey),
                value,
                ownershipLabel
            });
        };

        const districtOwnerCounts = d3.rollup(
            data,
            v => v.length,
            d => d.district,
            d => d.ownership
        );

        districtOwnerCounts.forEach((ownerMap, district) => {
            ownerMap.forEach((count, owner) => {
                addLink(`district:${district}`, `ownership:${owner}`, count, owner);
            });
        });

        const ownerOpenCounts = d3.rollup(
            data,
            v => v.length,
            d => d.ownership,
            d => d.openCategory
        );

        ownerOpenCounts.forEach((openMap, owner) => {
            openMap.forEach((count, open) => {
                addLink(`ownership:${owner}`, `open:${open}`, count, owner);
            });
        });

        const sankey = d3.sankey()
            .nodeWidth(18)
            .nodePadding(12)
            .extent([[0, 0], [width, height]]);

        const graph = sankey({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });

        svg.append('g')
            .selectAll('path')
            .data(graph.links)
            .enter()
            .append('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', d => colorOwnership(d.ownershipLabel))
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .attr('stroke-opacity', 0.35)
            .on('mouseover', (event, d) => {
                tooltip
                    .html(`
                        <div><strong>${d.source.name} → ${d.target.name}</strong></div>
                        <div>权属：${d.ownershipLabel || '—'}</div>
                        <div>数量：${d.value}</div>
                    `)
                    .style('left', `${event.pageX + 12}px`)
                    .style('top', `${event.pageY - 12}px`)
                    .classed('visible', true);
            })
            .on('mouseout', () => tooltip.classed('visible', false));

        const node = svg.append('g')
            .selectAll('g')
            .data(graph.nodes)
            .enter()
            .append('g');

        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => Math.max(1, d.y1 - d.y0))
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => d.group === 'ownership' ? colorOwnership(d.name) : '#1f4e79')
            .attr('fill-opacity', d => d.group === 'ownership' ? 0.8 : 0.6)
            .attr('stroke', '#fff');

        node.append('text')
            .attr('x', d => d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .text(d => d.name)
            .filter(d => d.x0 < width / 2)
            .attr('x', d => d.x1 + 6)
            .attr('text-anchor', 'start');
    }

    function debounce(fn, wait = 200) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(null, args), wait);
        };
    }

    async function init() {
        const raw = await d3.csv(csvPath);
        const processed = raw.map(row => {
            const district = clean(row['区县']) || '未知';
            const ownership = normalizeOwnership(row['权属性质']);
            const openCategory = normalizeOpen(row['开放情况']);
            const protectionStatus = clean(row['保护状况']) || '未知';
            const protectionLevel = clean(row['文保单位级别']);
            return {
                district,
                ownership,
                openCategory,
                protectionScore: scoreProtection(protectionStatus, protectionLevel),
                openScore: scoreOpen(openCategory),
                isHighLevel: isHighLevel(protectionLevel)
            };
        }).filter(d => d.district && d.ownership);

        const metricSelect = document.getElementById('metric-toggle');
        const minCountInput = document.getElementById('min-count');
        const applyBtn = document.getElementById('apply-filter');

        function update() {
            const metricKey = metricSelect.value;
            const minCount = Math.max(1, parseInt(minCountInput.value) || 1);

            const matrixData = aggregateMatrix(processed, minCount, metricKey);
            const districtTotals = d3.rollup(matrixData, v => d3.sum(v, x => x.count), d => d.district);
            const districts = Array.from(districtTotals.keys())
                .sort((a, b) => d3.descending(districtTotals.get(a), districtTotals.get(b)));
            const ownerships = Array.from(new Set(matrixData.map(d => d.ownership)));

            renderMatrix(matrixData, districts, ownerships, metricKey);
            renderSankey(processed.filter(d => {
                const key = `${d.district}|||${d.ownership}`;
                const record = matrixData.find(x => `${x.district}|||${x.ownership}` === key);
                return record && record.count >= minCount;
            }));
        }

        applyBtn.addEventListener('click', update);
        window.addEventListener('resize', debounce(update, 250));

        update();
    }

    init();
})();
