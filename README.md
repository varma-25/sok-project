# SOK – Student Online Knowledge Portal

A MERN-based platform built for my college batch (~7000 students) to replace Telegram groups.  
Provides assignment sharing, group chat, and role-based access for students and admins.

##  Features
- Role-based authentication (Admins & Students)
- Assignment uploads (PDFs) categorized by branch & semester
- Delete permissions restricted to Admins
- Real-time group chat using Socket.IO
- Messages persist in MongoDB and auto-delete after 48 hours
- Mobile-friendly responsive UI

##  Tech Stack
- **Frontend**: React + Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, MongoDB Atlas
- **Authentication**: JWT + bcryptjs
- **File Uploads**: Cloudinary
- **Real-time Chat**: Socket.IO
