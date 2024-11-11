var Ex13_GA_Test= () => {
    // First load in the sprites to use
    document.getElementById('extraTitle').innerHTML = 
    `
       <p><span style="color: red;">*** </span> confine the agent and agent's environment logic </p>
    `;



    var Max_Gene_Instructions = 80;

    let computeWGSL = 
    `  
        var maxGeneMoves: u32 = ${Max_Gene_Instructions}u; 
        var storageIndShift: u32 = EZ_CHUNK_IND * maxGeneMoves;  // <- times the number of each gene
        
        var stepNum: f32 = EZ_USER_INPUT[ 63 ];
 
        const totalVals: u32 = 4u * EZ_CELL_VALS;

        // Set them to current
        var outValues: array< u32, totalVals >;

        var grabbedMem: u32 = 0u;

        // GET ALL 0-255 cell values in an EZ to read u32 array
        var ii: u32 = 0; 
        loop {
            if ii >= totalVals { break; }
            if( ii % 4u == 0u ){
                grabbedMem = EZ_CELL_VAL( EZX, 0, EZY, 0, ii / 4u );
            }
            outValues[ii] = ( grabbedMem >> ((ii%4u)*8u) ) & 0x000000FFu;
            ii = ii + 1u;
        }
 


        var instruction: u32 = 0u;

        var jj: u32 = 0u;           // for inspecting neighbours
        var nOffset: u32 = 0u;      // getting the adjusted offset
        var kk: u32 = 0u;           // the neighbour with adjusted offset
        var di: u32 = 0u;
        var dx: i32 = -1i;
        var dy: i32 = -1i;
        var bestValOfInt: u32 = 0u;  // can be 0 to 255
        var bestNeigh: u32 = 0u;     // can be 0 to 7  (best neighbour)
        var tempigess: u32 = 0u;  
        
        var useAveInstead: bool = true; // if this is true at the end of the neighbourhood time

        ii = 0;
        loop {
            if ii >= maxGeneMoves { break; } // MAX INSTRUCTION SIZE

            instruction = EZ_STORAGE[ storageIndShift + ii ];       // Get the correct instruction (single U32 value)
            var v_inst: vec4<u32> = EZ_U32_TO_VEC4( instruction );
 
            // The first part is the op code:
            var opCode = v_inst.x   % 13u;       // Specify the type of entity power 
            var toCode = v_inst.y   % totalVals;
            var fromCode = v_inst.z % totalVals;

            var attOfInt = v_inst.w;            // Attribute of interest 
                                                // MAPS to one of the 4*memVals attributes of a cell (so max 255, and max 64 u32 mem spots per cell)

            // random offset for tie breaker
            nOffset = EZ_RAND_U( opCode*2111u + toCode*1127u + fromCode*199u + attOfInt*166u + EZX*219u + EZY*397u );
            nOffset = nOffset % 8u;
            jj = 0u;
            loop {
                if jj >= 8 { break; }
                kk = (jj + nOffset) % 8u;       // Apply the random shift to handle the case of all rando...
                di = (kk%8) + ((kk%8)/4u);      // Which way look around (0 - 7 SKIPS 4!(SELF))
                dx = -1 + i32(di%3u);           // X Value
                dy = -1 + i32(di/3u);           // Y Value

                tempigess = EZ_CELL_VAL( EZX, dx, EZY, dy, attOfInt / 4u );
                tempigess = ( tempigess >> ((attOfInt%4u)*8u) ) & 0x000000FFu;

                if( tempigess >= bestValOfInt ){
                    bestValOfInt = tempigess;
                    bestNeigh = kk;
                    useAveInstead = false;
                }
                
                jj = jj + 1u;
            }


            // Now that the best neighbour has been found based on the val of interest
            // use that neighbours 'fromCode'  
            di = (bestNeigh%8) + ((bestNeigh%8)/4u);
            dx = -1 + i32(di%3u);
            dy = -1 + i32(di/3u);

            tempigess = EZ_CELL_VAL( EZX, dx, EZY, dy, fromCode / 4u );         // NOW THAT WE HAVE THE NEIGHBOUR THATS IMPORTANT
            tempigess = ( tempigess >> ((fromCode%4u)*8u) ) & 0x000000FFu;      // GET THE VALUE THIS GENE INSTRUCTION WANTS

            // ^ ^ ^ ^ ^ ^ will be between 0 and 255


            // Add 1
            if( opCode == 0 ){
                outValues[toCode] += tempigess + 1u;
            }
            // Add 10
            else if( opCode == 1 ){
                outValues[toCode] += tempigess + 10u;
            }
            // Bit shift right 1
            else if( opCode == 2 ){
                outValues[toCode] += tempigess >> 1u;
            }
            // Bit shift left 1
            else if( opCode == 3 ){
                outValues[toCode] = tempigess << 1u;
            }
            // Gradual Increase
            else if( opCode == 4 ){
                outValues[toCode] += tempigess/7u;
            }
            // Big Increase
            else if( opCode == 5 ){
                outValues[toCode] += tempigess + 40u;
            }
            // Medium Increase
            else if( opCode == 6 ){
                outValues[toCode] = tempigess + 15u;
            }
            // Death
            else if( opCode == 7 ){
                outValues[toCode] = 0u;
            }
            // Max Life
            else if( opCode == 8 ){
                outValues[toCode] = tempigess >> 1u;
            }
            // Stabilization Increase
            else if( opCode == 9 ){
                outValues[toCode] = 123u;
            }
            // Smooth Retreate Increase
            else if( opCode == 10 ){
                outValues[toCode] = u32( f32(tempigess)*0.9f );
            }
            // Add 1
            else if( opCode == 11 ){
                outValues[toCode] = tempigess >> 2u;
            } 
            // Sub 1
            else if( opCode == 12 ){
                if( tempigess > 0 ){outValues[toCode] = tempigess - 1u; }
                else{ outValues[toCode] = 0u; }
                
            }

            // CONSTRAIN new output values to this number
            outValues[toCode] = outValues[toCode] % 256u; 

            ii = ii + 1u;
        }


        // Override input cells with certain values:
        var bsize: f32 = f32(EZ_CHUNK_SIZE);
        var angsize: f32 = 6.28f / 5f;
        var currang: f32 = 0f;
        var sensorCell: u32 = 0u;

        ii = 0;
        loop {
            if ii >= 5 { break; }
            if( EZX_R == u32(sin(currang)*(bsize/3f) + bsize/2f) && EZY_R == u32(cos(currang)*(bsize/3f) + bsize/2f)  ){
                sensorCell = ii + 1u;
            }
            currang += angsize;
            ii = ii + 1u;
        }

        // You are a special cell - take in the power of idk
        if( sensorCell > 0u ){
            sensorCell = sensorCell - 1u;
            
            if( stepNum%500 > f32(sensorCell) * 100 ){
                outValues[0] = 255u;
                outValues[1] = 255u;
                outValues[2] = 255u;
                outValues[3] = 255u;
            }
            else{
                outValues[0] = 0u;
                outValues[1] = 0u;
                outValues[2] = 0u;
                outValues[3] = 0u;
            }
            
        }


        // UPDATE 
        //      - - - - - - - - NEXT ROUND
        ii = 0;
        loop {
            if ii >= EZ_CELL_VALS { break; }

            instruction = ii * 4u; // re-use this 

            EZ_STATE_OUT[ EZ_CELL_IND + (ii*EZ_TOTAL_CELLS) ] = 
                ( outValues[instruction + 0] & 0x000000FF) |
                ((outValues[instruction + 1] & 0x000000FF) << 8) |
                ((outValues[instruction + 2] & 0x000000FF) << 16) |
                ((outValues[instruction + 3] & 0x000000FF) << 24);

            ii = ii + 1u;
        }
        
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;

        var valsToUse: u32 = 3u;        // < -   USE the first 4 u32 values in a cell
 
        // then each val in the mem spot 
        
        var ii: u32 = 0u;
        var rawCellVal: u32 = 0u;
        var calcedPower: f32 = 0f;
        loop {
            if ii >= valsToUse { break; }

            rawCellVal = EZ_CELL_VAL( EZX, 0, EZY, 0, ii );

            calcedPower = f32( ((rawCellVal>>24)&0x000000FF) ) / 255f;
            calcedPower = 1f;   // - calcedPower;

            rrr += calcedPower * f32( (rawCellVal & 0x000000FF) ) / 255f;
            ggg += calcedPower * f32( ((rawCellVal >> 8) & 0x000000FF) ) / 255f;
            bbb += calcedPower * f32( ((rawCellVal >> 16) & 0x000000FF) ) / 255f;
 
            ii = ii + 1u;
        }

        calcedPower = f32( valsToUse );         // divide by amount of cell's looked at 

        EZ_OUTPUT.red = rrr / calcedPower;
        EZ_OUTPUT.grn = ggg / calcedPower;
        EZ_OUTPUT.blu = bbb / calcedPower; 
    `;


    // todo:
    //    find what value youre looking for ( any of the 255 vals)
    //    set the starting position random for checking neighbours ()
    //      (so that if all the same value like 0 then it still gives a random num)
    //    from the highest priority neighbour for that instruction


    
    // Usage example
    let config = {

        CELL_SIZE: 4,       // nxn pixels per cell 
        CHUNK_SIZE: 32,     // nxn cells per digital brain
        CHUNKS_ACROSS: 4,   // nxn digital brains per batch
        PARTS_ACROSS: 1,    // nxn sqaures to display per cell

        CELL_VALS: 5,       // 5 u32's 
            // **** NOTE ^^^^^^      
            //      MAX OF 64 BECAUSE THE HIGHEST VAL address specificable has to fit in a 255 number, and 65 would be over te max.
		
        READ_BACK_FREQ: 111,     // Every 15 time steps read back the gpu buffer
        READ_BACK_FUNC: ( currentStep, entireBuffer ) => {
            console.log('-------')
            console.log('entireBuffer', entireBuffer.length, 'at time step', currentStep);

            console.log(currentStep)
            // if( currentStep === 0 ){
            //     console.log('logg')
            // }



        },

        //STORAGE: allGenes,

        BUFFER_TYPE: 'u32',
        STORAGE_TYPE: 'u32',      // float to store the weights of the NN 

            FRAG_PIXEL_MODE: false,  // if true  ->  switches rendering logic to the fragment shader instead of
                                    // many draw calls to two traingle shape  

        CONTAINER_ID:   'demoCanvasContainer',    // DOM id to insdert canvas to
        RAND_SEED:      'randomseed12345678910' + seedForCurrentBatch, 
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

    
    // The seed for this batch of chunks
    var seedForCurrentBatch = "testhsetidsemtset12";
    seedForCurrentBatch += Math.random() + ":" + Date.now();
    console.log('seed for batch:', seedForCurrentBatch)

    // Generate the population
    let totalGenesToTry = config.CHUNKS_ACROSS * config.CHUNKS_ACROSS; 
    let allGenes = new Uint32Array( totalGenesToTry * Max_Gene_Instructions );
    EZWG.SHA1.seed('test123456' + seedForCurrentBatch );
    for(let v = 0;v < allGenes.length;v++){
        allGenes[v] = EZWG.createPackedU32( 
            Math.floor(256*EZWG.SHA1.random()), 
            Math.floor(256*EZWG.SHA1.random()),
            Math.floor(256*EZWG.SHA1.random()),
            Math.floor(256*EZWG.SHA1.random()) );
            //EZWG.randomU32( EZWG.SHA1.random() )
    }

    config.STORAGE = allGenes;




    // Extra pre and post processing here : 
    let glength = config.CHUNK_SIZE*config.CHUNKS_ACROSS;
    let attlength = glength * glength;
    
    let initialState = new Uint32Array( 
        attlength *
        config.CELL_VALS ); 
    for(let b = 0;b < initialState.length;b++){
        initialState[b] = 0;
    } 
    //EZWG.SHA1.seed('ddfddd' + seedForCurrentBatch)

    // Loop through each xx, and yy
    for(let xx = 0;xx < glength;xx++){
        for(let yy = 0;yy < glength;yy++){
            
            // Loop through each value
            for(let cval = 0;cval < config.CELL_VALS;cval++){

                // CORNER 
                if( xx % config.CHUNK_SIZE === 0 && yy % config.CHUNK_SIZE === 0 ){

                    initialState[ (cval*attlength) + (xx*glength) + yy ] = 
                        EZWG.createPackedU32( 
                            Math.floor(256*EZWG.SHA1.random()), 
                            Math.floor(256*EZWG.SHA1.random()),
                            Math.floor(256*EZWG.SHA1.random()),
                            Math.floor(256*EZWG.SHA1.random()) ); 
                }

                // ANYthing else
                else{
                    initialState[ (cval*attlength) + (xx*glength) + yy ] = 
                        EZWG.createPackedU32( 10, 11, 12, 13 );
                }
  
                 
  
            }
        } 

    }
    

    config.STARTING_BUFFER = initialState;

    // Intital set the default runner to this
    EZ_EXAMPLE = new EZWG( config);
    EZ_EXAMPLE.UPDATE_INTERVAL = 65;
    
    
};