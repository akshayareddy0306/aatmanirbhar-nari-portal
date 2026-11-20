# Aatmanirbhar Nari — Realistic Interactive Business Platform

A comprehensive digital platform empowering women-led home businesses and small enterprises with verified discovery, direct customer purchase requests, and business enablement.

Built for the **Unified Mentor Internship Project** and prepared for live evaluator demonstration and seamless **Netlify** deployment.

---

## 🎨 Visual Design System

Designed strictly according to the specified palette guidelines:
- **Main background:** `#FFFCFA` (Warm porcelain white)
- **Surface white:** `#FFFFFF`
- **Soft blush pink:** `#F6DDE3`
- **Light pink:** `#FBECEF`
- **Muted rose:** `#B96F83` (Primary brand accent)
- **Subtle lavender:** `#E9E4F2` (Secondary tags and cards)
- **Body text:** `#55515A`
- **Headings:** `#3D3642` (Deep warm slate — strictly non-black)
- **Light borders:** `#E9E3E5`

**Strictly Avoided:** Black (#000), Violet, Purple, Green, Neon, floral clipart, cartoon graphics, and cluttered layouts.

---

## 🔑 Demo Access & Role Credentials

All three roles operate independently in their own dedicated login screens with 1-click **Quick Fill** demo buttons:

| Role | Email / Username | Password | Dedicated Login Path |
|---|---|---|---|
| **Platform Administrator** | `admin@aatmanirbharnari.in` | `admin123` | Role Portal &rarr; Admin Login |
| **Entrepreneur / Seller** | `meera@sakhi.in` | `seller123` | Role Portal &rarr; Entrepreneur Login |
| **Customer / Buyer** | `anita@example.com` | `customer123` | Role Portal &rarr; Customer Login |

*Note: Guest visitors can also browse the public directory and product gallery without logging in.*

---

## 🎬 Complete 26-Step Evaluator Demonstration Flow

Follow this exact workflow to demonstrate the full platform capabilities to evaluators:

1. **Step 1:** Open `index.html` in your browser (or your live Netlify URL).
2. **Step 2:** Watch the **2-second brand intro animation** featuring the female silhouette logo (or click **Skip Intro &rarr;**).
3. **Step 3:** The **Three Separate Logins Portal** opens.
4. **Step 4:** Select **Entrepreneur / Seller** &rarr; click **Register as an Entrepreneur**.
5. **Step 5:** Enter your jewelry business details (or click **Pre-fill Jewelry Business**) and submit the profile.
6. **Step 6:** In the Seller Dashboard, open the **Add Product (Photo Upload)** tab.
7. **Step 7:** Click **Select Photos from Laptop** (or drag & drop).
8. **Step 8:** The native computer file picker opens. Select actual earrings or jewelry photos from your laptop.
9. **Step 9:** Enter product name (e.g. *Handmade Kundan & Pearl Jhumka Earrings*), category, price (e.g. ₹549), description, and location.
10. **Step 10:** Click **Save & Publish Product**. The product immediately appears under **My Products** with your actual photo!
11. **Step 11:** Navigate to **Approval Status** &rarr; click **Submit for Admin Review**.
12. **Step 12:** Click **Logout** from the seller sidebar.
13. **Step 13:** On the login portal, select **Platform Admin** &rarr; click **Quick Fill** &rarr; **Sign In**.
14. **Step 14:** In the **Verification Queue**, find the submitted business and click **Inspect & Approve**.
15. **Step 15:** Review all business details and the actual uploaded product photographs, then click **Approve & Publish to Directory**.
16. **Step 16:** Click **Logout** from the admin console.
17. **Step 17:** On the login portal, select **Customer / Buyer** &rarr; click **Quick Fill** &rarr; **Sign In**.
18. **Step 18:** Search for the newly approved jewelry business or browse by category.
19. **Step 19:** Open the approved business profile.
20. **Step 20:** View the actual uploaded earrings and photographs.
21. **Step 21:** Click on the product &rarr; click **Request to Purchase** &rarr; fill in quantity and contact preference &rarr; submit.
22. **Step 22:** Note the generated Reference ID (e.g. `REQ-2026-XXXX`) &rarr; click **Logout**.
23. **Step 23:** Log back in as the **Entrepreneur / Seller**.
24. **Step 24:** Open the **Customer Requests** tab &rarr; the new purchase request is displayed!
25. **Step 25:** Click **Manage** &rarr; enter a note (e.g. *"Accepted! Dispatching tomorrow via local courier."*) &rarr; click **Accept & Confirm Request**.
26. **Step 26:** Log in again as the **Customer** &rarr; view **My Purchase Requests** to see the updated **Accepted** status with the seller's note!

---

## 💾 Architecture & Browser-Side Database

- **Binary Image Persistence (IndexedDB):** Photos selected from your laptop are stored in an IndexedDB object store (`product_images`) so that page refreshes never lose high-resolution photos or hit localStorage limits.
- **Relational Data Persistence (localStorage):** User accounts, business profiles, products, requests, inquiries, audit logs, and branding settings are stored in local storage and shared across all roles in the same browser.
- **Replaceable Brand Logo:** Platform administrators can upload a custom logo from their laptop under **Logo & Branding Settings**, preview it, and apply it site-wide.
- **Scope Disclaimer:** This is an interactive frontend demonstration. The purchase request workflow coordinates requests between buyers and sellers; actual payment settlement, delivery logistics, and commercial contracts are conducted directly outside the prototype.

---

## 🚀 Netlify Deployment Instructions

This project is built with zero bundlers or build tools, making it 100% fail-safe for Netlify static hosting:

### Option A: Drag-and-Drop Deploy (Instant)
1. Log in to [Netlify](https://app.netlify.com/).
2. Drag the `Aatmanirbhar_Nari_MVP` folder directly into the Netlify **Deploys** area.
3. Your site will be live immediately with a secure HTTPS URL.

### Option B: Git Repository Deploy
1. Push this folder to a GitHub repository.
2. In Netlify, click **Add new site &rarr; Import an existing project**.
3. Select your GitHub repository.
4. Set:
   - **Base directory:** `.` (root)
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.` (root)
5. Click **Deploy Site**. The included `netlify.toml` and `_redirects` ensure smooth SPA routing and clean URL refreshes.
