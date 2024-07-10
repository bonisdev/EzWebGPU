var Ex5_GPUBufferRead = () => {
    let computeWGSL = 
    `
        // This value is used as an index to get the right attribute
        // in the cell (we're only going to define a size of 1 for 
        //  this CGOL example)
        let cellAttribute: u32 = 0u;

        
        var neighbourCount: u32 = 0u;

        // Explanation of the EX_CELL_VAL function call:
        //      get the surroduning 8 neighbours (from the chunk that
        //      EZX and EZY is in), get the offset by 1 or -1, and at
        //      that cell's value stored at index "cellAttribute"
        neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  1, cellAttribute );
        neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  0, cellAttribute );
        neighbourCount += EZ_CELL_VAL( EZX, 1, EZY, -1, cellAttribute );
        neighbourCount += EZ_CELL_VAL( EZX, 0, EZY, -1, cellAttribute );
        
        neighbourCount += EZ_CELL_VAL( EZX, -1, EZY, -1, cellAttribute );
        neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  0, cellAttribute );
        neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  1, cellAttribute );
        neighbourCount += EZ_CELL_VAL( EZX, 0,  EZY,  1, cellAttribute );

        var myState: u32 = EZ_STATE_IN[ EZ_CELL_IND ];
        
        if (myState == 1u && (neighbourCount < 2u || neighbourCount > 3u)) {
            EZ_STATE_OUT[ EZ_CELL_IND ] = 0u;
        }
        else if (myState == 0 && neighbourCount == 3u) {
            EZ_STATE_OUT[ EZ_CELL_IND ] = 1u;
        }
        else {
            EZ_STATE_OUT[ EZ_CELL_IND ] = myState;
        }
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;
        
        let cellAttIndex: u32 = 0u;
        var cellVal: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, cellAttIndex );
        //      EZ_STATE_IN[ EZ_CELL_IND + (0u) * EZ_TOTAL_CELLS ];

        if( cellVal == 0 ){
            rrr = 0;
            ggg = 0;
            bbb = 0;
        }
        else{
            rrr = EZ_RAND( EZX + EZY + EZ_CHUNK_X*34 + EZ_CHUNK_Y*400 );
            ggg = EZ_RAND( EZX + EZY + EZ_CHUNK_X*13 + EZ_CHUNK_Y*213 );
            bbb = EZ_RAND( EZX + EZY + EZ_CHUNK_X*18 + EZ_CHUNK_Y*311 );
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

    document.getElementById('extraTitle').innerHTML = '<span style="color: red;">*** </span> Check the console.log for the GPU buffer every 100 steps'

    // Usage example
    let config = {

        BUFFER_TYPE: 'u32',
        CELL_SIZE: 5,
        CHUNK_SIZE: 32,
        CHUNKS_ACROSS: 3,
        PARTS_ACROSS: 1,

        READ_BACK_FREQ: 15,     // Every 15 time steps read back the gpu buffer
        READ_BACK_FUNC: ( currentStep, entireBuffer ) => { console.log('entireBuffer', entireBuffer.length); },

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
};