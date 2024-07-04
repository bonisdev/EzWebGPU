
let computeWGSL = 
`
    var neighbs: f32 = 0;
    neighbs += EZ_GET_CELL(EZX+1, EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );      
    neighbs += EZ_GET_CELL(EZX+1, EZY  , 0, EZ_CHUNK_X, EZ_CHUNK_Y );      
    neighbs += EZ_GET_CELL(EZX+1, EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );     
    neighbs += EZ_GET_CELL(EZX  , EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );    
    neighbs += EZ_GET_CELL(EZX-1, EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );   
    neighbs += EZ_GET_CELL(EZX-1, EZY  , 0, EZ_CHUNK_X, EZ_CHUNK_Y );     
    neighbs += EZ_GET_CELL(EZX-1, EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );  
    neighbs += EZ_GET_CELL(EZX  , EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );       

    var myState: f32 = EZ_STATE_IN[ EZ_CELL_IND ];

    if (myState == 1 && (neighbs < 2 || neighbs > 3)) {
        EZ_STATE_OUT[ EZ_CELL_IND ] = 0.9;
    }
    else if (myState == 0 && neighbs == 3) {
        EZ_STATE_OUT[ EZ_CELL_IND ] = 1.0;
    }

    else {
        EZ_STATE_OUT[ EZ_CELL_IND ] = myState;
    }
`;

let fragmentWGSL = 
`
    var rrr: f32 = 1;
    var ggg: f32 = 1;
    var bbb: f32 = 0;

    var cellVal: f32 = EZ_STATE[ EZ_REBUILT_INSTANCE + (0) * u32(grid.x * grid.y) ];

    var drawingWeightsOffset: u32 = EZ_CHUNK_IND * 3u; // 3 storage values for r,g,b

    if( cellVal < 1 ){
        rrr = 0;
        ggg = 0;
        bbb = 0;
    }
    else{

        rrr = EZ_STORAGE[ drawingWeightsOffset + 0 ];
        ggg = EZ_STORAGE[ drawingWeightsOffset + 1 ];
        bbb = EZ_STORAGE[ drawingWeightsOffset + 2 ];
        
    }

    EZ_OUTPUT.red = rrr;
    EZ_OUTPUT.grn = ggg;
    EZ_OUTPUT.blu = bbb; 
`;

// An Extra buffer of random f32's 0-1 to get a variety of colours
let randomConwayRGBs = new Float32Array( 256 );
EZWG.SHA1.seed('test seed 1234' + Date.now());
for(let b = 0;b < randomConwayRGBs.length;b++){ 
    randomConwayRGBs[b] = EZWG.SHA1.random()
}

// Usage example
let config = {

    CELL_SIZE: 5,
    CHUNK_SIZE: 32,
    CHUNKS_ACROSS: 3,
    PARTS_ACROSS: 5,

    CONTAINER_ID:   'demoCanvasContainer',    // DOM id to insdert canvas to
    RAND_SEED:      'randomseed12345678910', 
    STARTING_CONFIG: EZWG.ALL_BINS,      // couldve been EZWG.ALL_ZERO
    COMPUTE_WGSL: `
        // The custom WGSL code goes here
        ${computeWGSL}
    `,

    FRAGMENT_WGSL: `
        // The custom WGSL code goes here
        ${fragmentWGSL}
    `,

    STORAGE: randomConwayRGBs

};

// Intital set the default runner to this
EZ_EXAMPLE = new EZWG( config);