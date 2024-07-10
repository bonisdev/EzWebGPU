var Ex4_MultiStorage = () => {
    let computeWGSL = 
    `
        let cellAttribute: u32 = 0u;

        // Only if the value is exactly 1 consider it alive, gredations of death
        var neighbs: f32 = 0f;
        var tmpVal: f32 = 0f;
        tmpVal = EZ_CELL_VAL( EZX, 1, EZY,  1, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }
        tmpVal = EZ_CELL_VAL( EZX, 1, EZY,  0, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }    
        tmpVal = EZ_CELL_VAL( EZX, 1, EZY, -1, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }
        tmpVal = EZ_CELL_VAL( EZX, 0, EZY, -1, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; } 
        tmpVal = EZ_CELL_VAL( EZX, -1, EZY, -1, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }
        tmpVal = EZ_CELL_VAL( EZX, -1, EZY,  0, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }
        tmpVal = EZ_CELL_VAL( EZX, -1, EZY,  1, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }
        tmpVal = EZ_CELL_VAL( EZX, 0,  EZY,  1, cellAttribute );
        if( tmpVal == 1f ){ neighbs = neighbs + 1f; }

        var myState: f32 = EZ_STATE_IN[ EZ_CELL_IND ];

        if (myState == 1f && (neighbs < 2f || neighbs > 3f)) {
            EZ_STATE_OUT[ EZ_CELL_IND ] = 0.95f;
        }
        else if (myState < 1f && neighbs == 3f) {
            EZ_STATE_OUT[ EZ_CELL_IND ] = 1f;
        }
        else {
        
            // This is the decay
            if(myState < 1f){
                myState = myState * 0.96f;
            }
            EZ_STATE_OUT[ EZ_CELL_IND ] = myState;
        }
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0f;
        var ggg: f32 = 0f;
        var bbb: f32 = 0f;

        let cellAttIndex: u32 = 0u;
        var cellVal: f32 = EZ_CELL_VAL( EZX, 0, EZY, 0, cellAttIndex );

        var drawingWeightsOffset: u32 = EZ_CHUNK_IND * 3u; // 3 storage values for r,g,b


        if( cellVal < 1f ){
            if( EZ_COMP_IND < u32( cellVal *  f32( EZ_PARTS_ACROSS_F * EZ_PARTS_ACROSS_F )) ){
                rrr = EZ_STORAGE[ drawingWeightsOffset + 0u ];
                ggg = EZ_STORAGE[ drawingWeightsOffset + 1u ];
                bbb = EZ_STORAGE[ drawingWeightsOffset + 2u ];
            }
            else{
                rrr = 0;
                ggg = 0;
                bbb = 0;
            }
        }
        else{
            rrr = EZ_STORAGE[ drawingWeightsOffset + 0u ];
            ggg = EZ_STORAGE[ drawingWeightsOffset + 1u ];
            bbb = EZ_STORAGE[ drawingWeightsOffset + 2u ];
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
    console.log(randomConwayRGBs)

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
};