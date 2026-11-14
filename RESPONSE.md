# Part A: Product Thinking

**My position up front:** the customer asked for a solution ("block submission"), not a problem. The three stakeholders want different things: fewer wasted review rounds, an audit trail, and no extra friction. A blanket hard block serves the first two and ignores the third. My compromise is to build the feature as an **opt-in company setting** with two strictness levels (warn or block), and to make every response to a suggestion, including rejections with a reason, part of the record. That gives the audit trail without forcing friction on companies that don't want it.

## 1. Questions I would ask

**About the problem**

- What happens today when a user skips a suggestion? Can you show me a recent case where it caused an extra review round, and how often does that happen?
- Who feels the pain: submitters, reviewers, or compliance? Who on your side raised this?
- Is this one customer, or have others asked for something similar?

**About what "reviewed" means**

- What counts as a response: accept, reject, "not relevant", or just viewing it? Would "dismiss all" be acceptable, or would that defeat the purpose?
- Are all suggestions equally important, or should low-confidence or cosmetic ones be exempt?

**About the rule**

- Hard block, or a warning with a logged "submit anyway"? Would the latter satisfy the audit-trail need?
- Who controls it: a company admin, a team lead, or each user?
- What happens to content already in progress when the rule is turned on?

**To internal stakeholders**

- How do we measure review rounds today, and what number would tell us this worked?
- What exactly does the audit trail need to record, for whom, and for how long?
- Are there users who submit many pieces a day, for whom extra clicks really add up?

## 2. How I would gather more information

**Product data**

- How many suggestions a submission typically gets, and how many are acted on, rejected, or ignored. If most are ignored, the suggestions may be the problem, not the users.
- Whether submissions with ignored suggestions actually get sent back more often. This is the core claim; if the data doesn't support it, the feature won't fix review rounds.
- Which suggestion types are ignored most. A narrower fix may be better than a gate.

**Product behaviour**

- Walk through the flow as a submitter and as a reviewer: how easy is it to skip suggestions, and is "reviewed" even visible today?
- Check what the platform already records about suggestions, so I know how much audit trail already exists.

**People**

- Customer success and support: tickets about ignored suggestions, from this customer or others.
- The team that owns the AI suggestions: how accurate are they, and is there a confidence score we could use?

## 3. Developer-ready ticket

**Title:** Suggestion review gate before submitting for review (opt-in)

**Context**

Users can submit content for human review without responding to AI suggestions. A customer reports this causes unnecessary review rounds and leaves no record that suggestions were considered. We want companies to be able to require a response to each suggestion before submission, without adding friction for companies that don't want it.

**Scope (v1)**

1. **Settings** (company level, admin only, changes logged):
   - `requireSuggestionReview`: `off` (default), `warn`, `block`.
   - `rejectionReason`: `optional` (default) or `required`.
2. **Suggestion responses.** Each suggestion can be `accepted`, `rejected`, or `not_relevant`. Rejecting or marking as not relevant shows a reason input (free text plus quick picks such as "incorrect", "already handled"), optional or required per the setting. Responses are stored with user, timestamp and reason.
3. **Gate on submit.** With `warn`, submitting with unreviewed suggestions shows a confirmation listing them, with "Review them" and "Submit anyway"; submitting anyway is recorded as an override. With `block`, the submit button is disabled with a message until every suggestion has a response.
4. **Reviewer view.** The reviewer sees each suggestion's response, reason, and who gave it, or that it was overridden.
5. **Metrics.** Track suggestions reviewed vs ignored, overrides, and review rounds per submission, before and after enabling.
6. **Notice on enable.** When an admin turns the gate on or changes its mode, submitters see a one-time in-app notice explaining what changed and what is now required, so the gate never appears as a surprise.

**Out of scope for v1:** per-user or per-team settings; exempting suggestions by confidence or type; bulk "dismiss all" (deliberately, so the gate can't be bypassed in one click); feeding reasons back into the AI.

**Acceptance criteria**

- With `off`, nothing changes for existing users.
- With `warn`, the confirmation appears when unreviewed suggestions remain; "Submit anyway" submits and records an override.
- With `block`, submission is not possible until every suggestion has a response, and the UI says why.
- With `rejectionReason` set to `required`, a rejection cannot be saved without a reason.
- Every response, reason and override is stored and visible to the reviewer.
- Content already in review when the setting is turned on is not affected.
- Turning the gate on, or changing its mode, shows each submitter a one-time notice on their next visit.

**Assumptions**

- A1: Suggestions already have stable ids, so responses can be attached to them.
- A2: Company-level control is enough for v1; per-user control would weaken the audit trail.
- A3: `warn` is the recommended setting; `block` exists for teams with a compliance need.
- A4: Reasons are stored and displayed only; using them to improve the AI is a later step.

**Open questions**

- Does viewing a suggestion count as reviewing it, or is an explicit response required? (Assumed explicit.)
- Should low-confidence suggestions be exempt? (Needs a confidence score from the AI team.)
- Should the gate apply to resubmissions after a review round, or only the first submission?
- Does the audit trail need to be exportable, and for how long must it be kept?
- Should admins be told when someone uses "Submit anyway"? A notification per override would be noisy; a count on the settings page or a weekly summary is a better start.

**Dependencies:** admin settings UI, the AI suggestions service (stable ids, confidence score if any), analytics events, and design for the dialog and reviewer view.
