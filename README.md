![Logo](assets/ogo.png)

# EzWebGPU.js

## Live demo!
(https://bonisdev.github.io/EzWebGPU/)


## Pre-Computed Constants

The following constants are automatically added to your WGSL shader code:

- **EZX**: Current cell's X coordinate (0-63 on a grid 64x64)
- **EZY**: Current cell's Y coordinate (0-63 on a grid 64x64)
- **EZ_CELL_IND**: Another measure of cell's location derived from (0-4095 on a grid 64x64)
- **EZ_CHUNK_X**: Current cell's home chunk (0-2 on a grid partitioned into 3x3 chunks)
- **EZ_CHUNK_Y**: Current cell's home chunk (0-2 on a grid partitioned into 3x3 chunks)
- **EZ_CHUNK_IND**: Another measure of cell's home chunk derived from (0-8 on a 3x3 chunked grid)
- **EZ_CELL_VALS**: Number of individual U32 or F32 values in a cell 
- **EZ_CELLS_ACROSS_X**: Total cells across the x-axis (would be 64 on a grid 64x64)
- **EZ_CELLS_ACROSS_Y**: Total cells across the y-axis (would be 64 on a grid 64x64)

### Example code

Conway's Game of Life:

```wgsl
 let computeWGSL =
`
    var neighbs: f32 = 0;
    neighbs += EZ_GET_CELL(EZX+1, EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX+1, EZY  , 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX+1, EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX  , EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX-1, EZY-1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX-1, EZY  , 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX-1, EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );
    neighbs += EZ_GET_CELL(EZX  , EZY+1, 0, EZ_CHUNK_X, EZ_CHUNK_Y );

    var myState: f32 = EZ_STATE_IN[ EZ_CELL_IND ];


    if (myState == 1 && (neighbs < 2 || neighbs > 3)) {
        EZ_STATE_OUT[ EZ_CELL_IND ] = 0.0;
    }
    else if (myState == 0 && neighbs == 3) {
        EZ_STATE_OUT[ EZ_CELL_IND ] = 1.0;
    }
    else {
        EZ_STATE_OUT[ EZ_CELL_IND ] = myState;
    }
`;
```

```wgsl
let fragmentWGSL =
`
    var rrr: f32 = 0;
    var ggg: f32 = 0;
    var bbb: f32 = 0;

    var cellVal: f32 = cellState[ EZ_REBUILT_INSTANCE + (0) * EZ_TOTAL_CELLS ];

    if( cellVal < 1 ){
        rrr = 0;
        ggg = 0;
        bbb = 0;
    }
    else{
        rrr = 1;
        ggg = 1;
        bbb = 1;
    }

    EZ_OUTPUT.red = rrr;
    EZ_OUTPUT.grn = ggg;
    EZ_OUTPUT.blu = bbb;
`;
```

```javascript
// Usage example
let config = {
  CELL_SIZE: 1,
  CHUNK_SIZE: 256,
  CHUNKS_ACROSS: 1,
  PARTS_ACROSS: 1,

  CONTAINER_ID: "demoCanvasContainer", // DOM id to insdert canvas to
  RAND_SEED: "randomseed12345678910",
  STARTING_CONFIG: EZWG.ALL_BINS, // couldve been EZWG.ALL_ZERO
  COMPUTE_WGSL: `
        // The custom WGSL code goes here
        ${computeWGSL}
    `,

  FRAGMENT_WGSL: `
        // The custom WGSL code goes here
        ${fragmentWGSL}
    `,
};

// Intital set the default runner to this
EZ_EXAMPLE = new EZWG(config);

document.getElementById("extraTitle").innerHTML = `
    <p style="color: red;">If this example is just flashing and not progressing to the next CGOL step contact admin immediately (important)</p>
`;
```

### EZ Cheat Sheet
![Logo](assets/ezcs.png)