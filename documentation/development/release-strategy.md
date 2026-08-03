# Release Strategy

## Environments

- Local developer
- Pull-request preview/web test environment
- Shared development API/database
- Staging
- Production

## Release gates

- Format, lint, typecheck, tests, coverage, builds, and e2e pass
- Database migrations reviewed and reversible where practical
- Accessibility checks pass
- FUN gate evidence exists for player-facing changes
- Performance budgets pass for animation changes
- Security and privacy impact reviewed
- Testing exceptions remain current

## Mobile cadence

The browser remains the rapid development surface. Android validation begins during Base Camp Alive, not at the end. iOS validation occurs at defined milestone gates and before public release.
