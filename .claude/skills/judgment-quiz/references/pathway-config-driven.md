# Pathway: behavior defined by configuration

**Use when** the business rules are mostly configuration rather than code. This is typical of Drupal,
and true of WordPress plugins, CMS workflows, feature flags and SaaS admin settings. The rules are
real, a stakeholder is accountable for them, and nobody ever wrote them down as rules.

## Finding the decisions

Read the exported configuration. In Drupal that is `config/sync/*.yml` (or the site's config
directory). The places judgments hide:

| Config                                                                      | What each judgment looks like                                                                                               |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `workflows.workflow.*` (content moderation)                                 | Each state, and each transition along with the roles allowed to make it                                                     |
| `user.role.*`                                                               | Each permission each role has or lacks. Concentrate on the ones a stakeholder would argue about, not every `access content` |
| `views.view.*`                                                              | Filters, contextual filters, access settings, sorts and "no results" behavior. Who sees which items, and in what order      |
| `field.field.*`, `core.entity_form_display.*`, `core.entity_view_display.*` | Required or optional status, defaults, what is displayed to whom                                                            |
| `webform.webform.*`                                                         | Conditional logic (`#states`), validation, handlers (who is emailed, and when)                                              |
| `eca.*` / `rules.*` / custom `*.settings`                                   | Event → condition → action. Each condition is a judgment                                                                    |
| `pathauto.pattern.*`, `redirect`                                            | Where content lives and what happens to old URLs                                                                            |

On other platforms, use whatever export exists: WordPress options or ACF JSON, a feature-flag
dashboard export, or screenshots of an admin settings page if there's nothing better.

## Producing the key

Derive the answer from the config and cite it: `"evidence": "DERIVED: config/sync/workflows.workflow.editorial.yml — transitions.publish.from: [draft, review]"`.

A derived key is weaker than an executed one, because config interacts in ways reading misses: a
permission granted by another module, a Views access plugin, a custom hook that overrides the
workflow. So:

- **Spot-check by observation.** For a sample of scenarios, and for every one whose derived answer
  surprises you, confirm it on a running environment the way `pathway-running-system.md` describes.
  Replace `DERIVED:` with the observed evidence when you do.
- **Make sure the config you read is the deployed config.** Uncommitted overrides (`settings.php`,
  `config_split`, `config_ignore`) mean production may differ from the repository. Note which source
  you read.

## Confidence

Medium for derived keys, high for observed ones. Say which is which in the results. A mismatch on a
derived key may be a misreading of the config rather than a finding, so confirm it by observation
before treating it as a defect.
