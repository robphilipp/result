# version history for `Result`

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