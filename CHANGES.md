# version history for `Result`

## version 0.5.0

1. Adds `Optional.flatMap` method
2. Adds `Optional.getOrUndefined` method that returns the value if present, or `undefined` if absent.
3. Adds `Optional.getOr` method that returns the value if present, or a value from the supplier function if absent.

## version 0.4.0

Adds `Optional.ifPresent` method that executes the supplied callback function if the optional is present.

## version 0.3.0

1. Adds the `Optional` class as a buddy to the `Result` class.
2. Updates versions and cleans up warnings and other code linting issues.

## version 0.2.0

This is really a no-op from the interface contract perspective. But changed to use classes rather than pure functional simply because the method docs are better, and it does simplify (decomplexify) the code a bit (from its original undecomplexified form). 

## version 0.1.1

Update docs.

## version 0.1.0

1. Added `conditionalMap` and `conditionalFlatMap`.
2. Deprecated `andThen` in favor of `flatMap`

## version 0.0.4

Changed from arrow functions to function form in the interface for better doc support.

## version 0.0.3

Added `getOr` that accepts a supplier function.

## version 0.0.2 (docs)

Added docs to [README.md](README.md)

## version 0.0.1 (initial release)

The initial release for `Result`.