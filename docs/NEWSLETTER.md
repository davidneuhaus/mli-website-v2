# Newsletter — pending decision

Currently the static site keeps the live **CleverReach** form actions:

- `https://eu2.cleverreach.com/f/298124-389075/wcs/`
- `https://eu2.cleverreach.com/f/298124-320428/wcs/`

October CMS AJAX (`genericForm::onFormSubmit`) was removed; forms POST directly to CleverReach.

## Before launch

Confirm with stakeholder:

1. Keep CleverReach as-is, or
2. Replace with HubSpot / another ESP

Reusable Astro component: `src/components/NewsletterCleverReach.astro`.
