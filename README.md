# Axis - Task Management & Time Tracking

Axis is a comprehensive task management, approval management, and time tracking software built with Next.js and Convex.

## Features

- **Organisation Management**: Create and manage multiple organisations
- **Department/Team Structure**: Organise employees into departments with managers
- **Employee Context**: Full employee management with roles and permissions
- **Task Management**: Create, assign, and track tasks across departments
- **Time Tracking**: Log hours spent on tasks with start/stop functionality
- **Approval Workflows**: Configurable approval processes for time entries and tasks
- **Authentication**: Secure authentication powered by Better Auth

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless database and functions)
- **Authentication**: Better Auth with Convex integration
- **Email**: Resend for transactional emails
- **UI Components**: shadcn/ui, Radix UI, Phosphor Icons

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- Bun (recommended) or npm/yarn/pnpm
- A Convex account
- Resend API key (for email functionality)

### Installation

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd axis
bun install
```

2. Set up environment variables:

Create a `.env.local` file with:

```env
# Convex
CONVEX_DEPLOYMENT=your-convex-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (for emails)
RESEND_API_KEY=your-resend-api-key
```

3. Initialize Convex:

```bash
npx convex dev
```

4. Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── landing/           # Landing page
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers/        # Context providers
├── convex/               # Convex backend
│   ├── betterAuth/       # Better Auth integration
│   ├── schema.ts         # Database schema
│   └── *.ts              # Convex functions
├── lib/                  # Utility libraries
└── hooks/                # Custom React hooks
```

## Database Schema

The application uses the following main tables:

### Core Tables (from Better Auth)
- `user` - User accounts and profiles
- `session` - Active authentication sessions
- `account` - OAuth account connections

### Application Tables
- `organisations` - Companies/organisations
- `departments` - Teams/departments within organisations
- `employees` - Employee records linking users to organisations
- `departmentManagers` - Manager assignments for departments
- `tasks` - Tasks and assignments
- `taskComments` - Comments on tasks
- `timeEntries` - Time tracking entries
- `approvals` - Approval requests and decisions
- `approvalWorkflows` - Configurable approval workflows
- `invitations` - Organisation membership invitations

## Development

### Running Tests

```bash
bun test
```

### Linting

```bash
bun lint
```

### Convex Deployment

```bash
npx convex deploy
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Better Auth Documentation](https://www.better-auth.com)

## Deployment

The easiest way to deploy this app is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Don't forget to set up your environment variables in the Vercel dashboard.

## License

MIT
