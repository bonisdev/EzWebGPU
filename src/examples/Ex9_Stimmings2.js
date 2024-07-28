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
        var rrr: f32 = 0;
        var ggg: f32 = 0;
        var bbb: f32 = 0;
        
        let cellAttIndex: u32 = 0u;
        var entityType: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, cellAttIndex );
        //      EZ_STATE_IN[ EZ_CELL_IND + (0u) * EZ_TOTAL_CELLS ];

        if( entityType > 0 ){
            var vecc: vec4<u32> = EZ_U32_TO_VEC4( EZ_STORAGE[ (64*(entityType-1u)) + EZ_COMP_IND ] );
            rrr = f32(vecc.x) / 255.0f;
            ggg = f32(vecc.y) / 255.0f;
            bbb = f32(vecc.z) / 255.0f;
        }
        else{
            rrr = 0;
            ggg = 0;
            bbb = 0;
        }

        EZ_OUTPUT.red = rrr;
        EZ_OUTPUT.grn = ggg;
        EZ_OUTPUT.blu = bbb; 
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

    
    let viewSsquareSide = 512;//Math.min(window.innerWidth, window.innerHeight)
    // Usage example
    let config = {

        CELL_SIZE: 8,
        CHUNK_SIZE: Math.floor(viewSsquareSide/8),
        CHUNKS_ACROSS: 1,
        PARTS_ACROSS: 8,

        CELL_VALS: 3,
        
            FRAG_PIXEL_MODE: true,
            PIXEL_PER_COMP: 1,
        /*
        Slot( 0 )  	// 0x0000FFFF		0x00FF0000 		//0xFF000000
					EntType				TEAM			CPU TAG
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

    EZWG.SHA1.seed('ddfddd')
    for(let xx = 0;xx < glength;xx++){
        for(let yy = 0;yy < glength;yy++){
            let type = EZWG.SHA1.random()
            if( type < 0.1 ){
                // Instantiate thing        + 0*attlength
                initialState[xx*glength + yy ] = 1
            }
            else if( type < 0.5 ){
                //Instantiate another
                initialState[xx*glength + yy ] = 2
            }
            // else just keep it zero
        }
    }

    config.STARTING_BUFFER = initialState;

    // Intital set the default runner to this
    EZ_EXAMPLE = new EZWG( config);
    EZ_EXAMPLE.UPDATE_INTERVAL = 50;
    
};