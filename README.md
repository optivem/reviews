# Optivem Hub

**[Dashboard](https://optivem.github.io/hub/)**

[![dashboard](https://github.com/optivem/hub/actions/workflows/dashboard.yml/badge.svg)](https://github.com/optivem/hub/actions/workflows/dashboard.yml)

Optivem Academy — sandbox project submissions, reviews, and discussions

[Submit a Review Request](https://github.com/optivem/hub/issues/new/choose)

## How to submit your sandbox project for review

1. Click [**Submit a Review Request**](https://github.com/optivem/hub/issues/new/choose)
2. Choose the template for your course (ATDD or Pipeline)
3. Select your project, course, and module
4. Submit the issue — it goes straight to **In Review**

If a ticket for the same project and module already exists, your new issue will be auto-closed as a duplicate. Issues created by users who are not members of the selected project are also auto-closed.

## Status tracking

All statuses are updated automatically — you don't need to change them manually.

| Status | Meaning |
|--------|---------|
| **In Review** | Waiting for reviewer (set on creation, and after you respond to feedback) |
| **In Progress** | Reviewer is working on feedback |
| **Done** | Review complete, ticket closed |

### Status transitions

```
  Issue created ──→ In Review
                       │
                       ├── Reviewer comments ──→ In Progress
                       │                           │
                       │                           │ Student comments
                       │                           │
                       │                           └──→ In Review
                       │
                       └── Reviewer closes ──→ Done
```

### Trigger rules

| Event | Who | Result |
|-------|-----|--------|
| Issue created | Student | Status → **In Review** |
| Comment | Student | Reopen if closed; status → **In Review** |
| Comment | Reviewer | Status → **In Progress** (skipped if closing) |
| Close | Reviewer | Status → **Done** |
| Close | Student | Auto-reopened with comment (students cannot close tickets) |
| Reopen | Anyone (no comment) | Status → **In Review** |
| Reopen | Anyone (with comment) | Handled by comment rules above |
| Assignee or milestone changed | Anyone | Auto-reverted with warning (managed automatically) |

When you've addressed feedback, add a comment on your issue describing what you changed. The status will automatically move back to **In Review**.

## For Teachers

[Project Board](https://github.com/orgs/optivem/projects/18)

## Refresh

[Refresh Dashboard](https://github.com/optivem/hub/actions/workflows/dashboard.yml)

## Notifications

GitHub does not notify you about new discussions, issues, or comments by default. Setting this up correctly requires **two** independent steps — watching the repo is not enough on its own.

### Step 1 — Watch the repo

1. Go to the [hub repository](https://github.com/optivem/hub)
2. Click **Watch** (top right)
3. Choose **All Activity**, or **Custom** → check **Discussions**, **Issues**, and any other categories you want

### Step 2 — Enable delivery for each category in your global settings

Even with **All Activity** watching, GitHub still suppresses notifications for any category whose delivery is turned off globally. **Discussions in particular is off by default.**

1. Go to [github.com/settings/notifications](https://github.com/settings/notifications)
2. Scroll to the **Discussions** section and enable **email** and/or **web** delivery
3. Do the same for **Issues**, **Pull requests**, etc. as needed
4. If you route org notifications to a specific email, confirm `optivem` is routed to an inbox you actually read (under **Custom routing**)

### Automatic notifications

You will also be notified automatically when:
- Someone @mentions you in a discussion, issue, or comment
- You comment on or subscribe to a specific discussion or issue (use the **Notifications** button at the bottom of any discussion/issue to subscribe to just that thread)

### Troubleshooting "I'm watching but didn't get notified"

If you watched **All Activity** but still missed something:

- **Most common cause:** Discussions delivery is disabled in your global settings (Step 2 above).
- Confirm you're not on **Custom** watching with Discussions unchecked — re-open the **Watch** dropdown to verify.
- Check spam/junk for emails from `notifications@github.com`.
- Make sure the `optivem` org isn't muted at [github.com/settings/notifications](https://github.com/settings/notifications) under "Notifications for…".
- Review your active subscriptions at [github.com/notifications/subscriptions](https://github.com/notifications/subscriptions).
