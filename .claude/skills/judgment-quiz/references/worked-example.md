# Worked example: a membership-status quiz

An illustrative example. Each finding below stands for a _kind_ of result a real quiz produces. The
domain is fictional; the patterns are not.

The system classifies each member of an association and shows the status on their account page and
in staff reports: 🟢 **Active**, 🟠 **Needs attention** (staff should follow up), 🔴 **Lapsed**
(benefits suspended). The quiz had 30 scenarios. The membership director answered it, and matched the
system on 21.

## A scenario that exposed a category error

### A3 (as the answerer saw it)

> A member record was imported from the old system during the migration. It has a join date but no
> payment history at all, because the old system never exported payments.
>
> - **a.** 🟠 **Needs attention** — _Payment for the current term has not been received._
> - **b.** 🔴 **Lapsed** — _No payment within the grace period; benefits are suspended._
> - **c.** 🟢 **Active** — _The member is in good standing._
> - **d.** 🟠 **Needs attention** — _The member's record is incomplete._

**The system said:** b. **The director said:**

```
answer: none — this isn't a membership status. Show "Imported — awaiting verification" and put it on
the migration team's list.
why: We don't know anything about this person yet. Calling them lapsed would suspend benefits for
someone who may well have paid.
```

The same answer came back on four related scenarios. **Lesson:** when the expert rejects every option
the same way across several questions, a concept is missing from the model. Moving these records up
or down the status ladder wouldn't have fixed it, because they don't belong on the ladder at all.

## An identical-input twin that exposed a data gap

These two scenarios were built from **identical inputs**, because the system stores only the date of
the last payment attempt, not whether it succeeded:

- **B4.** "The member's card was declined at the last renewal and they haven't paid since." The
  director said 🔴 Lapsed, and so did the system.
- **B7.** "The member's card was valid at the last renewal. This term's automatic charge never reached
  the payment provider because of an outage, so no decline was recorded either." The director said
  🟠 Needs attention: _it's our failure, not theirs._ The system said 🔴 Lapsed and suspended the
  member's benefits.

B7 used `given:` lines to make the ambiguous facts explicit:

> The member did nothing wrong; the charge never reached the provider.
> No decline is on record, only the date of the attempt.

**Lesson:** the twin pair showed that the expert distinguished two situations the system had no way
to represent. The fix was a data change, recording each payment attempt's outcome. The same change
resolved a third scenario. It's common for one data fix to resolve several findings, and data changes
are expensive once other systems depend on the data, which is a reason to run the quiz early.

## A contradiction that turned out to be a misread

C2 (a member who upgraded mid-term _and_ missed a payment) was answered 🟢 "the upgrade outranks the
missed payment". C5 (the same missed payment, no upgrade) was answered 🔴. Both can't follow from one
rule. In the follow-up round, C2 turned out to be a misread: the director had taken "upgraded" to
mean "paid for the upgrade". The system's rule (a missed payment is never hidden by other activity)
was confirmed. **Changing the system on the first-pass answer would have introduced a defect.**

## A wording failure

D1: the option text "_Membership is partial_" was meant to mean _some benefits are suspended_. The
director read it as _paid in part_. The logic was right, and the sentence describing it failed. The
fix was a wording change only.

## Agreements worth recording

Every scenario about grace periods matched, as did every scenario about staff-only statuses. These
went into the results file, because they confirm choices that were made deliberately and might
otherwise be "simplified" later.
