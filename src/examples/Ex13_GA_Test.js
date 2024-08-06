var Ex13_GA_Test= () => {
    // First load in the sprites to use
    document.getElementById('extraTitle').innerHTML = 
    `
       <p><span style="color: red;">*** </span> confine the agent and agent's environment logic </p>
    `;



    var Max_Gene_Moves = 8;

    let computeWGSL = 
    `
        let cellAttribute: u32 = 0u;
        var cellValue = 0u;
        var maxGeneMoves: u32 = ${Max_Gene_Moves}u;
        var geneSize = EZ_CELL_VALS * maxGeneMoves;
        var storageInd: u32 = EZ_CHUNK_IND * geneSize;  // <- times the number of each gene
        var ii: u32 = 0; 
 
        // Set them to current
        var outValues: array< vec4<u32>, EZ_CELL_VALS >;
        ii = 0;
        loop {
            if ii >= EZ_CELL_VALS { break; }
            outValues[ii] = EZ_U32_TO_VEC4( EZ_CELL_VAL(EZX, 0, EZY, 0, ii) );
            ii = ii + 1u;
        }

        // TODO maybe need to separate into a read array when adding more operations to a single value
        // for one pass 


        var instruction: u32 = 0u;
        
        ii = 0;
        loop {
            if ii >= EZ_CELL_VALS { break; } // MAX INSTRUCTION SIZE

            instruction = EZ_STORAGE[ storageInd + ii ]; 
 
            var v_inst: vec4<u32> = EZ_U32_TO_VEC4( instruction );

            // If over threshold then activate the instruction in this slot
            if( outValues[ii].x >= outValues[ii].y ){

                // The first part is the op code:
                var opCode = v_inst.x % 4u;
                var toCode = v_inst.w % EZ_CELL_VALS;

                // Add 1
                if( opCode == 0 ){
                    outValues[toCode].x = outValues[toCode].x + 1;
                }
                // Add 10
                else if( opCode == 1 ){
                    outValues[toCode].x = outValues[toCode].x + 10;
                }
                // Shift right 1
                else if( opCode == 2 ){
                    outValues[toCode].x = outValues[toCode].x >> 1;
                }
                // Shift left 1
                else if( opCode == 3 ){
                    outValues[toCode].x = outValues[toCode].x << 1;
                } 

                // CONSTRAIN new output values to this number
                outValues[toCode].x = outValues[toCode].x % 256;
            }

            ii = ii + 1u;
        }


        ii = 0;
        loop {
            if ii >= EZ_CELL_VALS { break; }
            //cellValue = EZ_CELL_VAL( EZX, 0, EZY, 0, ii );

            EZ_STATE_OUT[ EZ_CELL_IND + (ii*EZ_TOTAL_CELLS) ] = EZ_VEC4_TO_U32( outValues[ii] );//outValues[ii];//cellValue;//EZ_VEC4_TO_U32( cellVec );
            ii = ii + 1u;
        }
        
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;
         
        var rawCellVal0: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 0 );
        var rawCellVal1: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 1 );
        var rawCellVal2: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 2 );

        var vec0: vec4<u32> = EZ_U32_TO_VEC4( rawCellVal0 );
        var vec1: vec4<u32> = EZ_U32_TO_VEC4( rawCellVal1 );
        var vec2: vec4<u32> = EZ_U32_TO_VEC4( rawCellVal2 );

        rrr = f32(vec0.x) / 255.0f;
        ggg = f32(vec1.x) / 255.0f;
        bbb = f32(vec2.x) / 255.0f;

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 
    `;


    // Generate the population
    let totalGenesToTry = 4 * 4
    let geneSize = 5 * Max_Gene_Moves;//  5 unique cell values and a possible max of 8 moves 
    let allGenes = new Uint32Array( totalGenesToTry * geneSize )
    EZWG.SHA1.seed('test12345')
    for(let v = 0;v < allGenes.length;v++){
        allGenes[v] = EZWG.randomU32( EZWG.SHA1.random() )
    }

    
    // Usage example
    let config = {

        CELL_SIZE: 4,
        CHUNK_SIZE: 16,
        CHUNKS_ACROSS: 4,   // One gene per chunk
        PARTS_ACROSS: 1,

        CELL_VALS: 5,
		
        READ_BACK_FREQ: 100,     // Every 15 time steps read back the gpu buffer
        READ_BACK_FUNC: ( currentStep, entireBuffer ) => { console.log('-------');console.log('entireBuffer', entireBuffer.length, 'at time step', currentStep); },

        STORAGE: allGenes,

        BUFFER_TYPE: 'u32',
        STORAGE_TYPE: 'u32',      // float to store the weights of the NN 

            FRAG_PIXEL_MODE: false,  // switches rendering logic to the fragment shader instead of
                                    // many draw calls to two traingle shape  

        CONTAINER_ID:   'demoCanvasContainer',    // DOM id to insdert canvas to
        RAND_SEED:      'randomseed12345678910', 
        STARTING_CONFIG: EZWG.ALL_RANDS,//ALL_BINS,      // couldve been EZWG.ALL_ZERO
        COMPUTE_WGSL: `
            // The custom WGSL code goes here
            ${computeWGSL}
        `,

        FRAGMENT_WGSL: `
            // The custom WGSL code goes here
            ${fragmentWGSL}
        `
    };



    // Extra pre and post processing here : 
    let glength = config.CHUNK_SIZE*config.CHUNKS_ACROSS;
    let attlength = glength * glength;
    
    let initialState = new Uint32Array( 
        attlength *
        config.CELL_VALS ); 
    for(let b = 0;b < initialState.length;b++){
        initialState[b] = 0;
    } 
    EZWG.SHA1.seed('ddfddd')

    // Loop through each xx, and yy
    for(let xx = 0;xx < glength;xx++){
        for(let yy = 0;yy < glength;yy++){
            
            // Loop through each value
            for(let cval = 0;cval < config.CELL_VALS;cval++){

                if( cval === 0 ){
                    initialState[ (cval*attlength) + (xx*glength) + yy ] = 
                        // DunknowYet,   DecayRate*10,    Threshold,    Value,   
                        EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
                }
                else if( cval === 1 ){
                    initialState[ (cval*attlength) + (xx*glength) + yy ] = 
                        EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
                }
                else if( cval === 2 ){
                    initialState[ (cval*attlength) + (xx*glength) + yy ] = 
                        EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
                }
                else {
                    initialState[ (cval*attlength) + (xx*glength) + yy ] = 
                        EZWG.createPackedU32( 
                            0,                                          // idk yet 
                            5 + Math.floor(EZWG.SHA1.random()*25),      //Decay rate
                            Math.floor(EZWG.SHA1.random()*223),         //Threshold 
                            Math.floor(EZWG.SHA1.random()*223),         //Value
                        );
                }

  
            }
        } 

    }
    

    config.STARTING_BUFFER = initialState;

    // Intital set the default runner to this
    EZ_EXAMPLE = new EZWG( config);
    
    
};