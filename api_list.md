# Airbnb Clone Backend API Documentation

This document provides an overview of the API endpoints required for the Airbnb-like backend.

---

## 1️⃣ Authentication & User Management
- **POST /auth/register** → Register a new user (guest or host)
- **POST /auth/login** → Log in and get a token
- **POST /auth/logout** → Log out the user
- **POST /auth/refresh-token** → Get a new access token
- **GET /auth/me** → Get current user profile
- **PUT /auth/me** → Update current user profile

---

## 2️⃣ Listings
- **GET /listings** → Get all listings with optional filters (location, price, guests)
- **GET /listings/:id** → Get details of a listing
- **POST /listings** → Create a new listing (Host only)
- **PUT /listings/:id** → Update listing (Host owner only)
- **DELETE /listings/:id** → Delete listing (Host owner only)

---

## 3️⃣ Bookings
- **POST /listings/:id/book** → Create a booking for a listing (Guest only)
- **GET /bookings** → Get all bookings for the current user (Guest or Host)
- **GET /bookings/:id** → Get booking details
- **PUT /bookings/:id/cancel** → Cancel a booking

---

## 4️⃣ Reviews
- **POST /listings/:id/reviews** → Add a review for a listing (Guest only after stay)
- **GET /listings/:id/reviews** → Get all reviews for a listing

---

## 5️⃣ Messaging
- **POST /conversations** → Start a new conversation
- **GET /conversations** → Get all conversations for current user
- **GET /conversations/:id** → Get messages in a conversation
- **POST /conversations/:id** → Send a message in a conversation

---

## 6️⃣ Admin (role=admin)
- **GET /admin/users** → Get all users
- **GET /admin/listings** → Get all listings
- **GET /admin/bookings** → Get all bookings
- **PUT /admin/users/:id/ban** → Ban a user

---

## Notes
- **Authentication**: Bearer JWT token required for protected routes
- **Dates**: All dates use ISO8601 format
- **Responses**: JSON format
- **Status codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
