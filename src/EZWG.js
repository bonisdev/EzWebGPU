// webgpu-ca.js

const global = typeof window !== 'undefined' ? window : null;
const ssr = global === null;

// Save a couple of long function names that are used frequently.
// This optimization saves around 400 bytes.
const addEventListener = 'addEventListener';
const removeEventListener = 'removeEventListener';
const getBoundingClientRect = 'getBoundingClientRect';

// CellularAutomataConfig class definition      //used:  https://highlight.hohli.com/?theme=github
class EZWG {


    static ALL_ZERO = 0
    static ALL_RANDS = 1
    static ALL_BINS = 2

    constructor( config = {}) {
 

        // Define default values
        const defaults = {
            BUFFER_DATA_TYPE: 'f32',
            CELL_VALS: 1,
            CHUNK_SIZE: 64,
            CHUNKS_ACROSS: 1,
            PARTS_ACROSS: 1,
            READ_BACK_FREQ: -1,
            CONTAINER_ID: 'putcahhere',
            RAND_SEED: 's'+Date.now() + "L" + Math.random(),
            STARTING_CONFIG: EZWG.ALL_ZERO,
            COMPUTE_WGSL: '',
            FRAGMENT_WGSL: '',
            READ_BACK_FUNC: ( currentStep, entireBuffer ) => {},
            CELL_SIZE: 8
        };
 
        // Merge defaults with the provided config
        this.config = { ...defaults, ...config };
 
        // Assign values to instance variables with type checks
        this.BUFFER_DATA_TYPE = this.config.BUFFER_DATA_TYPE;
        this.CELL_VALS = this._validatePositiveInteger(this.config.CELL_VALS, 'CELL_VALS');
        this.CHUNK_SIZE = this._validatePositiveInteger(this.config.CHUNK_SIZE, 'CHUNK_SIZE');
        this.CHUNKS_ACROSS = this._validatePositiveInteger(this.config.CHUNKS_ACROSS, 'CHUNKS_ACROSS');
        this.PARTS_ACROSS = this._validatePositiveInteger(this.config.PARTS_ACROSS, 'PARTS_ACROSS');
        this.READ_BACK_FREQ = this._validateInteger(this.config.READ_BACK_FREQ, 'READ_BACK_FREQ');
        this.CONTAINER_ID = this._validateNonEmptyString(this.config.CONTAINER_ID, 'CONTAINER_ID');
        this.RAND_SEED = this._validateNonEmptyString(this.config.RAND_SEED, 'RAND_SEED');
        this.STARTING_CONFIG = this._validateInteger(this.config.STARTING_CONFIG, 'STARTING_CONFIG');
        this.COMPUTE_WGSL = this._validateString(this.config.COMPUTE_WGSL, 'COMPUTE_WGSL');
        this.FRAGMENT_WGSL = this._validateString(this.config.FRAGMENT_WGSL, 'FRAGMENT_WGSL');
        this.READ_BACK_FUNC = this.config.READ_BACK_FUNC;
        this.CELL_SIZE = this._validatePositiveInteger(this.config.CELL_SIZE, 'CELL_SIZE');


        this.RAND = new PseudRand( this.RAND_SEED );



        // Game time specific variables
        //128 x 128
        this.GRID_SIZE = (this.CHUNK_SIZE * this.CHUNKS_ACROSS)
        this.TOTAL_CELLS = this.GRID_SIZE * this.GRID_SIZE 
        this.UPDATE_INTERVAL = 50
        this.WORKGROUP_SIZE = 8

        this.USER_INPUT_BUFFER_SIZE = 8*8
		this.EXTRA_CONFIG_STORAGE_SIZE = 250;//445111;//67000;//128*128;//100000;//512*512;

        this.loaded = false;
        this.READ_BUFFER_BUSY = false;
        this.step = 0;
        this.flaggedForDeath = false;

        this.canvas = null;
        this.context = null


        this.userInputTempStorage = null
        this.simulationPipeline = null
        this.bindGroups = []

        this.cellStateArray = []

        this.device = null
        this.cellPipeline = null
        this.vertexBuffer = null
        this.vertices = []              // will end up being the square you draw over and over again (TODO look and see if drawing 2 triangle everytime for each thing

        this.cellStateStorageForRead = []

        this.cellStateStorage = []

 

        this.CELL_STIM_LOCATIONS = 4;  


        this.dragStartX = -1
        this.dragStartY = -1
        this.isDragging = false;
        this.LAST_CELL_X = -1
        this.LAST_CELL_Y = -1
  
    }

    killdeath(){
        
        if (this.device) {
            this.vertexBuffer?.destroy();
            this.cellStateStorage?.forEach(buffer => buffer?.destroy());
            this.userInputTempStorage?.destroy();
            this.cellStateStorageForRead?.destroy();
            this.device = null;
            this.context = null;

            // Remove canvas
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }

    async init() {
        if (!('gpu' in navigator)) {
            document.addEventListener('DOMContentLoaded', () => this._createNoWebGPUCanvas());
        }
        else{
            await this.getInsideThere()
        }
        // Additional initialization logic for WebGPU compatible environments
    }

    // Method to validate positive integers
    _validatePositiveInteger(value, propertyName) {
        if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
            throw new Error(`${propertyName} must be a positive integer`);
        }
        return value;
    }
    // Method to validate positive integers
    _validateInteger(value, propertyName) {
        if ( !Number.isInteger(value) ) {
            throw new Error(`${propertyName} must be a   integer`);
        }
        return value;
    }
    // Method to validate non-empty strings
    _validateNonEmptyString(value, propertyName) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            throw new Error(`${propertyName} must be a non-empty string`);
        }
        return value;
    }
    // Method to validate non-empty strings
    _validateString(value, propertyName) {
        if (typeof value !== 'string' ) {
            throw new Error(`${propertyName} must be a non-empty string`);
        }
        return value;
    }


    // Method to create a canvas if WebGPU is not supported
    _createNoWebGPUCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 400;
        this.canvas.height = 400;
        document.body.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');
        this.context.fillStyle = 'gray';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const text = 'no web gpu detected';
        const fontSize = 20;
        this.context.font = `${fontSize}px Arial`;

        let offsetX = 0;
        let offsetY = 0;

        const drawText = (timestamp) => {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = 'gray';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            function pseudoRandom(x, y, t) {
                // A simple pseudo-random function
                return Math.sin(x * 12.9898 + y * 78.233 + t * 0.5) * 43758.5453 % 1;
            }
            
            for (let i = 0; i < this.canvas.height / fontSize; i++) {
                for (let j = 0; j < this.canvas.width / fontSize; j++) {
                    const pulse = Math.sin((timestamp + (i + j) * 100) / 500) * 0.5 + 0.5;
                    this.context.fillStyle = `rgba(255, 0, 0, ${pulse})`;
            
                    const angle = (timestamp / 1000) % (2 * Math.PI);
                    
                    // Add deterministic randomness
                    const offsetX = (pseudoRandom(i, j, timestamp) - 0.5) * 10; // Adjust the multiplier for more/less spread
                    const offsetY = (pseudoRandom(i + 1, j + 1, timestamp) - 0.5) * 10; // Adjust the multiplier for more/less spread
            
                    const x = j * fontSize + offsetX;
                    const y = i * fontSize + fontSize + offsetY;
            
                    this.context.save();
                    this.context.translate(x, y);
                    this.context.rotate(angle);
                    this.context.fillText(text, -this.context.measureText(text).width / 2, 0);
                    this.context.restore();
                }
            }
            

            offsetX += 1;
            offsetY += 1;
            if (offsetX > this.canvas.width) offsetX = 0;
            if (offsetY > this.canvas.height) offsetY = 0;

            requestAnimationFrame(drawText);
        };

        requestAnimationFrame(drawText);
    }

    // The loading logic, buckle up
    async getInsideThere(){

 
        // Navigator i guess?
        if (!navigator.gpu) {
            document.getElementById("ucantplay").classList.remove("hidden");
            document.getElementById("canvas2hide").classList.add("hidden");
            throw new Error("WebGPU not supported on this browser.");
        }
        else{
            console.log('isogsodo')
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            this._createNoWebGPUCanvas()
            throw new Error("No appropriate GPUAdapter found.");
        }
        else{
            console.log('is good')
        } 


 
        this.canvas = document.createElement('canvas'); 

        
		//canvas.addEventListener( 'click', handleClick );
		this.canvas.addEventListener('mousedown', (event) => handleMouseDown(event, this.canvas, this));
		//canvas.addEventListener('mousemove', handleMouseMove);
		this.canvas.addEventListener('mouseup', (event) => handleMouseUp(event, this.canvas, this));
        this.canvas.addEventListener('keydown', (event) => handleKeyDown(event, this.canvas, this));


		this.canvas.width = this.GRID_SIZE * this.CELL_SIZE;
		this.canvas.height = this.GRID_SIZE *  this.CELL_SIZE
		this.canvas.style.width = this.GRID_SIZE *  this.CELL_SIZE
		this.canvas.style.height = this.GRID_SIZE *  this.CELL_SIZE
        console.log(this.CONTAINER_ID)
        let daparent = document.getElementById(this.CONTAINER_ID)
        if( !daparent ) new Error("The parent container with ID " + this.CONTAINER_ID+ "for EzWebGPU is not found");
        daparent.appendChild(this.canvas)


 
		if (!adapter) { 
			throw new Error("No appropriate GPUAdapter found!!!!5545445");
		}
		this.device = await adapter.requestDevice(); 
		this.context = this.canvas.getContext("webgpu");
		const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
		this.context.configure({
			device: this.device,
			format: canvasFormat,
		});

		const PUstructType = [
			{ name: "position", type: "vec3" },
			{ name: "color", type: "vec4" }
		];
        this.vertices = new Float32Array([ 
			// X,    Y
			//-1, -1, // Triangle 1
			//1, -1,
			//1,  1, 
			//-1, -1, // Triangle 2
			//1,  1,
			//-1,  1,

            -1*(1/this.PARTS_ACROSS), -1*(1/this.PARTS_ACROSS), // Triangle 1
			1*(1/this.PARTS_ACROSS), -1*(1/this.PARTS_ACROSS),
			1*(1/this.PARTS_ACROSS),  1*(1/this.PARTS_ACROSS), 
			-1*(1/this.PARTS_ACROSS), -1*(1/this.PARTS_ACROSS), // Triangle 2
			1*(1/this.PARTS_ACROSS),  1*(1/this.PARTS_ACROSS),
			-1*(1/this.PARTS_ACROSS),  1*(1/this.PARTS_ACROSS),
 
            //// Front face
            //-1, -1, 1,  // Vertex 0
            //1, -1, 1,   // Vertex 1
            //1, 1, 1,    // Vertex 2
            //-1, 1, 1,   // Vertex 3 
            //// Right face
            //1, -1, 1,   // Vertex 4 (Same as Vertex 1 of Front face)
            //1, -1, -1,  // Vertex 5
            //1, 1, -1,   // Vertex 6
            //1, 1, 1,    // Vertex 7 (Same as Vertex 2 of Front face) 
            //// Top face
            //-1, 1, 1,   // Vertex 8 (Same as Vertex 3 of Front face)
            //1, 1, 1,    // Vertex 9 (Same as Vertex 2 of Front face)
            //1, 1, -1,   // Vertex 10
            //-1, 1, -1,  // Vertex 11
		]);
		// SWUARE DEFINTION
		const vertexBufferLayout = {
			arrayStride: 8,//  2 x 4 byte coordinates = 8
			attributes: [{
				format: "float32x2",//"uint16x4"  <- another possible config
				offset: 0,
				shaderLocation: 0, // Position. Matches @location(0) in the @vertex shader.
			}],
		};
		this.vertexBuffer = this.device.createBuffer({
			label: "Cell this.vertices",
			size: this.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer( this.vertexBuffer, /*buffer offset :o*/0, this.vertices );
 














        // Create the bind group layout and pipeline layout.
		const bindGroupLayout = this.device.createBindGroupLayout({
			label: "Cell Bind Group Layout",
			entries: [
				{
					binding: 0,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
					buffer: {} // Grid uniform buffer
				}, 
				{
					binding: 1,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" } // Cell state input buffer
				}, 
				{
					binding: 2,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" } // Cell state output buffer
				}, 
				{
					binding: 3,
					visibility: GPUShaderStage.COMPUTE,
					buffer: { type: "storage" } // user input
				}, 
				{
					binding: 4,
					visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
					buffer: { type: "read-only-storage" } // large static block of config numbers
				}
                //,
				//{
				//	binding: 5,
				//	visibility: GPUShaderStage.COMPUTE,
				//	buffer: { type: "storage" } // Cell state output buffer
				//}
			]
		});

		const pipelineLayout = this.device.createPipelineLayout({
			label: "Cell Pipeline Layout",
			bindGroupLayouts: [ bindGroupLayout ],
		});

        var cellShaderWSGL = `
			struct VertexOutput {
				@builtin(position) position: vec4f,
				@location(0) cell: vec2f,
				@location(1) rVal: f32,
				@location(2) gVal: f32,
				@location(3) bVal: f32
			};

			@group(0) @binding(0) var<uniform> grid: vec2f;
			@group(0) @binding(1) var<storage> cellState: array<f32>; 
			@group(0) @binding(4) var<storage> EZ_EXTRA_VALS: array<f32>;

			@vertex
			fn vertexMain(@location(0) position: vec2f, @builtin(instance_index) instance: u32) -> VertexOutput {
				var output: VertexOutput;
				// let corrected_instance = f32(instance);
				let i = f32(instance);
                let caW: f32 = `+this.PARTS_ACROSS+`f;
                let caWu: u32 = `+this.PARTS_ACROSS+`u;

                // Global Grid meta
                var rawCol: u32 = instance % u32(grid.x * caW);
                var rawRow: u32 = instance / u32(grid.x * caW); 

				let cell = vec2f( f32(rawCol / caWu), f32(rawRow / caWu) );

                // Component metas
                var cmpix: u32 = instance % caWu;
                var cmpiy: u32 = (instance / u32(grid.x * caW)) % caWu;
                var cmpind: u32 = cmpix + cmpiy * caWu;


                // Gets you to the center of the cell
				let cellOffset = cell / grid * 2;

                
				var gridPos = (position+1) / grid - 1 + cellOffset;

                
                // Now THIS: gets you to the top left of the components now
                // (subtract 1 / cellWidth/2 to and then multiply by how many components dep ur in)
                var clsxe: f32 = (1 / grid.x) * 2;
                var clsye: f32 = (1 / grid.x) * 2;// CELL SIZE
                var smlDx: f32 = (1/caW) * clsxe;
                var smlDy: f32 = (1/caW) * clsye;

                gridPos.x = gridPos.x + (f32(cmpix) * smlDx) - (clsxe*0.5) + smlDx/2;
                gridPos.y = gridPos.y + (f32(cmpiy) * smlDy) - (clsye*0.5) + smlDy/2;

				output.position = vec4f(gridPos, 0, 1);
				output.cell = cell / (grid*1);
				
                //--------------------------------------------------------- Newly added to sort
                const numJooses: u32 = `+this.CELL_VALS+`u; 
                const CHUNK_SIZE: u32 = `+this.CHUNK_SIZE+`u;
                const CHUNKS_ACROSS: u32 = `+this.CHUNKS_ACROSS+`u; 

                const EZ_cellParts: u32 = `+this.PARTS_ACROSS+`u; 
                
                var EZ_CHUNK_X: u32 = ( u32(instance/2) / (CHUNK_SIZE) ) % CHUNKS_ACROSS;
                var EZ_CHUNK_Y: u32 = ( u32(instance/2) / (CHUNK_SIZE*CHUNKS_ACROSS) );
                EZ_CHUNK_Y = (EZ_CHUNK_Y / CHUNK_SIZE) % CHUNKS_ACROSS;
    


                var rebuilt_instance: u32 = u32(cell.x) + u32(cell.y) * u32(grid.y);
                

                var EZ_CHUNK_IND: u32 = (EZ_CHUNK_X  + EZ_CHUNK_Y * CHUNKS_ACROSS);

                ` + this.FRAGMENT_WGSL + `
				

				return output;
			}

			@fragment
			fn fragmentMain(input: VertexOutput) -> @location(0) vec4f { 
				return vec4f( input.rVal, input.gVal, input.bVal, 1);
			}
		`;
 

		// Create the shader that will render the cells.
		const cellShaderModule = this.device.createShaderModule({
			label: "Cell shader",
			code: cellShaderWSGL
		});

		// Create a pipeline that renders the cell.
		this.cellPipeline = this.device.createRenderPipeline({
			label: "Cell pipeline",
			layout: pipelineLayout,
			vertex: {
				module: cellShaderModule,
				entryPoint: "vertexMain",
				buffers: [ vertexBufferLayout ]
			},
			fragment: {
				module: cellShaderModule,
				entryPoint: "fragmentMain",
				targets: [ {
					format: canvasFormat
				} ]
			}
		});






















        let simulationWSGLCode = `
			@group(0) @binding(0) var<uniform> grid: vec2f;

			@group(0) @binding(1) var<storage> EZ_STATE_IN: array<f32>;
			@group(0) @binding(2) var<storage, read_write> EZ_STATE_OUT: array<f32>;
			@group(0) @binding(3) var<storage, read_write> EZ_USER_INPUT: array<f32>;
			@group(0) @binding(4) var<storage> EZ_EXTRA_VALS: array<f32>;

			fn cellIndex(cell: vec2u) -> u32 {
				//let sze: u32 = 
				return ((cell.y+u32(grid.y)) % u32(grid.y)) * u32(grid.x) + ((cell.x+u32(grid.x)) % u32(grid.x));
			}
            fn cellIndexChk(cell: vec2u, ogcx: u32, ogcy: u32, chk: u32) -> u32 { 

                var nuCellX: u32 = cell.x;
                var nuCellY: u32 = cell.y;


                // Internal chunk wrap before the big external wrap
                nuCellX = nuCellX % chk;
                nuCellX = nuCellX + ogcx * chk;

                nuCellY = nuCellY % chk;
                nuCellY = nuCellY + ogcy * chk;

                
				return ((nuCellY+u32(grid.y)) % u32(grid.y)) * u32(grid.x) + ((nuCellX+u32(grid.x)) % u32(grid.x));   
			}
            
            fn cellIndexChkRel(cell: vec2u, ogcx: u32, ogcy: u32, chk: u32) -> u32 { 

                var nuCellX: u32 = cell.x + (ogcx*chk);
                var nuCellY: u32 = cell.y + (ogcy*chk);


                // Internal chunk wrap before the big external wrap
                //nuCellX = (nuCellX/ % chk;
                //nuCellX = nuCellX + ogcx * chk;

                //nuCellY = nuCellY % chk;
                //nuCellY = nuCellY + ogcy * chk;

                
				return ((nuCellY+u32(grid.y)) % u32(grid.y)) * u32(grid.x) + ((nuCellX+u32(grid.x)) % u32(grid.x));   
			}

			fn cellAttVal(x: u32, y: u32, att: u32) -> f32 {
				return EZ_STATE_IN[ att * u32( grid.x * grid.y ) + cellIndex(vec2(x, y)) ];
			}

            
			fn cellAttValChunk(x: u32, y: u32, att: u32, ocx: u32, ocy: u32, chks: u32) -> f32 {
				return EZ_STATE_IN[ att * u32( grid.x * grid.y ) + cellIndexChk(vec2(x, y), ocx, ocy, chks) ];
			}
            // Multiply the x and the y by chunk location
            fn cellAttValChunkRelative(x: u32, y: u32, att: u32, ocx: u32, ocy: u32, chks: u32) -> f32 {
				return EZ_STATE_IN[ att * u32( grid.x * grid.y ) + cellIndexChkRel(vec2( x, y), ocx, ocy, chks)  ];
			}

            fn getSwingWeight( rawWeght: f32 ) -> f32 {
                return ( rawWeght * 2.0) - 1.0;
            }

			fn celldAttVal(x: u32, y: u32, att: u32) -> f32 {
                return EZ_STATE_IN[ att * u32( grid.x * grid.y ) + cellIndex(vec2(x, y)) ];
            }

			@compute @workgroup_size( ${this.WORKGROUP_SIZE}, ${this.WORKGROUP_SIZE} )
			fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
                 
                let EZ_TOTAL_CELLS = u32(grid.x * grid.y);
                let EZ_CELL_IND = cellIndex(cell.xy);

                const EZ_CELL_VALS: u32  = `+this.CELL_VALS+`u;

                //const stimStations = `+this.CELL_STIM_LOCATIONS+`u;

                const EZ_CHUNK_SIZE: u32 = `+this.CHUNK_SIZE+`u;
                const EZ_CHUNKS_ACROSS: u32 = `+this.CHUNKS_ACROSS+`u; 
    
                var EZ_CHUNK_X: u32 = cell.x / EZ_CHUNK_SIZE;
                var EZ_CHUNK_Y: u32 = cell.y / EZ_CHUNK_SIZE;
 

                // The chunk shift
                var EZ_CHUNK_IND: u32 = EZ_CHUNK_X + EZ_CHUNK_Y*EZ_CHUNKS_ACROSS;

                ` + this.COMPUTE_WGSL + `

				if( 4 > 5 ){
                    // 'incrementer' variable for each f32 or u32 value in memory
                    var i_EZ_userInputCounter: u32 = 0u;
                    loop {
                        if i_EZ_userInputCounter >= EZ_CELL_VALS { break; }

                        let EZ_lastInputToChange         = EZ_TOTAL_CELLS * i_EZ_userInputCounter + EZ_CELL_IND;  

                        var nuVal: f32 = EZ_STATE_IN[EZ_lastInputToChange];

                        // Get the min max of the input coordinattres
                        var minX: u32 = min( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
                        var maxX: u32 = max( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
                        var minY: u32 = min( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
                        var maxY: u32 = max( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
                        if( EZ_USER_INPUT[6] > 0 ){
                            if( cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY ){
                                EZ_STATE_OUT[ EZ_lastInputToChange ] = 1; 
                            }
                            else{
                                EZ_STATE_OUT[ EZ_lastInputToChange ] = nuVal; 
                            }
                        }
                        else{
                            EZ_STATE_OUT[ EZ_lastInputToChange ] = nuVal; 
                        }
                        i_EZ_userInputCounter++;
                    }
                }

			}
		`;
  
		// Create the compute shader that will process the game of life simulation.
		const simulationShaderModule = this.device.createShaderModule({
			label: "Life simulation shader",
			code: simulationWSGLCode
		});

		// Create a compute pipeline that updates the game state.
		this.simulationPipeline = this.device.createComputePipeline({
			label: "Simulation pipeline",
			layout: pipelineLayout,
			compute: {
				module: simulationShaderModule,
				entryPoint: "computeMain",
			}
		});

		// Create a uniform buffer that describes the grid.
		const uniformArray = new Float32Array([ this.GRID_SIZE, this.GRID_SIZE ]);
		const uniformBuffer = this.device.createBuffer({
			label: "Grid Uniforms",
			size: uniformArray.byteLength,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});
		this.device.queue.writeBuffer( uniformBuffer, 0, uniformArray );


















		

		// Create an array representing the active state of each cell.
		let dbug_cell_state_buffer_info=false;
		this.cellStateArray = (new Float32Array( this.TOTAL_CELLS * this.CELL_VALS )).fill(0);
		if(dbug_cell_state_buffer_info)console.log('seeed', this.RAND_SEED);
		if(dbug_cell_state_buffer_info)console.log('this.cellStateArray.byteLength', this.cellStateArray.byteLength);
		if(dbug_cell_state_buffer_info)console.log('4 bytes times:', this.CELL_VALS );
		if(dbug_cell_state_buffer_info)console.log('Grid length', this.GRID_SIZE);
		if(dbug_cell_state_buffer_info)console.log('Total cells ', this.TOTAL_CELLS);

		// Create two storage buffers to hold the cell state.
		this.cellStateStorage = [
			this.device.createBuffer({
				label: "Cell State A",
				size: this.cellStateArray.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
			}),
			this.device.createBuffer({
				label: "Cell State B",
				size: this.cellStateArray.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC, //GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			})
		];

		//0-mouseX pos, 1-mouseY pos, 2- special inst, 3-specialinst
        // This the one that gets changed on the CPU side and is red in
        this.liveInput = ( new Float32Array( this.USER_INPUT_BUFFER_SIZE ) ).fill(0);
		this.userInputTempStorage = 
			this.device.createBuffer({
				label: "Temp User Input 1",
				size: this.liveInput.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		this.device.queue.writeBuffer( this.userInputTempStorage, 0, this.liveInput );




















        //64x64 must be >
		//38x38 joos types + 38 decay vals + 38 squirt vals
		const extraConfigValStorage = new Float32Array( this.EXTRA_CONFIG_STORAGE_SIZE   );//[1.0, 1.0, 1.0, 1.0 ]);

        // NOTE::: allocation
        // If there are juices; (39)
        // 128x128      16,384  
        // wghts     wghts     sqrtVal    decayVal      drawWghts
        // 39x39     39x39     1x39       1x39          3(rgb)x39

        let spind = 0; 
		var randForWghts = new PseudRand( 'board' + this.RAND_SEED  );
		for(let v = 0;v < extraConfigValStorage.length;v++){

            if(v < this.EXTRA_CONFIG_STORAGE_SIZE ) {
                extraConfigValStorage[v] = randForWghts.random();
            }
            else if(true){
                extraConfigValStorage[v] = randForWghts.random();
                // extraConfigValStorage[v] = sprites[spind]
                // spind++;
            }
        }
		const extraConfigStorage = 
			this.device.createBuffer({
				label: "Extra config sotrage",
				size: extraConfigValStorage.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
			});
		this.device.queue.writeBuffer( extraConfigStorage, 0, extraConfigValStorage );


        
        // Create the buffer you do the async read back to the CPu from: 
        this.cellStateStorageForRead = 
            this.device.createBuffer({
                label: "Cell State C",
                size: this.cellStateArray.byteLength,
				usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST
                // usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
            });
        //this.device.queue.writeBuffer( cellStateStorageForRead, 0, this.cellStateArray );

		// Set each cell to a random state, then copy the JavaScript array into
		// the storage buffer.
		//for (let i = 0; i < TOTAL_CELLS; i++) {
		//    this.cellStateArray[i] = Math.random() > 0.66 ? 1 : 0;
		//}
		// Add the extra bit of information per cell+
		

		//this.initTheInitialCellStateArray_withNeighbours( this.cellStateArray, this.RAND_SEED, this.GRID_SIZE );
		
        if( this.STARTING_CONFIG === EZWG.ALL_RANDS){
            this.initTheInitialCellStateAllRand( this.cellStateArray, this.RAND_SEED, this.GRID_SIZE );
        }
        else if( this.STARTING_CONFIG === EZWG.ALL_BINS){
            this.initTheInitialCellStateAllRandBins( this.cellStateArray, this.RAND_SEED, this.GRID_SIZE );
        }
        else{//if( this.STARTING_CONFIG === EZWG.ALL_ZERO){
            this.initTheInitialCellStateAllZeros( this.cellStateArray, this.RAND_SEED, this.GRID_SIZE );
        }
 
		this.device.queue.writeBuffer( this.cellStateStorage[0], 0, this.cellStateArray );


		// Create a bind group to pass the grid uniforms into the pipeline
		this.bindGroups = [
			this.device.createBindGroup({
				label: "Cell renderer bind group A",
				layout: bindGroupLayout,
				entries: [{
					binding: 0,
					resource: { buffer: uniformBuffer }
				}, {
					binding: 1,
					resource: { buffer: this.cellStateStorage[0] }
				}, {
					binding: 2,
					resource: { buffer: this.cellStateStorage[1] }
				}, {
					binding: 3,
					resource: { buffer: this.userInputTempStorage }
				}, {
					binding: 4,
					resource: { buffer: extraConfigStorage }
				}
                ],
			}),
			this.device.createBindGroup({
				label: "Cell renderer bind group B",
				layout: bindGroupLayout,
				entries: [{
					binding: 0,
					resource: { buffer: uniformBuffer }
				}, {
					binding: 1,
					resource: { buffer: this.cellStateStorage[1] }
				}, {
					binding: 2,
					resource: { buffer: this.cellStateStorage[0] }
				}, {
					binding: 3,
					resource: { buffer: this.userInputTempStorage }
				}, {
					binding: 4,
					resource: { buffer: extraConfigStorage }
				}
                ],
			}),
		];



        this.loaded = true;
        //and call back?
    }

    // Do a full pass
    run(){
        if( !this.READ_BUFFER_BUSY){  

            let encoder = this.device.createCommandEncoder();
            // Start a compute pass
            let computePass = encoder.beginComputePass();

            // Write value of the buffer w users values 
            this.device.queue.writeBuffer( this.userInputTempStorage, 0, this.liveInput);
            this.liveInput[6] = 0;

            //}
            //// The real indicator is userIn
            //else{
            //	let deadInput = ( new Float32Array( USER_INPUT_BUFFER_SIZE) ).fill( 0.0 );
            //	this.device.queue.writeBuffer( userInputTempStorage, 0, deadInput);
            //}

            computePass.setPipeline( this.simulationPipeline ); 
            computePass.setBindGroup( 0, this.bindGroups[ this.step % 2 ] );

            let workgroupCount = Math.ceil( this.GRID_SIZE / this.WORKGROUP_SIZE );
            computePass.dispatchWorkgroups( workgroupCount, workgroupCount );
            computePass.end();


            
            // const resolveBuffer = this.device.createBuffer({
            //     size: 16,
            //     usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
            // });
            // encoder.resolveQuerySet(myQuerySet, 0, 2, resolveBuffer, 0); 
            // // Currently, we have to create a separate GPUBuffer mapped for reading and use copyBufferToBuffer()...
            // const resultBuffer = this.device.createBuffer({
            //     size: 16,
            //     usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            // });
            // encoder.copyBufferToBuffer(resolveBuffer, 0, resultBuffer, 0, 16);

            let doReadBack = false;
            const encoder_cpu_helper = this.device.createCommandEncoder();
 
            if(this.READ_BACK_FREQ> -1 && (this.step % this.READ_BACK_FREQ === 0)){ 
                doReadBack = true; 

                // Copy output buffer to staging buffer
                encoder_cpu_helper.copyBufferToBuffer(
                    this.cellStateStorage[((this.step+1) % 2)], 0, // Source offset
                    this.cellStateStorageForRead, 0, // Destination offset
                    this.cellStateArray.byteLength
                );
                //this.device.queue.submit( encoder_cpu_helper ); 
            }




            this.step++; // Increment the this.step count

            // Start a render pass
            const pass = encoder.beginRenderPass( {
                colorAttachments: [ {
                    view: this.context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },//{ r: 0, g: 0, b: 0.4, a: 1.0 },
                    storeOp: "store",
                } ]
            } );

            // Draw the grid.
            pass.setPipeline( this.cellPipeline );
            pass.setBindGroup( 0, this.bindGroups[ this.step % 2 ] ); // Updated!
            pass.setVertexBuffer( 0, this.vertexBuffer );
            pass.draw( this.vertices.length / 2, this.GRID_SIZE * this.GRID_SIZE * (this.PARTS_ACROSS*this.PARTS_ACROSS) );

            // End the render pass and submit the command buffer
            pass.end();

            if( doReadBack === true ){
                this.device.queue.submit( [
                    encoder.finish(),
                    encoder_cpu_helper.finish()
                ] );
                this.READ_BUFFER_BUSY = true;

                
                // Map the staging buffer
                this.cellStateStorageForRead.mapAsync( GPUMapMode.READ, 0, this.cellStateArray.byteLength ).then(mappedStaginBuffer => {
                    // Read and print the contents 
                    let remaped = this.cellStateStorageForRead.getMappedRange( 0, this.cellStateArray.byteLength );
                    let arrayBufferToAnalyse = remaped.slice(0);
                    //let theUi8 = new Uint8Array( dudata );
                    
                    let float32ArrayBuffer = new Float32Array(arrayBufferToAnalyse); 

                    //console.log(float32ArrayBuffer)
                    //goThroughF32ValsAndReprint( float32ArrayBuffer, this );
                    this.READ_BACK_FUNC( this.step, float32ArrayBuffer )

                    this.cellStateStorageForRead.unmap();
                    this.READ_BUFFER_BUSY = false;
                }).catch( error => {
                    console.log('errrr mapping ', error);
                });
                

            }
            else{
                this.device.queue.submit( [ encoder.finish() ] );
            }

            
            //console.log("this.step==>", this.step);
            //console.log(resultBuffer);
            //https://developer.mozilla.org/en-US/docs/Web/API/GPUQuerySet
            //https://github.com/gpuweb/gpuweb/issues/4383
            //what da spruce man

        }
        else{
            console.log('READ BUFFER BUSY: ', this.READ_BUFFER_BUSY, 'at time index', this.step)
        }

    }
 

    // Called to initiate the values in the grid.
    initTheInitialCellStateArray_withNeighbours( cellStateArray, seeed, grid_size ){
        let nuSeed = 'insI2' + seeed;
        
        let rand = new PseudRand( nuSeed  );

        // Intiial bullshi
        for(let ii = 0;ii < this.CHUNKS_ACROSS;ii++){
            for(let jj = 0;jj < this.CHUNKS_ACROSS;jj++){
                
                let offX = ii * this.CHUNK_SIZE;
                let offY = jj * this.CHUNK_SIZE;

                for(let kk = 0;kk < 2;kk++){

                    let theX = Math.floor(rand.random()*this.CHUNK_SIZE) + offX;//locations[k].x;
                    let theY = Math.floor(rand.random()*this.CHUNK_SIZE) + offY;//locations[k].y;

                    for(let rg = 0;rg < 256;rg++){
                        if(rand.random() < 0.42){
                            for(let c = 0;c < this.CELL_VALS;c++){
                                cellStateArray[
                                    (theX+Math.floor(rg/16))*grid_size + (theY+(rg%16)) + c*(grid_size*grid_size)
                                ] = rand.random()<0.5?rand.random():1.0;
                            }
                        }
                    } 
                }
            }
        } 
        
        // Set the neighbours
        for(let xx = 0;xx < this.CHUNKS_ACROSS;xx++){
            for(let yy = 0;yy < this.CHUNKS_ACROSS;yy++){

                
                let offX = xx * this.CHUNK_SIZE;
                let offY = yy * this.CHUNK_SIZE;

                for(let ii = 0;ii < this.CHUNK_SIZE;ii++){
                    for(let jj = 0;jj < this.CHUNK_SIZE;jj++){

                        let theX = Math.floor(ii) + offX;
                        let theY = Math.floor(jj) + offY;
                        let nOffset = 0+Math.floor( rand.random()*259 );//4;//
                        
                        let nnn = 0;
                        for(let c = this.joosValuesPerCell;c < this.CELL_VALS;c++){
                            let wrapNeighbour = (nnn + nOffset)%9;
                            
                            //if( xx === 0 && yy === 1 && ii === 23 && jj === 12){
                            //    console.log('wrapNeighbour', wrapNeighbour, 'c', c);
                            //}

                            if( wrapNeighbour === 4 ){
                                c--;// just skip this middle one of (3x3)
                                    // this works because 'nnn' increases even thouugh this goes back
                            }
                            else{
                                let ngh_offx = Math.floor((wrapNeighbour)%3) - 1;
                                let ngh_offy = Math.floor((wrapNeighbour)/3) - 1;
                                //ngh_offx += ngh_offy;
                                //ngh_offy = 0;
                                cellStateArray[
                                    (theX) + (theY*grid_size) + c*(grid_size*grid_size)
                                ] = ( (ii+this.CHUNK_SIZE+ngh_offx) % this.CHUNK_SIZE ) +
                                    ( (jj+this.CHUNK_SIZE+ngh_offy) % this.CHUNK_SIZE ) * 1000;
                            }

                            
                            nnn++;
                        }


                    }
                }

            }
        } 
    }
    initTheInitialCellStateAllRand( cellStateArray, seeed, grid_size ){
        let nuSeed = 'insI2' + seeed;
        let rand = new PseudRand( nuSeed );
        let daBigONe = this.CHUNKS_ACROSS * this.CHUNKS_ACROSS * this.CHUNK_SIZE * this.CHUNK_SIZE
        for(let ii = 0;ii < daBigONe;ii++){ 
            for(let c = 0;c < this.CELL_VALS;c++){
                cellStateArray[
                    ii + c*(grid_size*grid_size)
                ] =  rand.random();
            } 
        }
    }
    initTheInitialCellStateAllRandBins( cellStateArray, seeed, grid_size ){
        let nuSeed = 'insI2' + seeed;
        let rand = new PseudRand( nuSeed );
        let daBigONe = this.CHUNKS_ACROSS * this.CHUNKS_ACROSS * this.CHUNK_SIZE * this.CHUNK_SIZE
        for(let ii = 0;ii < daBigONe;ii++){
            for(let c = 0;c < this.CELL_VALS;c++){
                cellStateArray[
                    ii + c*(grid_size*grid_size)
                ] =  rand.random()<0.5?0:1;
            } 
        }
    }
    initTheInitialCellStateAllZeros( cellStateArray, seeed, grid_size ){
        let nuSeed = 'insI2' + seeed;
        let rand = new PseudRand( nuSeed );
        let daBigONe = this.CHUNKS_ACROSS * this.CHUNKS_ACROSS * this.CHUNK_SIZE * this.CHUNK_SIZE
        for(let ii = 0;ii < daBigONe;ii++){
            for(let c = 0;c < this.CELL_VALS;c++){
                cellStateArray[
                    ii + c*(grid_size*grid_size)
                ] = 0;
            } 
        }
    }
 
} 