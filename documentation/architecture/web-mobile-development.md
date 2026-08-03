# Web-First, Mobile-First Development

## Decision

Bravely Done is designed for mobile use but developed primarily in the browser. The web build is not a disposable preview. It is a supported surface and the fastest way to build, debug, automate, and test the shared application.

## One application, three packages

- Angular application runs directly in modern browsers.
- Capacitor packages that application for Android.
- Capacitor packages that application for iOS.
- Platform adapters isolate native storage, haptics, notifications, safe areas, and lifecycle events.

## Desktop development harness

Development mode should support:

- Centered portrait device frame
- Presets for common viewport sizes
- Rotation between portrait and landscape
- Safe-area and notch overlays
- Animation-state selector
- Time-scale control
- Reduced-motion toggle
- Artificial low-performance mode
- Offline and reconnect simulation
- Domain event inspector
- Reward and inventory editor
- Screenshot capture for visual review

The harness must wrap the real mobile layout rather than create a separate UI.

## Responsive rules

- Portrait mobile is the design baseline.
- Touch targets should meet platform accessibility guidance.
- UI must work at 320 CSS pixels wide.
- Tablet and desktop may expose more context but cannot alter the core flow.
- Three.js camera framing must be tested across narrow, tall, and foldable-like aspect ratios.
- Safe-area insets must not cover primary actions or reward text.

## Development workflow

1. Run frontend and optional API in the browser.
2. Develop domain logic and Base Camp scene with browser developer tools.
3. Verify phone-size layouts continuously through the harness.
4. Run automated unit, integration, and Playwright checks.
5. Sync through Capacitor for native lifecycle, haptics, notifications, storage, and device performance checks.
6. Validate Android frequently and iOS at defined milestone gates.

## Platform abstraction

```typescript
interface PlatformServices {
  storage: DurableStorage;
  haptics: HapticsPort;
  notifications: NotificationPort;
  lifecycle: LifecyclePort;
  ai: BravelyAi;
}
```

Browser implementations should provide realistic fallbacks so development does not require an emulator for every change.

## Timer rule

The timer is a domain service, not an animation timer. It must derive active elapsed duration from persisted state and lifecycle events so backgrounding, screen locking, refreshes, and rendering pauses do not corrupt progress.
