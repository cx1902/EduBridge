I will implement a built-in **Direct Messaging (Inbox)** system to handle communications between Students, Tutors, and Admins.

### **1. Database Schema Changes**
I will add a new `InboxMessage` model to your database (`schema.prisma`) to store these messages.
*   **Fields**: `sender`, `receiver`, `subject`, `content`, `isRead`, `type` (General, Class Update, Admin Ticket).
*   **Relations**: Link messages to Users (Sender/Receiver) and optionally a Course (for class updates).

### **2. Backend Implementation**
I will create a new API module `inbox` with the following features:
*   **Send Message (`POST /api/inbox/send`)**:
    *   **One-to-One**: For Student contact Tutor/Admin.
    *   **Bulk Send**: For Tutors sending "Class Updates" to all enrolled students of a course.
*   **Get Messages (`GET /api/inbox`)**: Retrieve received messages.
*   **Mark as Read (`PUT /api/inbox/:id/read`)**: Update status when opened.

### **3. Frontend Implementation**
*   **New Inbox Page**: A dedicated page (`/inbox`) to view, read, and reply to messages.
*   **Compose Interface**:
    *   **Students**: Can select their Tutors or "Admin Support".
    *   **Tutors**: Can select "Class Update" (picks a course) or "Admin Support".
*   **Navbar Update**: Add a "Mail" icon to the top navigation bar for quick access.

### **4. Specific Workflows**
*   **Class Updates**: When a Tutor sends a class update, the system will automatically create a message for every student enrolled in that course.
*   **Admin Tickets**: Messages sent to "Admin" will be routed to the system administrators (ticket style).

**Verification Plan:**
1.  Send a message from a Student to a Tutor.
2.  Login as Tutor to verify receipt.
3.  Send a "Class Update" from Tutor to a Course.
4.  Login as a Student enrolled in that course to verify receipt.
