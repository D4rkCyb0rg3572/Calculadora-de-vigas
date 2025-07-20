// Beam Calculator JavaScript - Vértice Engenharia
// Author: Vértice Engenharia Team
// Description: Complete structural beam calculator with SFD and BMD generation

class BeamCalculator {
    constructor() {
        this.beam = {
            length: 6,
            type: 'simply-supported',
            supportA: 0,
            supportB: 6,
            pointLoads: [],
            distributedLoads: [],
            moments: []
        };
        this.reactions = {};
        this.stepByStepCalculations = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Add load buttons
        document.getElementById('addPointLoad').addEventListener('click', () => this.addPointLoad());
        document.getElementById('addDistributedLoad').addEventListener('click', () => this.addDistributedLoad());
        document.getElementById('addMoment').addEventListener('click', () => this.addMoment());

        // Calculate button
        document.getElementById('calculateButton').addEventListener('click', () => this.calculate());

        // Beam type change event
        document.getElementById('beamType').addEventListener('change', () => this.updateSupportVisibility());

        // Beam length change event
        document.getElementById('beamLength').addEventListener('change', () => this.updateSupportBDefault());

        // Remove load buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-point-load')) {
                e.target.closest('.point-load-item').remove();
                this.drawBeam(); // Update drawing when load is removed
            }
            if (e.target.classList.contains('remove-distributed-load')) {
                e.target.closest('.distributed-load-item').remove();
                this.drawBeam(); // Update drawing when load is removed
            }
            if (e.target.classList.contains('remove-moment')) {
                e.target.closest('.moment-item').remove();
                this.drawBeam(); // Update drawing when moment is removed
            }
        });

        // Initialize support visibility
        this.updateSupportVisibility();
        
        // Initialize beam drawing
        this.drawBeam();
        
        // Add event listeners for dynamic updates
        document.getElementById('beamLength').addEventListener('input', () => this.drawBeam());
        document.getElementById('beamType').addEventListener('change', () => this.drawBeam());
        document.getElementById('supportA').addEventListener('input', () => this.drawBeam());
        document.getElementById('supportB').addEventListener('input', () => this.drawBeam());
    }

    drawBeam() {
        const svg = document.getElementById('beamSvg');
        const svgWidth = 600;
        const svgHeight = 180;
        const beamY = 90;
        const beamHeight = 20;
        
        // Clear previous drawing
        svg.innerHTML = '';
        
        // Get current beam properties
        const beamLength = parseFloat(document.getElementById('beamLength').value) || 6;
        const beamType = document.getElementById('beamType').value;
        const supportA = parseFloat(document.getElementById('supportA').value) || 0;
        const supportB = parseFloat(document.getElementById('supportB').value) || beamLength;
        
        // Calculate scale
        const margin = 50;
        const drawingWidth = svgWidth - 2 * margin;
        const scale = drawingWidth / beamLength;
        
        // Draw beam
        const beamRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        beamRect.setAttribute('x', margin);
        beamRect.setAttribute('y', beamY - beamHeight/2);
        beamRect.setAttribute('width', drawingWidth);
        beamRect.setAttribute('height', beamHeight);
        beamRect.setAttribute('fill', '#8B4513');
        beamRect.setAttribute('stroke', '#654321');
        beamRect.setAttribute('stroke-width', '2');
        svg.appendChild(beamRect);
        
        // Draw supports
        this.drawSupport(svg, margin + supportA * scale, beamY + beamHeight/2, 'A', beamType === 'cantilever' ? 'fixed' : 'pinned');
        
        if (beamType !== 'cantilever') {
            this.drawSupport(svg, margin + supportB * scale, beamY + beamHeight/2, 'B', beamType === 'fixed' ? 'fixed' : 'pinned');
        }
        
        // Draw loads
        this.drawLoads(svg, margin, beamY, scale, beamHeight);
        
        // Draw dimensions
        this.drawDimensions(svg, margin, beamY, drawingWidth, beamLength);
    }

    drawSupport(svg, x, y, label, type) {
        const supportGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        if (type === 'pinned') {
            // Draw triangle support
            const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            triangle.setAttribute('points', `${x-15},${y} ${x+15},${y} ${x},${y+20}`);
            triangle.setAttribute('fill', '#666');
            triangle.setAttribute('stroke', '#333');
            triangle.setAttribute('stroke-width', '2');
            supportGroup.appendChild(triangle);
            
            // Draw ground lines
            for (let i = -20; i <= 20; i += 5) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x + i);
                line.setAttribute('y1', y + 20);
                line.setAttribute('x2', x + i + 3);
                line.setAttribute('y2', y + 25);
                line.setAttribute('stroke', '#333');
                line.setAttribute('stroke-width', '2');
                supportGroup.appendChild(line);
            }
        } else if (type === 'fixed') {
            // Draw fixed support
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x - 5);
            rect.setAttribute('y', y);
            rect.setAttribute('width', 10);
            rect.setAttribute('height', 25);
            rect.setAttribute('fill', '#666');
            rect.setAttribute('stroke', '#333');
            rect.setAttribute('stroke-width', '2');
            supportGroup.appendChild(rect);
            
            // Draw hatching
            for (let i = 0; i <= 25; i += 5) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x - 5);
                line.setAttribute('y1', y + i);
                line.setAttribute('x2', x - 10);
                line.setAttribute('y2', y + i + 3);
                line.setAttribute('stroke', '#333');
                line.setAttribute('stroke-width', '1');
                supportGroup.appendChild(line);
            }
        }
        
        // Draw label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 40);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#333');
        text.textContent = label;
        supportGroup.appendChild(text);
        
        svg.appendChild(supportGroup);
    }

    drawLoads(svg, margin, beamY, scale, beamHeight) {
        // Draw point loads
        document.querySelectorAll('.point-load-item').forEach((item, index) => {
            const magnitude = parseFloat(item.querySelector('.point-load-magnitude').value);
            const position = parseFloat(item.querySelector('.point-load-position').value);
            
            if (!isNaN(magnitude) && !isNaN(position)) {
                this.drawPointLoad(svg, margin + position * scale, beamY - beamHeight/2, magnitude, `P${index + 1}`);
            }
        });
        
        // Draw distributed loads
        document.querySelectorAll('.distributed-load-item').forEach((item, index) => {
            const startLoad = parseFloat(item.querySelector('.distributed-load-start').value);
            const endLoad = parseFloat(item.querySelector('.distributed-load-end').value);
            const startPos = parseFloat(item.querySelector('.distributed-load-start-pos').value);
            const endPos = parseFloat(item.querySelector('.distributed-load-end-pos').value);
            
            if (!isNaN(startLoad) && !isNaN(endLoad) && !isNaN(startPos) && !isNaN(endPos)) {
                this.drawDistributedLoad(svg, margin + startPos * scale, margin + endPos * scale, beamY - beamHeight/2, startLoad, endLoad);
            }
        });
        
        // Draw moments
        document.querySelectorAll('.moment-item').forEach((item, index) => {
            const magnitude = parseFloat(item.querySelector('.moment-magnitude').value);
            const position = parseFloat(item.querySelector('.moment-position').value);
            
            if (!isNaN(magnitude) && !isNaN(position)) {
                this.drawMoment(svg, margin + position * scale, beamY, magnitude, `M${index + 1}`);
            }
        });
    }

    drawPointLoad(svg, x, y, magnitude, label) {
        const loadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Draw arrow
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrow.setAttribute('x1', x);
        arrow.setAttribute('y1', y - 40);
        arrow.setAttribute('x2', x);
        arrow.setAttribute('y2', y);
        arrow.setAttribute('stroke', '#e74c3c');
        arrow.setAttribute('stroke-width', '3');
        arrow.setAttribute('marker-end', 'url(#arrowhead)');
        loadGroup.appendChild(arrow);
        
        // Draw arrowhead marker (define once)
        if (!svg.querySelector('#arrowhead')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            polygon.setAttribute('fill', '#e74c3c');
            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.appendChild(defs);
        }
        
        // Draw label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y - 45);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#e74c3c');
        text.textContent = `${magnitude} kN`;
        loadGroup.appendChild(text);
        
        svg.appendChild(loadGroup);
    }

    drawDistributedLoad(svg, x1, x2, y, startLoad, endLoad) {
        const loadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Draw distributed load arrows
        const numArrows = Math.max(3, Math.floor((x2 - x1) / 20));
        for (let i = 0; i <= numArrows; i++) {
            const x = x1 + (x2 - x1) * i / numArrows;
            const loadMagnitude = startLoad + (endLoad - startLoad) * i / numArrows;
            const arrowHeight = Math.max(20, loadMagnitude * 3);
            
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            arrow.setAttribute('x1', x);
            arrow.setAttribute('y1', y - arrowHeight);
            arrow.setAttribute('x2', x);
            arrow.setAttribute('y2', y);
            arrow.setAttribute('stroke', '#f39c12');
            arrow.setAttribute('stroke-width', '2');
            arrow.setAttribute('marker-end', 'url(#arrowhead-orange)');
            loadGroup.appendChild(arrow);
        }
        
        // Create orange arrowhead marker
        if (!svg.querySelector('#arrowhead-orange')) {
            const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead-orange');
            marker.setAttribute('markerWidth', '8');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('refX', '7');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 8 3, 0 6');
            polygon.setAttribute('fill', '#f39c12');
            marker.appendChild(polygon);
            defs.appendChild(marker);
            if (!svg.querySelector('defs')) svg.appendChild(defs);
        }
        
        // Draw load distribution line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y - Math.max(20, startLoad * 3));
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y - Math.max(20, endLoad * 3));
        line.setAttribute('stroke', '#f39c12');
        line.setAttribute('stroke-width', '2');
        loadGroup.appendChild(line);
        
        svg.appendChild(loadGroup);
    }

    drawMoment(svg, x, y, magnitude, label) {
        const momentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Draw moment arc
        const radius = 25;
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const direction = magnitude > 0 ? 1 : -1;
        arc.setAttribute('d', `M ${x - radius} ${y} A ${radius} ${radius} 0 1 ${direction > 0 ? 1 : 0} ${x + radius} ${y}`);
        arc.setAttribute('stroke', '#9b59b6');
        arc.setAttribute('stroke-width', '3');
        arc.setAttribute('fill', 'none');
        arc.setAttribute('marker-end', 'url(#moment-arrow)');
        momentGroup.appendChild(arc);
        
        // Create moment arrow marker
        if (!svg.querySelector('#moment-arrow')) {
            const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'moment-arrow');
            marker.setAttribute('markerWidth', '8');
            marker.setAttribute('markerHeight', '6');
            marker.setAttribute('refX', '7');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 8 3, 0 6');
            polygon.setAttribute('fill', '#9b59b6');
            marker.appendChild(polygon);
            defs.appendChild(marker);
            if (!svg.querySelector('defs')) svg.appendChild(defs);
        }
        
        // Draw label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y - 35);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#9b59b6');
        text.textContent = `${Math.abs(magnitude)} kNm`;
        momentGroup.appendChild(text);
        
        svg.appendChild(momentGroup);
    }

    drawDimensions(svg, margin, beamY, drawingWidth, beamLength) {
        // Draw dimension line
        const dimY = beamY + 60;
        const dimLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dimLine.setAttribute('x1', margin);
        dimLine.setAttribute('y1', dimY);
        dimLine.setAttribute('x2', margin + drawingWidth);
        dimLine.setAttribute('y2', dimY);
        dimLine.setAttribute('stroke', '#333');
        dimLine.setAttribute('stroke-width', '1');
        svg.appendChild(dimLine);
        
        // Draw dimension arrows
        const leftArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftArrow.setAttribute('x1', margin);
        leftArrow.setAttribute('y1', dimY - 5);
        leftArrow.setAttribute('x2', margin);
        leftArrow.setAttribute('y2', dimY + 5);
        leftArrow.setAttribute('stroke', '#333');
        leftArrow.setAttribute('stroke-width', '1');
        svg.appendChild(leftArrow);
        
        const rightArrow = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightArrow.setAttribute('x1', margin + drawingWidth);
        rightArrow.setAttribute('y1', dimY - 5);
        rightArrow.setAttribute('x2', margin + drawingWidth);
        rightArrow.setAttribute('y2', dimY + 5);
        rightArrow.setAttribute('stroke', '#333');
        rightArrow.setAttribute('stroke-width', '1');
        svg.appendChild(rightArrow);
        
        // Draw dimension text
        const dimText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dimText.setAttribute('x', margin + drawingWidth / 2);
        dimText.setAttribute('y', dimY + 20);
        dimText.setAttribute('text-anchor', 'middle');
        dimText.setAttribute('font-family', 'Arial, sans-serif');
        dimText.setAttribute('font-size', '12');
        dimText.setAttribute('fill', '#333');
        dimText.textContent = `${beamLength} m`;
        svg.appendChild(dimText);
    }

    updateSupportVisibility() {
        const beamType = document.getElementById('beamType').value;
        const supportBContainer = document.getElementById('supportBContainer');
        
        if (beamType === 'cantilever') {
            supportBContainer.style.display = 'none';
        } else {
            supportBContainer.style.display = 'block';
        }
    }

    updateSupportBDefault() {
        const beamLength = parseFloat(document.getElementById('beamLength').value) || 6;
        document.getElementById('supportB').value = beamLength;
    }

    addPointLoad() {
        const container = document.getElementById('pointLoadsContainer');
        const loadItem = document.createElement('div');
        loadItem.className = 'point-load-item mb-2';
        loadItem.innerHTML = `
            <div class="row">
                <div class="col-6">
                    <input type="number" class="form-control point-load-magnitude" placeholder="Carga (kN)" step="0.1">
                </div>
                <div class="col-5">
                    <input type="number" class="form-control point-load-position" placeholder="Posição (m)" step="0.1">
                </div>
                <div class="col-1">
                    <button type="button" class="btn btn-danger btn-sm remove-point-load">×</button>
                </div>
            </div>
        `;
        container.appendChild(loadItem);
        
        // Add event listeners for dynamic drawing updates
        loadItem.querySelector('.point-load-magnitude').addEventListener('input', () => this.drawBeam());
        loadItem.querySelector('.point-load-position').addEventListener('input', () => this.drawBeam());
    }

    addDistributedLoad() {
        const container = document.getElementById('distributedLoadsContainer');
        const loadItem = document.createElement('div');
        loadItem.className = 'distributed-load-item mb-2';
        loadItem.innerHTML = `
            <div class="row mb-1">
                <div class="col-6">
                    <input type="number" class="form-control distributed-load-start" placeholder="Início (kN/m)" step="0.1">
                </div>
                <div class="col-6">
                    <input type="number" class="form-control distributed-load-end" placeholder="Fim (kN/m)" step="0.1">
                </div>
            </div>
            <div class="row">
                <div class="col-5">
                    <input type="number" class="form-control distributed-load-start-pos" placeholder="Pos. Início (m)" step="0.1">
                </div>
                <div class="col-5">
                    <input type="number" class="form-control distributed-load-end-pos" placeholder="Pos. Fim (m)" step="0.1">
                </div>
                <div class="col-2">
                    <button type="button" class="btn btn-danger btn-sm remove-distributed-load">×</button>
                </div>
            </div>
        `;
        container.appendChild(loadItem);
        
        // Add event listeners for dynamic drawing updates
        loadItem.querySelector('.distributed-load-start').addEventListener('input', () => this.drawBeam());
        loadItem.querySelector('.distributed-load-end').addEventListener('input', () => this.drawBeam());
        loadItem.querySelector('.distributed-load-start-pos').addEventListener('input', () => this.drawBeam());
        loadItem.querySelector('.distributed-load-end-pos').addEventListener('input', () => this.drawBeam());
    }

    addMoment() {
        const container = document.getElementById('momentsContainer');
        const momentItem = document.createElement('div');
        momentItem.className = 'moment-item mb-2';
        momentItem.innerHTML = `
            <div class="row">
                <div class="col-6">
                    <input type="number" class="form-control moment-magnitude" placeholder="Momento (kNm)" step="0.1">
                </div>
                <div class="col-5">
                    <input type="number" class="form-control moment-position" placeholder="Posição (m)" step="0.1">
                </div>
                <div class="col-1">
                    <button type="button" class="btn btn-danger btn-sm remove-moment">×</button>
                </div>
            </div>
        `;
        container.appendChild(momentItem);
        
        // Add event listeners for dynamic drawing updates
        momentItem.querySelector('.moment-magnitude').addEventListener('input', () => this.drawBeam());
        momentItem.querySelector('.moment-position').addEventListener('input', () => this.drawBeam());
    }

    collectInputData() {
        // Get beam properties
        this.beam.length = parseFloat(document.getElementById('beamLength').value) || 6;
        this.beam.type = document.getElementById('beamType').value;
        this.beam.supportA = parseFloat(document.getElementById('supportA').value) || 0;
        
        if (this.beam.type !== 'cantilever') {
            this.beam.supportB = parseFloat(document.getElementById('supportB').value) || this.beam.length;
        }

        // Collect point loads
        this.beam.pointLoads = [];
        document.querySelectorAll('.point-load-item').forEach(item => {
            const magnitude = parseFloat(item.querySelector('.point-load-magnitude').value);
            const position = parseFloat(item.querySelector('.point-load-position').value);
            if (!isNaN(magnitude) && !isNaN(position) && position >= 0 && position <= this.beam.length) {
                this.beam.pointLoads.push({ magnitude, position });
            }
        });

        // Collect distributed loads
        this.beam.distributedLoads = [];
        document.querySelectorAll('.distributed-load-item').forEach(item => {
            const startLoad = parseFloat(item.querySelector('.distributed-load-start').value);
            const endLoad = parseFloat(item.querySelector('.distributed-load-end').value);
            const startPos = parseFloat(item.querySelector('.distributed-load-start-pos').value);
            const endPos = parseFloat(item.querySelector('.distributed-load-end-pos').value);
            if (!isNaN(startLoad) && !isNaN(endLoad) && !isNaN(startPos) && !isNaN(endPos) &&
                startPos >= 0 && endPos <= this.beam.length && startPos < endPos) {
                this.beam.distributedLoads.push({ startLoad, endLoad, startPos, endPos });
            }
        });

        // Collect moments
        this.beam.moments = [];
        document.querySelectorAll('.moment-item').forEach(item => {
            const magnitude = parseFloat(item.querySelector('.moment-magnitude').value);
            const position = parseFloat(item.querySelector('.moment-position').value);
            if (!isNaN(magnitude) && !isNaN(position) && position >= 0 && position <= this.beam.length) {
                this.beam.moments.push({ magnitude, position });
            }
        });
    }

    calculateReactions() {
        this.stepByStepCalculations = [];
        this.reactions = {};

        // Add step for equilibrium equations
        this.stepByStepCalculations.push({
            title: "Equações de Equilíbrio",
            content: "Para uma viga em equilíbrio estático, devemos satisfazer:",
            equations: [
                "ΣFy = 0 (Soma das forças verticais = 0)",
                "ΣM = 0 (Soma dos momentos = 0)"
            ]
        });

        let totalVerticalForce = 0;
        let totalMoment = 0;

        // Calculate total forces and moments
        this.beam.pointLoads.forEach(load => {
            totalVerticalForce += load.magnitude;
        });

        this.beam.distributedLoads.forEach(load => {
            const length = load.endPos - load.startPos;
            const avgLoad = (load.startLoad + load.endLoad) / 2;
            totalVerticalForce += avgLoad * length;
        });

        // Calculate moments about left support
        this.beam.pointLoads.forEach(load => {
            totalMoment += load.magnitude * load.position;
        });

        this.beam.distributedLoads.forEach(load => {
            const length = load.endPos - load.startPos;
            const avgLoad = (load.startLoad + load.endLoad) / 2;
            const centroid = load.startPos + length / 2;
            totalMoment += avgLoad * length * centroid;
        });

        this.beam.moments.forEach(moment => {
            totalMoment += moment.magnitude;
        });

        switch (this.beam.type) {
            case 'simply-supported':
                this.calculateSimplySupportedReactions(totalVerticalForce, totalMoment);
                break;
            case 'cantilever':
                this.calculateCantileverReactions(totalVerticalForce, totalMoment);
                break;
            case 'fixed':
                this.calculateFixedReactions(totalVerticalForce, totalMoment);
                break;
        }
    }

    calculateSimplySupportedReactions(totalVerticalForce, totalMoment) {
        // For simply supported beam: Ra + Rb = Total Load, Ma = 0
        // Calculate moments about support A
        let momentAboutA = 0;
        
        this.beam.pointLoads.forEach(load => {
            momentAboutA += load.magnitude * (load.position - this.beam.supportA);
        });

        this.beam.distributedLoads.forEach(load => {
            const length = load.endPos - load.startPos;
            const avgLoad = (load.startLoad + load.endLoad) / 2;
            const centroid = load.startPos + length / 2;
            momentAboutA += avgLoad * length * (centroid - this.beam.supportA);
        });

        this.beam.moments.forEach(moment => {
            momentAboutA += moment.magnitude;
        });

        const spanLength = this.beam.supportB - this.beam.supportA;
        const Rb = momentAboutA / spanLength;
        const Ra = totalVerticalForce - Rb;

        this.reactions = { Ra, Rb, Ma: 0, Mb: 0 };

        this.stepByStepCalculations.push({
            title: "Cálculo das Reações - Viga Simplesmente Apoiada",
            content: `Para viga simplesmente apoiada com apoios em A (x=${this.beam.supportA}m) e B (x=${this.beam.supportB}m):`,
            equations: [
                "ΣFy = Ra + Rb - ΣP = 0",
                `Ra + Rb = ${totalVerticalForce.toFixed(2)} kN`,
                "",
                `ΣMA = Rb × L - ΣP × x - ΣM = 0`,
                `Rb × ${spanLength.toFixed(2)} = ${momentAboutA.toFixed(2)}`,
                `Rb = ${momentAboutA.toFixed(2)} / ${spanLength.toFixed(2)} = ${Rb.toFixed(2)} kN`,
                "",
                `Ra = ${totalVerticalForce.toFixed(2)} - ${Rb.toFixed(2)} = ${Ra.toFixed(2)} kN`
            ]
        });
    }

    calculateCantileverReactions(totalVerticalForce, totalMoment) {
        // For cantilever beam: Ra = Total Load, Ma = Total Moment
        const Ra = totalVerticalForce;
        const Ma = totalMoment;

        this.reactions = { Ra, Rb: 0, Ma, Mb: 0 };

        this.stepByStepCalculations.push({
            title: "Cálculo das Reações - Viga Engastada (Cantilever)",
            content: "Para viga engastada em A (x=0):",
            equations: [
                "ΣFy = Ra - ΣP = 0",
                `Ra = ${totalVerticalForce.toFixed(2)} kN`,
                "",
                "ΣMA = Ma - ΣP × x - ΣM = 0",
                `Ma = ${totalMoment.toFixed(2)} kNm`
            ]
        });
    }

    calculateFixedReactions(totalVerticalForce, totalMoment) {
        // Simplified fixed beam analysis (statically indeterminate)
        // Using moment distribution method approximation
        const Ra = totalVerticalForce / 2;
        const Rb = totalVerticalForce / 2;
        const Ma = -totalMoment / 8;
        const Mb = -totalMoment / 8;

        this.reactions = { Ra, Rb, Ma, Mb };

        this.stepByStepCalculations.push({
            title: "Cálculo das Reações - Viga Bi-engastada",
            content: "Para viga bi-engastada (análise simplificada):",
            equations: [
                "ΣFy = Ra + Rb - ΣP = 0",
                `Ra = Rb = ${totalVerticalForce.toFixed(2)} / 2 = ${Ra.toFixed(2)} kN`,
                "",
                "Para momentos (método simplificado):",
                `Ma = Mb ≈ -${totalMoment.toFixed(2)} / 8 = ${Ma.toFixed(2)} kNm`
            ]
        });
    }

    generateShearForceData() {
        const points = [];
        const numPoints = 100;
        const dx = this.beam.length / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const x = i * dx;
            let shear = 0;

            // Add reaction forces
            if (this.beam.type === 'simply-supported' || this.beam.type === 'fixed') {
                if (x >= this.beam.supportA) shear += this.reactions.Ra;
                if (x >= this.beam.supportB) shear += this.reactions.Rb;
            } else if (this.beam.type === 'cantilever') {
                if (x >= this.beam.supportA) shear += this.reactions.Ra;
            }

            // Subtract point loads
            this.beam.pointLoads.forEach(load => {
                if (x >= load.position) {
                    shear -= load.magnitude;
                }
            });

            // Subtract distributed loads
            this.beam.distributedLoads.forEach(load => {
                if (x >= load.startPos) {
                    const endPos = Math.min(x, load.endPos);
                    const length = endPos - load.startPos;
                    if (length > 0) {
                        const avgLoad = (load.startLoad + load.endLoad) / 2;
                        shear -= avgLoad * length;
                    }
                }
            });

            points.push({ x, shear });
        }

        return points;
    }

    generateBendingMomentData() {
        const points = [];
        const numPoints = 100;
        const dx = this.beam.length / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const x = i * dx;
            let moment = 0;

            // Add reaction moments
            if (this.beam.type === 'cantilever' || this.beam.type === 'fixed') {
                moment += this.reactions.Ma;
            }

            // Add moments from reaction forces
            if (this.beam.type === 'simply-supported' || this.beam.type === 'fixed') {
                if (x >= this.beam.supportA) {
                    moment += this.reactions.Ra * (x - this.beam.supportA);
                }
                if (x >= this.beam.supportB) {
                    moment += this.reactions.Rb * (x - this.beam.supportB);
                }
            } else if (this.beam.type === 'cantilever') {
                if (x >= this.beam.supportA) {
                    moment += this.reactions.Ra * (x - this.beam.supportA);
                }
            }

            // Subtract moments from point loads
            this.beam.pointLoads.forEach(load => {
                if (x >= load.position) {
                    moment -= load.magnitude * (x - load.position);
                }
            });

            // Subtract moments from distributed loads
            this.beam.distributedLoads.forEach(load => {
                if (x >= load.startPos) {
                    const endPos = Math.min(x, load.endPos);
                    const length = endPos - load.startPos;
                    if (length > 0) {
                        const avgLoad = (load.startLoad + load.endLoad) / 2;
                        const centroid = load.startPos + length / 2;
                        moment -= avgLoad * length * (x - centroid);
                    }
                }
            });

            // Add applied moments
            this.beam.moments.forEach(appliedMoment => {
                if (x >= appliedMoment.position) {
                    moment += appliedMoment.magnitude;
                }
            });

            // Inverter o sinal para seguir a convenção brasileira (positivo para baixo)
            points.push({ x, moment: -moment });
        }

        return points;
    }

    generateStepByStepEquations() {
        // Generate equations for each section of the beam
        const criticalPoints = [0];
        
        // Add all load positions as critical points
        this.beam.pointLoads.forEach(load => criticalPoints.push(load.position));
        this.beam.distributedLoads.forEach(load => {
            criticalPoints.push(load.startPos);
            criticalPoints.push(load.endPos);
        });
        this.beam.moments.forEach(moment => criticalPoints.push(moment.position));
        criticalPoints.push(this.beam.length);

        // Remove duplicates and sort
        const uniquePoints = [...new Set(criticalPoints)].sort((a, b) => a - b);

        // Generate equations for each section
        for (let i = 0; i < uniquePoints.length - 1; i++) {
            const startX = uniquePoints[i];
            const endX = uniquePoints[i + 1];
            const midX = (startX + endX) / 2;

            this.generateSectionEquations(startX, endX, midX, i + 1);
        }
    }

    generateSectionEquations(startX, endX, midX, sectionNum) {
        let shearEquation = "";
        let momentEquation = "";
        let shearValue = 0;
        let momentValue = 0;

        // Calculate shear and moment at midpoint
        if (this.beam.type === 'simply-supported' || this.beam.type === 'cantilever' || this.beam.type === 'fixed') {
            shearValue += this.reactions.Ra;
            momentValue += this.reactions.Ra * midX;
            shearEquation += `${this.reactions.Ra.toFixed(2)}`;
            momentEquation += `${this.reactions.Ra.toFixed(2)} × x`;
        }

        if (this.beam.type === 'cantilever' || this.beam.type === 'fixed') {
            momentValue += this.reactions.Ma;
            if (momentEquation) momentEquation += ` + ${this.reactions.Ma.toFixed(2)}`;
            else momentEquation += `${this.reactions.Ma.toFixed(2)}`;
        }

        // Subtract loads that occur before this section
        this.beam.pointLoads.forEach(load => {
            if (load.position <= startX) {
                shearValue -= load.magnitude;
                momentValue -= load.magnitude * (midX - load.position);
                shearEquation += ` - ${load.magnitude}`;
                momentEquation += ` - ${load.magnitude} × (x - ${load.position})`;
            }
        });

        this.stepByStepCalculations.push({
            title: `Seção ${sectionNum}: ${startX.toFixed(1)}m ≤ x ≤ ${endX.toFixed(1)}m`,
            content: "Equações para força cortante e momento fletor:",
            equations: [
                `V(x) = ${shearEquation || "0"}`,
                `V = ${shearValue.toFixed(2)} kN`,
                "",
                `M(x) = ${momentEquation || "0"}`,
                `M(${midX.toFixed(1)}) = ${momentValue.toFixed(2)} kNm`
            ]
        });
    }

    plotDiagrams() {
        const shearData = this.generateShearForceData();
        const momentData = this.generateBendingMomentData();

        // Plot Shear Force Diagram
        const shearTrace = {
            x: shearData.map(point => point.x),
            y: shearData.map(point => point.shear),
            type: 'scatter',
            mode: 'lines',
            name: 'Força Cortante',
            line: { color: '#dc3545', width: 3 }
        };

        const shearLayout = {
            title: 'Diagrama de Força Cortante (SFD)',
            xaxis: { title: 'Posição na Viga (m)' },
            yaxis: { title: 'Força Cortante (kN)' },
            showlegend: true,
            grid: true
        };

        Plotly.newPlot('shearForceDiagram', [shearTrace], shearLayout, { responsive: true });

        // Plot Bending Moment Diagram
        const momentTrace = {
            x: momentData.map(point => point.x),
            y: momentData.map(point => point.moment),
            type: 'scatter',
            mode: 'lines',
            name: 'Momento Fletor',
            line: { color: '#0d6efd', width: 3 }
        };

        const momentLayout = {
            title: 'Diagrama de Momento Fletor (BMD)',
            xaxis: { title: 'Posição na Viga (m)' },
            yaxis: { title: 'Momento Fletor (kNm)' },
            showlegend: true,
            grid: true
        };

        Plotly.newPlot('bendingMomentDiagram', [momentTrace], momentLayout, { responsive: true });
    }

    displayResults() {
        // Display reactions
        const reactionsDiv = document.getElementById('reactionsResults');
        let reactionsHTML = '<h5>Reações nos Apoios:</h5>';
        
        switch (this.beam.type) {
            case 'simply-supported':
                reactionsHTML += `
                    <p><strong>Ra (Apoio A):</strong> ${this.reactions.Ra.toFixed(2)} kN ↑</p>
                    <p><strong>Rb (Apoio B):</strong> ${this.reactions.Rb.toFixed(2)} kN ↑</p>
                `;
                break;
            case 'cantilever':
                reactionsHTML += `
                    <p><strong>Ra (Reação Vertical):</strong> ${this.reactions.Ra.toFixed(2)} kN ↑</p>
                    <p><strong>Ma (Momento de Engaste):</strong> ${this.reactions.Ma.toFixed(2)} kNm</p>
                `;
                break;
            case 'fixed':
                reactionsHTML += `
                    <p><strong>Ra (Apoio A):</strong> ${this.reactions.Ra.toFixed(2)} kN ↑</p>
                    <p><strong>Rb (Apoio B):</strong> ${this.reactions.Rb.toFixed(2)} kN ↑</p>
                    <p><strong>Ma (Momento A):</strong> ${this.reactions.Ma.toFixed(2)} kNm</p>
                    <p><strong>Mb (Momento B):</strong> ${this.reactions.Mb.toFixed(2)} kNm</p>
                `;
                break;
        }
        
        reactionsDiv.innerHTML = reactionsHTML;

        // Display step-by-step calculations
        const calculationsDiv = document.getElementById('stepByStepCalculations');
        let calculationsHTML = '';
        
        this.stepByStepCalculations.forEach(step => {
            calculationsHTML += `
                <div class="calculation-step">
                    <h6>${step.title}</h6>
                    <p>${step.content}</p>
                    ${step.equations.map(eq => `<div class="equation">${eq}</div>`).join('')}
                </div>
            `;
        });
        
        calculationsDiv.innerHTML = calculationsHTML;
    }

    calculate() {
        try {
            // Show loading state
            document.getElementById('calculateButton').classList.add('loading');
            
            // Collect input data
            this.collectInputData();
            
            // Validate inputs
            if (this.beam.length <= 0) {
                alert('Por favor, insira um comprimento válido para a viga.');
                return;
            }
            
            // Calculate reactions
            this.calculateReactions();
            
            // Generate step-by-step equations
            this.generateStepByStepEquations();
            
            // Display results
            this.displayResults();
            
            // Plot diagrams
            this.plotDiagrams();
            
        } catch (error) {
            console.error('Erro no cálculo:', error);
            alert('Ocorreu um erro durante o cálculo. Verifique os dados inseridos.');
        } finally {
            // Remove loading state
            document.getElementById('calculateButton').classList.remove('loading');
        }
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BeamCalculator();
});

