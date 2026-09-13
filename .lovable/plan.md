# Update the Ledger skill with the Speculos emulator path

The skill currently assumes a physical Ledger on USB. Everything learned while
getting the emulator working — and the separate emulator enrolment — is missing.
Add it, so a future session can reproduce a device-confirmed run with no hardware.

## What gets added to `.agents/skills/ledger-agent-stack/SKILL.md`

1. **Description line** — mention Speculos/emulator so the skill is retrieved when
   someone asks for a device gate without hardware.

2. **New section: Emulated device (Speculos)**
   - When to use it: demos, CI, and any machine without a Ledger attached.
   - Setup that actually worked: Speculos v1.22.3 in a venv; the Ethereum app
     `.elf` for the target model pulled from the `app-ethereum` releases; a
     `qemu-arm` binary must be on PATH **named `qemu-arm-static`** or Speculos
     will not start.
   - Ports: APDU on `127.0.0.1:9999`, REST API on `5000`. The bridge runs with
     `LEDGER_TRANSPORT=speculos` and speaks to the APDU port.
   - The default test seed yields address `0xf39Fd6e5…92266` — useful as a
     known-good check that the whole chain recovers correctly.

3. **New section: Driving the emulator screen**
   - Approval needs button presses; there is no human. Poll the REST screen
     endpoint and press accordingly rather than guessing a fixed sequence.
   - `POST /button/{left|right|both}` takes action `press-and-release`
     (hyphens, not underscores) and accepts only those three targets. Other
     shapes return 405 and look like a missing endpoint.
   - Automation-rule JSON schema differs between Speculos versions; screen-driven
     pressing is the reliable path.

4. **Separate enrolment, stated explicitly**
   - `LEDGER_SIGNER_ADDRESS` for a physical device, `LEDGER_SIGNER_ADDRESS_EMULATOR`
     for Speculos. Never one falling back to the other.
   - Every approval carries a qualifier (`device` vs `emulator`) that travels into
     the receipt, so an emulated tap can never be read as a hardware tap.
   - With no enrolled address set, the gate is open — say so rather than implying
     it is enforced.

5. **New trap: CJS interop on `@ledgerhq/hw-app-eth`**
   - `AppEth is not a constructor` / bridge 502. The class nests one level under
     Node's interop. Resolve `mod.default?.default ?? mod.default ?? mod.AppEth`.

6. **Trap tightened** — the existing "device refused / locked" entry gets the
   emulator equivalent: a stalled review screen is a failed approval, not a retry.

## Technical notes

Single-file edit to `.agents/skills/ledger-agent-stack/SKILL.md`, then
`skills--apply_draft` on `.agents/skills/ledger-agent-stack` to activate the
updated version. No app source changes.
