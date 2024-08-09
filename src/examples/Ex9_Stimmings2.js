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
            // This Entity's Sepcial Random
        var tesr: u32 = counter + EZ_RAND_U( counter + EZX*19 + EZY*183);

        // TODO - GET THE ENTITY PROFILE 

        // 0, 1, 2, 3, 4, 5, 6, 7, 8   <-  (4 Stationary)
        var nextMove: u32 = EZ_CELL_VAL( EZX, 0, EZY, 0, 1 );
        var pPrior: u32 = (nextMove >> 8) & 0x000000FF;     // IDK --- - What is this guys random priority ?!
        nextMove = (nextMove & 0x000000FF);                 // NEXT MOVE INTENTION


        
        //          Stores 4 different scent values
        var SLTINDX_STRT: u32 = 2u;
        var SCSLTS: u32 = 2u;       // ALL SCENT SLOTS
        //          First these values are filled with lowest of each scent 
        const TTL_INSLTS: u32 = 16u;    //8 * SCSLTS;       // TOTAL IN SCENT VALS (u32s) 8 nghbs times each u32 val needed for scent
        const TTL_OUTS: u32  = 8u;      //4 * SCSLTS;       // TOTAL scent outs (u8's) to write back
        var inScents: array< u32, TTL_INSLTS >;
        var outScents: array< u32, TTL_OUTS >;
        outScents[0] = 0u;  // home
        outScents[1] = 0u;  // res
        outScents[2] = 0u;  // work
        outScents[3] = 0u;  // enemy

        outScents[4] = 0u;  // home
        outScents[5] = 0u;  // res
        outScents[6] = 0u;  // work
        outScents[7] = 0u;  // enemy



        //      No matter what accumulate the neighbours' intentions
        var i: u32 = 0u; 
        var di: u32 = 0u;                   // Direction ind
        var bitind: u32 = 0u;               // Scent ind (the 0-3 inside a u32)
        var dx: i32 = -1i;
        var dy: i32 = -1i;

        // FIRST MAKE ALL THE SCENT VALUE READS U NEED:
        loop {                              // Goes 0-7 (inclusive)
            if i >= TTL_INSLTS { break; }   // from 0 to TTL_INSLTS-1
            di = (i%8) + ((i%8)/4u);        // Which way look around (0 - 7 SKIPS 4!(SELF))
            bitind = i / 8;                 // Which scent to be compiling (0 - 3)
            dx = -1 + i32(di%3u);           // X Value
            dy = -1 + i32(di/3u);           // Y Value
            inScents[ i ] = EZ_CELL_VAL( EZX, dx, EZY, dy, 2u + bitind );
            i = i + 1u;
        }
        // INSCENTS for 2 scent slots
        // SCHEMA for 2 (TWO) memory slots
        //  [ topleft u32,  topmiddle u32, toprightu32 , ....  , bottommiddle u32+1, bottomright u32+1 ]



        // SECOND LOOP THROUGH NEIGHBOURS AND GET THE MOVE INTENTION IF IT'S ON YOU

        //
        //          4  ( FOUR ) 
        //
        //
        //
        //                          IS LIKE THE 
        //
        //
        //
        //
        //                                          -1  here
        //
        //
        //



        //          Attackers on ME
        var numOfStomprs: u32 = 0u;         // Amount of stompers on me movement?
        var comingFromLoc: u32 = 4u;        // Where is the stomper coming from
        
        //          Attackers on DESTINATION
        var movConflicts: u32 = 0u;         // USED if ur going away from ur current spot
        var immintDestEntity: u32 = 0u;     // if the spot is empty or not

        //          Get your next destination
        var bestMoveInd: u32 = 4u;          // DEFAULT STATIONARY


        //          Quickly get the GOING-TO move spot of ur next move (IF UR GOIN THERE)
        immintDestEntity = EZ_CELL_VAL( EZX, (-1 + i32(nextMove%3u)), EZY, (-1 + i32(nextMove/3u)), 0u );
        immintDestEntity = immintDestEntity & 0x0000FFFF;

        i = 0u;         // USED for getting STOMPED on, ACUUMULATING PHYSICS,  "verifying DESTINATION still good".
        loop {
            if i >= 8 { break; }
            di = (i%8) + ((i%8)/4u);        // Which way look around (0 - 7 SKIPS 4!(SELF))
            dx = -1 + i32(di%3u);           // X Value
            dy = -1 + i32(di/3u);           // Y Value

            // TODO IMPLEMENT PHYSICS TOUCHING HERE - ACCUMULATE TRANSFORMATION VALUES HERE
 
            //      Attackers on YOUR cell
            bitind = EZ_CELL_VAL( EZX, dx, EZY, dy, 1u );   
            bitind = bitind & 0x000000FF;
            if( di == 8u - bitind ){
                numOfStomprs = numOfStomprs + 1u;   // USED in the case ur movement 
                                                    // is blocked or ur not moving in the first place
                comingFromLoc = di;                 // Just add this number back on to 
                                                    // yourself to get the attacker (WHO THIS CELL SHOULD BECOME)
            }
            
            //      Attackers on TO cell (USED when nextMove not 4)
            //      "verifying DESTINATION still good"
            bitind = EZ_CELL_VAL( EZX, dx + (-1 + i32(nextMove%3u)), EZY, dy + (-1 + i32(nextMove/3u)), 1u );
            bitind = bitind & 0x000000FF;
            if( di == 8u - bitind ){
                movConflicts = movConflicts + 1u;   // USED in the case you are going to MOVE
                                                    // if 1 in total -> ur good to MOVE
            }
            i = i + 1u;
        }


        // TODO also here accumualte all the PHysics....
        var UHOH_UNDRWNT_TRANFSORM: u32 = 0u;


        // LOOKING FOR MOVES ON for DESIRED SCENTS

        //          CHOOSING A NEXT INTENDED MOVEMENT

        var otherIntentionsOnGoal: u32 = 0u;    // how many other guys have intentions on the same cell


        var tempDesiredMoveInd: u32 = 0u;       // <- TODO this number detrmeind by scent desire
        
        // insert scent desires here?! TODO
        if( entityType == 1u ){                 // JUST GO RIGHT (old man)
            tempDesiredMoveInd = 0u;
            bestMoveInd = tempDesiredMoveInd;   // TODO <- temp statement normally SCENT values are compared
        }
        else if( entityType == 2u ){            // GO TO RES (stimmers)
            tempDesiredMoveInd = 1u;
            bestMoveInd = tempDesiredMoveInd;
        } 

        i = 0u;
        loop {
            if i >= 8 { break; }
            di = (i%8) + ((i%8)/4u);
            dx = -1 + i32(di%3u);
            dy = -1 + i32(di/3u);

            bitind = EZ_CELL_VAL( EZX, dx + (-1 + i32(tempDesiredMoveInd%3u)), EZY, dy + (-1 + i32(tempDesiredMoveInd/3u)), 1u );
            bitind = bitind & 0x000000FF;
            //      bitind is now the movement location of the guys
             

            if( di == 8u - bitind  ){   // TODO SOMehow movent priotrt
                otherIntentionsOnGoal = otherIntentionsOnGoal + 1u;
            }

            i = i + 1u;
        }
        



        //         NOW HAVE ALL THE VALUES FOR THE "FINAL VERDICT "
        // WHAT TO DO W ALL THIS INFORMATION..........
        //
        //                      POSSIIBLITIES

        /////////               HMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM





        //          TODO Grab the corresponding TRANSFORMATION
        if( UHOH_UNDRWNT_TRANFSORM > 0u && nextMove == 4u ){  // Always false for now anwyas
        
        }
        //          YOU are a free space AND there's exactly ONE moving on to you
        else if( entityType == 0u ){
            // RETRIEVE that one and copy its values into you
            if( numOfStomprs == 1u ){
                dx = -1 + i32(comingFromLoc%3u);           // X Value
                dy = -1 + i32(comingFromLoc/3u);           // Y Value
                            // DO NOT IMPLEMENT PHYSCS HERE....  i think.....// TODO IMPLEMENT PHYSICS TOUCHING HERE - ACCUMULATE TRANSFORMATION VALUES HERE
                // Get the cell type, and incrase the count.....
                bitind = EZ_CELL_VAL( EZX, dx, EZY, dy, 0u );  
                entityType =bitind & 0x0000FFFF;
                counter =   (bitind >> 16) & 0x0000FFFF;
                counter =   counter + 1;                      //      *********   only thing from the invading entity that GETS UPDATES  ^ ^^loook at this comment

                bitind = EZ_CELL_VAL( EZX, dx, EZY, dy, 1u );
                nextMove = 4u;  //(bitind & 0x000000FF);        // <- THIS GETRSE RESET
                pPrior = (bitind >> 8) & 0x000000FF;
            }
            // EMPTY and no one moving on to you... carry on nothingness somehow....
            else{
                // entity is already set,
                // counter already went up
                nextMove = 4u;//is the same (4)
                //  pPrior = idk
            }
        }



        //          YOU are an ENTITY    Maybe Move   vs.  Maybe Stay
        else{
            // Good to set new move 
            //      FINAL VERDICT: ->           // For setting new movement intention
            // FoR SETTING A NEW NEXT MOVE
            // A best move has been found that matches scent desire <- TODO actually implement the scent scanning
            // next move is stationary so its open to being set
            // the spot u are going to has no other INTENTIONS going there, and is an OPEN SLOT ( 0u ) <- SEPARTE THIS FOR MULTIPLE PRIORTITY
            // and the special random hit your frequency
            if( bestMoveInd != 4u &&  nextMove == 4u && otherIntentionsOnGoal == 0u && (tesr%5 == 2) ){     //if( nextMove == 4 ){     // No move just update
                // "entityType" is already updated
                // "counter" is already updated
                nextMove = bestMoveInd;
                // "pPrior" .. do .... someting about this
                //}
            }

            // Will activate the movement you have SET -> 
            // You are going somwhere AND 
            //      iT is STILL good to move there
            else if(nextMove != 4u && movConflicts == 1u && immintDestEntity < 1){                                   // Intension to move is still valid?
                                    //if( numOfStomprs > 1 ){
                                        // HOWEVER more than one
                                    //}
                entityType = 0u;
                counter = 0u;
                nextMove = 4u;
                // "pPrior" .. do .... someting about this

            }

            // YoU have to STAY - your movment was cancelled
            else{
                // "entityType" is already updated
                // "counter" is already updated
                nextMove = 4u;// reset it back to nuffin agian
                // "pPrior" .. do .... someting about this
            }
        }

        


        
        // If there's any more than one contender it nulls the movement anyways
        // from the other guys perpectivce



        // GRAB SCENT PROFILE + DAMAGE PROFILE and EVALUATE THE NEW SCENTS WITH THE NEW LOCATION
        // AND UPDATE THE SCENTS THIS FRAME HERE - WITH THE NEW ENTITY VALUES 



        var crvl: u32    = 0u;              // CUrrent scent val looking at 
        var tmpcrvl: u32 = 0u;              // Current holding val for the contender for lwoestscent
 
        // FIND THE HIGHEST SCENT AND SUB 1
        i = 0u;
        loop {
            if i >= 4*8*SCSLTS { break; }   // nghbs,   u8s,   scentslts
            di = i / 4;                     // Each di another index in inScents
            bitind = (i%4) + (i/(4*8))*4;   // Which outScent to be writing to
            crvl = inScents[ di ];          // Get the entire u32 represeting the scents from this direction//EZ_CELL_VAL( EZX, dx, EZY, dy, 2u );
            crvl = ( crvl >> (8u*(i%4)) ) & 0x000000FF;     // Starts at FF and .. FF000000  <-then loops around for next scent slot 
            tmpcrvl = outScents[ bitind ];
            if( crvl > tmpcrvl ){
                outScents[ bitind ] = crvl;
            }
            i = i + 1u;
        }
        i = 0u;
        loop {               
            if i >= TTL_OUTS { break; }
            outScents[ i ] = max( outScents[ i ], 22u );
            outScents[ i ] = outScents[ i ] - 22u;
            i = i + 1u;
        }



        // SCENT EMITTER res:
        if( entityType == 1u ){     // OLD MAN
            outScents[ 0u ] = 255u; 
        }
        else if( entityType == 3u ){// RES
            outScents[ 1u ] = 255u; 
        }
 

 
        

        // 0:  SET 
        var myState: u32 = 0u;
        myState = (entityType & 0x0000FFFF) | ((counter & 0x0000FFFF) << 16);

        // 1:  SET rando thing funner 
        //      nextMove
 
        // 2: SCENTS
        EZ_STATE_OUT[ EZ_CELL_IND + 2u * EZ_TOTAL_CELLS ] = 
            (outScents[0] & 0x000000FF) |
            ((outScents[1] & 0x000000FF) << 8) |
            ((outScents[2] & 0x000000FF) << 16) |
            ((outScents[3] & 0x000000FF) << 24);
        
        EZ_STATE_OUT[ EZ_CELL_IND + 3u * EZ_TOTAL_CELLS ] = 
            (outScents[4] & 0x000000FF) |
            ((outScents[5] & 0x000000FF) << 8) |
            ((outScents[6] & 0x000000FF) << 16) |
            ((outScents[7] & 0x000000FF) << 24);

 

        var bufferInd0: u32 = EZ_CELL_IND + 0u * EZ_TOTAL_CELLS;
        var bufferInd1: u32 = EZ_CELL_IND + 1u * EZ_TOTAL_CELLS;
        // Get the min max of the input coordinattres
        var minX: u32 = min( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
        var maxX: u32 = max( u32(EZ_USER_INPUT[0]),  u32(EZ_USER_INPUT[2]));
        var minY: u32 = min( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
        var maxY: u32 = max( u32(EZ_USER_INPUT[1]),  u32(EZ_USER_INPUT[3]));
        if( EZ_USER_INPUT[6] > 0){
            if( EZX >= minX && EZX <= maxX && EZY >= minY && EZY <= maxY ){
                // The case where the cell is in the bounding box of the user's click drag

                if( EZ_USER_INPUT[4] == 1){
                    EZ_STATE_OUT[ bufferInd0 ] = 1;     // and coincenidenly sets the counter to 0
                    EZ_STATE_OUT[ bufferInd1 ] = 4u;    // (stationary)
                }
                else if( EZ_USER_INPUT[4] == 2){
                    EZ_STATE_OUT[ bufferInd0 ] = 2;     // and coincenidenly sets the counter to 0
                    EZ_STATE_OUT[ bufferInd1 ] = 4u;    // (stationary)
                }
                
                else{
                    EZ_STATE_OUT[ bufferInd0 ] = 0;     // and coincenidenly sets the counter to 0
                    EZ_STATE_OUT[ bufferInd1 ] = 4u;    // (stationary)
                }

                
            }
            else{
                EZ_STATE_OUT[ bufferInd0 ] = myState;               //pPrior
                EZ_STATE_OUT[ bufferInd1 ] = nextMove;  // TODO bit smoosh rentiy priority
            }
        }
        else{
            EZ_STATE_OUT[ bufferInd0 ] = myState;
            EZ_STATE_OUT[ bufferInd1 ] = nextMove;
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



        //      SCENTS
        var scntSlot0: u32 = EZ_STATE_IN[ EZ_CELL_IND + 2u*EZ_TOTAL_CELLS];
        var scntSlot1: u32 = EZ_STATE_IN[ EZ_CELL_IND + 3u*EZ_TOTAL_CELLS];

        var homScent: f32 = f32( scntSlot0 & 0x000000FF );
        var resScent: f32 = f32( (scntSlot0 >> 8) & 0x000000FF );

        homScent = homScent / 255f;
        homScent = homScent * 0.783f;
        homScent = pow( homScent, 3 );

        resScent = resScent / 255f;
        resScent = resScent * 0.783f;
        resScent = pow( resScent, 3 );


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
            randVal = 0.15;

            EZ_OUTPUT.red = homScent;

            EZ_OUTPUT.grn = resScent; 

            EZ_OUTPUT.blu = resScent;
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
        CHUNK_SIZE: 64,
        CHUNKS_ACROSS: 1,
        PARTS_ACROSS: 8,            // Note* frag shader considers each part one by one pixel

        CELL_VALS: 4,
        
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
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                initialState[ (3*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                
                    //EZWG.createPackedU32( 0, 5 + Math.floor(EZWG.SHA1.random()*25), 127, Math.floor(EZWG.SHA1.random()*256) );
            }
            // Second type of guy
            else if( type < 0.06 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 2;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                initialState[ (3*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
            }
            
            // RESOURCE
            else if( type < 0.08 ){
                initialState[ (0*attlength) + (xx*glength) + yy ] = 3;
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                
                initialState[ (3*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
            }


            //Nothing
            else{
                initialState[ (0*attlength) + (xx*glength) + yy ] = 0;  // This also sets counter to 0
                initialState[ (1*attlength) + (xx*glength) + yy ] = 4;  // next movement direction (4) is stationary
                initialState[ (2*attlength) + (xx*glength) + yy ] =     // scents
                    EZWG.createPackedU32( 0, 0, 0, 0);
                
                initialState[ (3*attlength) + (xx*glength) + yy ] =   // scents
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
    EZ_EXAMPLE.UPDATE_INTERVAL = 45;//45;
    
};