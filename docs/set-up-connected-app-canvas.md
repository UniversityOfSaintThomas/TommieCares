# Setting up a connected app for Canvas LTI

Canvas LTIs are a way to integrate external tools into Canvas. 
To set up a connected app for Canvas LTI, you need to create a 
connected app in Salesforce and configure it in Canvas.

## Step 1: Create a connected app in Salesforce

### Initial Setup

1. In Salesforce, navigate to **Setup**.
2. In the Quick Find box, type **App Manager** and select **App Manager**.
3. Click **New Connected App**.
4. Fill in the required fields.
5. In the **API (Enable OAuth Settings)** section, click **Enable OAuth Settings**.
6. In the **Callback URL** field, enter the URL where Canvas will send the OAuth response.
7. In the **Selected OAuth Scopes** section, select the OAuth scopes you want to enable.
8. In the **OAuth Policies** section, select **Admin approved users are pre-authorized**.
   1. Access Lightning applications (lightning)
   2. Access Visualforce applications (visualforce)
9. Check "Issue JSON Web Token (JWT)-based access tokens for named users"
10. Check "Require Proof Key for Code Exchange (PKCE) Extension for Supported Authorization Flows"
11. Check "Require Secret for Web Server Flow"
12. Check "Require Secret for Refresh Token Flow"
13. Click **Save**.

### Getting your OAuth credentials

1. View the connected app you just created.
2. Click the **Manage Consumer Details** button.
3. You may be challenged with 2 factor authentication.
4. Note down the **Consumer Key** and **Consumer Secret** in a safe place. ***Never commit them to code or documentation!***
5. Click **Cancel**.


### Manage access to the Connected App

1. View the connected app you just created.
2. Click the **Manage** button.
3. On the next page then click **Edit Policies**.

#### Basic Information

1. Fill in the URL of the Salesforce app you want to connect to.

#### OAuth Policies

1. Check "Admin approved users are pre-authorized."
2. In IP Relaxation, select "Relax IP restrictions."
3. In Refresh Token Policy, select "Immediately expire refresh token."
4. In JWT-Based Access Token Policy, select "Issue JSON Web Token (JWT)-based access tokens."
5. For Token Timeout, select "30 minutes."
6. Click **Save**.

### Manage Profiles
1. View the connected app you just created.
3. Click **Manage Profiles** and assign the connected app to the appropriate profiles.
4. Click **Save**.
5. Click **Back** to return to the connected app details page.
6. Click **View** to view the connected app details.
7. Note down the **Callback URL**.
8. Click **Edit** and add the **Callback URL** to the **Callback URLs** field.
9. Click **Save**.

### Manage Permissions Sets


## Step 2: Configure the connected app in Canvas

1. In Canvas, navigate to **Admin**.
2. In the left-hand navigation, click **Settings**.
3. Click **Apps**.
4. Click **View App Configurations**.
5. Click **+ App**.
6. In the **Configuration Type** dropdown, select **By URL**.
7. In the **Name** field, enter a name for the app.
8. In the **Consumer Key** field, enter the **Consumer Key** from the connected app in Salesforce.
9. In the **Shared Secret** field, enter the **Consumer Secret** from the connected app in Salesforce.
10. In the **Config URL** field, enter the **Callback URL** from the connected app in Salesforce.
11. Click **Submit**.
12. Click **Save**.
13. Click **Add App**.
14. Click **Save**.
15. The connected app is now configured in Canvas.
16. You can now use the connected app in your Canvas courses.

By following these steps, you can set up a connected app for Canvas LTI and integrate external tools into your Canvas courses.