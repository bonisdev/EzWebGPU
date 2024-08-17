var Ex14_FreeVerticies= () => {
    // First load in the sprites to use
    document.getElementById('extraTitle').innerHTML = 
    `
       <p><span style="color: red;">*** </span> confine the agent and agent's environment logic </p>
    `;

    let computeWGSL = 
    `

        let cellAttribute: u32 = 0u;
        var cellValue = EZ_CELL_VAL( EZX, 0, EZY,  0, cellAttribute );
        var geneSize = 8u;
        var storageInd: u32 = EZ_CHUNK_IND * geneSize;  // <- times the number of each gene

        var entType: f32 = EZ_CELL_VAL( EZX, 0, EZY,  0, 0u );
        var coorx: f32 = EZ_CELL_VAL( EZX, 0, EZY,  0, 1u );
        var coory: f32 = EZ_CELL_VAL( EZX, 0, EZY,  0, 2u );
        var vx: f32 = EZ_CELL_VAL( EZX, 0, EZY,  0, 3u );
        var vy: f32 = EZ_CELL_VAL( EZX, 0, EZY,  0, 4u );
        var idk: f32 = EZ_CELL_VAL( EZX, 0, EZY,  0, 5u );

        coorx = coorx + vx;
        coory = coory + vy;

        vx = vx * 0.99f;
        vy = vy * 0.99f;

 
 
        
        EZ_STATE_OUT[ EZ_CELL_IND + 0u*EZ_TOTAL_CELLS ] = entType;
        EZ_STATE_OUT[ EZ_CELL_IND + 1u*EZ_TOTAL_CELLS ] = coorx;
        EZ_STATE_OUT[ EZ_CELL_IND + 2u*EZ_TOTAL_CELLS ] = coory;
        EZ_STATE_OUT[ EZ_CELL_IND + 3u*EZ_TOTAL_CELLS ] = vx;
        EZ_STATE_OUT[ EZ_CELL_IND + 4u*EZ_TOTAL_CELLS ] = vy;
        EZ_STATE_OUT[ EZ_CELL_IND + 5u*EZ_TOTAL_CELLS ] = idk;
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;
         
        var cellVal: f32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 0u ); 

        rrr = cellVal;
        ggg = cellVal;
        bbb = cellVal;

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 

        
        var xxx: f32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 1u ); 
        var yyy: f32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 2u );

        var newPos: vec2f = (vec2f( xxx, yyy )+1) / grid - 1 + EZ_h_cellOffset;

        newPos.x = newPos.x + (f32(EZ_COMP_X) * EZ_h_smlDx) - (EZ_h_clsX*0.5) + EZ_h_smlDx/2;
        newPos.y = newPos.y + (f32(EZ_COMP_Y) * EZ_h_smlDy) - (EZ_h_clsY*0.5) + EZ_h_smlDy/2;

        // EZ_h_pos = EZ_h_ pos + newPos; 
        // EZ_OUTPUT.position = vec4f(EZ_h_pos, 0, 1);

        //  newPos.x = -1 + xxx/grid.x*2;
        //  newPos.y = -2 + yyy/grid.y*2;
        // EZ_OUTPUT.position = vec4f(newPos, 0, 1);   //EZ_OUTPUT.position+1;//vec4f(newPos, 0, 1);

    `;


    // Generate the population
    let totalGenesToTry = 16 * 16
    let geneSize = 8
    let allGenes = new Float32Array( totalGenesToTry * geneSize )
    EZWG.SHA1.seed('test12345')
    for(let v = 0;v < allGenes.length;v++){
        allGenes[v] = EZWG.SHA1.random()
    }

    
    // Usage example
    let config = {

        CELL_SIZE: 8,
        CHUNK_SIZE: 32,
        CHUNKS_ACROSS: 2,
        PARTS_ACROSS: 1,

        CELL_VALS: 6,
		
        READ_BACK_FREQ: 100,     // Every 15 time steps read back the gpu buffer
        READ_BACK_FUNC: ( currentStep, entireBuffer ) => { console.log('entireBuffer', entireBuffer.length, 'at time step', currentStep); },

        STORAGE: allGenes,

        BUFFER_TYPE: 'f32',
        STORAGE_TYPE: 'f32',      // float to store the weights of the NN 

            FRAG_PIXEL_MODE: false,  // switches rendering logic to the fragment shader instead of
                                    // many draw calls to two traingle shape  
            FREE_VERTICIES_MODE: true,// the verticies will be moving around 

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
    
    let initialState = new Float32Array( 
        attlength *
        config.CELL_VALS );
    
    for(let b = 0;b < initialState.length;b++){
        initialState[b] = 0;
    }

    EZWG.SHA1.seed('ddfdstimmers2dd')
    for(let xx = 0;xx < glength;xx++){
        for(let yy = 0;yy < glength;yy++){

            let type = EZWG.SHA1.random()
            // Make the first type of guy
            if( type < 0.03 || true ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 1;  // TYPE of entity
                initialState[ (1*attlength) + (xx*glength) + yy ] = 0.5 + xx;//-1 + ((0.5+xx)/glength);//0;//0.5 + xx;  // next movement direction
                initialState[ (2*attlength) + (xx*glength) + yy ] = 0.5 + yy;//-1 + ((0.5+yy)/glength);//0;//0.5 + yy;   // scents 
                initialState[ (3*attlength) + (xx*glength) + yy ] = (0.5 - EZWG.SHA1.random()) * 0.021;
                initialState[ (4*attlength) + (xx*glength) + yy ] = (0.5 - EZWG.SHA1.random()) * 0.021;
                initialState[ (5*attlength) + (xx*glength) + yy ] = 0;
                
                    //EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
            } 
            
            // Loop through each value
            // for(let cval = 0;cval < config.CELL_VALS;cval++){ 
            // }
            
            // else just keep it zero
        }
    }

    config.STARTING_BUFFER = initialState;
 

    // Intital set the default runner to this
    EZ_EXAMPLE = new EZWG( config);
    EZ_EXAMPLE.UPDATE_INTERVAL = 115;//45;
    
    
};