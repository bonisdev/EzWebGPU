var Ex13_GA_Test= () => {
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

        var cellState: u32 = EZ_STATE_IN[ EZ_CELL_IND ];
        var cellVec: vec4<u32> = EZ_U32_TO_VEC4( cellState );

        cellVec.x = cellVec.x - 1;
        cellVec.y = cellVec.y + 1;
        cellVec.z = cellVec.z - 1;
        
        // TODO maybe switch these around@?
        // if( cellVec.x < 1 ) {
        //     cellVec.x = 0
        // }
        // if( cellVec.y < 1 ) {
        //     cellVec.y = 0
        // }
        // if( cellVec.z < 1 ) {
        //     cellVec.z = 0
        // }
        
        EZ_STATE_OUT[ EZ_CELL_IND ] = EZ_VEC4_TO_U32( cellVec );
    `;

    let fragmentWGSL = 
    `
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;
        
        let cellAttIndex: u32 = 0u;
        var cellVal: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, cellAttIndex );

        var vecc: vec4<u32> = EZ_U32_TO_VEC4( cellVal );
        rrr = f32(vecc.x) / 255.0f;
        ggg = f32(vecc.y) / 255.0f;
        bbb = f32(vecc.z) / 255.0f;

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 
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
        CHUNK_SIZE: 1,
        CHUNKS_ACROSS: 16,
        PARTS_ACROSS: 1,
		
        READ_BACK_FREQ: 100,     // Every 15 time steps read back the gpu buffer
        READ_BACK_FUNC: ( currentStep, entireBuffer ) => { console.log('entireBuffer', entireBuffer.length, 'at time step', currentStep); },

        STORAGE: allGenes,

        BUFFER_TYPE: 'u32',
        STORAGE_TYPE: 'f32',      // float to store the weights of the NN 

            FRAG_PIXEL_MODE: true,  // switches rendering logic to the fragment shader instead of
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

    // Intital set the default runner to this
    EZ_EXAMPLE = new EZWG( config);
    
    
};