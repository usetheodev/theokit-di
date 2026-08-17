# Caveats

Where the shipped code and its own documentation disagree. Each entry states what the
code does, with the evidence that establishes it.

* [Inert container decorators](inert-di-decorators.md) - Four exported decorators the container never reads.
* [Metadata-only agent decorators](metadata-only-agent-decorators.md) - Sixteen decorators with no runtime consumer in this repo.
* [@Transactional has no DI binding path](transactional-di-binding.md) - The documented DI route does not exist.
