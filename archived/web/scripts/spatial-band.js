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

    function boundingBox(points) {
        const xs = points.map(d => d.x);
        const ys = points.map(d => d.y);
        return {
            x0: d3.min(xs),
            x1: d3.max(xs),
            y0: d3.min(ys),
            y1: d3.max(ys)
        };
    }

    function renderScatter(data, topN, minWorth) {
        const container = d3.select('#spatial-scatter');
        container.selectAll('*').remove();

        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const { width: cw } = container.node().getBoundingClientRect();
        const width = Math.max(600, cw - margin.left - margin.right);
        const height = 420;

        const valid = data.filter(d =>
            d.longitude && d.latitude &&
            d.openCategory !== '不开放' &&
            d.compositeScore >= minWorth
        );
        if (!valid.length) {
            container.append('div')
                .style('text-align', 'center')
                .style('color', '#6c757d')
                .style('padding', '40px 0')
                .text('暂无经纬度数据，无法渲染散点。');
            return;
        }

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear()
            .domain(d3.extent(valid, d => d.longitude))
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain(d3.extent(valid, d => d.latitude))
            .range([height, 0]);

        const colorWorth = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain(d3.extent(valid, d => d.compositeScore));

        const plot = g.append('g').attr('class', 'plot');

        // Scatter points
        const dots = plot.selectAll('.dot')
            .data(valid)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(d.longitude))
            .attr('cy', d => y(d.latitude))
            .attr('r', 7)
            .attr('fill', d => colorWorth(d.compositeScore))
            .attr('fill-opacity', 0.85)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                tooltip
                    .html(`
                        <div><strong>${d.name}</strong></div>
                        <div>${d.district} · ${d.protectionLevel || '无级别'}</div>
                        <div>保护分：${d.protectionScore.toFixed(2)} | 开放：${(d.openScore * 100).toFixed(0)}%</div>
                    `)
                    .style('left', `${event.pageX + 12}px`)
                    .style('top', `${event.pageY - 12}px`)
                    .classed('visible', true);
            })
            .on('mouseout', () => tooltip.classed('visible', false));

        // Select high-score set for band
        const highScore = valid
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, topN);

        if (highScore.length) {
            const box = boundingBox(highScore.map(d => ({ x: x(d.longitude), y: y(d.latitude) })));
            const band = [
                [box.x0 - 8, box.y0 - 8],
                [box.x1 + 8, box.y0 - 8],
                [box.x1 + 8, box.y1 + 8],
                [box.x0 - 8, box.y1 + 8]
            ];

            plot.append('path')
                .attr('d', d3.line()(band.concat([band[0]])))
                .attr('fill', '#1f4e79')
                .attr('fill-opacity', 0.08)
                .attr('stroke', '#1f4e79')
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '6,4');

            // Simple path suggestion: sort by longitude then latitude
            const sortedPath = [...highScore].sort((a, b) => a.longitude === b.longitude
                ? a.latitude - b.latitude
                : a.longitude - b.longitude);
            plot.append('path')
                .datum(sortedPath)
                .attr('d', d3.line()
                    .x(d => x(d.longitude))
                    .y(d => y(d.latitude))
                )
                .attr('fill', 'none')
                .attr('stroke', '#e67e22')
                .attr('stroke-width', 2)
                .attr('stroke-opacity', 0.8);

            plot.selectAll('.band-label')
                .data(sortedPath.slice(0, 3))
                .enter()
                .append('text')
                .attr('class', 'band-label')
                .attr('x', d => x(d.longitude))
                .attr('y', d => y(d.latitude) - 10)
                .attr('text-anchor', 'middle')
                .style('font-size', '11px')
                .style('font-weight', '700')
                .style('fill', '#0f172a')
                .text(d => d.name.length > 6 ? d.name.slice(0, 6) : d.name);
        }

        // color legend
        const legendWidth = 160;
        const legendHeight = 10;
        const legend = svg.append('g')
            .attr('transform', `translate(${margin.left},${height + margin.top + 12})`);

        const defs = svg.append('defs');
        const gradientId = 'worth-gradient';
        const linear = defs.append('linearGradient')
            .attr('id', gradientId)
            .attr('x1', '0%')
            .attr('x2', '100%');
        d3.range(0, 1.01, 0.1).forEach(t => {
            linear.append('stop')
                .attr('offset', `${t * 100}%`)
                .attr('stop-color', colorWorth(colorWorth.domain()[0] + t * (colorWorth.domain()[1] - colorWorth.domain()[0])));
        });

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', `url(#${gradientId})`)
            .attr('rx', 4)
            .attr('ry', 4);

        const axisScale = d3.scaleLinear()
            .domain(colorWorth.domain())
            .range([0, legendWidth]);
        legend.append('g')
            .attr('transform', `translate(0,${legendHeight})`)
            .call(d3.axisBottom(axisScale).ticks(4).tickSize(4))
            .selectAll('text')
            .style('font-size', '10px');

        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -6)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text('“值得去”综合得分');

        const zoom = d3.zoom()
            .scaleExtent([1, 6])
            .on('zoom', (event) => {
                plot.attr('transform', event.transform);
            });
        svg.call(zoom);
    }

    function renderDistanceGradient(data, topN, minWorth) {
        const container = d3.select('#distance-gradient');
        container.selectAll('*').remove();

        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const { width: cw } = container.node().getBoundingClientRect();
        const width = Math.max(520, cw - margin.left - margin.right);
        const height = 320;

        const locatable = data.filter(d =>
            d.longitude && d.latitude &&
            d.openCategory !== '不开放' &&
            d.compositeScore >= minWorth
        );
        if (!locatable.length) {
            container.append('div')
                .style('text-align', 'center')
                .style('color', '#6c757d')
                .style('padding', '40px 0')
                .text('暂无经纬度数据，无法计算距离梯度。');
            return;
        }

        const svg = container.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const candidates = locatable
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, topN);
        if (!candidates.length) return;

        const core = candidates[0];
        const withDist = locatable
            .map(d => ({
                ...d,
                dist: Math.hypot(d.longitude - core.longitude, d.latitude - core.latitude)
            }));

        const x = d3.scaleLinear()
            .domain([0, d3.max(withDist, d => d.dist) || 1])
            .range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, 5])
            .range([height, 0]);

        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(6))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 36)
            .attr('fill', '#1f2d3d')
            .attr('text-anchor', 'middle')
            .style('font-weight', '600')
            .text('距核心点（经纬差的相对距离）');

        g.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -44)
            .attr('fill', '#1f2d3d')
            .attr('text-anchor', 'middle')
            .style('font-weight', '600')
            .text('保护评分');

        g.selectAll('.dist-dot')
            .data(withDist)
            .enter()
            .append('circle')
            .attr('class', 'dist-dot')
            .attr('cx', d => x(d.dist))
            .attr('cy', d => y(d.protectionScore))
            .attr('r', 5)
            .attr('fill', d => d === core ? '#e67e22' : '#1f4e79')
            .attr('fill-opacity', d => d === core ? 0.9 : 0.5)
            .on('mouseover', (event, d) => {
                tooltip
                    .html(`
                        <div><strong>${d.name}</strong></div>
                        <div>${d.district} · ${d.protectionLevel || '无级别'}</div>
                        <div>保护分：${d.protectionScore.toFixed(2)}</div>
                        <div>开放：${(d.openScore * 100).toFixed(0)}%</div>
                        <div>距核心：${d.dist.toFixed(3)}</div>
                    `)
                    .style('left', `${event.pageX + 12}px`)
                    .style('top', `${event.pageY - 12}px`)
                    .classed('visible', true);
            })
            .on('mouseout', () => tooltip.classed('visible', false));

        // Trend line (LOESS-like via moving average)
        const sortedByDist = withDist.sort((a, b) => a.dist - b.dist);
        const windowSize = Math.max(3, Math.floor(sortedByDist.length * 0.1));
        const smoothed = sortedByDist.map((d, i, arr) => {
            const start = Math.max(0, i - Math.floor(windowSize / 2));
            const end = Math.min(arr.length, start + windowSize);
            const slice = arr.slice(start, end);
            return {
                dist: d.dist,
                protectionAvg: d3.mean(slice, s => s.protectionScore)
            };
        });

        g.append('path')
            .datum(smoothed)
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .x(d => x(d.dist))
                .y(d => y(d.protectionAvg))
                .curve(d3.curveMonotoneX)
            );

        g.append('text')
            .attr('x', 0)
            .attr('y', -6)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .text(`核心点：${core.name}`);
    }

    async function init() {
        const raw = await d3.csv(csvPath);
        const processed = raw.map(row => {
            const openCategory = normalizeOpen(row['开放情况']);
            const protectionStatus = clean(row['保护状况']) || '未知';
            const protectionLevel = clean(row['文保单位级别']) || '无';
            const longitude = parseFloat(row['经度']);
            const latitude = parseFloat(row['纬度']);
            const protectionScore = scoreProtection(protectionStatus, protectionLevel);
            const openScore = scoreOpen(openCategory);
            return {
                name: clean(row['名称']),
                district: clean(row['区县']) || '未知',
                longitude: isNaN(longitude) ? null : longitude,
                latitude: isNaN(latitude) ? null : latitude,
                protectionLevel,
                protectionScore,
                openScore,
                openCategory,
                compositeScore: protectionScore + openScore
            };
        }).filter(d => d.name);

        const topNInput = document.getElementById('top-n');
        const minWorthInput = document.getElementById('min-worth');
        const applyBtn = document.getElementById('apply-spatial');

        const update = () => {
            const topN = Math.max(5, parseInt(topNInput.value) || 20);
            const minWorth = Math.min(6, Math.max(0, parseFloat(minWorthInput.value) || 0));

            renderScatter(processed, topN, minWorth);
            renderDistanceGradient(processed, topN, minWorth);
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
