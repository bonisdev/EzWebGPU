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
    var bbb: f32 = 0;

    var cellVal: f32 = cellState[ EZ_REBUILT_INSTANCE + (0) * EZ_TOTAL_CELLS ];

    if( cellVal < 1 ){
        rrr = 0;
        ggg = 0;
        bbb = 0;
    }
    else{

        // Calc distance 
        var distFromCenter: f32 = abs( EZ_PARTS_ACROSS_F/2f - f32(EZ_COMP_X) );
        distFromCenter = abs( distFromCenter + ((EZ_PARTS_ACROSS_F/2f)-f32(EZ_COMP_Y)) ) ;
        distFromCenter = distFromCenter / ( EZ_PARTS_ACROSS_F );

        let offR = 0.44 + (f32(EZ_CHUNK_X) * 0.913 + f32(EZ_CHUNK_Y) * 0.7121) % 1;
        let offG = 0.78 + (f32(EZ_CHUNK_X) * 0.513 + f32(EZ_CHUNK_Y) * 0.8121) % 1;
        let offB = 0.41 + (f32(EZ_CHUNK_X) * 0.693 + f32(EZ_CHUNK_Y) * 0.4121) % 1;

        rrr = offR * (1f - distFromCenter);
        ggg = offG * (1f - distFromCenter);
        bbb = offB * (1f - distFromCenter);
        

        
    }

    EZ_OUTPUT.red = rrr;
    EZ_OUTPUT.grn = ggg;
    EZ_OUTPUT.blu = bbb; 
`;

// Usage example
let config = {

    CELL_SIZE: 8,
    CHUNK_SIZE: 32,
    CHUNKS_ACROSS: 2,
    PARTS_ACROSS: 8,

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