# Caveats

Where the shipped code and its own documentation disagree. Each entry states what the
code does, with the evidence that establishes it.

* [Inert container decorators](inert-di-decorators.md) - `@Primary` and `@Qualifier` are exported but the container never reads them.
* [Metadata-only agent decorators](metadata-only-agent-decorators.md) - Sixteen decorators with no runtime consumer in this repo.
* [@Transactional needs its DataSource bound explicitly](transactional-di-binding.md) - Nothing binds it for you; you call `bindDataSourceToInstance`.
