# studious-enigma
A web-based QR code ticketing system for public transport.  This project includes a React.js frontend for user registration, ticket purchase, and displaying QR code tickets, with plans for admin dashboard and integration with backend and payment APIs.  Built to streamline and secure transit ticketing using modern web technologies.
```markdown
# Bus Ticketing Frontend

This React frontend is for a QR-based bus ticketing system (final-year project). It assumes a backend API that supports authentication, ticket creation, ticket verification, and ticket listing for admins.

Main features:
- User login (role: user)
- Admin login (role: admin)
- Users: select/enter bus stop, see price, checkout, get QR ticket
- Admins: list tickets, scan/verify QR tickets, generate QR tickets for cash customers
- Every ticket generation and scan sends a request to backend to be recorded

Backend API endpoints used (suggestions — implement server accordingly):
- POST /api/auth/login           {username, password, role} -> {token}
- POST /api/tickets              create ticket (user checkout or admin cash generation)
- GET  /api/tickets              list tickets (admin)
- POST /api/tickets/verify      verify a ticket (scan)
- POST /api/tickets/scan        record that a QR was scanned (if you want separate)
Adjust endpoints as needed.

How to run:
1. npm install
2. npm start

Notes:
- The code stores JWT in localStorage under "token" and user info under "user".
- Replace API base URL in src/api.js with your backend URL.
```