var Ex9_Stimmings2 = () => {
    // First load in the sprites to use
    document.getElementById('extraTitle').innerHTML = 
    `
       <p><span style="color: red;">*** </span> using some 8x8 png images to convert each pixel into a U32 (RGBA) and loading into STORAGE</p>
    `;

    let computeWGSL = 
    `


        // 0, 1, 2, 3       SECOND half is coutner
        var SLOT0: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 0 );
        var entityType: u32 = SLOT0 & 0x0000FFFF;
        var counter: u32 = (SLOT0 >> 16) & 0x0000FFFF;
        counter = counter + 1u;

        // 0, 1, 2, 3, 4, 5, 6, 7, 8   <-  (4 Stationary)
        var nextMove: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 1 );

        // Stores 4 different scent values
        var SLOT2: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 2 );

        var outScents: array< vec4<u32>, 1 >;
        outScents[0] = EZ_U32_TO_VEC4( SLOT2 );

        // Calculate the PERSONAL priority movement  - based on location
        //      used if there's another entity that wants to go 
        //      to SAME location as you do
        var pPrior: u32 = 0;    

        // EVERYTHING ABOUT THE CELL STATE SHOULD BE LOADED ------------------

        // No matter what accumulate the neighbours' intentions
        var i: u32 = 0u;
        var ii: u32 = 0u;
        var scntind: u32 = 0u;
        var dx: i32 = -1i;
        var dy: i32 = -1i;

        var realProblems: u32 = 0u;         // Anyone contesting your movement?
 
        loop {                              // Goes 0-7 (inclusive)
            if i >= 8*4 { break; }         
            ii = (i%8) + ((i%8) / 4u);      // Which way look around
            scntind = i / 8;                // Which scent to be compiling
            dx = -1 + i32(ii%3u);           // X Value
            dy = -1 + i32(ii/3u);           // Y Value


            // TODO - somewhere here check if anyone has MOVE
            //      intensions into you - they can only do it 
            // neighbourCount += EZ_CELL_VAL( EZX, 1, EZY,  1, cellAttribute );


            //EZ_STATE_OUT[ EZ_CELL_IND + (ii*EZ_TOTAL_CELLS) ] = EZ_VEC4_TO_U32( outValues[ii] );      //outValues[ii];//cellValue;//EZ_VEC4_TO_U32( cellVec );
            i = i + 1u;
        }

        
        // TODO -verify
        // SOMEONE MOVING on to you with higher priority?! 
        //   IF their movment is on YOU AND they have higher move priority (stimmings over a weed)
        //      (movements from incoming dont update they just transfer over values...)
        // COUNT any transformation MAXes hit?
        //  do that first 

        // IF you are moving - ONLY check for movement contesting -
        //  because transformations can only be checked for if no move intention OR a move intention but the move was blocked by a movment priority conflict.
        //
        // If it is contested - do YOU have priority?
 
        // If No one has intensions to move (no realProblems)  
        //      then based on your current movement priority - do you have pers

        // To move somehwere an entity must have INTENTION
        // as well as the current priority to move to that spot.



        // This value is used as an index to get the right attribute
        // in the cell (we're only going to define a size of 1 for 
        //  this CGOL example)
        var cellAttribute: u32 = 0u;

 
        

        // 0:  SET 
        var myState: u32 = 0u;
        myState = (entityType & 0x0000FFFF) | ((counter & 0x0000FFFF) << 16);

        // 1:  SET 
        var lastRand: u32 = EZ_STATE_IN[ EZ_CELL_IND + 1u * EZ_TOTAL_CELLS ];
        EZ_STATE_OUT[ EZ_CELL_IND + 1u * EZ_TOTAL_CELLS ] = u32( 255*EZ_RAND((EZX+counter*17+EZY*5+lastRand)%255) );
 
        // Hadnle the mouse input here
        // Here's the addition of mouse handling 
        //      'incrementer' variable for each f32 or u32 value in memory  
        cellAttribute = 0u;

        

        var bufferInd: u32 = EZ_CELL_IND + 0u * EZ_TOTAL_CELLS;
        // Get the min max of the input coordinattres
        var minX: u32 = min( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
        var maxX: u32 = max( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
        var minY: u32 = min( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
        var maxY: u32 = max( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
        if( EZ_USER_INPUT[6] > 0){
            if( EZX >= minX && EZX <= maxX && EZY >= minY && EZY <= maxY ){
                // The case where the cell is in the bounding box of the user's click drag
                EZ_STATE_OUT[ bufferInd ] = 3; // and coincenidenly sets the counter to 0
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
        
        // 0, 1, 2, 3       SECOND half is coutner 
        let SLOT_0 = EZ_STATE_IN[ EZ_CELL_IND + 0u * EZ_TOTAL_CELLS]; 
        let entityType = SLOT_0 & 0x0000FFFF;
        var counter: u32 = (SLOT_0 >> 16) & 0x0000FFFF;
        counter = counter + EZX * 12u + EZY * 27u;

        var animFreq: u32 = 0;
        var animStart: u32 = 0;
        var animSize: u32 = 1;
        var animFrame: u32 = 0;

        if( entityType == 1u ){ // Old man
            animFreq = 17u;
            animStart = 3u;
            animSize = 5u;
        }
        else if( entityType == 2u ){ // Wandering stim
            animFreq = 14u;
            animStart = 8u;
            animSize = 3u;
        }
        else if( entityType == 3u ){ // Debug res
            animFreq = 29u;
            animStart = 0u;
            animSize = 3u;
        }


        var thisPixBg: u32 = 0;
        if (entityType > 0u) {

            animFrame = animStart + ((counter/animFreq) % animSize);

            var colorVec = EZ_STORAGE[(64u * (animFrame)) + (EZ_COMP_X) + (EZ_COMP_Y)*8];
            var alpha: u32 = (colorVec >> 24) & 0xFF;

            if( alpha > 0 ){
                EZ_OUTPUT.red = f32(colorVec & 0xFF) / 255.0;
                EZ_OUTPUT.grn = f32((colorVec >> 8) & 0xFF) / 255.0;
                EZ_OUTPUT.blu = f32((colorVec >> 16) & 0xFF) / 255.0;
            }
            else{
                thisPixBg = 1;
            }
            
        }
        
        if( thisPixBg == 1u || entityType < 1u ){
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

    // Sprite A, B, C
    packedPixels = [ -14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-15808001,-15808001,-15808001,-15808001,-15808001,-15808001,-14410515,-14410515,-15808001,-11751134,-11751134,-3389377,-3389377,-15808001,-14410515,-14410515,-15808001,-11751134,-6010461,-6010461,-3389377,-15808001,-14410515,-14410515,-15808001,-3389377,-6010461,-6010461,-11751134,-15808001,-14410515,-14410515,-15808001,-3389377,-3389377,-11751134,-11751134,-15808001,-14410515,-14410515,-15808001,-15808001,-15808001,-15808001,-15808001,-15808001,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-14410515,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-969216,-969216,-969216,-969216,-969216,-969216,-2366702,-2366702,-969216,-5026083,-5026083,-13387840,-13387840,-969216,-2366702,-2366702,-969216,-5026083,-10766756,-10766756,-13387840,-969216,-2366702,-2366702,-969216,-13387840,-10766756,-10766756,-5026083,-969216,-2366702,-2366702,-969216,-13387840,-13387840,-5026083,-5026083,-969216,-2366702,-2366702,-969216,-969216,-969216,-969216,-969216,-969216,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-2366702,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-15027835,-15027835,-15027835,-15027835,-15027835,-15027835,-11751134,-11751134,-15027835,-15027835,-15027835,-14817611,-14817611,-15027835,-11751134,-11751134,-15027835,-15027835,-15027835,-15027835,-14817611,-15027835,-11751134,-11751134,-15027835,-14817611,-15027835,-15027835,-15027835,-15027835,-11751134,-11751134,-15027835,-14817611,-14817611,-15027835,-15027835,-15027835,-11751134,-11751134,-15027835,-15027835,-15027835,-15027835,-15027835,-15027835,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,-11751134,0,-15516058,0,0,-12741661,-9587458,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-16045236,0,-13014631,-13014631,-14397314,0,0,0,-9587458,0,-13014631,-13014631,-14397314,0,-9587458,0,-14397314,0,0,-13014631,-14397314,0,-14397314,0,0,-14397314,-65794,-13014631,-13014631,-14397314,0,0,0,0,-9587458,-65794,0,0,0,0,0,0,-9587458,0,0,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-16045236,0,-13014631,-13014631,-14397314,0,0,0,-9587458,-9587458,-14991515,-13014631,-14397314,0,0,0,-10116899,0,-14397314,-14991515,-14397314,0,0,0,0,-14397314,-65794,-13014631,-14991515,0,0,0,0,0,-9587458,-65794,0,0,0,0,0,0,-9587458,0,0,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-16045236,0,-13014631,-13014631,-14397314,0,0,0,-9587458,-14397314,-14991515,-13014631,-14397314,0,0,0,-16045236,-13014631,-14397314,-13014631,-14397314,0,0,0,-16045236,0,-14397314,-65794,-14991515,0,0,0,0,0,0,-9587458,-65794,0,0,0,0,0,0,-9587458,0,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-16045236,0,-13014631,-13014631,-14397314,0,0,0,-14991515,0,-14991515,-13014631,-9587458,0,0,0,-9587458,0,-14397314,-14991515,-14397314,-9587458,0,0,0,-13014631,-65794,-13014631,-14991515,0,0,0,0,0,-9587458,-65794,0,0,0,0,0,0,-9587458,0,0,0,0,0,-15516058,0,-12741661,0,-9587458,0,0,0,-15516058,0,-12741405,0,-9587458,0,0,0,-16045236,0,-13014631,-13014631,-14397314,0,0,0,-9587458,0,-13014631,-13014631,-14397314,0,-9587458,0,-14397314,0,0,-13014631,-14397314,0,-14397314,0,0,-14397314,-65794,-13014631,-13014631,-14397314,0,0,0,0,-9587458,-65794,0,0,0,0,0,0,-9587458,0,0,0,0,-15053442,0,-13014631,0,-8999972,0,0,0,-15053442,0,-8999972,-8999972,-8999972,0,0,0,-15451811,0,-4427264,-5876736,-5876736,-8999972,0,0,-8999972,-12621680,-4427264,-5876736,-4427264,-12621680,0,0,-15053442,0,0,-9587458,0,0,0,0,-15053442,-9028349,0,-9587458,0,-9028349,0,0,-15053442,-9028349,-2985714,-2985714,-2985714,-9028349,-13559035,0,0,0,-2985714,-2985714,-2985714,0,-13559035,0,-15053442,0,-13014631,0,-8999972,0,0,0,-15053442,0,-8999972,-8999972,-8999972,0,0,0,-15451811,0,-4427264,-5876736,-5876736,-8999972,0,0,-8999972,-12621680,-4427264,-5876736,-4427264,-12621680,0,0,-15053442,0,0,-9587458,0,0,0,0,-15053442,-9028349,0,-9587458,-2985714,-9028349,-9028349,-13559035,-15053442,-9028349,-2985714,-2985714,-2985714,-9028349,-13559035,0,0,0,0,-2985714,0,0,0,0,-15053442,0,-13014631,0,-8999972,0,0,0,-15053442,0,-8999972,-8999972,-8999972,0,0,0,-15451811,0,-4427264,-5876736,-5876736,-8999972,0,0,-8999972,-12621680,-4427264,-5876736,-4427264,-12621680,0,0,-15053442,0,0,-9587458,0,0,0,0,-15053442,0,0,-9587458,-2985714,-9028349,-13559035,0,-15053442,-9028349,-2985714,-2985714,-2985714,-2985714,0,0,0,-9028349,-2985714,0,-2985714,0,0,0,0,0,-6066066,0,-3104354,0,0,0,0,0,-6066066,-7705751,-3104354,0,0,0,0,-6066066,-5078914,-3104354,-3104354,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-6066066,-3104354,-3104354,-6066066,0,0,0,0,-6066066,-7705751,-3104354,-6066066,0,0,0,-6066066,-5078914,-3104354,-3104354,-6066066,-6066066,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,-6066066,0,0,0,0,-3104354,-3104354,0,0,0,0,0,0,-3104354,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3104354,0,-6066066,0,0,0,0,0,-3104354,-7705751,-6066066,0,0,0,0,-6066066,-3104354,-3104354,-5078914,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3104354,0,-6066066,0,0,0,0,0,-3104354,-7705751,-6066066,0,0,0,0,-6066066,-3104354,-3104354,-5078914,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3104354,0,-6066066,0,0,0,0,0,-6066066,-7705751,-3104354,0,0,0,0,-6066066,-5078914,-3104354,-3104354,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3104354,-3104354,-6066066,-6066066,0,0,0,0,-6066066,-6066066,-7705751,-3104354,0,0,0,-6066066,-6066066,-5078914,-3104354,-3104354,-6066066,0,0,-6066066,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,-3104354,-3104354,0,0,0,0,0,0,-3104354,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-3104354,0,-6066066,0,0,0,0,0,-6066066,-7705751,-3104354,0,0,0,0,-6066066,-5078914,-3104354,-3104354,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-6066066,0,-3104354,0,0,0,0,0,-6066066,-7705751,-3104354,0,0,0,0,-6066066,-5078914,-3104354,-3104354,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,-6066066,-3104354,-3104354,-3104354,-6066066,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,-3104354,0,0,0,0,0,0,0,0,0,0,0,0 ];

    var lastReadBackTime = Date.now();


    // Usage example
    let config = {

        CELL_SIZE: 16,               // How many pixels across one cell is (fragment renderer
                                    // MUST get  evenly divided by PARTS_ACROSS
        CHUNK_SIZE: 32,
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
        Slot( 0 )  	// 0x0000FFFF   //0xFFFF0000
					EntType	        Counter
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
            // Make the first type of guy
            if( type < 0.03 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 1;  // TYPE of entity
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction
                initialState[ (2*attlength) + (xx*glength) + yy ] =   // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                
                    //EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
            }
            // Second type of guy
            else if( type < 0.06 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 2;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
            }
            
            // RESOURCE
            else if( type < 0.08 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 3;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
            }


            //Nothing
            else{
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