var Ex10_RealWeirdIntegerCA = () => {
    // First load in the sprites to use
    document.getElementById('extraTitle').innerHTML = 
    `
       <p><span style="color: red;">*** </span> Each chunk has a different randomly generated u32 bit mask</p>
    `;


 
    let seeed = 'test seed 1234' + Date.now()
    console.log('using seed:', seeed)

    
    EZWG.SHA1.seed(seeed);

    let chunksThisTimeAcross = 2
    let numberOfOperationsPerStep = 1
    
    let randomMasks = new Array( numberOfOperationsPerStep * chunksThisTimeAcross * chunksThisTimeAcross);
    for(let kk = 0;kk < randomMasks.length;kk++){
        randomMasks[kk] = EZWG.randomU32( EZWG.SHA1.random() )
    }
    


    let computeWGSL = 
    `
        // Find the chunk's bit smashing parameters
        // from the storage buffer
 
        let sqInd: u32 = EZ_CHUNK_IND * (1);

         
        var valToSet = 0u;
        var choice = 0u;

        var megaSec: u32 = 0u;

        var bufferInd: u32 = EZ_CELL_IND + 0 * EZ_TOTAL_CELLS;
 
        var uiind: u32 = 0; 
        loop {
            if uiind >= EZ_CELL_VALS { break; }

            var neighbourCount: u32 = 0u; 
            neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  1, uiind ) / 8u;
            neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  0, uiind ) / 8u;
            neighbourCount += EZ_CELL_VAL( EZX, 1, EZY, -1, uiind ) / 8u;
            neighbourCount += EZ_CELL_VAL( EZX, 0, EZY, -1, uiind ) / 8u; 
            neighbourCount += EZ_CELL_VAL( EZX, -1, EZY, -1, uiind ) / 8u;
            neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  0, uiind ) / 8u;
            neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  1, uiind ) / 8u;
            neighbourCount += EZ_CELL_VAL( EZX, 0,  EZY,  1, uiind ) / 8u;

            valToSet = EZ_STATE_IN[ EZ_CELL_IND + uiind*EZ_TOTAL_CELLS ];//EZ_CELL_VAL( EZX, 0, EZY, 0, uiind );
            choice = EZ_STORAGE[ sqInd ];
            
            valToSet = valToSet ^ choice;
            //megaSec = choice & valToSet;

            valToSet = valToSet ^ neighbourCount;

            //valToSet = valToSet + 1u + (EZX % 23) + (EZY % 35);
            EZ_STATE_OUT[ EZ_CELL_IND + uiind*EZ_TOTAL_CELLS ] = valToSet;
            uiind = uiind + 1;
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

        var vecc: vec4<u32> = EZ_U32_TO_VEC4( cellVal );
        rrr = f32(vecc.x) / 255.0f;
        ggg = f32(vecc.y) / 255.0f;
        bbb = f32(vecc.z) / 255.0f;

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 
    `;


    console.log( 'randomMasks __  use these stoarag vlaues:')
    console.log( randomMasks )

    // Usage example
    let config = {

        CELL_SIZE: 8,
        CHUNK_SIZE: 32,
        CHUNKS_ACROSS: chunksThisTimeAcross,
        PARTS_ACROSS: 1,

        CELL_VALS: 1,// 3 U32 values per cell, gonna use the first 255 of each cell as
                    // the RGB for the cell respectively

        STORAGE: randomMasks,
        
        // READ_BACK_FREQ: 10,     // Every 15 time steps read back the gpu buffer
        // READ_BACK_FUNC: ( currentStep, entireBuffer ) => { console.log('entireBuffer', entireBuffer); },

        BUFFER_TYPE: 'u32',
        STORAGE_TYPE: 'u32',

        CONTAINER_ID:   'demoCanvasContainer',    // DOM id to insdert canvas to
        RAND_SEED:      'randomseed12345678910', 
        STARTING_CONFIG: EZWG.ALL_RANDS,      // couldve been EZWG.ALL_ZERO
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
    EZ_EXAMPLE.UPDATE_INTERVAL = 16
    
    
};