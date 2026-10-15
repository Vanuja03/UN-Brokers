# API reference

Base path: `/api`

Successful responses:

```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "limit": 20, "total": 1, "pages": 1 } }
```

`meta` is included on paginated lists. Errors:

```json
{ "success": false, "message": "Please check the highlighted information and try again.", "errors": [{ "field": "email", "message": "Enter a valid email address." }] }
```

Staff requests that change data need the `ub_csrf` cookie value in the `X-CSRF-Token` header. The browser must send cookies (`credentials: include`).

## Health

`GET /api/health` — database connection status.

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | Sign in with email and password |
| POST | `/api/auth/logout` | Staff + CSRF | End the session |
| POST | `/api/auth/refresh` | Refresh cookie + CSRF | Rotate tokens |
| GET | `/api/auth/me` | Staff | Current profile |

## Quotations

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/quotes` | Public | Create an inquiry |
| GET | `/api/quotes` | Staff | Search and filter |
| GET | `/api/quotes/stats` | Staff | Dashboard figures |
| GET | `/api/quotes/export` | Staff | CSV download |
| GET | `/api/quotes/:id` | Staff | One inquiry |
| PATCH | `/api/quotes/:id/status` | Staff + CSRF | Change status |
| PATCH | `/api/quotes/:id` | Staff + CSRF | Assign or add a note |
| DELETE | `/api/quotes/:id` | Staff + CSRF | Archive |
| DELETE | `/api/quotes/:id?permanent=true` | Administrator + CSRF | Delete |

`POST /api/quotes` body:

- `customerName`, `phone`, `email`, `preferredContactMethod` (`phone`, `email`, `either`)
- `insuranceType`: `motor`, `motor-third-party`, `travel`, `fire`, `dwelling-fire`, `workers-compensation`, `money-in-transit`, `personal-accident`, `title-insurance`
- `insuranceDetails`: object for that type. Unknown fields are removed.
- `message`, `consent` (must be `true`), `sourcePage`, `campaignSource`
- `website` must be empty. It is a spam field.
- Header `X-Idempotency-Key` prevents a double submit from creating two records.

The response contains `referenceNumber`. It does not return the stored customer record.

List filters: `search`, `status`, `insuranceType`, `from`, `to`, `assignedTo`, `page`, `limit`, `sort`.

Statuses: `new`, `contacted`, `awaiting-information`, `quote-in-progress`, `quotation-sent`, `converted`, `not-converted`, `archived`.

## Contact messages

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/contacts` | Public | Save a message |
| GET | `/api/contacts` | Staff | List messages |
| PATCH | `/api/contacts/:id/status` | Staff + CSRF | `new`, `in-progress`, `resolved`, `archived` |

## Public content

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/insurance` | Editable service summaries |
| GET | `/api/insurance/:slug` | One summary |
| GET | `/api/partners` | Active partners |
| GET | `/api/testimonials` | Approved testimonials |
| GET | `/api/team` | Active team profiles |
| GET | `/api/faqs?category=general` | Active FAQs |
| GET | `/api/settings/public` | Public business details |

## Administrator content

These routes require an administrator and a CSRF token for changes.

- `POST`, `PATCH`, `DELETE /api/partners`
- `POST`, `PATCH`, `DELETE /api/testimonials`
- `POST`, `PATCH`, `DELETE /api/team`
- `POST`, `PATCH`, `DELETE /api/faqs`
- `PUT /api/insurance/:slug`
- `GET /api/admin/partners`, `/api/admin/testimonials`, `/api/admin/team`, `/api/admin/faqs` return hidden records as well

## Settings and staff

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/settings` | Administrator | Full business settings |
| PUT | `/api/settings` | Administrator + CSRF | Update business settings |
| GET | `/api/admin/staff` | Staff | Names for assignment |
| POST | `/api/admin/staff` | Administrator + CSRF | Create an account |
| PATCH | `/api/admin/staff/:id` | Administrator + CSRF | Change role or active flag |
| GET | `/api/admin/audit` | Administrator | Recent staff actions |

SMTP credentials are not stored in the database and are never returned by the API.
