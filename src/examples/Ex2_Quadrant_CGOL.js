var Ex2_Quadrant_CGOL = () => {
    let computeWGSL = 
    `
        let cellAttribute: u32 = 0u;

        var neighbourCount: u32 = 0u;

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

        if( cellVal == 0 ){
            rrr = 0;
            ggg = 0;
            bbb = 0;
        }
        else{
            if( EZ_CHUNK_X == 0 && EZ_CHUNK_Y == 0 ){ 
                rrr = 1;
                ggg = 1;
                bbb = 1; 
            }
            else if( EZ_CHUNK_X == 0 && EZ_CHUNK_Y == 1 ){ 
                rrr = 1;
                ggg = 1;
                bbb = 0; 
            }
            else if( EZ_CHUNK_X == 1 && EZ_CHUNK_Y == 0 ){ 
                rrr = 0;
                ggg = 1;
                bbb = 0; 
            }
            else if( EZ_CHUNK_X == 1 && EZ_CHUNK_Y == 1 ){ 
                rrr = 1;
                ggg = 0;
                bbb = 0; 
            }
        }

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 
    `;

    // Usage example
    let config = {

        CELL_SIZE: 6,
        CHUNK_SIZE: 30,
        CHUNKS_ACROSS: 2,

        BUFFER_TYPE: 'u32',

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
    
    document.getElementById('extraTitle').innerHTML = 
    `
        <span style="color: red;">*** </span> If this example is just flashing and not progressing to the next CGOL step this is a WebGPU bug fiddle with the '<span style="color: violet;">WORKGROUP_SIZE</span>' config attribute in new EZWG()
    `;

    // document.getElementById('extraTitle').innerHTML = 
    // `
    //     <p style="color: red;">For some reason CHUNK_SIZE 256 results in this flashing...  255 and 257 work fine again</p>
    // `;
};