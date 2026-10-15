# UN Brokers

Insurance brokerage website for quotation inquiries, contact messages, and staff follow-up. The public site explains nine insurance categories. Inquiries are validated, stored in MongoDB, and managed from an administrator dashboard.

Submitting a form does not purchase a policy or start cover.

## Stack

- React, TypeScript, Vite, React Router, Tailwind CSS
- React Hook Form, Zod, Axios, Lucide, Framer Motion
- Node.js, Express, MongoDB, Mongoose, JWT cookies, Nodemailer

## Project layout

```text
client/     Public site and admin dashboard
server/     REST API, models, email, tests
```

## Prerequisites

- Node.js 20 or newer
- A MongoDB database, or the built-in memory mode for local preview

## Local development

1. Install dependencies from the repository root:

```bash
npm install
```

2. Create the API environment file:

```bash
copy server\.env.example server\.env
```

On macOS or Linux, use `cp server/.env.example server/.env`.

3. Replace both JWT secrets with different random strings of at least 32 characters. Add your MongoDB connection string to `MONGODB_URI`.

4. Start the API and the website:

```bash
npm run dev
```

The site is at `http://localhost:5173`. The API is at `http://localhost:5000`.

5. Create an administrator. Do not reuse this example password:

```bash
npm run create-admin -w server -- --name "Your Name" --email "you@company.com" --password "a-long-password-1"
```

6. Optional sample content for partners, testimonials, team profiles, FAQs, and service descriptions:

```bash
npm run seed
```

Sample partners, reviews, and team profiles are labelled in the interface. Replace them before launch. `npm run seed -w server -- --refresh` replaces sample records and leaves real records in place.

### Preview without installing MongoDB

```bash
$env:DEV_ADMIN_EMAIL="admin@localhost.test"
$env:DEV_ADMIN_PASSWORD="TempAdmin123"
npm run dev:memory
```

This starts a temporary database, loads sample content, and creates the admin only when those two variables are set. The data disappears when the process stops. Do not use the development secrets in production.

## Environment variables

API (`server/.env`):

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB or Atlas connection string |
| `CLIENT_ORIGIN` | Website origin. Separate multiple origins with commas. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Different secrets, 32+ characters |
| `COOKIE_SECURE` | `true` in production |
| `COOKIE_SAMESITE` | `lax` on one site. Use `none` with `COOKIE_SECURE=true` when the site and API are on different hosts. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional email delivery |
| `BUSINESS_NOTIFICATION_EMAIL` | Inbox for new inquiries |
| `COMPANY_*`, `DEFAULT_CURRENCY`, `BUSINESS_TIMEZONE` | Initial business settings |
| `ADMIN_APP_URL` | Used in staff email links |

Website (`client/.env`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL in production, such as `https://api.example.com/api`. Leave empty locally. |
| `VITE_SITE_URL` | Public site URL for canonical links |
| `VITE_GA_MEASUREMENT_ID` | Optional. Analytics loads only after a visitor accepts. |

Business contact details are edited in **Admin → Settings**. Empty telephone, email, address, and social links stay hidden.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | API and website |
| `npm run dev:memory` | Temporary database and website |
| `npm test` | API tests |
| `npm run lint` | Typecheck the API and lint the website |
| `npm run build` | Production build of both packages |
| `npm run seed` | Sample and default content |
| `npm run create-admin` | Create a staff account |

## Testing

```bash
npm test
```

The tests use an in-memory MongoDB instance. They cover quotation validation, duplicate submissions, private inquiry access, authentication, roles, status updates, and the contact form.

## Production

Build both packages:

```bash
npm run build
```

Start the API with the production environment variables:

```bash
npm run start -w server
```

The compiled client is `client/dist`. The compiled API is `server/dist/server.js`.

### MongoDB Atlas

Create a database user and allow the API host. Put the connection string in `MONGODB_URI`. Run `npm run create-admin` once against that database. Run `npm run seed` only if you want the labelled sample content.

### API hosting

Render, Railway, or another Node host:

- Root or service directory: `server` if the host does not use npm workspaces. For a workspace install, build from the repository root and start `node server/dist/server.js`.
- Build: `npm install && npm run build -w server`
- Start: `npm run start -w server`
- Health check: `GET /api/health`

### Website hosting

Deploy `client` to Vercel or Netlify.

- Build: `npm run build`
- Output: `dist`
- Set `VITE_API_URL` to the public API, including `/api`
- Set `VITE_SITE_URL` to the public website
- `client/vercel.json` rewrites SPA routes. `client/public/_redirects` does the same for Netlify.

When the website and API are on different hosts, set `CLIENT_ORIGIN` to the website origin, `COOKIE_SAMESITE=none`, and `COOKIE_SECURE=true`.

Before launch, replace the host in `client/public/sitemap.xml` and `client/public/robots.txt` with the real site URL.

## Email

Inquiries are saved before email is attempted. If SMTP is not configured, notifications are skipped and the customer still receives a reference number on screen.

When SMTP is configured, the API tries the business notification and the customer acknowledgment, with one retry. It records `sent`, `failed`, or `skipped` on the inquiry. Staff can see that status in the inquiry detail page.

## Security notes

- Administrator passwords are hashed with bcrypt. There is no default password.
- Access and refresh tokens are HTTP-only cookies. The CSRF token is a separate cookie and must be echoed in `X-CSRF-Token` for staff changes.
- Public users cannot list or open inquiries.
- Login and inquiry routes are rate limited.
- Request bodies are limited to 100 KB and operator keys such as `$gt` are rejected.
- Permanent deletion is limited to administrators. The default delete action archives the inquiry.
- Staff audit events are stored for one year and do not copy the full customer submission.

## Roles

- **Staff** can review inquiries and contact messages, update status, add notes, assign inquiries, and export CSV.
- **Administrators** can also edit content, business settings, and staff accounts, and permanently delete an inquiry.

## API

See [docs/API.md](docs/API.md).

## Before launch

- Replace sample partners, testimonials, and team profiles.
- Add the real telephone, email, address, office hours, and logo in settings.
- Review the privacy notice and terms for the jurisdiction where the brokerage operates.
- Configure SMTP and the notification inbox.
- Set production secrets, cookie flags, and the public site URL.
- Confirm the currency. The default is LKR.
