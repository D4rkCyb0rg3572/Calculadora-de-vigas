// Beam Calculator JavaScript - Vértice Engenharia
// Author: Vértice Engenharia Team
// Description: Complete structural beam calculator with SFD and BMD generation

class BeamCalculator {
    constructor() {
        this.beam = {
            length: 6,
            type: 'simply-supported',
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

        // Remove load buttons (event delegation)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-point-load')) {
                e.target.closest('.point-load-item').remove();
            }
            if (e.target.classList.contains('remove-distributed-load')) {
                e.target.closest('.distributed-load-item').remove();
            }
            if (e.target.classList.contains('remove-moment')) {
                e.target.closest('.moment-item').remove();
            }
        });
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
    }

    collectInputData() {
        // Get beam properties
        this.beam.length = parseFloat(document.getElementById('beamLength').value) || 6;
        this.beam.type = document.getElementById('beamType').value;

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
        const Rb = totalMoment / this.beam.length;
        const Ra = totalVerticalForce - Rb;

        this.reactions = { Ra, Rb, Ma: 0, Mb: 0 };

        this.stepByStepCalculations.push({
            title: "Cálculo das Reações - Viga Simplesmente Apoiada",
            content: "Para viga simplesmente apoiada com apoios em A (x=0) e B (x=L):",
            equations: [
                "ΣFy = Ra + Rb - ΣP = 0",
                `Ra + Rb = ${totalVerticalForce.toFixed(2)} kN`,
                "",
                "ΣMA = Rb × L - ΣP × x - ΣM = 0",
                `Rb × ${this.beam.length} = ${totalMoment.toFixed(2)}`,
                `Rb = ${totalMoment.toFixed(2)} / ${this.beam.length} = ${Rb.toFixed(2)} kN`,
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
            if (this.beam.type === 'simply-supported' || this.beam.type === 'cantilever' || this.beam.type === 'fixed') {
                if (x >= 0) shear += this.reactions.Ra;
                if (this.beam.type === 'simply-supported' && x >= this.beam.length) shear += this.reactions.Rb;
                if (this.beam.type === 'fixed' && x >= this.beam.length) shear += this.reactions.Rb;
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
            if (this.beam.type === 'simply-supported' || this.beam.type === 'cantilever' || this.beam.type === 'fixed') {
                moment += this.reactions.Ra * x;
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

            points.push({ x, moment });
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

