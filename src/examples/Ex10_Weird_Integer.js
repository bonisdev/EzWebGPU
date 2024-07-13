var Ex10_RealWeirdIntegerCA = () => {
    // First load in the sprites to use
    document.getElementById('extraTitle').innerHTML = 
    `
       <p><span style="color: red;">*** </span> using some 8x8 png images to convert each pixel into a U32 (RGBA) and loading into STORAGE</p>
    `;

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
            if( EZ_CHUNK_IND == 0u ){
                var vecc: vec4<u32> = EZ_U32_TO_VEC4( EZ_STORAGE[ 0 + EZ_COMP_IND ] );
                rrr = f32(vecc.x) / 255.0f;
                ggg = f32(vecc.y) / 255.0f;
                bbb = f32(vecc.z) / 255.0f;
            }
            else{
                rrr = 1;
                ggg = 1;
                bbb = 1;
            }
        }

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 
    `;

 
    let seeed = 'test seed 1234' + Date.now()
    console.log('using seed:', seeed)

    EZWG.SHA1.seed(seeed);

    let squarePerCell = 4
    let numberOfOperationsPerStep = 6
    
    let randomMasks = new Array( numberOfOperationsPerStep * squarePerCell);
    for(let kk = 0;kk < randomMasks.length;kk++){
        randomMasks[kk] = EZWG.randomU32( EZWG.SHA1.random() )
    }
    // Usage example
    let config = {

        CELL_SIZE: 8,
        CHUNK_SIZE: 32,
        CHUNKS_ACROSS: 2,
        PARTS_ACROSS: Math.floor( squarePerCell / 2 ),

        CELL_VALS: 4,// 3 U32 values per cell, gonna use the first 255 of each cell as
                    // the RGB for the cell respectively

        STORAGE: packedPixels,

        BUFFER_TYPE: 'u32',
        STORAGE_TYPE: 'u32',

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
    
    
};