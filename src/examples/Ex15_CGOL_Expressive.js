var Ex15_CGOL_Expressive = () => {
    let computeWGSL = 
    `

        // Helper variables for readability later on
        var attributeOffset: u32 = 0;
        var myState: f32 = 0;
        var totalNghbrCount: u32 = 0;

        // Loop through each value in the cell, and store their CGOL state value
        var neighbrs: array< f32, EZ_CELL_VALS >;
        var valIndex: u32 = 0;
        loop {
            if valIndex >= EZ_CELL_VALS { break; }
              
            var neighbourCount: u32 = 0u;

            neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  1, valIndex );
            neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  0, valIndex );
            neighbourCount += EZ_CELL_VAL( EZX, 1, EZY, -1, valIndex );
            neighbourCount += EZ_CELL_VAL( EZX, 0, EZY, -1, valIndex );
            
            neighbourCount += EZ_CELL_VAL( EZX, -1, EZY, -1, valIndex );
            neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  0, valIndex );
            neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  1, valIndex );
            neighbourCount += EZ_CELL_VAL( EZX, 0,  EZY,  1, valIndex );


            var bufferInd: u32 = EZ_CELL_IND + valIndex * EZ_TOTAL_CELLS;
            var myState: u32 = EZ_STATE_IN[ bufferInd ];
            
            
            if (myState == 1u && (neighbourCount < 2u || neighbourCount > 3u)) {
                EZ_STATE_OUT[ bufferInd ] = 0u;
            }
            else if (myState == 0 && neighbourCount == 3u) {
                EZ_STATE_OUT[ bufferInd ] = 1u;
            }
            else {
                EZ_STATE_OUT[ bufferInd ] = myState;
            }
            
            valIndex++;
        }  


        
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;

        // Helper variables for readiblity
        var drawingWeightsOffset: u32 = 0; 
        var totalTypesLive: u32 = EZ_CELL_VALS;
        
        var valIndex: u32 = 0;  //< - the attribute index in a cell
        loop {
            if valIndex >= EZ_CELL_VALS { break; }

            // shift read location in storage buffer: 3 storage values for r,g,b
            drawingWeightsOffset = EZ_CHUNK_IND * 3u;
            // and also shift down the location to accomodate the multiple values per cell  
            drawingWeightsOffset = drawingWeightsOffset + (EZ_CELL_VALS * 3u) * valIndex;

             
            var cellVal: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, valIndex );

            if( cellVal < 1 ){
                totalTypesLive = totalTypesLive - 1;
            }
            else{ 
                rrr += EZ_RAND(u32(34*EZ_STORAGE[ drawingWeightsOffset + 0 ]));//+ EZ_CHUNK_X + EZ_CHUNK_Y + cellVal);
                ggg += EZ_RAND(u32(34*EZ_STORAGE[ drawingWeightsOffset + 1 ]));//+ EZ_CHUNK_X + EZ_CHUNK_Y + cellVal);
                bbb += EZ_RAND(u32(34*EZ_STORAGE[ drawingWeightsOffset + 2 ]));//+ EZ_CHUNK_X + EZ_CHUNK_Y + cellVal); 
            }
            valIndex++;
        }

        if( totalTypesLive < 1 ){
            rrr = 0;
            ggg = 0;
            bbb = 0;
        }
        else{
            rrr = rrr / f32(totalTypesLive);
            ggg = ggg / f32(totalTypesLive);
            bbb = bbb / f32(totalTypesLive);
        }

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb;
    `;

    // An Extra buffer of random f32's 0-1 to get a variety of colours
    let randomConwayRGBs = new Float32Array( 4096 );
    EZWG.SHA1.seed('test seed 1234' + Date.now());
    for(let b = 0;b < randomConwayRGBs.length;b++){
        randomConwayRGBs[b] = EZWG.SHA1.random()
    } 

    // Usage example
    let config = {

        BUFFER_TYPE: 'u32',
        STORAGE_TYPE: 'f32',

        CELL_VALS: 5,   // Now this means 17 f32 values per cell
        CELL_SIZE: 4,
        CHUNK_SIZE: 32,
        CHUNKS_ACROSS: 4,
        PARTS_ACROSS: 1,

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