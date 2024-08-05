var Ex9_Stimmings2 = () => {
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
        var cellAttribute: u32 = 0u;

        
        var neighbourCount: u32 = 0u;

        // Explanation of the EX_CELL_VAL function call:
        //      get the surroduning 8 neighbours (from the chunk that
        //      EZX and EZY is in), get the offset by 1 or -1, and at
        //      that cell's value stored at index "cellAttribute"
        // neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  1, cellAttribute );
        // neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  0, cellAttribute );
        // neighbourCount += EZ_CELL_VAL( EZX, 1, EZY, -1, cellAttribute );
        // neighbourCount += EZ_CELL_VAL( EZX, 0, EZY, -1, cellAttribute );
        
        // neighbourCount += EZ_CELL_VAL( EZX, -1, EZY, -1, cellAttribute );
        // neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  0, cellAttribute );
        // neighbourCount += EZ_CELL_VAL( EZX, -1, EZY,  1, cellAttribute );
        // neighbourCount += EZ_CELL_VAL( EZX,  0, EZY,  1, cellAttribute );


        var bufferInd: u32 = EZ_CELL_IND + 0u * EZ_TOTAL_CELLS;
        var myState: u32 = EZ_STATE_IN[ bufferInd ];

        var lastRand: u32 = EZ_STATE_IN[ EZ_CELL_IND + 1u * EZ_TOTAL_CELLS ];
        EZ_STATE_OUT[ EZ_CELL_IND + 1u * EZ_TOTAL_CELLS ] = u32( 255*EZ_RAND((EZX+EZY+lastRand)%255) );
 
        // Hadnle the mouse input here
        // Here's the addition of mouse handling 
        //      'incrementer' variable for each f32 or u32 value in memory  
        cellAttribute = 0u;

        

        // Get the min max of the input coordinattres
        var minX: u32 = min( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
        var maxX: u32 = max( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
        var minY: u32 = min( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
        var maxY: u32 = max( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
        if( EZ_USER_INPUT[6] > 0){
            if( EZX >= minX && EZX <= maxX && EZY >= minY && EZY <= maxY ){
                // The case where the cell is in the bounding box of the user's click drag
                EZ_STATE_OUT[ bufferInd ] = 1; 
            }
            else{
                EZ_STATE_OUT[ bufferInd ] = myState; 
            }
        }
        else{
            EZ_STATE_OUT[ bufferInd ] = myState; 
        } 

    `;

    let fragmentWGSL = 
    `  
		
        EZ_OUTPUT.red = 0;
        EZ_OUTPUT.grn = 0;
        EZ_OUTPUT.blu = 0;
		
		if(EZ_RAW_COL%4==0){
            EZ_OUTPUT.grn = 0.91;
		}
		if(EZ_RAW_ROW%4==0){
            EZ_OUTPUT.blu = 0.91;
		}
		

        // TODO test what quadrant y'all in finna shnngg
         
        let cell = EZ_STATE_IN[ EZ_CELL_IND ];
        let entityType = cell; // Assuming cell holds the entity type 
        if (entityType > 0u) {
            var colorVec = EZ_STORAGE[(64u * (entityType - 1u)) + (EZ_COMP_X) + (EZ_COMP_Y)*8];
            EZ_OUTPUT.red = f32(colorVec & 0xFF) / 255.0;
            EZ_OUTPUT.grn = f32((colorVec >> 8) & 0xFF) / 255.0;
            EZ_OUTPUT.blu = f32((colorVec >> 16) & 0xFF) / 255.0;
        }
        else {
            var randVal: f32 = f32(EZ_STATE_IN[ EZ_CELL_IND + 1u*EZ_TOTAL_CELLS]);
            randVal = randVal / 255.0;
            EZ_OUTPUT.red = randVal;
            EZ_OUTPUT.grn = randVal;
            EZ_OUTPUT.blu = randVal;
        }
    `;


    // Convert the images to their U32 arrays 
    let sprtA = document.getElementById('exmplSprite1');
    // Ensure the image is fully loaded
    if (sprtA.complete && sprtA.naturalWidth !== 0) {
        const packedPixels = EZWG.processImagePixels(sprtA, 8, 8).concat(
            EZWG.processImagePixels(document.getElementById('exmplSprite2'), 8, 8)
        );
        // console.log(packedPixels);
        packedPixels.forEach((packedValue, index) => {
            const { r, g, b, a } = EZWG.unpackU32(packedValue);
            console.log(`Pixel ${index}: R=${r}, G=${g}, B=${b}, A=${a}`);
        });
    } 
    else {
        console.error('Image failed to load or is not accessible.');
    }

    let packedPixels = 
        EZWG.processImagePixels(document.getElementById('exmplSprite1'), 8, 8).concat(
            EZWG.processImagePixels(document.getElementById('exmplSprite2'), 8, 8)
        );

    var lastReadBackTime = Date.now();


    // Usage example
    let config = {

        CELL_SIZE: 8,               // How many pixels across one cell is (fragment renderer
                                    // assumes this number is the same as PARTS_ACROSS)
        CHUNK_SIZE: 128,
        CHUNKS_ACROSS: 1,
        PARTS_ACROSS: 8,            // Note* frag shader considers each part one by one pixel

        CELL_VALS: 3,
        
            FRAG_PIXEL_MODE: true, // switches rendering logic to the fragment shader instead of
                                    // many draw calls to two traingle shape  
    
        READ_BACK_FREQ: 100,     // Every 15 time steps read back the gpu buffer
        READ_BACK_FUNC: ( currentStep, entireBuffer ) => {
            console.log('entireBuffer', entireBuffer.length);
            console.log('currentStep')
            let diffinTime = Date.now();
            console.log(`${diffinTime - lastReadBackTime}`)
            lastReadBackTime = diffinTime
        },
        /*
        Slot( 0 )  	// 0x0000FFFF
					EntType	 
	    Slot( 1 )	// 0x000000FF						// 0x0000FF00							0x00FF0000   	0xFF000000
					Movement next direction X(-127)		Movement next direction Y(-127)	  		// Good to go	?????
	    Slot( 2 )	// 0x000000FF						// 0x0000FF00							0x00FF0000   	0xFF000000
					Scent 1, SCent 2, Scent 3, Scent 4 (each 0-255)
        */

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


    // Extra pre and post processing here :

    let glength = config.CHUNK_SIZE*config.CHUNKS_ACROSS;
    let attlength = glength * glength;
    
    let initialState = new Uint32Array( 
        attlength *
        config.CELL_VALS );
    
    for(let b = 0;b < initialState.length;b++){
        initialState[b] = 0;
    }

    EZWG.SHA1.seed('ddfdstimmers2dd')
    for(let xx = 0;xx < glength;xx++){
        for(let yy = 0;yy < glength;yy++){

            let type = EZWG.SHA1.random()
            if( type < 0.1 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 1;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction
                initialState[ (2*attlength) + (xx*glength) + yy ] =   // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                
                    //EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
            }
            else if( type < 0.5 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 2;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
            }
            else{
                //Nothing
                initialState[ (0*attlength) + (xx*glength) + yy ] = 0;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 0;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
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
    EZ_EXAMPLE.UPDATE_INTERVAL = 45;
    
};