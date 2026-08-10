# Codex Capacity Monitor

A personal Windows utility that presents Codex account capacity and reset availability while the user works.

## Language

**Quota Window**:
A backend-defined interval in which Codex capacity is measured. The currently relevant windows are five-hour and weekly.
_Avoid_: Bucket, allowance period

**Remaining Capacity**:
The unused percentage of a Quota Window, derived from the backend-reported used percentage.
_Avoid_: Credits, balance, tokens

**Full Reset Credit**:
An earned, redeemable entitlement that can reset eligible Codex Quota Windows. The first release displays these but never redeems them.
_Avoid_: Reset count, retry, automatic reset

**Window Reset Time**:
The backend-reported time at which a Quota Window resets automatically.
_Avoid_: Credit expiry, refresh time

**Credit Expiry Time**:
The time after which a Full Reset Credit is no longer redeemable.
_Avoid_: Window reset time
