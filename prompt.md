Absolutely. Below is a detailed master prompt you can save as something like PROJECT_REQUIREMENTS.md and give directly to your developer or use with an AI coding agent such as Cursor, Claude Code, or another coding environment.

# Fresh Bites POS Software – Master Development Prompt

## Project Overview

Build a premium, fast, modern Point of Sale (POS) web application for a food and drinks business called **Fresh Bites**.

The business sells items such as:

- Burgers
- Fried Chicken
- Wings
- Nuggets
- Fries
- Soft Drinks
- Juices
- Water
- Snacks
- Combo Deals
- Special Offers

The system should be simple enough for a cashier to use without technical knowledge.

The primary workflow is:

1. Customer comes to the counter.
2. Cashier selects products.
3. Cashier adjusts quantities if needed.
4. System automatically calculates subtotal.
5. Cashier applies a discount if applicable.
6. Cashier receives payment.
7. System calculates remaining change.
8. Sale is completed.
9. Thermal receipt is printed.
10. Sale is stored in the database.
11. Admin can view the sale later and reprint the receipt.

---

# IMPORTANT DESIGN DIRECTION

## DO NOT CREATE AN AI-GENERATED LOOKING DASHBOARD

This is extremely important.

The interface must NOT look like a typical AI-generated SaaS dashboard.

Avoid:

- Excessive gradients
- Purple/blue AI-style gradients
- Floating glassmorphism cards everywhere
- Random glowing effects
- Excessive rounded pill components
- Oversized headings
- Generic dashboard layouts
- Too many unnecessary icons
- Excessive whitespace
- Decorative blobs
- Futuristic AI aesthetics
- Generic template-like UI

The system should look like a **real premium commercial POS software used by restaurants and retail businesses**.

Design inspiration should come from professional POS and restaurant management systems.

The design should feel:

- Professional
- Premium
- Practical
- Fast
- Clean
- Dense but not cluttered
- Business-focused
- Easy to scan
- Built for daily commercial use

This is a working POS application, not a marketing website.

The UI should prioritize:

1. Speed
2. Clarity
3. Ease of use
4. Large touch-friendly controls
5. Minimal clicks
6. High information visibility
7. Professional software appearance

Do not add unnecessary visual elements.

---

# TECH STACK

The application must be built using the following stack.

## Frontend

- Next.js
- Latest stable Next.js version
- App Router
- TypeScript
- React

## Styling

Use:

- Tailwind CSS

The UI should use a structured design system with reusable components.

Avoid random inline styles.

Use:

- Consistent spacing
- Consistent typography
- Reusable buttons
- Reusable form components
- Reusable dialogs
- Reusable tables
- Reusable cards where appropriate

Do not overuse cards.

## Backend / Database

Use:

- Supabase

Supabase should handle:

- PostgreSQL database
- Authentication
- User management
- Role management
- Row Level Security
- Realtime features where useful

Use Supabase as the primary backend database.

---

# APPLICATION ARCHITECTURE

Create a clean and scalable project architecture.

Suggested structure:

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── deals/
│   │   ├── discounts/
│   │   ├── sales/
│   │   ├── reports/
│   │   ├── users/
│   │   └── settings/
│   │
│   ├── pos/
│   │   └── page.tsx
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── pos/
│   ├── dashboard/
│   ├── products/
│   ├── sales/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   ├── utils/
│   └── constants/
│
├── hooks/
│
├── types/
│
└── middleware.ts

Keep the architecture modular.

Do not place all business logic inside page components.

Create reusable services, utilities, hooks, and components where appropriate.

USER ROLES

The system should initially support two user roles.

1. Admin

The Admin has full access.

Admin can:

Access dashboard
Add products
Edit products
Delete/deactivate products
Manage categories
Change prices
Create discounts
Create combo deals
View all sales
View reports
Reprint receipts
Void completed sales
Manage users
Manage shop settings
2. Cashier

Cashier should have restricted access.

Cashier can:

Access POS
Search products
Select products
Add products to cart
Increase/decrease quantity
Remove products
Apply allowed discounts
Receive payments
Complete sales
Print receipts
View limited recent orders

Cashier should NOT be able to:

Change permanent product prices
Delete products
Manage users
Access full reports
Change important system settings
Void completed sales without Admin authorization
AUTHENTICATION

Use Supabase Authentication.

Required features:

Login page
Secure authentication
Session handling
Protected routes
Role-based access control

After login:

Admin should be redirected to:

/dashboard

Cashier should be redirected to:

/pos

Users should not be able to access pages outside their permissions.

Implement proper route protection.

MAIN DASHBOARD

Create a professional business dashboard.

The dashboard should show useful information without becoming overly complex.

Dashboard Statistics

Display:

Today's Sales
Today's Orders
Average Order Value
Total Discount Given Today

Optional additional metrics:

Yesterday's Sales
Weekly Sales
Monthly Sales

The dashboard should also include:

Recent Sales

Show:

Invoice Number
Date/Time
Cashier
Payment Method
Total Amount
Sale Status
Best Selling Products

Show the most frequently sold products.

Sales Chart

Provide simple sales analytics.

Examples:

Daily sales
Weekly sales
Monthly sales

Keep charts professional and simple.

Do not add unnecessary animations.

PRODUCT MANAGEMENT

Create a complete product management section.

Admin should be able to:

Create product
Edit product
Delete product
Deactivate product
Activate product
Change product price
Change category
Change availability

Each product should have:

id
name
description (optional)
category_id
price
is_active
image_url (optional)
created_at
updated_at

Example:

Product Name:
Zinger Burger

Category:
Burgers

Price:
290 PKR

Status:
Active

Important:

Cashier should never manually enter the normal product price.

The POS should always retrieve the current active product price.

PRODUCT CATEGORIES

Admin should be able to manage categories.

Examples:

Burgers
Fried Chicken
Fries
Drinks
Juices
Snacks
Deals
Add-ons

Admin should be able to:

Add category
Edit category
Delete/deactivate category
Change category display order

Each category should have:

id
name
slug
sort_order
is_active
created_at

Categories should appear as easy-to-click navigation options inside the POS.

PRICE MANAGEMENT

The owner frequently changes prices.

Price management must therefore be very easy.

Admin should be able to:

Edit product price directly
Save new price
Immediately update POS pricing

Recommended feature:

Keep price history.

Example:

Product:
Zinger Burger

Old Price:
Rs. 290

New Price:
Rs. 320

Changed By:
Admin

Changed At:
29 Aug 2026

Suggested table:

product_price_history

Fields:

id
product_id
old_price
new_price
changed_by
created_at
DISCOUNT SYSTEM

The system must support multiple types of discounts.

Percentage Discount

Examples:

10% OFF
15% OFF
20% OFF

Example calculation:

Subtotal: Rs. 1,000
Discount: 10%
Discount Amount: Rs. 100

Final Total: Rs. 900
Fixed Amount Discount

Examples:

Rs. 50 OFF
Rs. 100 OFF
Rs. 200 OFF

Example:

Subtotal: Rs. 1,000
Discount: Rs. 100

Final Total: Rs. 900
Product-Level Discount

Admin should be able to optionally configure special pricing for a product.

Example:

Product:
Zinger Burger

Original Price:
Rs. 350

Discount:
Rs. 50

Final Price:
Rs. 300

The POS should clearly display the final price.

Discount Permissions

Cashier discount permissions should be configurable.

Example:

Maximum Cashier Discount:
10%

If a cashier attempts to apply more than the allowed discount:

Require Admin PIN or Admin authorization.

All applied discounts should be stored with the sale for reporting purposes.

DEALS / COMBO SYSTEM

The business sells combination deals.

Admin should be able to create deals.

Example:

Deal Name:
Deal 1

Includes:

1 × Zinger Burger
1 × Drumstick
1 × Buddy Drink

Deal Price:
Rs. 490

The cashier should simply select:

Deal 1

The deal should be added to the cart with its predefined price.

The system should support:

Deal name
Description
Included products
Fixed deal price
Active/inactive status

The POS should show deals inside a separate category.

POS FRONT DESK

This is the most important part of the application.

The POS must be optimized for:

Speed
Touch screens
Desktop computers
Fast order processing

The layout should have three main areas.

LEFT / MAIN PRODUCT AREA

Display:

Product categories
Product search
Product grid

Example:

------------------------------------------------
Search Products

[ Burgers ] [ Chicken ] [ Drinks ] [ Deals ]

------------------------------------------------

[ Zinger Burger ]
Rs. 290

[ Patty Burger ]
Rs. 220

[ Chicken Burger ]
Rs. 300

[ Fries ]
Rs. 150

[ Coke 1L ]
Rs. 160

Products should have large clickable buttons/cards.

Do not make them overly rounded or overly decorative.

The design should look like professional POS software.

PRODUCT SEARCH

Add fast product search.

When cashier searches:

coke

Show matching products:

Coke Regular
Coke Buddy
Coke 1 Liter
Coke 2 Liter

Search should be fast and responsive.

Support keyboard interaction.

CART / CURRENT ORDER

The right side of the POS should contain the active order.

Example:

CURRENT ORDER

Zinger Burger
Rs. 290

Quantity:
[-] 1 [+]

Crispy Chicken
Rs. 230

Quantity:
[-] 1 [+]

Coke 1 Liter
Rs. 160

Quantity:
[-] 1 [+]

----------------------------

Subtotal
Rs. 680

Discount
Rs. 0

----------------------------

TOTAL
Rs. 680

[ PAY ]

Cashier should be able to:

Increase quantity
Decrease quantity
Remove item
Clear order
Apply discount

All calculations should update instantly.

QUANTITY SYSTEM

Quantity controls must be easy to use.

Example:

[-]  2  [+]

Calculation:

2 × Rs. 290 = Rs. 580

Do not require the cashier to type quantity manually unless an optional keyboard input is added.

PAYMENT FLOW

When cashier clicks:

PAY

Open a professional payment modal/page.

Show:

Subtotal
Discount
Final Total

Payment methods:

Cash
Card
Other
CASH PAYMENT

For cash payments:

Total:
Rs. 1,150

Cash Received:
Rs. 1,500

Change:
Rs. 350

Change should calculate automatically.

Cashier should be able to quickly enter the received amount.

SALE COMPLETION

After payment:

Validate order.
Validate payment.
Create sale record.
Create sale items.
Store discount.
Store payment information.
Generate invoice number.
Mark sale as completed.
Print receipt.
Reset POS for next customer.

Use a transaction or equivalent database-safe approach so that partial sale records are not created if an error occurs.

INVOICE NUMBERING

Automatically generate unique invoice numbers.

Example:

FB-000001
FB-000002
FB-000003

Invoice numbers must be unique.

THERMAL RECEIPT PRINTING

The system should support thermal receipt printing.

Primary target:

80mm thermal receipt printer

Receipt should include:

Business name
Logo if configured
Address
Phone number
Invoice number
Date
Time
Cashier name
Items
Quantity
Item price
Item totals
Subtotal
Discount
Grand total
Payment method
Cash received
Change
Thank-you message

Example:

          FRESH BITES
       Eat Fresh, Feel Fresh

--------------------------------

Zinger Burger
1 × 290                    290

Crispy Chicken
1 × 230                    230

Coke 1 Liter
1 × 160                    160

--------------------------------

Subtotal                   680
Discount                     0

--------------------------------

TOTAL                      680

Payment: Cash

Invoice: FB-000125

Date: 29-08-2026
Time: 08:35 PM

Thank You For Your Order

The receipt layout should be optimized for thermal printing.

Do not simply print the normal web page.

Create a dedicated print layout.

SALES HISTORY

Admin should have access to complete sales history.

Display a table with:

Invoice Number
Date
Time
Cashier
Payment Method
Discount
Total
Status

Support:

Search by invoice number
Filter by date
Filter by cashier
Filter by payment method
Filter by status

Clicking a sale should open complete sale details.

SALE DETAILS

Display:

Invoice Number

Date and Time

Cashier

Items

Quantity

Price

Subtotal

Discount

Final Total

Payment Method

Cash Received

Change

Status

Admin should also be able to:

Reprint Receipt
VOID / CANCEL SALE

Before checkout:

Cashier can:

Remove items
Change quantity
Clear entire cart

After a sale is completed:

A completed sale should not simply be permanently deleted.

Instead, use:

completed
voided
refunded (future-ready)

Voiding a completed sale should:

Require Admin permission or Admin PIN.
Store who voided the sale.
Store void timestamp.
Store void reason.

Suggested fields:

status
voided_by
void_reason
voided_at

Do not permanently delete completed sales.

REPORTS

Create simple useful reports.

Daily Sales

Show:

Total Sales
Total Orders
Total Discount
Average Order Value
Weekly Sales

Show total sales by day.

Monthly Sales

Show sales summary for the selected month.

Product Sales

Show:

Product name
Quantity sold
Revenue generated
Best Selling Products

Show the most sold products.

Reports should be clear and practical.

Do not create overly complicated enterprise analytics.

SETTINGS

Create a store settings page.

Settings should include:

Business Name
Business Logo
Address
Phone Number
Currency
Receipt Footer Message
Tax Settings (optional)

Example:

Business Name:
Fresh Bites

Currency:
PKR

Receipt Footer:
Thank you for your order!

These settings should automatically appear on receipts where applicable.

DATABASE DESIGN

Use Supabase PostgreSQL.

Create a scalable relational database.

Recommended tables:

profiles
categories
products
product_price_history
deals
deal_items
discounts
sales
sale_items
payments
store_settings
PROFILES
id
full_name
email
role
created_at
updated_at

Role values:

admin
cashier
CATEGORIES
id
name
slug
sort_order
is_active
created_at
updated_at
PRODUCTS
id
name
description
category_id
price
image_url
is_active
created_at
updated_at
PRODUCT PRICE HISTORY
id
product_id
old_price
new_price
changed_by
created_at
DEALS
id
name
description
price
is_active
created_at
updated_at
DEAL ITEMS
id
deal_id
product_id
quantity
DISCOUNTS
id
name
type
value
is_active
start_date
end_date
created_at

Discount type:

percentage
fixed
SALES
id
invoice_number
cashier_id
subtotal
discount_amount
discount_type
total_amount
payment_method
cash_received
change_amount
status
created_at
updated_at
SALE ITEMS
id
sale_id
product_id
product_name
unit_price
quantity
discount_amount
total
created_at

Important:

Store product name and price snapshot inside the sale item.

Do not depend only on the current product price.

If the Admin changes a product price later, old invoices must still show the original price used at the time of sale.

PAYMENTS
id
sale_id
payment_method
amount
cash_received
change_amount
created_at
STORE SETTINGS
id
business_name
logo_url
address
phone
currency
receipt_footer
created_at
updated_at
SUPABASE SECURITY

Implement proper Supabase Row Level Security.

Requirements:

Admin

Admin can access:

All products
All categories
All deals
All sales
All reports
All users
All settings
Cashier

Cashier can:

Read active products
Read active categories
Read active deals
Create sales
Create sale items
Access limited permitted sales

Cashier should NOT be able to directly modify:

Product prices
Categories
Store settings
Users

Implement policies carefully.

Do not disable RLS globally.

DATA INTEGRITY

The POS handles financial data.

Therefore:

Never use JavaScript floating-point calculations directly for final money storage.
Store monetary values consistently.
Prefer integer smallest currency units where appropriate, or carefully configured numeric database types.
Validate all totals server-side/database-side where necessary.
Do not trust only frontend calculations.
Prevent negative quantities.
Prevent invalid discounts.
Prevent discounts greater than the allowed order amount.
Ensure invoice numbers are unique.
Ensure completed sales cannot accidentally be edited.
UX REQUIREMENTS

The POS must require minimal clicks.

Example ideal workflow:

Open POS
↓
Click Burger
↓
Click Zinger Burger
↓
Click Drink
↓
Click Coke
↓
Click Pay
↓
Enter Cash Received
↓
Complete Sale
↓
Receipt Prints
↓
New Order Starts

The system should be optimized for this speed.

KEYBOARD SUPPORT

Add useful keyboard shortcuts where practical.

For example:

Ctrl + K → Focus product search
Esc → Close modal
Enter → Confirm action

Do not create too many shortcuts.

Focus on practical cashier workflow.

RESPONSIVE DESIGN

Primary usage:

Desktop POS Screen
Touchscreen POS

The application must also work reasonably on:

Laptop
Tablet

The POS layout should adapt properly.

On smaller screens:

Product area and cart should remain easy to use.
Avoid broken horizontal layouts.
Important checkout controls should remain accessible.
LOADING AND ERROR STATES

Implement professional states for:

Loading products
Loading sales
Saving products
Completing sale
Printing receipt
Database errors

Avoid excessive skeleton animations.

Use clean loading states.

Show useful error messages.

Example:

Unable to complete sale.

Please check your connection and try again.
EMPTY STATES

Create professional empty states.

Examples:

No products found.
No sales have been recorded today.

Keep empty states minimal and professional.

Do not use large cartoon illustrations.

DESIGN SYSTEM

Create a consistent design system.

Use:

Typography

Professional sans-serif typography.

Clear hierarchy:

Page Title
Section Title
Table Heading
Body Text
Secondary Text

Avoid huge marketing-style headings.

Colors

Use a professional neutral business color system.

Suggested approach:

Clean neutral background
White content surfaces
Dark text
One strong brand accent color
Clear success state
Clear warning state
Clear destructive/error state

Do not use gradients unless explicitly requested later.

Do not use neon colors.

Do not make every element colorful.

Border Radius

Use controlled and consistent border radius.

Avoid making every component excessively rounded.

This should feel like commercial business software.

Shadows

Use subtle shadows only where required.

Do not use floating/glowing cards everywhere.

COMPONENT REQUIREMENTS

Create reusable components for:

Button
Input
Select
Search Input
Modal/Dialog
Confirm Dialog
Dropdown
Table
Pagination
Badge
Status Indicator
Toast/Notification
Empty State
Loading State
Date Picker
Price Input
Quantity Controls
POS Product Button
Cart Item
Payment Modal
Receipt Layout
FORM VALIDATION

Validate all forms.

Examples:

Product
Name → Required
Category → Required
Price → Required and must be greater than 0
Discount
Discount cannot be negative.
Percentage cannot exceed allowed limits.
Fixed discount cannot exceed order total.

Show validation errors clearly.

PERFORMANCE REQUIREMENTS

The POS should feel instant.

Requirements:

Products should load quickly.
Product search should be fast.
Adding items to cart should feel instant.
Calculations should happen immediately.
Avoid unnecessary page reloads.
Avoid unnecessary database calls.
Use caching where appropriate.

The cashier should not have to wait for normal interactions.

OFFLINE / CONNECTION CONSIDERATION

Because this is a physical shop POS, internet connectivity may sometimes fail.

The application architecture should consider future offline support.

For Version 1:

Clearly handle connection errors.
Do not lose an active cart if a temporary UI error occurs.

Future versions may add:

Offline order queue
Local storage
Sync when internet returns

Structure the application so offline support can be added later.

FUTURE FEATURES – DO NOT BUILD NOW

Do not implement these features in Version 1 unless specifically requested.

Future possible modules:

Inventory management
Ingredient stock
Recipe management
Stock purchase management
Supplier management
Customer management
Loyalty points
Online ordering
Food delivery
Kitchen display system
Table management
Multi-branch support
Employee attendance
Payroll
Advanced accounting
Mobile applications

The initial version must remain focused.

MVP DEVELOPMENT PRIORITY

Build in this order.

Phase 1 – Foundation
Next.js project setup
TypeScript
Tailwind CSS
Supabase integration
Authentication
User roles
Protected routes
Database schema
Row Level Security
Phase 2 – Admin Product Management
Categories
Products
Product availability
Price editing
Price history
Phase 3 – Deals and Discounts
Percentage discounts
Fixed discounts
Product discounts
Combo deals
Phase 4 – POS
Category navigation
Product search
Product grid
Cart
Quantity management
Discount application
Order calculations
Phase 5 – Payment and Sales
Payment modal
Cash received
Change calculation
Complete sale
Invoice generation
Database transaction logic
Phase 6 – Receipt Printing
80mm receipt layout
Print functionality
Reprint receipt
Phase 7 – Sales and Reports
Sales history
Sale details
Daily reports
Weekly reports
Monthly reports
Best-selling products
Phase 8 – Final QA

Test:

Product creation
Product editing
Price changes
Discounts
Deals
Cart calculations
Quantity calculations
Payment calculations
Change calculations
Receipt printing
Reprinting
User permissions
Mobile/tablet responsiveness
Error handling
FINAL DEVELOPMENT RULES
Do not over-engineer the first version.
Keep the POS workflow extremely fast.
Prioritize usability over visual decoration.
Build reusable components.
Use TypeScript properly.
Keep business logic separate from UI components.
Use Supabase Row Level Security correctly.
Protect financial and sales data.
Store historical product prices inside sale records.
Never permanently delete completed sales.
Use proper status systems for sales.
Optimize for desktop and touchscreen use.
Make receipt printing reliable.
Avoid AI-generated dashboard aesthetics.
The final application should look and feel like a real premium commercial POS product.
FINAL PRODUCT GOAL

The finished application should feel like a polished, professional POS system specifically designed for a food and drinks counter.

The cashier experience should be extremely simple:

SELECT PRODUCTS
→
ADJUST QUANTITY
→
APPLY DISCOUNT IF NEEDED
→
PAY
→
PRINT RECEIPT
→
NEXT CUSTOMER

The Admin experience should provide simple control over:

PRODUCTS
→
PRICES
→
DISCOUNTS
→
DEALS
→
SALES
→
REPORTS
→
SETTINGS

The system must be:

Fast
Reliable
Professional
Easy to use
Secure
Scalable
Premium in appearance

Most importantly, it should look like professionally designed commercial POS software, NOT an AI-generated SaaS dashboard or generic admin template.


You can save this directly as:

```text
PROJECT_REQUIREMENTS.md

I recommend also creating separate files later such as DATABASE_SCHEMA.md, POS_WORKFLOW.md, and UI_DESIGN_SYSTEM.md so your coding agent has smaller, more focused instructions instead of relying only on one large master prompt.