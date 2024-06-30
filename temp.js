let computeWGSL = 
`
    var neighbs: f32 = 0;
    neighbs += EZ_GET_CELL( EZX+1, EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );      
    neighbs += EZ_GET_CELL( EZX+1, EZY  , 0, EZ_CHUNK_X, EZ_CHUNK_Y );      
    neighbs += EZ_GET_CELL( EZX+1, EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );     
    neighbs += EZ_GET_CELL( EZX  , EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );    
    neighbs += EZ_GET_CELL( EZX-1, EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );   
    neighbs += EZ_GET_CELL( EZX-1, EZY  , 0, EZ_CHUNK_X, EZ_CHUNK_Y );     
    neighbs += EZ_GET_CELL( EZX-1, EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );  
    neighbs += EZ_GET_CELL( EZX  , EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );

    var myState: f32 = EZ_STATE_IN[ EZ_CELL_IND ];

    if (myState == 1 && (neighbs < 2 || neighbs > 3)) {
        EZ_STATE_OUT[ EZ_CELL_IND ] = 0.0;
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
    var bbb: f32 = 1; 

    if( cellState[ EZ_REBUILT_INSTANCE + (0) * u32(grid.x * grid.y) ] < 1 ){
        rrr = 0;
        ggg = 0;
        bbb = 0;
    }

    EZ_OUTPUT.red = rrr;
    EZ_OUTPUT.grn = ggg;
    EZ_OUTPUT.blu = bbb; 
`;

// Usage example
let config = {

    CELL_SIZE: 2,
    CHUNK_SIZE: 256,

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
    `
};

// Intital set the default runner to this
EZ_EXAMPLE = new EZWG( config);