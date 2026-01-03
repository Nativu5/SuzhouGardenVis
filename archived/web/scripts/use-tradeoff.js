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

    const openOrder = ['开放', '部分开放', '不开放', '未知'];
    const colorUse = d3.scaleOrdinal(d3.schemeSet2);

    const clean = (str) => (str || '').toString().trim();

    const normalizeOpen = (str) => {
        const v = clean(str);
        if (!v) return '未知';
        if (v.includes('不') || v.includes('未对外') || v.includes('未开放') || v.includes('关闭')) return '不开放';
        if (v.includes('预约')) return '部分开放';
        if (v.includes('部分')) return '部分开放';
        if (v.includes('开放')) return '开放';
        return '未知';
    };

    const scoreProtection = (status, level) => {
        const base = protectionScoreMap[status] || protectionScoreMap['未知'];
        const lv = clean(level);
        let bonus = 0;
        if (lv.includes('全国')) bonus = 0.8;
        else if (lv.includes('省')) bonus = 0.6;
        else if (lv.includes('市')) bonus = 0.4;
        else if (lv.includes('县')) bonus = 0.2;
        return Math.min(5, base + bonus);
    };

    const scoreOpen = (openStatus) => openScoreMap[openStatus] ?? openScoreMap['未知'];

    function aggregateByUse(data, minCount) {
        const grouped = d3.rollup(
            data,
            v => {
                const count = v.length;
                const protectionAvg = d3.mean(v, d => d.protectionScore);
                const openAvg = d3.mean(v, d => d.openScore);
                const levelCounts = d3.rollup(v, vv => vv.length, d => d.protectionLevel || '无');
                const worldHeritage = v.filter(d => d.worldHeritage).length;
                return { count, protectionAvg, openAvg, levelCounts, worldHeritage };
            },
            d => d.use
        );

        return Array.from(grouped, ([use, stats]) => ({ use, ...stats }))
            .filter(d => d.count >= minCount);
    }

    function aggregateMatrix(data, minCount, metricKey) {
        const grouped = d3.rollup(
            data,
            v => {
                const count = v.length;
                const protectionAvg = d3.mean(v, d => d.protectionScore);
                const openAvg = d3.mean(v, d => d.openScore);
                return { count, protectionAvg, openAvg };
            },
            d => d.use,
            d => d.openCategory
        );

        const result = [];
        grouped.forEach((openMap, use) => {
            openMap.forEach((val, openCategory) => {
                if (val.count >= minCount) {
                    result.push({
                        use,
                        openCategory,
                        count: val.count,
                        protectionAvg: val.protectionAvg,
                        openAvg: val.openAvg,
                        metricValue: metricKey === 'open' ? val.openAvg : val.protectionAvg
                    });
                }
            });
        });
        return result;
    }

    function renderMatrix(matrixData, uses, metricKey) {
        const container = d3.select('#use-matrix');
        container.selectAll('*').remove();

        if (!matrixData.length || !uses.length) {
            container.append('div')
                .style('text-align', 'center')
                .style('color', '#6c757d')
                .style('padding', '40px 0')
                .text('暂无数据，请降低最小样本数或检查筛选。');
            return;
        }

        const margin = { top: 20, right: 40, bottom: 60, left: 140 };
        const { width: cw } = container.node().getBoundingClientRect();
        const width = Math.max(520, cw - margin.left - margin.right);
        const height = Math.max(240, uses.length * 38);

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(openOrder).range([0, width]).padding(0.05);
        const y = d3.scaleBand().domain(uses).range([0, height]).padding(0.08);

        const extent = d3.extent(matrixData, d => d.metricValue);
        const color = d3.scaleSequential()
            .domain(extent[0] === extent[1] ? [extent[0] || 0, (extent[1] || 0) + 0.1] : extent)
            .interpolator(metricKey === 'open' ? d3.interpolateYlGn : d3.interpolateBlues);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('font-size', '12px');

        g.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('font-size', '12px');

        const cells = g.selectAll('.cell')
            .data(matrixData, d => `${d.use}-${d.openCategory}`)
            .enter()
            .append('g')
            .attr('class', 'cell')
            .attr('transform', d => `translate(${x(d.openCategory)},${y(d.use)})`);

        cells.append('rect')
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('rx', 6)
            .attr('ry', 6)
            .attr('fill', d => color(d.metricValue))
            .attr('stroke', '#f0f2f5');

        cells.append('text')
            .attr('x', x.bandwidth() / 2)
            .attr('y', y.bandwidth() / 2 - 4)
            .attr('text-anchor', 'middle')
            .style('fill', '#1f2d3d')
            .style('font-weight', '700')
            .text(d => d.count);

        cells.append('text')
            .attr('x', x.bandwidth() / 2)
            .attr('y', y.bandwidth() / 2 + 14)
            .attr('text-anchor', 'middle')
            .style('fill', '#4b5563')
            .style('font-size', '11px')
            .text(d => metricKey === 'open'
                ? `${(d.openAvg * 100).toFixed(0)}%`
                : d.protectionAvg.toFixed(2));

        cells.on('mouseover', (event, d) => {
            tooltip
                .html(`
                    <div><strong>${d.use} × ${d.openCategory}</strong></div>
                    <div>数量：${d.count}</div>
                    <div>平均保护分：${d.protectionAvg.toFixed(2)}</div>
                    <div>开放程度：${(d.openAvg * 100).toFixed(0)}%</div>
                `)
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 12}px`)
                .classed('visible', true);
        }).on('mouseout', () => tooltip.classed('visible', false));
    }

    function renderFrontier(useStats) {
        const container = d3.select('#use-frontier');
        container.selectAll('*').remove();

        if (!useStats.length) {
            container.append('div')
                .style('text-align', 'center')
                .style('color', '#6c757d')
                .style('padding', '40px 0')
                .text('暂无数据，请调整筛选条件。');
            return;
        }

        const margin = { top: 20, right: 20, bottom: 60, left: 60 };
        const { width: cw } = container.node().getBoundingClientRect();
        const width = Math.max(520, cw - margin.left - margin.right);
        const height = 380;

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([0, 1]).nice().range([0, width]);
        const y = d3.scaleLinear().domain([1, 5]).nice().range([height, 0]);
        const r = d3.scaleSqrt()
            .domain([1, d3.max(useStats, d => d.count) || 1])
            .range([6, 28]);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('.0%')))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 40)
            .attr('fill', '#1f2d3d')
            .attr('text-anchor', 'middle')
            .style('font-weight', '600')
            .text('开放程度（均值）');

        g.append('g')
            .call(d3.axisLeft(y).ticks(6))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -44)
            .attr('fill', '#1f2d3d')
            .attr('text-anchor', 'middle')
            .style('font-weight', '600')
            .text('保护评分（均值）');

        const dots = g.selectAll('.use-dot')
            .data(useStats)
            .enter()
            .append('g')
            .attr('class', 'use-dot')
            .attr('transform', d => `translate(${x(d.openAvg)},${y(d.protectionAvg)})`);

        dots.append('circle')
            .attr('r', d => r(d.count))
            .attr('fill', d => colorUse(d.use))
            .attr('fill-opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

        dots.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 4)
            .style('font-size', '10px')
            .style('font-weight', '700')
            .style('fill', '#0f172a')
            .text(d => d.use.length > 4 ? d.use.slice(0, 4) : d.use);

        dots.on('mouseover', (event, d) => {
            tooltip
                .html(`
                    <div><strong>${d.use}</strong></div>
                    <div>数量：${d.count}</div>
                    <div>保护评分：${d.protectionAvg.toFixed(2)}</div>
                    <div>开放程度：${(d.openAvg * 100).toFixed(0)}%</div>
                `)
                .style('left', `${event.pageX + 12}px`)
                .style('top', `${event.pageY - 12}px`)
                .classed('visible', true);
        }).on('mouseout', () => tooltip.classed('visible', false));

        // 简单前沿辅助线：按保护+开放得分排序连接前 5
        const ranked = [...useStats]
            .sort((a, b) => (b.protectionAvg + b.openAvg) - (a.protectionAvg + a.openAvg))
            .slice(0, 5);

        g.append('path')
            .datum(ranked)
            .attr('fill', 'none')
            .attr('stroke', '#e67e22')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', d3.line()
                .x(d => x(d.openAvg))
                .y(d => y(d.protectionAvg))
                .curve(d3.curveMonotoneX)
            );
    }

    async function init() {
        const raw = await d3.csv(csvPath);
        const processed = raw.map(row => {
            const use = clean(row['当前用途']) || '未标明';
            const openCategory = normalizeOpen(row['开放情况']);
            const protectionStatus = clean(row['保护状况']) || '未知';
            const protectionLevel = clean(row['文保单位级别']);
            return {
                use,
                openCategory,
                protectionScore: scoreProtection(protectionStatus, protectionLevel),
                openScore: scoreOpen(openCategory),
                protectionLevel,
                worldHeritage: (clean(row['世界遗产']).toLowerCase().includes('true') || clean(row['世界遗产']) === '是')
            };
        });

        const minCountInput = document.getElementById('min-count-use');
        const metricSelect = document.getElementById('matrix-metric');
        const applyBtn = document.getElementById('apply-use-filter');

        const update = () => {
            const minCount = Math.max(1, parseInt(minCountInput.value) || 1);
            const metricKey = metricSelect.value;

            const useStats = aggregateByUse(processed, minCount);
            colorUse.domain(useStats.map(d => d.use));
            const uses = useStats.map(d => d.use);
            const matrixData = aggregateMatrix(processed, minCount, metricKey)
                .filter(d => uses.includes(d.use));

            renderMatrix(matrixData, uses, metricKey);
            renderFrontier(useStats);
        };

        applyBtn.addEventListener('click', update);
        window.addEventListener('resize', debounce(update, 250));

        update();
    }

    function debounce(fn, wait = 200) {
        let t;
        return (...args) => {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(null, args), wait);
        };
    }

    init();
})();
