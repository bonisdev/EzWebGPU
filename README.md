# EzWebGPU

## Pre-Computed Constants

The following constants are automatically added to your WGSL shader code:

- **EZ_CELLS_ACROSS_X**: Total cells across the x-axis.
- **EZ_CELLS_ACROSS_Y**: Total cells across the y-axis.

### Example

```wgsl
// Example shader using EZ_CELLS_ACROSS_X and EZ_CELLS_ACROSS_Y
@compute @workgroup_size(1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let cell_x = GlobalInvocationID.x % EZ_CELLS_ACROSS_X;
    let cell_y = GlobalInvocationID.y % EZ_CELLS_ACROSS_Y;
    // Additional code here
}
```
