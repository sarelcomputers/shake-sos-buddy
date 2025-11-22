# Admin Dashboard Setup

The admin dashboard allows you to view all users, subscriptions, and revenue analytics.

## Making Your First Admin User

To access the admin dashboard, you need to assign the admin role to a user. Follow these steps:

### Option 1: Using Lovable Cloud Database UI

1. Go to your project settings and click "View Backend"
2. Navigate to the Database section
3. Find the `user_roles` table
4. Click "Insert Row" and add:
   - `user_id`: Your user's UUID (get this from the `profiles` table)
   - `role`: Select `admin` from the dropdown
5. Save the row

### Option 2: Using SQL (Recommended)

1. Go to your project settings and click "View Backend"
2. Navigate to SQL Editor (if available) or use the database query interface
3. Run this SQL command (replace `YOUR_EMAIL_HERE` with your actual email):

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM profiles
WHERE email = 'YOUR_EMAIL_HERE';
```

## Accessing the Admin Dashboard

Once you have admin privileges:

1. Sign in to your account
2. Go to Profile settings
3. Click "Admin Dashboard" button (only visible to admins)
4. Or navigate directly to `/admin`

## Admin Features

### Dashboard Overview
- **Total Users**: View total registered users
- **Active Subscriptions**: Number of paying subscribers
- **Trial Users**: Users currently on trial
- **Monthly Revenue**: Total revenue from active subscriptions

### Revenue Chart
- Visual representation of monthly revenue
- Track growth over time

### User Management
- View all users with their subscription status
- Filter by subscription status (Active, Trial, Cancelled, Expired)
- Search users by email
- See subscription expiry dates
- View revenue per user

## Security Notes

- Admin access is controlled via the `user_roles` table with proper RLS policies
- Only users with the `admin` role can view the admin dashboard
- Admin role checks are performed server-side for security
- Regular users cannot see the admin dashboard or access admin data

## Adding More Admins

To add additional admin users, either:
1. Use the same SQL command above with different emails
2. Build an admin user management interface (future enhancement)

## Troubleshooting

**Can't see Admin Dashboard button?**
- Verify your user has the admin role in the `user_roles` table
- Sign out and sign back in to refresh your session
- Check the browser console for any errors

**Access Denied error?**
- Ensure the admin role is correctly assigned
- Verify RLS policies are properly configured
- Check that the `has_role` function exists in the database
